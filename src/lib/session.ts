import { SignJWT, jwtVerify } from "jose";

// jose uses Web Crypto, so this module is safe in both the Node and edge
// runtimes (proxy.ts runs in Node on Next 16, but this stays portable).
function key(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** Sign a 7-day admin session token (HS256). */
export async function createSession(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

/** True only for a valid, unexpired admin token. Never throws. */
export async function verifySession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.admin === true;
  } catch {
    return false;
  }
}
