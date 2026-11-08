import { z } from "zod";

export const idSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const emailSchema = z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi yazın.").max(254);
export const passwordSchema = z.string().min(8, "Şifre en az 8 karakter olmalı.").max(72, "Şifre en fazla 72 karakter olmalı.")
  .refine(value => Buffer.byteLength(value, "utf8") <= 72, "Şifre UTF-8 olarak en fazla 72 bayt olmalı.");
export const nameSchema = z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(100);
