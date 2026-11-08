import { SignJWT, jwtVerify } from "jose";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("change-this"))
    throw new Error("SESSION_SECRET en az 32 karakterlik rastgele bir deger olmali.");
  return new TextEncoder().encode(secret);
}
export async function signSession(userId: number) {
  return new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(String(userId))
    .setIssuedAt().setIssuer("nexus-store").setAudience("nexus-user").setExpirationTime("7d").sign(key());
}
export async function verifySession(token: string): Promise<number | null> {
  const secret = key();
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"], issuer: "nexus-store", audience: "nexus-user" });
    const id = Number(payload.sub);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch { return null; }
}
