import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { date, gameSelect } from "@/lib/catalog";
import type { Achievement, Game } from "@/lib/models";

export default async function LibraryGamePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const ownership = (await query<{ acquired_at: string; order_id: number }>("SELECT acquired_at,order_id FROM user_games WHERE user_id=? AND game_id=?", [user.id, id]))[0];
  if (!ownership) notFound();
  const game = (await query<Game>(`${gameSelect} WHERE g.id=?`, [id]))[0];
  const achievements = await query<Achievement>(`SELECT a.*,ua.unlocked_at FROM achievements a LEFT JOIN user_achievements ua ON ua.achievement_id=a.id AND ua.user_id=? WHERE a.game_id=? ORDER BY ua.unlocked_at IS NULL,a.id`, [user.id, id]);
  const unlocked = achievements.filter(item => item.unlocked_at).length;
  return <main><Link className="back-link" href="/kutuphane">← Kütüphanene dön</Link><section className="library-hero"><img src={game.cover || "/covers/space.svg"} alt={game.name} /><div><span className="badge green">KÜTÜPHANENDE</span><h1>{game.name}</h1><p>{date(ownership.acquired_at)} tarihinde koleksiyonuna katıldı.</p><Link className="button secondary small" href={`/siparisler/${ownership.order_id}`}>Satın alma detayını gör ↗</Link></div></section>
    <div className="section-title"><h2>Başarımların</h2><span className="muted">{unlocked} / {achievements.length} tamamlandı</span></div><progress className="achievement-progress" value={unlocked} max={achievements.length || 1} aria-label="Başarım ilerlemesi" />
    <p className="muted achievement-explanation">Başarımlar, oyun sunucusundan doğrulanmış tamamlanma bilgisi geldiğinde açılır. Satın alma tek başına başarım kazandırmaz.</p><section className="panel">{achievements.length ? achievements.map(item => <article className={`achievement-row ${item.unlocked_at ? "unlocked" : ""}`} key={item.id}><span className="achievement-icon">{item.unlocked_at ? "✧" : "◇"}</span><div><strong>{item.name}</strong><p>{item.description}</p></div><span className={`badge spacer ${item.unlocked_at ? "orange" : ""}`}>{item.unlocked_at ? `Kazanıldı · ${date(item.unlocked_at)}` : "Kilitli"}</span></article>) : <p className="muted">Bu oyun için henüz başarım tanımlanmamış.</p>}</section>
  </main>;
}
