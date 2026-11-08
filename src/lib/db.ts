import mysql, { type PoolConnection, type RowDataPacket } from "mysql2/promise";

const globalDb = globalThis as unknown as { mysqlPool?: mysql.Pool };
export const pool = globalDb.mysqlPool ?? mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "digital_game_store",
  connectionLimit: 10, decimalNumbers: true, dateStrings: true,
  supportBigNumbers: true, bigNumberStrings: false,
});
if (process.env.NODE_ENV !== "production") globalDb.mysqlPool = pool;

export async function query<T = Record<string, unknown>>(sql: string, values: (string | number | boolean | Date | null)[] = []): Promise<T[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);
  return rows as T[];
}

// Havuz baglantisina actor degeri sizmamasi icin finally icinde temizlenir.
export async function withActor<T>(userId: number, action: (connection: PoolConnection) => Promise<T>) {
  const connection = await pool.getConnection();
  try {
    await connection.execute("SET @actor_user_id = ?", [userId]);
    return await action(connection);
  } finally {
    try { await connection.query("SET @actor_user_id = NULL"); } finally { connection.release(); }
  }
}
