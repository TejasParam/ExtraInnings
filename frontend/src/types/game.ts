export interface Game {
  id: number;
  game_id: number;
  game_date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  excitement_score: number;
  season: number;
  highlight_url: string | null;
}

export interface GameResponse {
  games: Game[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export type SortOption = 'excitement' | 'date';
export type TimeFilter = 'day' | 'week' | 'month' | 'season' | 'custom';
