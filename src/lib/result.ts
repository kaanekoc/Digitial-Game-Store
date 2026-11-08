import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

export type ActionResult = { error?: string; success?: string } | null;
export class UserError extends Error {}
export async function actionResult(
  action: () => Promise<ActionResult | void>,
): Promise<ActionResult> {
  try {
    return (await action()) ?? { success: "İşlem tamamlandı." };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ZodError) return { error: error.issues[0].message };
    if (error instanceof UserError) return { error: error.message };
    const sql = error as { code?: string; sqlMessage?: string };
    if (sql.code === "ER_SIGNAL_EXCEPTION") return { error: sql.sqlMessage };
    if (sql.code === "ER_DUP_ENTRY") return { error: "Bu kayıt zaten mevcut." };
    console.error(
      "Sunucu işlemi başarısız:",
      error instanceof Error ? error.message : "Bilinmeyen hata",
    );
    return { error: "İşlem tamamlanamadı. Lütfen tekrar deneyin." };
  }
}
