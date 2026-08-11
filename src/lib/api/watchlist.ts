import type { WatchlistMovie } from "@/types/watchlist";

type WatchlistResponse = {
  success: boolean;
  message?: string;
  movies?: WatchlistMovie[];
};

export async function fetchWatchlist() {
  const response = await fetch(
    "/api/watchlist",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data =
    (await response.json()) as WatchlistResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not load your watchlist.",
    );
  }

  return data.movies ?? [];
}