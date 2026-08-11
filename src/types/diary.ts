export type DiaryEntry = {
  id: string;

  movieId: number;
  movieTitle: string;
  movieYear?: string;
  poster: string | null;

  watchedDate: string;

  rating: number | null;
  review: string;

  containsSpoilers: boolean;
  isRewatch: boolean;
  liked: boolean;

  createdAt: string;
  updatedAt?: string;
};