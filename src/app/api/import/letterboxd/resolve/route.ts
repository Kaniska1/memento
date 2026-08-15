import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

import {
  resolveLetterboxdMovie,
  type LetterboxdResolveInput,
  type ResolvedLetterboxdMovie,
} from "@/lib/tmdb-letterboxd-resolver";

export const runtime =
  "nodejs";

const MAX_BATCH_SIZE = 30;
const CONCURRENCY = 6;

type ResolveRequest = {
  films?: LetterboxdResolveInput[];
};

async function mapWithConcurrency<
  TInput,
  TOutput
>(
  items: TInput[],
  limit: number,
  mapper: (
    item: TInput,
  ) => Promise<TOutput>,
) {
  const results:
    TOutput[] =
      new Array(
        items.length,
      );

  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index =
        nextIndex;

      nextIndex += 1;

      if (
        index >=
        items.length
      ) {
        return;
      }

      results[index] =
        await mapper(
          items[index],
        );
    }
  }

  await Promise.all(
    Array.from(
      {
        length:
          Math.min(
            limit,
            items.length,
          ),
      },
      () => worker(),
    ),
  );

  return results;
}

function isValidFilm(
  value: unknown,
): value is LetterboxdResolveInput {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false;
  }

  const film =
    value as Partial<LetterboxdResolveInput>;

  return (
    typeof film.key ===
      "string" &&
    film.key.length > 0 &&
    typeof film.name ===
      "string" &&
    film.name.trim().length >
      0 &&
    typeof film.year ===
      "string" &&
    typeof film.letterboxdUri ===
      "string"
  );
}

export async function POST(
  request: Request,
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authenticated.",
        },
        {
          status: 401,
        },
      );
    }

    const accessToken =
      process.env
        .TMDB_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message:
            "TMDB access token is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const body =
      (await request.json()) as ResolveRequest;

    const films =
      body.films ?? [];

    if (
      !Array.isArray(
        films,
      ) ||
      films.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No Letterboxd films were supplied.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      films.length >
      MAX_BATCH_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Resolve at most ${MAX_BATCH_SIZE} films per request.`,
        },
        {
          status: 400,
        },
      );
    }

    if (
      !films.every(
        isValidFilm,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more Letterboxd film records are invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const results =
      await mapWithConcurrency<
        LetterboxdResolveInput,
        ResolvedLetterboxdMovie
      >(
        films,
        CONCURRENCY,

        async (film) => {
          try {
            return await resolveLetterboxdMovie(
              film,
              accessToken,
            );
          } catch (error) {
            console.error(
              `Could not resolve ${film.name}:`,
              error,
            );

            return {
              key:
                film.key,

              letterboxd: {
                name:
                  film.name,

                year:
                  film.year,

                uri:
                  film.letterboxdUri,
              },

              status:
                "unmatched",

              confidence:
                "none",

              tmdb:
                null,

              alternatives:
                [],
            };
          }
        },
      );

    const matched =
      results.filter(
        (result) =>
          result.status ===
          "matched",
      ).length;

    const needsReview =
      results.filter(
        (result) =>
          result.status ===
          "review",
      ).length;

    const unmatched =
      results.filter(
        (result) =>
          result.status ===
          "unmatched",
      ).length;

    return NextResponse.json({
      success: true,

      count:
        results.length,

      summary: {
        matched,
        needsReview,
        unmatched,
      },

      results,
    });
  } catch (error) {
    console.error(
      "Could not resolve Letterboxd films:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Could not resolve Letterboxd films.",
      },
      {
        status: 500,
      },
    );
  }
}