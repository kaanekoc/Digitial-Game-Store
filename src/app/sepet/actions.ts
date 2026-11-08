"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { requireUser } from "@/lib/auth";
import { withActor } from "@/lib/db";
import { actionResult, UserError } from "@/lib/result";
import { idSchema } from "@/lib/validation";

export async function addToCart(form: FormData) {
  return actionResult(async () => {
    const user = await requireUser();
    const gameId = idSchema.parse(form.get("game_id"));
    await withActor(user.id, async c => {
      await c.beginTransaction();
      try {
        await c.execute("SELECT id FROM users WHERE id=? FOR UPDATE", [user.id]);
        const [rows] = await c.execute<RowDataPacket[]>("SELECT game_id FROM cart_items WHERE user_id=? AND game_id=?", [user.id, gameId]);
        if (!rows.length) await c.execute("INSERT INTO cart_items(user_id,game_id) VALUES(?,?)", [user.id, gameId]);
        await c.commit();
      } catch (error) { await c.rollback(); throw error; }
    });
    revalidatePath("/", "layout");
    redirect("/sepet");
  });
}
export async function removeFromCart(form: FormData) {
  return actionResult(async () => {
    const user = await requireUser();
    const gameId = idSchema.parse(form.get("game_id"));
    await withActor(user.id, async c => {
      await c.beginTransaction();
      try {
        await c.execute("SELECT id FROM users WHERE id=? FOR UPDATE", [user.id]);
        await c.execute("DELETE FROM cart_items WHERE user_id=? AND game_id=?", [user.id, gameId]);
        await c.commit();
      } catch (error) { await c.rollback(); throw error; }
    });
    revalidatePath("/", "layout");
    return { success: "Oyun sepetten çıkarıldı." };
  });
}
export async function checkout(form: FormData) {
  return actionResult(async () => {
    const user = await requireUser();
    const key = z.uuid().parse(form.get("checkout_key"));
    const total = z.coerce.number().finite().nonnegative().max(99_999_999.99).parse(form.get("total"));
    const id = await withActor(user.id, async c => {
      const [rows] = await c.query<RowDataPacket[][]>("CALL sp_checkout(?,?,?)", [user.id, key, total]);
      return Number(rows[0][0].order_id);
    });
    redirect(`/odeme/${id}`);
  });
}
export async function pay(form: FormData) {
  return actionResult(async () => {
    const user = await requireUser();
    if (process.env.DEMO_MODE !== "true") throw new UserError("Demo ödeme kapalı. Gerçek ödeme entegrasyonu bu projede bulunmuyor.");
    const id = idSchema.parse(form.get("order_id"));
    const method = z.enum(["demo_card", "demo_wallet"]).parse(form.get("method"));
    const result = z.enum(["success", "failed"]).parse(form.get("result"));
    await withActor(user.id, async c => {
      await c.execute("CALL sp_complete_payment(?,?,?,?,?)", [user.id, id, `demo-order-${id}`, method, result === "success"]);
    });
    revalidatePath("/", "layout");
    redirect(`/siparisler/${id}`);
  });
}
