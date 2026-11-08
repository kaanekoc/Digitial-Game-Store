import { query } from "./db";
import type { Game, Genre } from "./models";

export const gameSelect = `SELECT g.*,
  (SELECT image_url FROM game_images WHERE game_id=g.id ORDER BY image_type='cover' DESC,sort_order,id LIMIT 1) AS cover,
  (SELECT GROUP_CONCAT(ge.name ORDER BY ge.name SEPARATOR ', ') FROM game_genres gg JOIN genres ge ON ge.id=gg.genre_id WHERE gg.game_id=g.id) AS genres
  FROM games g`;

export async function getGames(search = "", genre = "", libraryUser?: number) {
  const conditions = libraryUser
    ? [
        "EXISTS(SELECT 1 FROM user_games ug WHERE ug.game_id=g.id AND ug.user_id=?)",
      ]
    : ["g.is_active=1"];
  const args: (string | number)[] = libraryUser ? [libraryUser] : [];
  if (search) {
    conditions.push("g.name LIKE ? ESCAPE '='");
    args.push(`%${search.slice(0, 200).replace(/[=%_]/g, "=$&")}%`);
  }
  if (/^\d+$/.test(genre)) {
    conditions.push(
      "EXISTS(SELECT 1 FROM game_genres gg WHERE gg.game_id=g.id AND gg.genre_id=?)",
    );
    args.push(Number(genre));
  }
  return query<Game>(
    `${gameSelect} WHERE ${conditions.join(" AND ")} ORDER BY g.id DESC LIMIT 100`,
    args,
  );
}
export async function getGenres() {
  return query<Genre>("SELECT * FROM genres ORDER BY name");
}
export const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    value,
  );
export const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
        new Date(value.replace(" ", "T")),
      )
    : "Belirtilmedi";
