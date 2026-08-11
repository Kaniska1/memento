export type LikedMovie = {
  id: string;
  movieId: number;

  title: string;
  year: string;
  poster: string | null;
  genre: string;

  rating: number | null;

  watched: boolean;
  watchlisted: boolean;

  lastWatchedAt: string | null;
  likedAt: string;
};