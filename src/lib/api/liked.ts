import type { LikedMovie } from "@/types/liked";

type LikedResponse = {
  success: boolean;
  message?: string;
  movies?: LikedMovie[];
};

export async function fetchLikedMovies() {
  const response = await fetch("/api/liked", {
    credentials: "include",
    cache: "no-store",
  });

  const data =
    (await response.json()) as LikedResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not load liked movies.",
    );
  }

  return data.movies ?? [];
}