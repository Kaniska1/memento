import type { FavouriteMovie } from "@/types/favourite";

const FAVOURITES_STORAGE_KEY = "memento:favourites";

export function getFavouriteMovies(): FavouriteMovie[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(FAVOURITES_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const movies = JSON.parse(stored) as FavouriteMovie[];

    return movies.sort(
      (a, b) =>
        new Date(b.addedAt).getTime() -
        new Date(a.addedAt).getTime(),
    );
  } catch {
    return [];
  }
}

export function saveFavouriteMovies(
  movies: FavouriteMovie[],
) {
  localStorage.setItem(
    FAVOURITES_STORAGE_KEY,
    JSON.stringify(movies),
  );

  window.dispatchEvent(
    new CustomEvent("memento:favourites-updated"),
  );
}

export function isMovieFavourite(movieId: number) {
  return getFavouriteMovies().some(
    (movie) => movie.id === movieId,
  );
}

export function addFavouriteMovie(
  movie: FavouriteMovie,
) {
  const movies = getFavouriteMovies();

  if (movies.some((item) => item.id === movie.id)) {
    return;
  }

  saveFavouriteMovies([movie, ...movies]);
}

export function removeFavouriteMovie(movieId: number) {
  const movies = getFavouriteMovies();

  saveFavouriteMovies(
    movies.filter((movie) => movie.id !== movieId),
  );
}

export function toggleFavouriteMovie(
  movie: FavouriteMovie,
) {
  if (isMovieFavourite(movie.id)) {
    removeFavouriteMovie(movie.id);
    return false;
  }

  addFavouriteMovie(movie);
  return true;
}