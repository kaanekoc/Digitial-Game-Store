import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { query } from "./db";
import { signSession, verifySession } from "./session";
import type { User } from "./models";
import { UserError } from "./result";

export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get("nexus_session")?.value;
  if (!token) return null;
  const id = await verifySession(token);
  if (!id) return null;
  const users = await query<User>("SELECT id,name,email,role FROM users WHERE id=?", [id]);
  return users[0] ?? null;
});
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/giris");
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new UserError("Bu işlem için yönetici yetkisi gerekiyor.");
  return user;
}
export async function createSession(id: number) {
  (await cookies()).set("nexus_session", await signSession(id), {
    httpOnly: true, sameSite: "lax", secure: new URL(process.env.APP_URL ?? "http://localhost:3000").protocol === "https:",
    maxAge: 60 * 60 * 24 * 7, path: "/",
  });
}
