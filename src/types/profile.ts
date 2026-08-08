export type ProfileFavouriteMovie = {
  id: number;
  title: string;
  year: string;
  poster: string | null;
};

export type TasteCategory = {
  label: string;
  percentage: number;
};

export type RatingDistributionItem = {
  rating: number;
  count: number;
};

export type ProfileData = {
  name: string;
  username: string;
  bio: string;
  joinedAt: string;
  favouriteMovies: ProfileFavouriteMovie[];
  preferredGenreIds: number[];
};