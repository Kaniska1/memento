export type OnboardingMovie = {
  id: number;
  title: string;
  year: string;
  poster: string | null;
  overview?: string;
  genreIds: number[];
};

export type InitialRating = {
  movieId: number;
  rating: number;
};

export type OnboardingPreferences = {
  favouriteMovies: OnboardingMovie[];
  preferredGenreIds: number[];
  initialRatings: InitialRating[];
};

export type OnboardingMoviesResponse = {
  results: OnboardingMovie[];
  message?: string;
};

