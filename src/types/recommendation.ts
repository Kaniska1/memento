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
  favouriteMovieIds: number[];
  preferredGenreIds: number[];
  initialRatings: {
    movieId: number;
    rating: number;
  }[];
};