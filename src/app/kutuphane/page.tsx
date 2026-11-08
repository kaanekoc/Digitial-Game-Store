import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getGames, getGenres } from "@/lib/catalog";
import { query } from "@/lib/db";
import { GameCard } from "@/components/game-card";
import { CatalogFilter } from "@/components/catalog-filter";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tur?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const genre = typeof params.tur === "string" ? params.tur : "";
  const [games, genres, stats] = await Promise.all([
    getGames(search, genre, user.id),
    getGenres(),
    query<{ games: number; achievements: number }>(
      "SELECT (SELECT COUNT(*) FROM user_games WHERE user_id=?) AS games, (SELECT COUNT(*) FROM user_achievements WHERE user_id=?) AS achievements",
      [user.id, user.id],
    ),
  ]);
  return (
    <main>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SENİN DÜNYALARIN</span>
          <h1>
            Kütüphanen<span className="accent">.</span>
          </h1>
          <p className="muted">
            Merhaba {user.name}, bir sonraki hikâyen hangisi?
          </p>
        </div>
        <Link className="button secondary small" href="/">
          Yeni oyunlar keşfet ↗
        </Link>
      </div>
      <div className="library-stats">
        <div>
          <strong>{stats[0].games}</strong>
          <span>KOLEKSİYONUNDAKİ OYUN</span>
        </div>
        <div>
          <strong>{stats[0].achievements}</strong>
          <span>KAZANILAN BAŞARIM</span>
        </div>
        <p>
          Her oyun yeni bir hikâye.
          <br />
          <span className="muted">Her başarım senden bir iz.</span>
        </p>
      </div>
      <div className="section-title">
        <h2>Oyunların</h2>
        <span className="muted">{games.length} oyun gösteriliyor</span>
      </div>
      <CatalogFilter genres={genres} search={search} genre={genre} />
      {games.length ? (
        <div className="game-grid">
          {games.map((game) => (
            <GameCard game={game} library key={game.id} />
          ))}
        </div>
      ) : (
        <section className="empty panel">
          <h2>
            {search || genre
              ? "Bu filtrede oyun bulunamadı."
              : "İlk hikâyen seni bekliyor."}
          </h2>
          <p>
            {search || genre
              ? "Filtrelerini değiştirerek tekrar dene."
              : "Satın aldığın oyunlar burada kalıcı olarak yer alacak."}
          </p>
          <Link className="button" href={search || genre ? "/kutuphane" : "/"}>
            {search || genre ? "Filtreleri temizle" : "Mağazayı keşfet ↗"}
          </Link>
        </section>
      )}
    </main>
  );
}
