import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, query, withActor } from "../src/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

test("MySQL: trigger, siparis, odeme ve basarim akisi", async t => {
  let user = 0, game = 0, achievement = 0, order = 0;
  const key = randomUUID();
  try {
    const [u] = await pool.execute<ResultSetHeader>("INSERT INTO users(name,email,password_hash) VALUES('Test',?,'not-a-login-hash')", [`${key}@test.local`]); user = u.insertId;
    const [g] = await pool.execute<ResultSetHeader>("INSERT INTO games(name,description,developer,publisher,price) VALUES('Test','Test','Test','Test',100)"); game = g.insertId;
    const [a] = await pool.execute<ResultSetHeader>("INSERT INTO achievements(game_id,name,description,completion_condition) VALUES(?,'Test','Test','test_event')", [game]); achievement = a.insertId;
    await t.test("3 trigger ve 3 procedure kurulu", async () => {
      const [triggers] = await pool.query<RowDataPacket[]>("SELECT TRIGGER_NAME FROM information_schema.triggers WHERE TRIGGER_SCHEMA=DATABASE()");
      const [procedures] = await pool.query<RowDataPacket[]>("SELECT ROUTINE_NAME FROM information_schema.routines WHERE ROUTINE_SCHEMA=DATABASE() AND ROUTINE_TYPE='PROCEDURE'");
      assert.equal(triggers.length, 3); assert.equal(procedures.length, 3);
    });
    await t.test("satista olmayan oyun sepete eklenemez; oyun degisikligi loglanir", async () => {
      await withActor(user, async c => { await c.execute("UPDATE games SET is_active=0 WHERE id=?", [game]); });
      await assert.rejects(pool.execute("INSERT INTO cart_items(user_id,game_id) VALUES(?,?)", [user, game]), /satista/);
      const logs = await query<{ actor_user_id: number }>("SELECT actor_user_id FROM activity_logs WHERE game_id=?", [game]);
      assert.equal(logs[0].actor_user_id, user);
      await pool.execute("UPDATE games SET is_active=1 WHERE id=?", [game]);
      await pool.execute("INSERT INTO cart_items(user_id,game_id) VALUES(?,?)", [user, game]);
      await assert.rejects(pool.execute("INSERT INTO cart_items(user_id,game_id) VALUES(?,?)", [user, game]), /Duplicate/);
    });
    await t.test("fiyat onayi ve checkout tekrar korumasi", async () => {
      await assert.rejects(pool.execute("CALL sp_checkout(?,?,?)", [user, key, 99]), /Fiyat/);
      await pool.execute("CALL sp_checkout(?,?,?)", [user, key, 100]);
      await pool.execute("CALL sp_checkout(?,?,?)", [user, key, 100]);
      const rows = await query<{ id: number }>("SELECT id FROM orders WHERE user_id=?", [user]);
      assert.equal(rows.length, 1); order = rows[0].id;
    });
    await t.test("basarisiz odeme sahiplik vermez", async () => {
      await pool.execute("CALL sp_complete_payment(?,?,?,'demo_card',FALSE)", [user, order, `fail-${key}`]);
      assert.equal((await query("SELECT * FROM user_games WHERE user_id=?", [user])).length, 0);
      await assert.rejects(pool.execute("CALL sp_unlock_achievement(?,?)", [user, achievement]), /ait degil/);
    });
    await t.test("odeme aninda fiyat degismisse yeniden onay gerekir", async () => {
      await pool.execute("CALL sp_checkout(?,?,?)", [user, randomUUID(), 100]);
      const rows = await query<{ id: number }>("SELECT id FROM orders WHERE user_id=? AND status='pending'", [user]); order = rows[0].id;
      await pool.execute("UPDATE games SET price=110 WHERE id=?", [game]);
      await assert.rejects(pool.execute("CALL sp_complete_payment(?,?,?,'demo_card',TRUE)", [user, order, `ok-${key}`]), /Fiyat/);
      await pool.execute("UPDATE games SET price=100 WHERE id=?", [game]);
    });
    await t.test("paralel odeme tekrari bir sahiplik ve bir odeme uretir", async () => {
      await Promise.all([1, 2].map(() => withActor(user, async c => {
        await c.execute("CALL sp_complete_payment(?,?,?,'demo_card',TRUE)", [user, order, `ok-${key}`]);
      })));
      assert.equal((await query("SELECT * FROM user_games WHERE user_id=?", [user])).length, 1);
      assert.equal((await query("SELECT * FROM payments WHERE order_id=?", [order])).length, 1);
      assert.equal((await query("SELECT * FROM cart_items WHERE user_id=?", [user])).length, 0);
      assert.equal((await query("SELECT * FROM activity_logs WHERE order_id=?", [order])).length, 1);
      await assert.rejects(pool.execute("INSERT INTO cart_items(user_id,game_id) VALUES(?,?)", [user, game]), /zaten/);
    });
    await t.test("basarim bir kez verilir; satin alma basarim kazandirmaz", async () => {
      assert.equal((await query("SELECT * FROM user_achievements WHERE user_id=?", [user])).length, 0);
      await pool.execute("CALL sp_unlock_achievement(?,?)", [user, achievement]);
      await pool.execute("CALL sp_unlock_achievement(?,?)", [user, achievement]);
      assert.equal((await query("SELECT * FROM user_achievements WHERE user_id=?", [user])).length, 1);
    });
  } finally {
    if (user) {
      await pool.execute("DELETE FROM user_achievements WHERE user_id=?", [user]);
      await pool.execute("DELETE FROM cart_items WHERE user_id=?", [user]);
      await pool.execute("DELETE FROM user_games WHERE user_id=?", [user]);
      await pool.execute("DELETE p FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.user_id=?", [user]);
      await pool.execute("DELETE l FROM activity_logs l LEFT JOIN orders o ON o.id=l.order_id WHERE o.user_id=? OR l.game_id=? OR l.actor_user_id=?", [user, game, user]);
      await pool.execute("DELETE oi FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=?", [user]);
      await pool.execute("DELETE FROM orders WHERE user_id=?", [user]);
      if (game) { await pool.execute("DELETE FROM achievements WHERE game_id=?", [game]); await pool.execute("DELETE FROM games WHERE id=?", [game]); }
      await pool.execute("DELETE FROM users WHERE id=?", [user]);
    }
    await pool.end();
  }
});
