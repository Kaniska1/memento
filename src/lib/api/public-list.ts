import type { PublicMovieList } from "@/types/public-list";

type PublicListResponse = {
  success: boolean;
  message?: string;
  list?: PublicMovieList;
};

export async function fetchPublicList(
  listId: string,
) {
  const response = await fetch(
    `/api/lists/public/${listId}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data =
    (await response.json()) as PublicListResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not load this list.",
    );
  }

  if (!data.list) {
    throw new Error(
      "Server did not return the list.",
    );
  }

  return data.list;
}