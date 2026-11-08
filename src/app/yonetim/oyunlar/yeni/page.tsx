import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getGenres } from "@/lib/catalog";
import { GameEditor } from "@/components/game-editor";
export default async function NewGamePage() {
  await requireAdmin();
  const genres = await getGenres();
  return <main><Link href="/yonetim?sekme=oyunlar" className="back-link">← Oyun yönetimine dön</Link><h1>Yeni oyun ekle.</h1><GameEditor genres={genres} /></main>;
}
