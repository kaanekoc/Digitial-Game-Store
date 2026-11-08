import Link from "next/link";
import { getGames, getGenres, money } from "@/lib/catalog";
import { GameCard } from "@/components/game-card";
import { CatalogFilter } from "@/components/catalog-filter";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; tur?: string }> }) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const genre = typeof params.tur === "string" ? params.tur : "";
  const [games, genres, featured] = await Promise.all([getGames(search, genre), getGenres(), getGames("Neon Drift")]);
  const hero = featured[0] ?? games[0];
  return <main>
    <div className="store-topline"><span><span className="live-dot" /> OYNAMAYA DEĞER HİKÂYELER</span><span>Senin dünyan. Senin kuralların.</span></div>
    {!search && !genre && hero && <section className="hero">
      <img className="hero-image" src={hero.cover || "/covers/racing.svg"} alt="Neon ışıklarıyla parlayan oyun dünyası" fetchPriority="high" />
      <div className="hero-shade" /><div className="hero-content"><span className="badge orange">HAFTANIN KEŞFİ</span><p className="hero-kicker">SIRADAKİ MACERANA HAZIR MISIN?</p><h1>Oyuna gir.<br /><em>Dünyanı değiştir.</em></h1><p className="hero-description">{hero.name} ile yeni bir hikâyeye başla.<br />Keşfedilecek dünyalar, kazanılacak başarımlar.</p><div className="row"><Link className="button" href={`/oyunlar/${hero.id}`}>Oyunu keşfet <span>↗</span></Link><span className="hero-price">{money(hero.price)}<small>Tek seferlik satın alma</small></span></div></div>
      <span className="hero-caption">{hero.name.toUpperCase()} <span> / NEXUS SEÇKİSİ</span></span>
    </section>}
    {!search && !genre && <div className="store-benefits"><span><b>◈</b> Tek hesap, tüm oyunların</span><span><b>⌁</b> Keşfedilmeyi bekleyen dünyalar</span><span><b>✧</b> Oyna, başar, koleksiyonunu büyüt</span></div>}
    <section id="oyunlar"><div className="section-title"><h2>{search || genre ? "Arama sonuçları" : "Sıradaki favorini keşfet"}</h2><span className="muted">{games.length} oyun</span>{(search || genre) && <Link href="/">Filtreleri temizle ×</Link>}</div>
      <CatalogFilter genres={genres} search={search} genre={genre} />
      {games.length ? <div className="game-grid">{games.map(game => <GameCard game={game} key={game.id} />)}</div> : <div className="empty panel"><h2>Bu aramada oyun bulunamadı.</h2><p>Başka bir isim veya tür ile tekrar dene.</p><Link href="/" className="button secondary">Tüm oyunları göster</Link></div>}
    </section><section className="discovery-banner"><div><span className="eyebrow">BİR OYUNDAN DAHA FAZLASI</span><h2>Koleksiyonun büyüsün.<br />Hikâyen devam etsin.</h2><p>Oyunların, satın alma geçmişin ve başarımların tek bir yerde.</p></div><Link className="button secondary" href="/kutuphane">Kütüphanene git ↗</Link></section>
  </main>;
}
