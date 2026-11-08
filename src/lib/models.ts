export interface User { id: number; name: string; email: string; role: "user" | "admin" }
export interface Game {
  id: number; name: string; description: string; developer: string; publisher: string;
  release_date: string | null; price: number; is_active: number;
  cover: string | null; genres: string | null;
}
export interface Genre { id: number; name: string }
export interface Achievement {
  id: number; game_id: number; name: string; description: string;
  completion_condition: string; unlocked_at?: string | null;
}
