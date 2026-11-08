import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { signSession, verifySession } from "../src/lib/session";
import { passwordSchema } from "../src/lib/validation";

test("oturum imzasi kullaniciyi korur; degistirilmis token reddedilir", async () => {
  const token = await signSession(42);
  assert.equal(await verifySession(token), 42);
  const parts = token.split(".");
  parts[1] = Buffer.from('{"sub":"1"}').toString("base64url");
  assert.equal(await verifySession(parts.join(".")), null);
  assert.equal(await verifySession("gecersiz"), null);
});
test("bcrypt sinirini asan UTF-8 sifre reddedilir", () => {
  assert.equal(passwordSchema.safeParse("a".repeat(73)).success, false);
  assert.equal(passwordSchema.safeParse("ş".repeat(40)).success, false);
  assert.equal(passwordSchema.safeParse("Sekiz123!").success, true);
});
