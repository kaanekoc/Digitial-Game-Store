import Link from "next/link";
import { money } from "@/lib/catalog";
import type { Game } from "@/lib/models";

export function GameCard({
  game,
  library = false,
}: {
  game: Game;
  library?: boolean;
}) {
  return (
    <Link
      href={library ? `/kutuphane/${game.id}` : `/oyunlar/${game.id}`}
      className="game-card"
    >
      <div className="game-art">
        <img
          src={game.cover || "/covers/space.svg"}
          alt={`${game.name} kapak görseli`}
          loading="lazy"
        />
        {library ? (
          <span className="art-label">KÜTÜPHANENDE</span>
        ) : (
          <span className="art-arrow" aria-hidden="true">
            ↗
          </span>
        )}
      </div>
      <div className="card-info">
        <p className="card-genres">{game.genres || "Keşfet"}</p>
        <h3>{game.name}</h3>
        <div className="card-bottom">
          <span>{game.developer}</span>
          {library ? (
            <b>Başarımları gör →</b>
          ) : (
            <b className="money">{money(game.price)}</b>
          )}
        </div>
      </div>
    </Link>
  );
}
