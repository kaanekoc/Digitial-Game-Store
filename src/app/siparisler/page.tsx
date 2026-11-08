import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { date, money } from "@/lib/catalog";
import { orderStatus } from "@/lib/orders";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await query<{
    id: number;
    status: string;
    created_at: string;
    total: number;
    games: string;
  }>(
    `SELECT o.id,o.status,o.created_at,SUM(oi.unit_price) AS total,GROUP_CONCAT(g.name SEPARATOR ', ') AS games FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN games g ON g.id=oi.game_id WHERE o.user_id=? GROUP BY o.id ORDER BY o.id DESC`,
    [user.id],
  );
  return (
    <main>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KOLEKSİYONUNUN YOLCULUĞU</span>
          <h1>
            Siparişlerin<span className="accent">.</span>
          </h1>
          <p className="muted">Satın alma ve ödeme geçmişin burada.</p>
        </div>
      </div>
      {orders.length ? (
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sipariş</th>
                <th>Oyunlar</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th>
                  <span className="sr-only">Detay</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.games}</td>
                  <td>{date(order.created_at)}</td>
                  <td className="money">{money(order.total)}</td>
                  <td>
                    <span
                      className={`badge ${order.status === "completed" ? "green" : ""}`}
                    >
                      {orderStatus[order.status]}
                    </span>
                  </td>
                  <td>
                    <Link className="accent" href={`/siparisler/${order.id}`}>
                      Detay →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="empty panel">
          <h2>Henüz siparişin yok.</h2>
          <p>İlk oyununla yeni bir hikâyeye başla.</p>
          <Link className="button" href="/">
            Oyunları keşfet ↗
          </Link>
        </section>
      )}
    </main>
  );
}
