export type DiaryEntry = {
  id: string;
  movieId: number;
  movieTitle: string;
  movieYear?: string;
  poster: string | null;
  watchedDate: string;
  rating: number;
  review: string;
  containsSpoilers: boolean;
  isRewatch: boolean;
  liked: boolean;
  createdAt: string;
};