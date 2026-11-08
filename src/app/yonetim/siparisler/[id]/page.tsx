import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { money, date } from "@/lib/catalog";
import { orderStatus, paymentMethod } from "@/lib/orders";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const order = (await query<{ email: string; status: string; created_at: string }>("SELECT o.*,u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?", [id]))[0];
  if (!order) notFound();
  const items = await query<{ name: string; unit_price: number; acquired_at: string | null }>("SELECT g.name,oi.unit_price,ug.acquired_at FROM order_items oi JOIN games g ON g.id=oi.game_id LEFT JOIN user_games ug ON ug.order_id=oi.order_id AND ug.game_id=oi.game_id WHERE oi.order_id=?", [id]);
  const payments = await query<{ id: number; provider: string; provider_payment_id: string; payment_method: string; status: string; amount: number; processed_at: string }>("SELECT * FROM payments WHERE order_id=?", [id]);
  return <main><Link href="/yonetim?sekme=siparisler" className="back-link">← Sipariş yönetimine dön</Link><h1>Sipariş #{id}</h1><p className="muted">{order.email} · {date(order.created_at)} · {orderStatus[order.status]}</p><section className="panel table-wrap"><h2>Oyunlar ve sahiplik</h2><table><thead><tr><th>Oyun</th><th>Satın alma fiyatı</th><th>Kütüphaneye eklenme</th></tr></thead><tbody>{items.map((item, i) => <tr key={i}><td>{item.name}</td><td className="money">{money(item.unit_price)}</td><td>{item.acquired_at ? date(item.acquired_at) : "Sahiplik verilmedi"}</td></tr>)}</tbody></table></section><section className="panel demo-tool table-wrap"><h2>Ödeme kayıtları</h2><table><thead><tr><th>İşlem</th><th>Referans</th><th>Yöntem</th><th>Tutar</th><th>Sonuç</th><th>Tarih</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id}><td>{payment.provider}</td><td>{payment.provider_payment_id}</td><td>{paymentMethod[payment.payment_method]}</td><td className="money">{money(payment.amount)}</td><td>{orderStatus[payment.status]}</td><td>{date(payment.processed_at)}</td></tr>)}</tbody></table>{!payments.length && <p className="muted">Ödeme kaydı yok.</p>}</section></main>;
}
