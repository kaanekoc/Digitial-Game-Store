import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getGenres, gameSelect } from "@/lib/catalog";
import { query } from "@/lib/db";
import type { Game } from "@/lib/models";
import { GameEditor } from "@/components/game-editor";
export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const game = (await query<Game>(`${gameSelect} WHERE g.id=?`, [id]))[0];
  if (!game) notFound();
  const [genres, selected, images] = await Promise.all([getGenres(), query<{ genre_id: number }>("SELECT genre_id FROM game_genres WHERE game_id=?", [id]), query<{ image_type: string; image_url: string }>("SELECT * FROM game_images WHERE game_id=? ORDER BY sort_order,id", [id])]);
  return <main><Link href="/yonetim?sekme=oyunlar" className="back-link">← Oyun yönetimine dön</Link><h1>{game.name}</h1><GameEditor game={game} genres={genres} selected={selected.map(g => g.genre_id)} cover={images.find(i => i.image_type === "cover")?.image_url} screenshots={images.filter(i => i.image_type === "screenshot").map(i => i.image_url).join("\n")} /></main>;
}
