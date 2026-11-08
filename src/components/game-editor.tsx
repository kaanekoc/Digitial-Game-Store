import type { Game, Genre } from "@/lib/models";
import { ActionForm } from "./action-form";
import { saveGame } from "@/app/yonetim/actions";

export function GameEditor({
  game,
  genres,
  selected = [],
  cover = "",
  screenshots = "",
}: {
  game?: Game;
  genres: Genre[];
  selected?: number[];
  cover?: string;
  screenshots?: string;
}) {
  return (
    <ActionForm
      action={saveGame}
      className="form-stack panel editor"
      submitLabel="Oyunu kaydet →"
    >
      {game && <input type="hidden" name="id" value={game.id} />}
      <div className="two-columns">
        <label>
          Oyun adı
          <input
            name="name"
            required
            minLength={2}
            maxLength={200}
            defaultValue={game?.name}
          />
        </label>
        <label>
          Satış fiyatı (TRY)
          <input
            name="price"
            type="number"
            required
            min="0"
            max="99999999.99"
            step="0.01"
            defaultValue={game?.price ?? 0}
          />
        </label>
      </div>
      <label>
        Açıklama
        <textarea
          name="description"
          required
          minLength={2}
          maxLength={20000}
          defaultValue={game?.description}
          rows={5}
        />
      </label>
      <div className="two-columns">
        <label>
          Geliştirici
          <input
            name="developer"
            required
            minLength={2}
            maxLength={200}
            defaultValue={game?.developer}
          />
        </label>
        <label>
          Yayıncı
          <input
            name="publisher"
            required
            minLength={2}
            maxLength={200}
            defaultValue={game?.publisher}
          />
        </label>
      </div>
      <label>
        Çıkış tarihi
        <input
          name="release_date"
          type="date"
          defaultValue={game?.release_date ?? ""}
        />
      </label>
      <fieldset>
        <legend>Oyun türleri (en az birini seç)</legend>
        <div className="checkboxes">
          {genres.map((genre) => (
            <label key={genre.id}>
              <input
                name="genres"
                type="checkbox"
                value={genre.id}
                defaultChecked={selected.includes(genre.id)}
              />
              {genre.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        Kapak görseli adresi
        <input
          name="cover"
          defaultValue={cover}
          maxLength={2048}
          placeholder="/covers/space.svg veya https://…"
        />
      </label>
      <label>
        Ekran görüntüleri (her satıra bir adres)
        <textarea
          name="screenshots"
          defaultValue={screenshots}
          placeholder="https://…"
        />
      </label>
      <label className="checkbox-label">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={game ? !!game.is_active : true}
        />
        Satışa açık
      </label>
      <p className="muted">
        Satışı kapatılan oyunlar mevcut kullanıcıların kütüphanesinde kalır.
      </p>
    </ActionForm>
  );
}
