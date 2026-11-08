import "dotenv/config";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";

// mysql CLI'deki DELIMITER komutunu da destekleyen kucuk SQL dosyasi okuyucusu.
export function statements(source: string) {
  let delimiter = ";";
  let buffer = "";
  const result: string[] = [];
  for (const line of source.split(/\r?\n/)) {
    if (line.trim().startsWith("--")) continue;
    const match = line.match(/^DELIMITER\s+(\S+)/i);
    if (match) {
      delimiter = match[1];
      continue;
    }
    buffer += line + "\n";
    if (buffer.trimEnd().endsWith(delimiter)) {
      result.push(buffer.trimEnd().slice(0, -delimiter.length));
      buffer = "";
    }
  }
  if (buffer.trim())
    throw new Error("SQL dosyasinin sonunda eksik delimiter var.");
  return result;
}

async function main() {
  const name = process.env.DB_NAME ?? "digital_game_store";
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error("Gecersiz DB_NAME");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
  });
  try {
    const [existing] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?",
      [name],
    );
    if (existing.length)
      throw new Error(
        "Veritabani zaten tablolar iceriyor. db:setup bos veritabani ister; mevcut veriler silinmedi.",
      );
    for (const file of ["database/schema.sql", "database/routines.sql"]) {
      const source = (await readFile(file, "utf8")).replaceAll(
        "digital_game_store",
        name,
      );
      for (const sql of statements(source)) await connection.query(sql);
    }
    console.log("13 tablo, 3 trigger ve 3 stored procedure olusturuldu.");
  } finally {
    await connection.end();
  }
}
if (process.argv[1]?.endsWith("setup-db.ts"))
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
