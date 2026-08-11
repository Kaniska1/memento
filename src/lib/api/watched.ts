import type { WatchedMovie } from "@/types/watched";

type WatchedResponse = {
  success: boolean;
  message?: string;
  movies?: WatchedMovie[];
};

export async function fetchWatchedMovies() {
  const response = await fetch("/api/watched", {
    credentials: "include",
    cache: "no-store",
  });

  const data =
    (await response.json()) as WatchedResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not load watched movies.",
    );
  }

  return data.movies ?? [];
}