import type { WatchlistMovie } from "@/types/watchlist";

const WATCHLIST_STORAGE_KEY = "memento:watchlist";

export function getWatchlist(): WatchlistMovie[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const movies = JSON.parse(stored) as WatchlistMovie[];

    return movies.sort(
      (a, b) =>
        new Date(b.addedAt).getTime() -
        new Date(a.addedAt).getTime(),
    );
  } catch {
    return [];
  }
}

export function saveWatchlist(movies: WatchlistMovie[]) {
  localStorage.setItem(
    WATCHLIST_STORAGE_KEY,
    JSON.stringify(movies),
  );

  window.dispatchEvent(
    new CustomEvent("memento:watchlist-updated"),
  );
}

export function isMovieWatchlisted(movieId: number) {
  return getWatchlist().some((movie) => movie.id === movieId);
}

export function addToWatchlist(movie: WatchlistMovie) {
  const movies = getWatchlist();

  if (movies.some((item) => item.id === movie.id)) {
    return;
  }

  saveWatchlist([movie, ...movies]);
}

export function removeFromWatchlist(movieId: number) {
  const movies = getWatchlist();

  saveWatchlist(
    movies.filter((movie) => movie.id !== movieId),
  );
}

export function toggleWatchlist(movie: WatchlistMovie) {
  if (isMovieWatchlisted(movie.id)) {
    removeFromWatchlist(movie.id);
    return false;
  }

  addToWatchlist(movie);
  return true;
}