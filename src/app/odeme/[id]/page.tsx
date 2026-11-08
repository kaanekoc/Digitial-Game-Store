import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { money } from "@/lib/catalog";
import { ActionForm } from "@/components/action-form";
import { pay } from "@/app/sepet/actions";

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const order = (await query<{ id: number; status: string }>("SELECT id,status FROM orders WHERE id=? AND user_id=?", [id, user.id]))[0];
  if (!order) notFound();
  const items = await query<{ name: string; unit_price: number }>("SELECT g.name,oi.unit_price FROM order_items oi JOIN games g ON g.id=oi.game_id WHERE oi.order_id=?", [id]);
  const total = items.reduce((sum, item) => sum + Math.round(item.unit_price * 100), 0) / 100;
  return <main><Link href="/sepet" className="back-link">← Sepete dön ve fiyatları yenile</Link><div className="page-heading"><div><span className="eyebrow">SİPARİŞ #{id}</span><h1>Son bir adım<span className="accent">.</span></h1><p className="muted">Oyunların kütüphanene katılmaya hazır.</p></div></div>
    <div className="checkout-grid"><section className="panel"><h2>Ödeme yöntemi</h2><p className="notice">Ders projesi: bu ekran bir ödeme simülasyonudur. Gerçek para çekilmez, kart bilgisi istenmez.</p>
      {order.status !== "pending" ? <p className="payment-done">Bu sipariş sonuçlandı. <Link href={`/siparisler/${id}`}>Sipariş detayını gör →</Link></p> : process.env.DEMO_MODE === "true" ? <ActionForm action={pay} submitLabel="Demo ödemeyi sonuçlandır →">
        <input type="hidden" name="order_id" value={id} /><label>Demo ödeme yöntemi<select name="method"><option value="demo_card">Demo kart</option><option value="demo_wallet">Demo cüzdan</option></select></label>
        <label>Ödeme sonucu<select name="result"><option value="success">Başarılı ödeme</option><option value="failed">Başarısız ödeme (test)</option></select></label>
      </ActionForm> : <p className="notice error">Demo ödeme kapalı.</p>}
    </section><aside className="panel order-summary"><span className="eyebrow">ONAYLADIĞIN SİPARİŞ</span>{items.map((item, i) => <div className="summary-line" key={i}><span>{item.name}</span><span className="money">{money(item.unit_price)}</span></div>)}<div className="summary-line total"><span>Toplam</span><strong className="money">{money(total)}</strong></div><p className="muted">Sipariş fiyatları kaydedildi. Ödeme sırasında satış durumu ve sahiplik tekrar kontrol edilir.</p></aside></div>
  </main>;
}
