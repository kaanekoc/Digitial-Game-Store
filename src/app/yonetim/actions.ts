"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireAdmin } from "@/lib/auth";
import { withActor } from "@/lib/db";
import { actionResult, UserError } from "@/lib/result";
import { idSchema } from "@/lib/validation";

const text = (max: number) =>
  z.string().trim().min(2, "Lütfen en az 2 karakter girin.").max(max);
const imageSchema = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      /^\/covers\/[a-z0-9_-]+\.svg$/.test(value) ||
      (/^https?:\/\//i.test(value) && URL.canParse(value)),
    "Görsel için /covers/ dosyası veya http(s) adresi kullanın.",
  );

export async function saveGame(form: FormData) {
  return actionResult(async () => {
    const admin = await requireAdmin();
    const id = form.get("id") ? idSchema.parse(form.get("id")) : null;
    const name = text(200).parse(form.get("name"));
    const description = text(20_000).parse(form.get("description"));
    const developer = text(200).parse(form.get("developer"));
    const publisher = text(200).parse(form.get("publisher"));
    const releaseDate = form.get("release_date")
      ? z.iso.date().parse(form.get("release_date"))
      : null;
    const price = z.coerce
      .number()
      .finite()
      .nonnegative()
      .max(99_999_999.99)
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
        "Fiyat en fazla iki ondalık basamak içermeli.",
      )
      .parse(form.get("price"));
    const active = form.get("is_active") === "on";
    const genres = [
      ...new Set(
        z
          .array(idSchema)
          .min(1, "En az bir tür seçin.")
          .max(20)
          .parse(form.getAll("genres")),
      ),
    ];
    const cover = imageSchema.parse(form.get("cover") || "/covers/space.svg");
    const screenshots = z
      .array(imageSchema)
      .max(12)
      .parse(
        String(form.get("screenshots") || "")
          .split(/\r?\n/)
          .map((v) => v.trim())
          .filter(Boolean),
      );
    await withActor(admin.id, async (c) => {
      await c.beginTransaction();
      try {
        let gameId = id;
        let oldImages: RowDataPacket[] = [],
          oldGenres: RowDataPacket[] = [];
        if (id) {
          const [existing] = await c.execute<RowDataPacket[]>(
            "SELECT id FROM games WHERE id=? FOR UPDATE",
            [id],
          );
          if (!existing.length) throw new UserError("Oyun bulunamadı.");
          [oldImages] = await c.execute<RowDataPacket[]>(
            "SELECT image_url,image_type FROM game_images WHERE game_id=?",
            [id],
          );
          [oldGenres] = await c.execute<RowDataPacket[]>(
            "SELECT genre_id FROM game_genres WHERE game_id=?",
            [id],
          );
          await c.execute(
            "UPDATE games SET name=?,description=?,developer=?,publisher=?,release_date=?,price=?,is_active=? WHERE id=?",
            [
              name,
              description,
              developer,
              publisher,
              releaseDate,
              price,
              active,
              id,
            ],
          );
        } else {
          const [result] = await c.execute<ResultSetHeader>(
            "INSERT INTO games(name,description,developer,publisher,release_date,price,is_active) VALUES(?,?,?,?,?,?,?)",
            [
              name,
              description,
              developer,
              publisher,
              releaseDate,
              price,
              active,
            ],
          );
          gameId = result.insertId;
        }
        await c.execute("DELETE FROM game_genres WHERE game_id=?", [gameId]);
        for (const genre of genres)
          await c.execute("INSERT INTO game_genres VALUES(?,?)", [
            gameId,
            genre,
          ]);
        await c.execute("DELETE FROM game_images WHERE game_id=?", [gameId]);
        await c.execute(
          "INSERT INTO game_images(game_id,image_url,image_type) VALUES(?,?,'cover')",
          [gameId, cover],
        );
        for (const [index, url] of screenshots.entries())
          await c.execute(
            "INSERT INTO game_images(game_id,image_url,image_type,sort_order) VALUES(?,?,'screenshot',?)",
            [gameId, url, index],
          );
        await c.execute(
          "INSERT INTO activity_logs(actor_user_id,game_id,action,old_values,new_values) VALUES(?,?,?,?,?)",
          [
            admin.id,
            gameId,
            id ? "game.media_and_genres_updated" : "game.created",
            JSON.stringify({ images: oldImages, genres: oldGenres }),
            JSON.stringify({ name, cover, screenshots, genres, price, active }),
          ],
        );
        await c.commit();
      } catch (error) {
        await c.rollback();
        throw error;
      }
    });
    revalidatePath("/", "layout");
    redirect("/yonetim?sekme=oyunlar");
  });
}
export async function saveGenre(form: FormData) {
  return actionResult(async () => {
    const admin = await requireAdmin();
    const name = text(100).parse(form.get("name"));
    const id = form.get("id") ? idSchema.parse(form.get("id")) : null;
    await withActor(admin.id, async (c) => {
      if (id)
        await c.execute("UPDATE genres SET name=? WHERE id=?", [name, id]);
      else await c.execute("INSERT INTO genres(name) VALUES(?)", [name]);
    });
    revalidatePath("/", "layout");
    return { success: "Tür kaydedildi." };
  });
}
export async function saveAchievement(form: FormData) {
  return actionResult(async () => {
    const admin = await requireAdmin();
    const id = form.get("id") ? idSchema.parse(form.get("id")) : null;
    const game = idSchema.parse(form.get("game_id"));
    const name = text(200).parse(form.get("name"));
    const description = text(5000).parse(form.get("description"));
    const condition = text(1000).parse(form.get("completion_condition"));
    await withActor(admin.id, async (c) => {
      if (id) {
        const [result] = await c.execute<ResultSetHeader>(
          "UPDATE achievements SET name=?,description=?,completion_condition=? WHERE id=? AND game_id=?",
          [name, description, condition, id, game],
        );
        if (!result.affectedRows) throw new UserError("Başarım bulunamadı.");
      } else
        await c.execute(
          "INSERT INTO achievements(game_id,name,description,completion_condition) VALUES(?,?,?,?)",
          [game, name, description, condition],
        );
    });
    revalidatePath("/", "layout");
    return { success: "Başarım tanımı kaydedildi." };
  });
}
export async function updateRole(form: FormData) {
  return actionResult(async () => {
    const admin = await requireAdmin();
    const id = idSchema.parse(form.get("user_id"));
    const role = z.enum(["user", "admin"]).parse(form.get("role"));
    if (id === admin.id)
      throw new UserError(
        "Kendi yönetici yetkinizi bu ekrandan değiştiremezsiniz.",
      );
    await withActor(admin.id, async (c) => {
      await c.execute("UPDATE users SET role=? WHERE id=?", [role, id]);
    });
    revalidatePath("/yonetim");
    return { success: "Kullanıcı rolü güncellendi." };
  });
}
export async function demoUnlock(form: FormData) {
  return actionResult(async () => {
    const admin = await requireAdmin();
    if (process.env.DEMO_MODE !== "true")
      throw new UserError("Ders demo aracı kapalı.");
    const user = idSchema.parse(form.get("user_id"));
    const achievement = idSchema.parse(form.get("achievement_id"));
    await withActor(admin.id, async (c) => {
      await c.execute("CALL sp_unlock_achievement(?,?)", [user, achievement]);
    });
    revalidatePath("/", "layout");
    return {
      success: "Doğrulanmış oyun olayı simüle edildi. Başarım kaydedildi.",
    };
  });
}
