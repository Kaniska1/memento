export type WatchlistMovie = {
  id: string;
  movieId: number;

  title: string;
  year: string;
  poster: string | null;
  genre: string;

  rating: number | null;
  tmdbRating: number | null;
  tmdbVoteCount: number | null;

  watched: boolean;
  liked: boolean;

  addedAt: string;
};