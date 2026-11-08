import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2";
import { pool, query } from "../../src/lib/db";

const tag = randomUUID().slice(0, 8);
const email = `e2e-${tag}@test.local`;
const password = "E2ePassword123!";
const title = `Test Oyunu ${tag}`;
let game = 0,
  achievement = 0,
  user = 0,
  lastOrder = 0,
  createdGame = 0,
  genre = 0;
const adminEmail = "admin@nexus.local";

async function login(page: Page, admin = false) {
  await page.goto("/giris");
  await page
    .getByLabel("E-posta", { exact: true })
    .fill(admin ? adminEmail : email);
  await page
    .getByLabel("Şifre", { exact: true })
    .fill(admin ? process.env.SEED_ADMIN_PASSWORD! : password);
  await page.getByRole("button", { name: "Giriş yap →", exact: true }).click();
  await expect(page).toHaveURL("/");
}

test.describe.serial("Ders projesi: gercek tarayici ve MySQL", () => {
  test.beforeAll(async () => {
    const [g] = await pool.execute<ResultSetHeader>(
      "INSERT INTO games(name,description,developer,publisher,price) VALUES(?,'Test aciklamasi','Test Studio','Test Publisher',100)",
      [title],
    );
    game = g.insertId;
    const [a] = await pool.execute<ResultSetHeader>(
      "INSERT INTO achievements(game_id,name,description,completion_condition) VALUES(?,'Test Basarimi','Ilk gorevi tamamla','test_mission')",
      [game],
    );
    achievement = a.insertId;
  });
  test.afterAll(async () => {
    const users = await query<{ id: number }>(
      "SELECT id FROM users WHERE email=?",
      [email],
    );
    user = users[0]?.id || user;
    if (user) {
      await pool.execute("DELETE FROM user_achievements WHERE user_id=?", [
        user,
      ]);
      await pool.execute("DELETE FROM cart_items WHERE user_id=?", [user]);
      await pool.execute("DELETE FROM user_games WHERE user_id=?", [user]);
      await pool.execute(
        "DELETE p FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.user_id=?",
        [user],
      );
      await pool.execute(
        "DELETE l FROM activity_logs l LEFT JOIN orders o ON o.id=l.order_id WHERE o.user_id=? OR l.actor_user_id=?",
        [user, user],
      );
      await pool.execute(
        "DELETE oi FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=?",
        [user],
      );
      await pool.execute("DELETE FROM orders WHERE user_id=?", [user]);
      await pool.execute("DELETE FROM users WHERE id=?", [user]);
    }
    // Basarisiz testte de yalnizca bu calismaya ait kurmaca kayitlar temizlenir.
    const created = await query<{ id: number }>(
      "SELECT id FROM games WHERE name=?",
      [`Yonetim ${tag}`],
    );
    createdGame = created[0]?.id || createdGame;
    for (const id of [game, createdGame].filter(Boolean)) {
      await pool.execute("DELETE FROM activity_logs WHERE game_id=?", [id]);
      await pool.execute("DELETE FROM achievements WHERE game_id=?", [id]);
      await pool.execute("DELETE FROM game_images WHERE game_id=?", [id]);
      await pool.execute("DELETE FROM game_genres WHERE game_id=?", [id]);
      await pool.execute("DELETE FROM games WHERE id=?", [id]);
    }
    await pool.execute("DELETE FROM genres WHERE name=?", [`Tur ${tag}`]);
    await pool.end();
  });

  test("ziyaretci oyun arar, kayit olur ve yonetim alanina giremez", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Oyuna gir/ }),
    ).toBeVisible();
    await page.getByRole("combobox").selectOption({ label: "Aksiyon" });
    await page.getByRole("button", { name: "Filtrele →" }).click();
    for (const card of await page.locator(".game-card").all())
      await expect(card).toContainText("Aksiyon");
    await page.getByRole("combobox").selectOption("");
    await page.getByRole("textbox", { name: "Oyun ara" }).fill(title);
    await page.getByRole("button", { name: "Filtrele →" }).click();
    await expect(page.locator(".game-card")).toHaveCount(1);
    await expect(page.locator(".game-card")).toContainText(title);
    await page.goto("/kayit");
    await page.getByLabel("Adın", { exact: true }).fill(`Test ${tag}`);
    await page.getByLabel("E-posta", { exact: true }).fill(email);
    await page.getByLabel("Şifre", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Hesap oluştur →" }).click();
    await expect(page).toHaveURL("/");
    user = (
      await query<{ id: number }>("SELECT id FROM users WHERE email=?", [email])
    )[0].id;
    await page.goto("/yonetim");
    await expect(page).toHaveURL("/");
    await page.goto(`/kutuphane/${game}`);
    await expect(
      page.getByRole("heading", { name: "Burada bir oyun yok." }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("sepetten cikarir, fiyat degisikligini onaylar, basarisiz ve basarili odeme yapar", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`/oyunlar/${game}`);
    await page.getByRole("button", { name: "Sepete ekle +" }).click();
    await expect(page).toHaveURL("/sepet");
    await page.getByRole("button", { name: "Sepetten çıkar ×" }).click();
    await expect(
      page.getByRole("heading", { name: "Yeni bir maceraya yer var." }),
    ).toBeVisible();
    await page.goto(`/oyunlar/${game}`);
    await page.getByRole("button", { name: "Sepete ekle +" }).click();
    await expect(page).toHaveURL("/sepet");
    await pool.execute("UPDATE games SET price=110 WHERE id=?", [game]);
    await page
      .getByRole("button", { name: "Toplamı onayla ve devam et →" })
      .click();
    await expect(page.locator(".notice[role=alert]")).toContainText(
      "Fiyat degisti",
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Toplamı onayla ve devam et →" })
      .click();
    await expect(page).toHaveURL(/\/odeme\/\d+/);
    await page.getByLabel("Ödeme sonucu").selectOption("failed");
    await page
      .getByRole("button", { name: "Demo ödemeyi sonuçlandır →" })
      .click();
    await expect(page).toHaveURL(/\/siparisler\/\d+/);
    await expect(
      page.getByText("Ödeme başarısız oldu.", { exact: false }),
    ).toBeVisible();
    expect(
      (await query("SELECT * FROM user_games WHERE user_id=?", [user])).length,
    ).toBe(0);
    await page.goto("/sepet");
    await page
      .getByRole("button", { name: "Toplamı onayla ve devam et →" })
      .click();
    await expect(page).toHaveURL(/\/odeme\/\d+/);
    await page
      .getByRole("button", { name: "Demo ödemeyi sonuçlandır →" })
      .click();
    await expect(page).toHaveURL(/\/siparisler\/\d+/);
    lastOrder = Number(page.url().split("/").at(-1));
    await expect(
      page.getByText("Ödemen tamamlandı.", { exact: false }),
    ).toBeVisible();
    await page.goto("/kutuphane");
    await expect(page.locator(".game-card")).toContainText(title);
    await page.goto(`/oyunlar/${game}`);
    await expect(
      page.getByRole("link", { name: "Kütüphanende görüntüle →" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sepete ekle +" }),
    ).toHaveCount(0);
  });

  test("basarim API anahtari, olay kontrolu, tekrar korumasi ve satistan kalkan oyun", async ({
    page,
    request,
  }) => {
    const body = {
      userId: user,
      achievementId: achievement,
      event: "test_mission",
    };
    expect(
      (
        await request.post("/api/integration/achievements", { data: body })
      ).status(),
    ).toBe(401);
    const headers = {
      Authorization: `Bearer ${process.env.GAME_INTEGRATION_SECRET}`,
    };
    expect(
      (
        await request.post("/api/integration/achievements", {
          headers,
          data: { ...body, event: "wrong" },
        })
      ).status(),
    ).toBe(422);
    expect(
      (
        await request.post("/api/integration/achievements", {
          headers,
          data: { ...body, userId: 99999999 },
        })
      ).status(),
    ).toBe(422);
    expect(
      (
        await request.post("/api/integration/achievements", {
          headers,
          data: body,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await request.post("/api/integration/achievements", {
          headers,
          data: body,
        })
      ).status(),
    ).toBe(200);
    expect(
      (await query("SELECT * FROM user_achievements WHERE user_id=?", [user]))
        .length,
    ).toBe(1);
    await pool.execute("UPDATE games SET is_active=0 WHERE id=?", [game]);
    await login(page);
    await page.goto(`/kutuphane/${game}`);
    await expect(page.getByText("Kazanıldı ·", { exact: false })).toBeVisible();
    await page.goto("/kutuphane");
    await expect(page.locator(".game-card")).toContainText(title);
    await page.goto(`/oyunlar/${game}`);
    await expect(
      page.getByText("Satışa kapalı", { exact: true }),
    ).toBeVisible();
  });

  test("yonetici oyun tur basarim roller ve islem kayitlarini yonetir", async ({
    page,
  }) => {
    await login(page, true);
    await page.goto(`/siparisler/${lastOrder}`);
    await expect(
      page.getByRole("heading", { name: "Burada bir oyun yok." }),
    ).toBeVisible();
    await page.goto(`/yonetim/siparisler/${lastOrder}`);
    await expect(page.getByText(email, { exact: false })).toBeVisible();
    await page.goto("/yonetim?sekme=turler");
    const genreForm = page
      .locator(".panel")
      .filter({ has: page.getByRole("heading", { name: "Yeni tür ekle" }) });
    await genreForm.getByLabel("Tür adı").fill(`Tur ${tag}`);
    await genreForm.getByRole("button", { name: "Tür ekle +" }).click();
    await expect(genreForm.getByRole("status")).toContainText("Tür kaydedildi");
    genre = (
      await query<{ id: number }>("SELECT id FROM genres WHERE name=?", [
        `Tur ${tag}`,
      ])
    )[0].id;
    await page.goto("/yonetim/oyunlar/yeni");
    await page.getByLabel("Oyun adı", { exact: true }).fill(`Yonetim ${tag}`);
    await page.getByLabel("Satış fiyatı (TRY)").fill("200");
    await page
      .getByLabel("Açıklama", { exact: true })
      .fill("Ders projesi icin eklenen yonetim testi oyunu.");
    await page.getByLabel("Geliştirici", { exact: true }).fill("Test Studio");
    await page.getByLabel("Yayıncı", { exact: true }).fill("Test Publisher");
    await page.getByLabel(`Tur ${tag}`, { exact: true }).check();
    await page.getByRole("button", { name: "Oyunu kaydet →" }).click();
    await expect(page).toHaveURL("/yonetim?sekme=oyunlar");
    createdGame = (
      await query<{ id: number }>("SELECT id FROM games WHERE name=?", [
        `Yonetim ${tag}`,
      ])
    )[0].id;
    await page.goto(`/yonetim/oyunlar/${createdGame}`);
    await page.getByLabel("Satış fiyatı (TRY)").fill("250");
    await page.getByLabel("Satışa açık", { exact: true }).uncheck();
    await page.getByRole("button", { name: "Oyunu kaydet →" }).click();
    await expect(page).toHaveURL("/yonetim?sekme=oyunlar");
    await page.goto("/yonetim?sekme=basarimlar");
    const newAchievement = page.locator(".panel").filter({
      has: page.getByRole("heading", { name: "Yeni başarım", exact: true }),
    });
    await newAchievement
      .getByRole("combobox")
      .selectOption(String(createdGame));
    await newAchievement.getByLabel("Başarım adı").fill("Yonetim Basarimi");
    await newAchievement
      .getByLabel("Açıklama", { exact: true })
      .fill("Test gorevini bitir.");
    await newAchievement
      .getByLabel("Tamamlanma olay kodu")
      .fill("admin_test_event");
    await newAchievement
      .getByRole("button", { name: "Başarım ekle +" })
      .click();
    await expect(newAchievement.getByRole("status")).toContainText(
      "Başarım tanımı kaydedildi",
    );
    const demoTool = page.locator(".demo-tool");
    await demoTool.locator('select[name="user_id"]').selectOption(String(user));
    await demoTool
      .locator('select[name="achievement_id"]')
      .selectOption(String(achievement));
    await demoTool
      .getByRole("button", { name: "Oyun olayını simüle et" })
      .click();
    await expect(demoTool.getByRole("status")).toContainText(
      "Başarım kaydedildi",
    );
    await page.goto("/yonetim?sekme=kullanicilar");
    const row = page.getByRole("row").filter({ hasText: email });
    await row.getByRole("combobox").selectOption("admin");
    await row.getByRole("button", { name: "Kaydet" }).click();
    await expect(row.getByRole("status")).toContainText("rolü güncellendi");
    await row.getByRole("combobox").selectOption("user");
    await row.getByRole("button", { name: "Kaydet" }).click();
    await expect(row.getByRole("status")).toContainText("rolü güncellendi");
    await page.goto("/yonetim?sekme=gunluk");
    await expect(
      page.getByText("game.updated", { exact: true }).first(),
    ).toBeVisible();
  });

  test("mobil arayuz tasmaz; gorseller ve istemci hatasiz yuklenir", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Oyuna gir/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".hero-image")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    ).toBe(true);
    await page.locator("img").evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (image) => {
          if (!(image instanceof HTMLImageElement)) return;
          image.loading = "eager";
          await image.decode();
        }),
      );
    });
    await page.screenshot({
      path: "test-results/store-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await page.screenshot({
      path: "test-results/store-desktop.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
});
