import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { date, money, getGenres } from "@/lib/catalog";
import { orderStatus } from "@/lib/orders";
import type { Achievement, User } from "@/lib/models";
import { ActionForm } from "@/components/action-form";
import { saveGenre, saveAchievement, updateRole, demoUnlock } from "./actions";

const tabs = [["oyunlar", "Oyunlar"], ["turler", "Türler"], ["basarimlar", "Başarımlar"], ["kullanicilar", "Kullanıcılar"], ["siparisler", "Siparişler"], ["gunluk", "İşlem günlüğü"]];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ sekme?: string }> }) {
  const admin = await requireAdmin();
  const { sekme } = await searchParams;
  const tab = tabs.some(([key]) => key === sekme) ? sekme : "oyunlar";
  const stats = (await query<{ games: number; users: number; orders: number; revenue: number }>(`SELECT (SELECT COUNT(*) FROM games) AS games,(SELECT COUNT(*) FROM users) AS users,(SELECT COUNT(*) FROM orders WHERE status='completed') AS orders,(SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='succeeded') AS revenue`))[0];
  return <main><div className="page-heading"><div><span className="eyebrow">NEXUS / YÖNETİCİ PANELİ</span><h1>Kontrol sende<span className="accent">.</span></h1><p className="muted">Mağazanı, kullanıcılarını ve işlemlerini yönet.</p></div><Link href="/" className="button secondary small">Mağazayı görüntüle ↗</Link></div>
    <div className="admin-stats"><div><span>TOPLAM OYUN</span><strong>{stats.games}</strong></div><div><span>KULLANICI</span><strong>{stats.users}</strong></div><div><span>TAMAMLANAN SİPARİŞ</span><strong>{stats.orders}</strong></div><div><span>DEMO SATIŞ TOPLAMI</span><strong className="money">{money(stats.revenue)}</strong></div></div>
    <nav className="admin-tabs" aria-label="Yönetim bölümleri">{tabs.map(([key, label]) => <Link key={key} href={`/yonetim?sekme=${key}`} aria-current={tab === key ? "page" : undefined}>{label}</Link>)}</nav>
    {tab === "oyunlar" && <Games />}{tab === "turler" && <Genres />}{tab === "basarimlar" && <Achievements />}{tab === "kullanicilar" && <Users adminId={admin.id} />}{tab === "siparisler" && <Orders />}{tab === "gunluk" && <Logs />}
  </main>;
}

async function Games() {
  const games = await query<{ id: number; name: string; developer: string; price: number; is_active: number }>("SELECT * FROM games ORDER BY id DESC");
  return <section><div className="section-title"><h2>Oyun kataloğu</h2><span className="muted">{games.length} oyun</span><Link href="/yonetim/oyunlar/yeni">+ Yeni oyun</Link></div><div className="panel table-wrap"><table><thead><tr><th>Oyun</th><th>Geliştirici</th><th>Fiyat</th><th>Satış durumu</th><th>İşlem</th></tr></thead><tbody>{games.map(game => <tr key={game.id}><td>{game.name}</td><td>{game.developer}</td><td className="money">{money(game.price)}</td><td><span className={`badge ${game.is_active ? "green" : ""}`}>{game.is_active ? "Satışta" : "Kapalı"}</span></td><td><Link className="accent" href={`/yonetim/oyunlar/${game.id}`}>Düzenle →</Link></td></tr>)}</tbody></table>{!games.length && <p className="muted">Henüz oyun eklenmedi.</p>}</div></section>;
}
async function Genres() {
  const genres = await getGenres();
  return <section><div className="section-title"><h2>Oyun türleri</h2></div><div className="two-columns"><div className="panel"><h3>Yeni tür ekle</h3><ActionForm action={saveGenre} submitLabel="Tür ekle +"><label>Tür adı<input name="name" required minLength={2} maxLength={100} /></label></ActionForm></div><div className="panel"><h3>Mevcut türler</h3>{genres.map(genre => <details key={genre.id}><summary>{genre.name}</summary><ActionForm action={saveGenre} submitLabel="Değişikliği kaydet"><input type="hidden" name="id" value={genre.id} /><label>Tür adı<input name="name" required minLength={2} maxLength={100} defaultValue={genre.name} /></label></ActionForm></details>)}</div></div></section>;
}
function AchievementFields({ games, achievement }: { games: { id: number; name: string }[]; achievement?: Achievement }) {
  return <>{achievement ? <><input type="hidden" name="id" value={achievement.id} /><input type="hidden" name="game_id" value={achievement.game_id} /></> : <label>Oyun<select name="game_id" required><option value="">Oyun seç</option>{games.map(game => <option value={game.id} key={game.id}>{game.name}</option>)}</select></label>}
    <label>Başarım adı<input name="name" required minLength={2} maxLength={200} defaultValue={achievement?.name} /></label>
    <label>Açıklama<textarea name="description" required minLength={2} maxLength={5000} defaultValue={achievement?.description} /></label>
    <label>Tamamlanma olay kodu<input name="completion_condition" required minLength={2} maxLength={1000} placeholder="first_mission_completed" defaultValue={achievement?.completion_condition} /></label></>;
}
async function Achievements() {
  const games = await query<{ id: number; name: string }>("SELECT id,name FROM games ORDER BY name");
  const achievements = await query<Achievement & { game_name: string }>("SELECT a.*,g.name AS game_name FROM achievements a JOIN games g ON g.id=a.game_id ORDER BY g.name,a.id");
  const users = process.env.DEMO_MODE === "true" ? await query<User>("SELECT id,name,email,role FROM users ORDER BY name") : [];
  return <section><div className="section-title"><h2>Başarım tanımları</h2></div><div className="two-columns"><div className="panel"><h3>Yeni başarım</h3><ActionForm action={saveAchievement} submitLabel="Başarım ekle +"><AchievementFields games={games} /></ActionForm></div><div className="panel"><h3>Mevcut başarımlar</h3>{achievements.map(item => <details key={item.id}><summary><span className="muted">{item.game_name} / </span>{item.name}</summary><ActionForm action={saveAchievement} submitLabel="Başarımı güncelle"><AchievementFields games={games} achievement={item} /></ActionForm></details>)}</div></div>
    {process.env.DEMO_MODE === "true" && <section className="panel demo-tool"><span className="eyebrow">YALNIZCA DERS DEMOSU</span><h3>Oyun entegrasyonu test aracı</h3><p className="muted">Doğrulanmış oyun olayını simüle eder. Kullanıcı seçilen oyuna sahip olmalı. Normal kullanıcılar bu aracı kullanamaz.</p><ActionForm action={demoUnlock} submitLabel="Oyun olayını simüle et"><div className="two-columns"><label>Kullanıcı<select name="user_id">{users.map(user => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label><label>Başarım<select name="achievement_id">{achievements.map(a => <option value={a.id} key={a.id}>{a.game_name} / {a.name}</option>)}</select></label></div></ActionForm></section>}
  </section>;
}
async function Users({ adminId }: { adminId: number }) {
  const users = await query<User & { games: number; achievements: number; orders: number }>(`SELECT u.id,u.name,u.email,u.role,(SELECT COUNT(*) FROM user_games WHERE user_id=u.id) AS games,(SELECT COUNT(*) FROM user_achievements WHERE user_id=u.id) AS achievements,(SELECT COUNT(*) FROM orders WHERE user_id=u.id) AS orders FROM users u ORDER BY u.id DESC`);
  return <section><div className="section-title"><h2>Kullanıcılar ve yetkiler</h2></div><div className="panel table-wrap"><table><thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Oyun / Başarım / Sipariş</th><th>Yetki</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.games} / {user.achievements} / {user.orders}</td><td>{user.id === adminId ? <span className="badge orange">Yönetici (sen)</span> : <ActionForm action={updateRole} className="inline-form" submitLabel="Kaydet"><input type="hidden" name="user_id" value={user.id} /><select name="role" defaultValue={user.role} aria-label={`${user.name} için rol`}><option value="user">Kullanıcı</option><option value="admin">Yönetici</option></select></ActionForm>}</td></tr>)}</tbody></table></div></section>;
}
async function Orders() {
  const orders = await query<{ id: number; email: string; status: string; created_at: string; total: number }>("SELECT o.*,u.email,(SELECT SUM(unit_price) FROM order_items WHERE order_id=o.id) AS total FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 100");
  return <section><div className="section-title"><h2>Siparişler</h2><span className="muted">Son 100 kayıt</span></div><div className="panel table-wrap"><table><thead><tr><th>Sipariş</th><th>Kullanıcı</th><th>Tarih</th><th>Tutar</th><th>Durum</th><th>İncele</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td>#{order.id}</td><td>{order.email}</td><td>{date(order.created_at)}</td><td className="money">{money(order.total || 0)}</td><td>{orderStatus[order.status]}</td><td><Link className="accent" href={`/yonetim/siparisler/${order.id}`}>Detay →</Link></td></tr>)}</tbody></table>{!orders.length && <p className="muted">Henüz sipariş yok.</p>}</div></section>;
}
async function Logs() {
  const logs = await query<{ id: number; action: string; actor: string | null; game_name: string | null; order_id: number | null; old_values: unknown; new_values: unknown; created_at: string }>("SELECT l.*,u.email AS actor,g.name AS game_name FROM activity_logs l LEFT JOIN users u ON u.id=l.actor_user_id LEFT JOIN games g ON g.id=l.game_id ORDER BY l.id DESC LIMIT 100");
  return <section><div className="section-title"><h2>İşlem günlüğü</h2><span className="muted">Son 100 kayıt</span></div><div className="panel">{logs.length ? logs.map(log => <details key={log.id}><summary className="log-summary"><span className="badge orange">{log.action}</span><span>{log.game_name || `Sipariş #${log.order_id}`}</span><span className="muted">{log.actor || "Sistem"} · {date(log.created_at)}</span></summary><div className="two-columns"><div><h4>Önceki değerler</h4><pre>{JSON.stringify(log.old_values, null, 2)}</pre></div><div><h4>Yeni değerler</h4><pre>{JSON.stringify(log.new_values, null, 2)}</pre></div></div></details>) : <p className="muted">Henüz değişiklik kaydı yok.</p>}</div></section>;
}
