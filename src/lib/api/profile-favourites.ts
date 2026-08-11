import type { ProfileFavouriteMovie } from "@/types/profile";

type FavouritesResponse = {
  success: boolean;
  message?: string;
  movies?: ProfileFavouriteMovie[];
};

async function parseResponse(
  response: Response,
) {
  const data =
    (await response.json()) as FavouritesResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Favourite films request failed.",
    );
  }

  return data.movies ?? [];
}

export async function fetchProfileFavourites() {
  const response = await fetch(
    "/api/profile/favourites",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  return parseResponse(response);
}

export async function updateProfileFavourites(
  movies: ProfileFavouriteMovie[],
) {
  const response = await fetch(
    "/api/profile/favourites",
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        movies,
      }),
    },
  );

  return parseResponse(response);
}