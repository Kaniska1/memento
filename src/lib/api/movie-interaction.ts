export type MovieInteraction = {
  watched: boolean;
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;
  lastWatchedAt: string | null;
  logCount: number;
};

export type UpdateMovieInteractionPayload = {
  movieTitle: string;
  movieYear?: string;
  poster?: string | null;
  genre?: string;

  watched?: boolean;
  liked?: boolean;
  watchlisted?: boolean;
  rating?: number | null;
  lastWatchedAt?: string | null;
};

type InteractionResponse = {
  success: boolean;
  message?: string;
  interaction?: MovieInteraction;
};

async function parseResponse(
  response: Response,
) {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    const message = [
      `Expected JSON but received something else.`,
      `Status: ${response.status}`,
      `Status text: ${response.statusText}`,
      `URL: ${response.url}`,
      `Redirected: ${response.redirected}`,
      `Content-Type: ${contentType || "missing"}`,
      `Body: ${text.slice(0, 1000)}`,
    ].join("\n");

    console.error(message);

    throw new Error(message);
  }

  const data =
    (await response.json()) as InteractionResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Movie interaction request failed (${response.status}).`,
    );
  }

  if (!data.interaction) {
    throw new Error(
      "Server did not return the movie interaction.",
    );
  }

  return data.interaction;
}

export async function fetchMovieInteraction(
  movieId: number,
) {
  const response = await fetch(
    `/api/movies/${movieId}/interaction`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  return parseResponse(response);
}

export async function updateMovieInteraction(
  movieId: number,
  payload: UpdateMovieInteractionPayload,
) {
  const response = await fetch(
    `/api/movies/${movieId}/interaction`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",

      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}