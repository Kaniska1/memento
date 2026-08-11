import type { MovieList } from "@/types/list";

type ListsResponse = {
  success: boolean;
  message?: string;
  lists?: MovieList[];
  list?: MovieList;
};

async function parseResponse(
  response: Response,
): Promise<ListsResponse> {
  const data =
    (await response.json()) as ListsResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "List request failed.",
    );
  }

  return data;
}

export async function fetchLists() {
  const response = await fetch(
    "/api/lists",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data =
    await parseResponse(response);

  return data.lists ?? [];
}

export async function createList(
  payload: {
    title: string;
    description?: string;
    isPublic?: boolean;
    isRanked?: boolean;
    movies?: MovieList["movies"];
  },
) {
  const response = await fetch(
    "/api/lists",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify(payload),
    },
  );

  const data =
    await parseResponse(response);

  if (!data.list) {
    throw new Error(
      "Server did not return the created list.",
    );
  }

  return data.list;
}

export async function updateList(
  listId: string,
  payload: Partial<{
    title: string;
    description: string;
    isPublic: boolean;
    isRanked: boolean;
    movies: MovieList["movies"];
  }>,
) {
  const response = await fetch(
    `/api/lists/${listId}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify(payload),
    },
  );

  const data =
    await parseResponse(response);

  if (!data.list) {
    throw new Error(
      "Server did not return the updated list.",
    );
  }

  return data.list;
}

export async function deleteList(
  listId: string,
) {
  const response = await fetch(
    `/api/lists/${listId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await parseResponse(response);
}

import type {
  ListCollaborator,
} from "@/types/list";

type CollaboratorResponse = {
  success: boolean;
  message?: string;
  collaborator?: ListCollaborator;
};

export async function addListCollaborator(
  listId: string,
  username: string,
) {
  const response = await fetch(
    `/api/lists/${listId}/collaborators`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        username,
      }),
    },
  );

  const data =
    (await response.json()) as CollaboratorResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not add collaborator.",
    );
  }

  if (!data.collaborator) {
    throw new Error(
      "Server did not return the collaborator.",
    );
  }

  return data.collaborator;
}

export async function removeListCollaborator(
  listId: string,
  userId: string,
) {
  const response = await fetch(
    `/api/lists/${listId}/collaborators`,
    {
      method: "DELETE",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        userId,
      }),
    },
  );

  const data =
    (await response.json()) as {
      success: boolean;
      message?: string;
    };

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not remove collaborator.",
    );
  }
}