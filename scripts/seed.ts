import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../src/lib/db";

const games = [
  ["Neon Drift", "Gecenin ritmini yakala.", "Yağmurla parlayan sokaklarda sınırlarını zorla. Her virajın yeni bir hikâye anlattığı, neon ışıklarıyla dolu bir şehirde yarış.", "Lumen Studio", "Nexus Originals", "2025-06-12", 349.90, "racing", ["Yarış", "Aksiyon"]],
  ["Kayıp Yörünge", "Sessizliğin ötesinde bir dünya.", "Terk edilmiş bir uzay istasyonunun son sinyalini takip et. Kaynaklarını yönet, bilinmeyen gezegenleri keşfet ve mürettebatın sırrını çöz.", "Orbit Works", "Deep Space", "2025-03-20", 499.90, "space", ["Macera", "Strateji"]],
  ["Ormanın Kalbi", "Küçük bir adım, büyük bir macera.", "Kadim ormanın kaybolan renklerini geri getir. El çizimi dünyalarda bulmacalar çöz, ormanın sakinleriyle dost ol ve kendi yolunu bul.", "Moss Games", "Leaf Interactive", "2024-11-08", 189.90, "forest", ["Macera", "Bağımsız"]],
  ["Demir Krallık", "Bir imparatorluk senin kararınla yükselir.", "Şehrini kur, ordularını eğit ve kaynaklarını dikkatle kullan. Değişen mevsimler ve güçlü rakipler arasında krallığını ayakta tut.", "Forge Studio", "Crown Publishing", "2025-01-16", 429.90, "kingdom", ["Strateji"]],
  ["Derin Mavi", "Yüzeyin altında başka bir hayat var.", "Okyanusun derinliklerinde unutulmuş bir uygarlığı keşfet. Kendi denizaltını geliştir, canlıları belgele ve gizemli akıntıları takip et.", "Tide Studio", "Blue Horizon", "2024-08-23", 249.90, "ocean", ["Macera", "Bağımsız"]],
  ["Kızıl Ufuk", "Son sınırda ilk sen ol.", "Toz fırtınalarıyla kaplı bir gezegende kolonini savun. Taktik savaşlar ve keşif görevleriyle insanlığın yeni evine yön ver.", "Red Planet", "Nexus Originals", "2025-09-05", 599.90, "desert", ["Aksiyon", "Strateji"]],
] as const;

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userPassword = process.env.SEED_USER_PASSWORD;
  if (!adminPassword || !userPassword || Math.min(adminPassword.length, userPassword.length) < 8)
    throw new Error(".env icinde en az 8 karakterli SEED_ADMIN_PASSWORD ve SEED_USER_PASSWORD tanimlayin.");
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [existing] = await c.query<import("mysql2").RowDataPacket[]>("SELECT id FROM games LIMIT 1");
    if (existing.length) throw new Error("Ornek veriler yalnizca bos oyun kataloguna eklenebilir. Mevcut veriler degistirilmedi.");
    for (const [name, email, password, role] of [
      ["Yönetici", "admin@nexus.local", adminPassword, "admin"],
      ["Deniz", "oyuncu@nexus.local", userPassword, "user"],
    ]) await c.execute("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [name, email, await bcrypt.hash(password, 12), role]);
    const genreIds = new Map<string, number>();
    for (const name of ["Aksiyon", "Macera", "Strateji", "Yarış", "Bağımsız"]) {
      const [result] = await c.execute<import("mysql2").ResultSetHeader>("INSERT INTO genres (name) VALUES (?)", [name]);
      genreIds.set(name, result.insertId);
    }
    for (const [name, tagline, description, developer, publisher, date, price, cover, genres] of games) {
      const [result] = await c.execute<import("mysql2").ResultSetHeader>(
        "INSERT INTO games (name, description, developer, publisher, release_date, price) VALUES (?, ?, ?, ?, ?, ?)",
        [name, tagline + "\n\n" + description, developer, publisher, date, price]);
      for (const genre of genres) await c.execute("INSERT INTO game_genres VALUES (?, ?)", [result.insertId, genreIds.get(genre)!]);
      await c.execute("INSERT INTO game_images (game_id, image_url, image_type) VALUES (?, ?, 'cover')", [result.insertId, `/covers/${cover}.svg`]);
      for (const [title, description, condition] of [
        ["İlk Adım", "İlk görevi tamamla.", "first_mission_completed"],
        ["Yeni Ufuklar", "Tüm bölümleri tamamla.", "all_chapters_completed"],
      ]) await c.execute("INSERT INTO achievements (game_id, name, description, completion_condition) VALUES (?, ?, ?, ?)", [result.insertId, title, description, condition]);
    }
    await c.commit();
    console.log("2 kullanici, 6 oyun, 5 tur ve 12 basarim eklendi. Oyunlar kurmaca ders verileridir.");
  } catch (error) { await c.rollback(); throw error; }
  finally { c.release(); await pool.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
