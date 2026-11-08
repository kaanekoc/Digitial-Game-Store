"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ResultSetHeader } from "mysql2";
import { pool, query } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { actionResult, UserError } from "@/lib/result";
import { emailSchema, passwordSchema, nameSchema } from "@/lib/validation";
import type { User } from "@/lib/models";

// Tek sunuculu ders projesi icin bellek ici giris siniri.
const attempts = new Map<string, { count: number; until: number }>();
export async function login(form: FormData) {
  return actionResult(async () => {
    const email = emailSchema.parse(form.get("email"));
    const password = passwordSchema.parse(form.get("password"));
    const now = Date.now();
    for (const [key, value] of attempts)
      if (value.until < now) attempts.delete(key);
    const attempt = attempts.get(email);
    if (attempt && attempt.count >= 5)
      throw new UserError("Çok fazla deneme. 15 dakika sonra tekrar deneyin.");
    const users = await query<User & { password_hash: string }>(
      "SELECT id,name,email,role,password_hash FROM users WHERE email=?",
      [email],
    );
    if (
      !users[0] ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      attempts.set(email, {
        count: (attempt?.count ?? 0) + 1,
        until: attempt?.until ?? now + 15 * 60_000,
      });
      throw new UserError("E-posta veya şifre yanlış.");
    }
    attempts.delete(email);
    await createSession(users[0].id);
    revalidatePath("/", "layout");
    redirect("/");
  });
}
export async function register(form: FormData) {
  return actionResult(async () => {
    const name = nameSchema.parse(form.get("name"));
    const email = emailSchema.parse(form.get("email"));
    const password = passwordSchema.parse(form.get("password"));
    if ((await query("SELECT id FROM users WHERE email=?", [email])).length)
      throw new UserError("Bu e-posta zaten kullanılıyor.");
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users(name,email,password_hash) VALUES(?,?,?)",
      [name, email, await bcrypt.hash(password, 12)],
    );
    await createSession(result.insertId);
    revalidatePath("/", "layout");
    redirect("/");
  });
}
export async function logout() {
  (await cookies()).delete("nexus_session");
  revalidatePath("/", "layout");
  redirect("/");
}
