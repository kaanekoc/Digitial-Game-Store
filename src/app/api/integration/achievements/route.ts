import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { pool, query } from "@/lib/db";
import { idSchema } from "@/lib/validation";

const bodySchema = z.object({
  userId: idSchema,
  achievementId: idSchema,
  event: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
  const secret = process.env.GAME_INTEGRATION_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("change-this"))
    return Response.json(
      { error: "Oyun entegrasyonu yapılandırılmamış." },
      { status: 503 },
    );
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (
    Buffer.byteLength(auth) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
  )
    return Response.json({ error: "Yetkisiz istek." }, { status: 401 });
  try {
    const text = await request.text();
    if (text.length > 4096)
      return Response.json({ error: "İstek çok büyük." }, { status: 413 });
    const data = bodySchema.parse(JSON.parse(text));
    const achievement = (
      await query<{ completion_condition: string }>(
        "SELECT completion_condition FROM achievements WHERE id=?",
        [data.achievementId],
      )
    )[0];
    if (!achievement || achievement.completion_condition !== data.event)
      return Response.json(
        { error: "Başarım veya tamamlanma olayı eşleşmiyor." },
        { status: 422 },
      );
    await pool.execute("CALL sp_unlock_achievement(?,?)", [
      data.userId,
      data.achievementId,
    ]);
    revalidatePath("/kutuphane", "layout");
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return Response.json(
        { error: "Geçersiz istek gövdesi." },
        { status: 400 },
      );
    if ((error as { code?: string }).code === "ER_SIGNAL_EXCEPTION")
      return Response.json(
        { error: "Kullanıcı oyuna sahip değil." },
        { status: 422 },
      );
    console.error(
      "Başarım entegrasyonu başarısız.",
      error instanceof Error ? error.message : "",
    );
    return Response.json({ error: "İşlem tamamlanamadı." }, { status: 500 });
  }
}
