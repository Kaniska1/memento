import { InitialRating } from "./onboarding";

export type RecommendedMovie = {
  id: number;
  title: string;
  overview: string;
  year: string;
  poster: string;
  backdrop: string | null;
  rating: number;
  voteCount: number;
  genre: string;
  matchScore: number;
  reason: string;
};

export type StoredOnboardingPreferences = {
  favouriteMovies: {
    movieId: number;
    title: string;
    year: string;
    poster: string | null;
    genre: string;
  }[];

  preferredGenreIds: number[];
  initialRatings: InitialRating[];
};