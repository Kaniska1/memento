export type WatchedMovie = {
  id: string;
  movieId: number;

  title: string;
  year: string;
  poster: string | null;
  genre: string;

  rating: number | null;
  liked: boolean;

  lastWatchedAt: string | null;
  logCount: number;
};