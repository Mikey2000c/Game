import Fastify from "fastify";
import cors from "@fastify/cors";
import fjwt from "@fastify/jwt";
import { z } from "zod";
import {
  readDb,
  writeDb,
  createUser,
  findUserByEmail,
  findUserByGoogleSub,
  findUserById,
  credit,
  publicUser,
} from "./db.js";
import { googleConfigured, verifyGoogleIdToken } from "./google.js";
import { evaluateSpin, spinReels } from "./slots.js";

const PORT = Number(process.env.PORT || 8787);
const JWT_SECRET = process.env.JWT_SECRET || "spinkeep-local-dev-secret-change-me";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

const app = Fastify({ logger: true });

await app.register(cors, { origin: true, credentials: true });
await app.register(fjwt, { secret: JWT_SECRET });

async function requireUser(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}

function issueToken(userId: string) {
  return app.jwt.sign({ sub: userId }, { expiresIn: "30d" });
}

app.get("/health", async () => ({
  ok: true,
  googleAuth: googleConfigured(),
  time: new Date().toISOString(),
}));

app.get("/config", async () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  googleAuthEnabled: googleConfigured(),
}));

app.post("/auth/email", async (request) => {
  const body = z
    .object({
      email: z.string().email(),
      name: z.string().min(1).optional(),
      mode: z.enum(["login", "signup"]).default("login"),
    })
    .parse(request.body);

  const db = readDb();
  let user = findUserByEmail(db, body.email);
  if (!user) {
    user = createUser(db, {
      email: body.email,
      name: body.name || body.email.split("@")[0] || "Player",
      method: "email",
    });
  }

  return { token: issueToken(user.id), user: publicUser(user) };
});

app.post("/auth/guest", async () => {
  const db = readDb();
  const stamp = Date.now().toString(36);
  const user = createUser(db, {
    email: `guest-${stamp}@spinkeep.local`,
    name: "Guest Player",
    method: "guest",
  });
  return { token: issueToken(user.id), user: publicUser(user) };
});

app.post("/auth/google", async (request, reply) => {
  const body = z
    .object({
      idToken: z.string().optional(),
      demo: z.boolean().optional(),
      email: z.string().email().optional(),
      name: z.string().optional(),
    })
    .parse(request.body);

  const db = readDb();

  if (body.idToken && googleConfigured()) {
    const profile = await verifyGoogleIdToken(body.idToken);
    if (!profile) return reply.code(401).send({ error: "Invalid Google token" });

    let user = findUserByGoogleSub(db, profile.sub) || findUserByEmail(db, profile.email);
    if (!user) {
      user = createUser(db, {
        email: profile.email,
        name: profile.name,
        method: "google",
        googleSub: profile.sub,
      });
    } else if (!user.googleSub) {
      user.googleSub = profile.sub;
      user.method = "google";
      writeDb(db);
    }

    return { token: issueToken(user.id), user: publicUser(user) };
  }

  if (body.demo) {
    const email = body.email || "demo.google@spinkeep.local";
    let user = findUserByEmail(db, email);
    if (!user) {
      user = createUser(db, {
        email,
        name: body.name || "Google Player",
        method: "google",
        googleSub: `demo-${email}`,
      });
    }
    return { token: issueToken(user.id), user: publicUser(user), demo: true };
  }

  return reply.code(400).send({
    error: "Google not configured",
    hint: "Set GOOGLE_CLIENT_ID or send { demo: true } for local testing",
  });
});

app.get("/me", { preHandler: requireUser }, async (request, reply) => {
  const db = readDb();
  const user = findUserById(db, request.user.sub);
  if (!user) return reply.code(404).send({ error: "User not found" });
  return { user: publicUser(user) };
});

app.post("/daily/claim", { preHandler: requireUser }, async (request, reply) => {
  const db = readDb();
  const user = findUserById(db, request.user.sub);
  if (!user) return reply.code(404).send({ error: "User not found" });

  const today = new Date().toISOString().slice(0, 10);
  if (user.lastDailyClaim === today) {
    return reply.code(409).send({ error: "Already claimed today", user: publicUser(user) });
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (user.lastDailyClaim === yesterday) user.streakDay = Math.min(7, user.streakDay + 1);
  else user.streakDay = 1;

  const reward = 500 + (user.streakDay - 1) * 100;
  user.lastDailyClaim = today;
  writeDb(db);
  credit(db, user.id, reward, "daily", { streakDay: user.streakDay });

  return { reward, user: publicUser(findUserById(readDb(), user.id)!) };
});

app.post("/spin", { preHandler: requireUser }, async (request, reply) => {
  const body = z
    .object({
      stake: z.number().int().positive().max(50_000),
      boost: z.boolean().default(false),
      gameId: z.string().default("orchard"),
    })
    .parse(request.body);

  const db = readDb();
  const user = findUserById(db, request.user.sub);
  if (!user) return reply.code(404).send({ error: "User not found" });

  const cost = body.boost ? body.stake * 2 : body.stake;
  if (user.tokens < cost) {
    return reply.code(400).send({ error: "Insufficient tokens", user: publicUser(user) });
  }

  credit(db, user.id, -cost, "spin_bet", { gameId: body.gameId, boost: body.boost });

  const grid = spinReels(body.boost);
  const result = evaluateSpin(grid, cost);

  if (result.payout > 0) {
    credit(db, user.id, result.payout, result.feature ? "bonus" : "spin_win", {
      gameId: body.gameId,
      scatters: result.scatters,
    });
  }

  const db2 = readDb();
  const u2 = findUserById(db2, user.id)!;
  u2.xp += body.boost ? 8 : 5;
  while (u2.xp >= 100) {
    u2.xp -= 100;
    u2.level += 1;
  }
  writeDb(db2);

  return {
    ...result,
    cost,
    user: publicUser(findUserById(readDb(), user.id)!),
  };
});

app.post("/gifts", { preHandler: requireUser }, async (request, reply) => {
  const body = z
    .object({
      toEmail: z.string().email(),
      amount: z.number().int().positive().max(10_000),
    })
    .parse(request.body);

  const db = readDb();
  const from = findUserById(db, request.user.sub);
  if (!from) return reply.code(404).send({ error: "User not found" });
  if (from.tokens < body.amount) {
    return reply.code(400).send({ error: "Insufficient tokens" });
  }

  let to = findUserByEmail(db, body.toEmail);
  if (!to) {
    to = createUser(db, {
      email: body.toEmail,
      name: body.toEmail.split("@")[0] || "Friend",
      method: "email",
    });
  }

  credit(db, from.id, -body.amount, "gift_out", { to: to.id });
  credit(readDb(), to.id, body.amount, "gift_in", { from: from.id });

  return { ok: true, user: publicUser(findUserById(readDb(), from.id)!) };
});

app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  app.log.info(`SpinKeep API on http://127.0.0.1:${PORT}`);
  app.log.info(
    `Google auth: ${googleConfigured() ? "ENABLED" : "demo mode (set GOOGLE_CLIENT_ID)"}`,
  );
});
