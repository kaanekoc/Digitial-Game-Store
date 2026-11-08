import type { Genre } from "@/lib/models";

export function CatalogFilter({
  genres,
  search,
  genre,
}: {
  genres: Genre[];
  search: string;
  genre: string;
}) {
  return (
    <form className="catalog-filter" method="get">
      <label className="search-field">
        <span className="sr-only">Oyun ara</span>
        <span aria-hidden="true">⌕</span>
        <input
          name="q"
          placeholder="Bir sonraki oyununu bul…"
          defaultValue={search}
          maxLength={200}
        />
      </label>
      <label className="genre-select">
        <span className="sr-only">Tür</span>
        <select name="tur" defaultValue={genre}>
          <option value="">Tüm türler</option>
          {genres.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <button className="button secondary" type="submit">
        Filtrele →
      </button>
    </form>
  );
}
