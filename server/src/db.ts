import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuid } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export type User = {
  id: string;
  email: string;
  name: string;
  method: "google" | "apple" | "email" | "guest";
  googleSub?: string;
  tokens: number;
  level: number;
  xp: number;
  streakDay: number;
  lastDailyClaim: string | null;
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  userId: string;
  type: "spin_bet" | "spin_win" | "daily" | "gift_out" | "gift_in" | "bonus" | "signup";
  amount: number;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export type DbShape = {
  users: User[];
  ledger: LedgerEntry[];
};

function emptyDb(): DbShape {
  return { users: [], ledger: [] };
}

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb(), null, 2));
  }
}

export function readDb(): DbShape {
  ensure();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as DbShape;
}

export function writeDb(db: DbShape) {
  ensure();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function findUserByEmail(db: DbShape, email: string) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(db: DbShape, id: string) {
  return db.users.find((u) => u.id === id);
}

export function findUserByGoogleSub(db: DbShape, sub: string) {
  return db.users.find((u) => u.googleSub === sub);
}

export function createUser(
  db: DbShape,
  input: Pick<User, "email" | "name" | "method"> & { googleSub?: string },
): User {
  const user: User = {
    id: uuid(),
    email: input.email,
    name: input.name,
    method: input.method,
    googleSub: input.googleSub,
    tokens: 12_840,
    level: 1,
    xp: 0,
    streakDay: 1,
    lastDailyClaim: null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  db.ledger.push({
    id: uuid(),
    userId: user.id,
    type: "signup",
    amount: user.tokens,
    meta: { reason: "starter_pack" },
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  return user;
}

export function credit(
  db: DbShape,
  userId: string,
  amount: number,
  type: LedgerEntry["type"],
  meta?: Record<string, unknown>,
) {
  const user = findUserById(db, userId);
  if (!user) throw new Error("User not found");
  user.tokens += amount;
  db.ledger.push({
    id: uuid(),
    userId,
    type,
    amount,
    meta,
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  return user;
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    method: user.method,
    tokens: user.tokens,
    level: user.level,
    xp: user.xp,
    streakDay: user.streakDay,
    lastDailyClaim: user.lastDailyClaim,
  };
}
