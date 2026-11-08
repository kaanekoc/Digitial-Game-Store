import Link from "next/link";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { gameSelect, money } from "@/lib/catalog";
import { query } from "@/lib/db";
import type { Game } from "@/lib/models";
import { ActionForm, Submit } from "@/components/action-form";
import { checkout, removeFromCart } from "./actions";

export default async function CartPage() {
  const user = await requireUser();
  const games = await query<Game>(
    `${gameSelect} JOIN cart_items c ON c.game_id=g.id WHERE c.user_id=? ORDER BY c.added_at`,
    [user.id],
  );
  const total =
    games.reduce((sum, game) => sum + Math.round(game.price * 100), 0) / 100;
  const invalid = games.some((game) => !game.is_active);
  return (
    <main>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SONRAKİ MACERANA BİR ADIM</span>
          <h1>
            Sepetin<span className="accent">.</span>
          </h1>
          <p className="muted">
            {games.length} oyun · Yeni dünyalar seni bekliyor.
          </p>
        </div>
        <Link href="/" className="back-link">
          ← Keşfetmeye devam et
        </Link>
      </div>
      {games.length ? (
        <div className="checkout-grid">
          <section className="panel cart-list">
            {games.map((game) => (
              <article className="cart-item" key={game.id}>
                <Link href={`/oyunlar/${game.id}`}>
                  <img
                    src={game.cover || "/covers/space.svg"}
                    alt={game.name}
                  />
                </Link>
                <div className="cart-item-info">
                  <p className="card-genres">{game.genres}</p>
                  <h2>
                    <Link href={`/oyunlar/${game.id}`}>{game.name}</Link>
                  </h2>
                  {!game.is_active && (
                    <p className="notice error">
                      Satışa kapalı; sepetten çıkar.
                    </p>
                  )}
                  <ActionForm action={removeFromCart} className="inline-form">
                    <input type="hidden" name="game_id" value={game.id} />
                    <Submit className="text-button">Sepetten çıkar ×</Submit>
                  </ActionForm>
                </div>
                <strong className="money">{money(game.price)}</strong>
              </article>
            ))}
          </section>
          <aside className="panel order-summary">
            <span className="eyebrow">SİPARİŞ ÖZETİ</span>
            <h2>Yeni bir başlangıç.</h2>
            <div className="summary-line">
              <span>{games.length} oyun</span>
              <span className="money">{money(total)}</span>
            </div>
            <div className="summary-line total">
              <span>Toplam</span>
              <strong className="money">{money(total)}</strong>
            </div>
            <p className="muted">
              Gösterilen güncel fiyatı onaylayarak ödeme adımına geçebilirsin.
              Fiyat değişirse yeniden onayın istenir.
            </p>
            {invalid ? (
              <p className="notice error">
                Satışa kapalı oyunları sepetinden çıkar.
              </p>
            ) : (
              <ActionForm
                action={checkout}
                submitLabel="Toplamı onayla ve devam et →"
              >
                <input type="hidden" name="checkout_key" value={randomUUID()} />
                <input type="hidden" name="total" value={total.toFixed(2)} />
              </ActionForm>
            )}
            <span className="checkout-note">
              ◈ Oyunların hesabına kalıcı olarak eklenir.
            </span>
          </aside>
        </div>
      ) : (
        <section className="empty panel">
          <span className="empty-icon">⌑</span>
          <h2>Yeni bir maceraya yer var.</h2>
          <p>Henüz sepetine oyun eklemedin.</p>
          <Link href="/" className="button">
            Oyunları keşfet ↗
          </Link>
        </section>
      )}
    </main>
  );
}
