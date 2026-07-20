import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_CLIENT_ID || "";
const client = clientId ? new OAuth2Client(clientId) : null;

export function googleConfigured() {
  return Boolean(clientId);
}

/** Verify a Google ID token. Returns profile or null if invalid / not configured. */
export async function verifyGoogleIdToken(idToken: string) {
  if (!client || !clientId) {
    return null;
  }
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) return null;
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0] || "Player",
    picture: payload.picture,
  };
}
