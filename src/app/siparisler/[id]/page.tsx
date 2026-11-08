import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { date, money } from "@/lib/catalog";
import { orderStatus, paymentMethod } from "@/lib/orders";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const order = (await query<{ id: number; status: string; created_at: string; completed_at: string | null }>("SELECT * FROM orders WHERE id=? AND user_id=?", [id, user.id]))[0];
  if (!order) notFound();
  const items = await query<{ game_id: number; name: string; unit_price: number }>("SELECT oi.*,g.name FROM order_items oi JOIN games g ON g.id=oi.game_id WHERE oi.order_id=?", [id]);
  const payments = await query<{ id: number; status: string; payment_method: string; amount: number; processed_at: string }>("SELECT * FROM payments WHERE order_id=? ORDER BY id", [id]);
  const total = items.reduce((sum, item) => sum + Math.round(item.unit_price * 100), 0) / 100;
  return <main><Link href="/siparisler" className="back-link">← Siparişlerine dön</Link><div className="page-heading"><div><span className="eyebrow">{date(order.created_at)}</span><h1>Sipariş #{id}</h1><p className="muted">{order.status === "completed" ? "Ödemen tamamlandı. Oyunların artık kütüphanende." : order.status === "failed" ? "Ödeme başarısız oldu. Oyun sahipliği verilmedi; sepetinden tekrar deneyebilirsin." : "Siparişin oluşturuldu, ödeme adımına devam edebilirsin."}</p></div><span className={`badge ${order.status === "completed" ? "green" : "orange"}`}>{orderStatus[order.status]}</span></div>
    <div className="checkout-grid"><section className="panel"><h2>Siparişindeki oyunlar</h2>{items.map(item => <div className="summary-line" key={item.game_id}><Link href={order.status === "completed" ? `/kutuphane/${item.game_id}` : `/oyunlar/${item.game_id}`}>{item.name} ↗</Link><strong className="money">{money(item.unit_price)}</strong></div>)}<div className="summary-line total"><span>Sipariş toplamı</span><strong className="money">{money(total)}</strong></div><p className="muted">Fiyatlar sipariş anındaki değerlerdir.</p></section><aside className="panel"><h2>Ödeme bilgisi</h2>{payments.length ? payments.map(payment => <dl className="game-facts" key={payment.id}><div><dt>Yöntem</dt><dd>{paymentMethod[payment.payment_method] || payment.payment_method}</dd></div><div><dt>Sonuç</dt><dd>{orderStatus[payment.status]}</dd></div><div><dt>İşlem tutarı</dt><dd className="money">{money(payment.amount)}</dd></div><div><dt>İşlem tarihi</dt><dd>{date(payment.processed_at)}</dd></div></dl>) : <p className="muted">Henüz ödeme yapılmadı.</p>}
      <Link className="button" href={order.status === "completed" ? "/kutuphane" : order.status === "pending" ? `/odeme/${id}` : "/sepet"}>{order.status === "completed" ? "Kütüphanene git →" : order.status === "pending" ? "Ödemeye devam et →" : "Sepetten tekrar dene →"}</Link>
    </aside></div>
  </main>;
}
