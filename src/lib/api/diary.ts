import type { DiaryEntry } from "@/types/diary";

export type CreateDiaryEntryPayload = {
  movieId: number;
  movieTitle: string;
  movieYear?: string;
  poster?: string | null;

  watchedDate: string;

  rating: number | null;
  review?: string;

  containsSpoilers?: boolean;
  isRewatch?: boolean;
  liked?: boolean;
};

type DiaryResponse = {
  success: boolean;
  message?: string;

  entries?: DiaryEntry[];
  entry?: DiaryEntry;
};

async function parseResponse(
  response: Response,
): Promise<DiaryResponse> {
  const data =
    (await response.json()) as DiaryResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Diary request failed.",
    );
  }

  return data;
}

export async function fetchDiaryEntries() {
  const response = await fetch(
    "/api/diary",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data =
    await parseResponse(response);

  return data.entries ?? [];
}

export async function createDiaryEntry(
  entry: CreateDiaryEntryPayload,
) {
  const response = await fetch(
    "/api/diary",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify(entry),
    },
  );

  const data =
    await parseResponse(response);

  if (!data.entry) {
    throw new Error(
      "Server did not return the diary entry.",
    );
  }

  return data.entry;
}

export async function updateDiaryEntry(
  id: string,
  entry: Partial<CreateDiaryEntryPayload>,
) {
  const response = await fetch(
    `/api/diary/${id}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify(entry),
    },
  );

  const data =
    await parseResponse(response);

  if (!data.entry) {
    throw new Error(
      "Server did not return the diary entry.",
    );
  }

  return data.entry;
}

export async function deleteDiaryEntry(
  id: string,
) {
  const response = await fetch(
    `/api/diary/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await parseResponse(response);
}