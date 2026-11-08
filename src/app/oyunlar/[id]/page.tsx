import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { gameSelect, money, date } from "@/lib/catalog";
import type { Achievement, Game } from "@/lib/models";
import { ActionForm } from "@/components/action-form";
import { addToCart } from "@/app/sepet/actions";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const game = (await query<Game>(`${gameSelect} WHERE g.id=?`, [id]))[0];
  if (!game) notFound();
  const [user, achievements, images] = await Promise.all([currentUser(), query<Achievement>("SELECT * FROM achievements WHERE game_id=?", [id]), query<{ image_url: string }>("SELECT image_url FROM game_images WHERE game_id=? AND image_type='screenshot' ORDER BY sort_order,id", [id])]);
  const owned = user && (await query("SELECT game_id FROM user_games WHERE user_id=? AND game_id=?", [user.id, id])).length > 0;
  return <main><Link href="/" className="back-link">← Mağazaya dön</Link><div className="detail-heading"><div><span className="eyebrow">{game.genres || "NEXUS MAĞAZA"}</span><h1>{game.name}</h1></div><span className={`badge ${game.is_active ? "green" : ""}`}>{game.is_active ? "Satışta" : "Satışa kapalı"}</span></div>
    <div className="detail-grid"><div><img className="detail-cover" src={game.cover || "/covers/space.svg"} alt={`${game.name} kapak görseli`} />
      <section className="about-game"><h2>Bu oyun hakkında</h2><p>{game.description}</p></section>
      {images.length > 0 && <section><h2>Oyun içinden</h2><div className="screenshots">{images.map((image, index) => <img key={image.image_url + index} src={image.image_url} alt={`${game.name} ekran görüntüsü ${index + 1}`} loading="lazy" />)}</div></section>}
    </div><aside><section className="panel purchase-panel"><span className="eyebrow">BİR SONRAKİ MACERAN</span><h2>{game.name}</h2><p className="muted">Dijital oyun · Kalıcı kütüphane kaydı</p><strong className="detail-price money">{money(game.price)}</strong>
      {owned ? <Link href={`/kutuphane/${id}`} className="button">Kütüphanende görüntüle →</Link> : game.is_active ? user ? <ActionForm action={addToCart} submitLabel="Sepete ekle +"><input type="hidden" name="game_id" value={game.id} /></ActionForm> : <Link href="/giris" className="button">Satın almak için giriş yap</Link> : <p className="notice">Bu oyun şu anda satışta değil.</p>}
      <dl className="game-facts"><div><dt>Geliştirici</dt><dd>{game.developer}</dd></div><div><dt>Yayıncı</dt><dd>{game.publisher}</dd></div><div><dt>Çıkış tarihi</dt><dd>{date(game.release_date)}</dd></div><div><dt>Türler</dt><dd>{game.genres || "Belirtilmedi"}</dd></div></dl>
    </section><section className="panel achievement-preview"><h3>✧ Kazanılacak başarımlar</h3><p className="muted">{achievements.length} başarım seni bekliyor.</p>{achievements.map(achievement => <div className="achievement-row" key={achievement.id}><span className="achievement-icon">◇</span><div><strong>{achievement.name}</strong><p>{achievement.description}</p></div></div>)}</section></aside></div>
  </main>;
}
