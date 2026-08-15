import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import {
  letterboxdFilmKey,
  parseLetterboxdExport,
  type LetterboxdDiaryRow,
  type LetterboxdReviewRow,
} from "@/lib/letterboxd-import";
import { connectDB } from "@/lib/mongodb";
import DiaryEntry from "@/models/DiaryEntry";
import MovieInteraction from "@/models/MovieInteraction";
import MovieList from "@/models/MovieList";

export const runtime =
  "nodejs";

const MAX_UPLOAD_BYTES =
  20 * 1024 * 1024;

type MatchedMovie = {
  key: string;

  tmdb: {
    id: number;
    title: string;
    year: string;
    poster:
      | string
      | null;
    backdrop:
      | string
      | null;
    genre: string;
    originalLanguage: string;
    rating: number;
    voteCount: number;
  };
};

function latestDate(
  dates: string[],
) {
  return [...dates]
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
}

function validIsoDate(
  value: string,
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value,
  );
}

function toDate(
  value:
    | string
    | null,
) {
  if (
    !value ||
    !validIsoDate(value)
  ) {
    return null;
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function laterDate(
  a:
    | Date
    | null
    | undefined,
  b:
    | Date
    | null
    | undefined,
) {
  if (!a) {
    return b ?? null;
  }

  if (!b) {
    return a;
  }

  return a.getTime() >=
    b.getTime()
    ? a
    : b;
}

function diaryGroupKey(
  row:
    | LetterboxdDiaryRow
    | LetterboxdReviewRow,
) {
  return [
    row.letterboxdUri,
    row.watchedDate,
  ].join("|");
}

function makeDiaryExternalId(
  row:
    | LetterboxdDiaryRow
    | LetterboxdReviewRow,
  occurrence: number,
) {
  return [
    row.letterboxdUri ||
      `${row.name}|${row.year}`,
    row.watchedDate,
    occurrence,
  ]
    .map((part) =>
      encodeURIComponent(
        String(part),
      ),
    )
    .join(":");
}

function listExternalId(
  name: string,
  url: string,
) {
  return (
    url ||
    `name:${name
      .trim()
      .toLowerCase()}`
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

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const matchesRaw =
      formData.get("matches");

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Letterboxd ZIP is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size <= 0 ||
      file.size >
        MAX_UPLOAD_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The ZIP must be between 1 byte and 20 MB.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof matchesRaw !==
        "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resolved TMDB matches are required.",
        },
        {
          status: 400,
        },
      );
    }

    let matches:
      MatchedMovie[];

    try {
      matches =
        JSON.parse(
          matchesRaw,
        ) as MatchedMovie[];
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resolved TMDB matches are invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Array.isArray(matches) ||
      matches.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "There are no matched films to import.",
        },
        {
          status: 400,
        },
      );
    }

    const matchMap =
      new Map<
        string,
        MatchedMovie["tmdb"]
      >();

    for (const match of
      matches) {
      if (
        typeof match?.key !==
          "string" ||
        !Number.isInteger(
          match?.tmdb?.id,
        )
      ) {
        continue;
      }

      matchMap.set(
        match.key,
        match.tmdb,
      );
    }

    const bytes =
      await file.arrayBuffer();

    const parsed =
      await parseLetterboxdExport(
        Buffer.from(bytes),
      );

    const matchedNormalized =
      parsed.normalizedFilms.filter(
        (film) =>
          matchMap.has(
            film.key,
          ),
      );

    if (
      matchedNormalized.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "None of the resolved films match this export.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    /*
     * --------------------------------
     * MOVIE INTERACTIONS
     * --------------------------------
     *
     * Existing Memento data wins over imported
     * nullable values. Positive watched/liked
     * states are merged rather than destroyed.
     */
    const movieIds =
      matchedNormalized.map(
        (film) =>
          matchMap.get(
            film.key,
          )!.id,
      );

    const existingInteractions =
      await MovieInteraction.find({
        userId:
          currentUser.id,

        movieId: {
          $in:
            movieIds,
        },
      }).lean();

    const existingMap =
      new Map(
        existingInteractions.map(
          (interaction) => [
            interaction.movieId,
            interaction,
          ],
        ),
      );

    const interactionOps =
      matchedNormalized.map(
        (film) => {
          const tmdb =
            matchMap.get(
              film.key,
            )!;

          const existing =
            existingMap.get(
              tmdb.id,
            );

          const importedWatched =
            film.watched ||
            film.liked ||
            film.rating !==
              null;

          const watched =
            Boolean(
              existing?.watched,
            ) ||
            importedWatched;

          const liked =
            Boolean(
              existing?.liked,
            ) ||
            film.liked;

          const rating =
            existing?.rating ??
            film.rating ??
            null;

          const importedLastWatched =
            toDate(
              latestDate(
                film.watchedDates,
              ),
            );

          const lastWatchedAt =
            laterDate(
              existing?.lastWatchedAt ??
                null,
              importedLastWatched,
            );

          const watchlisted =
            watched
              ? false
              : Boolean(
                  existing?.watchlisted,
                ) ||
                film.watchlisted;

          return {
            updateOne: {
              filter: {
                userId:
                  currentUser.id,

                movieId:
                  tmdb.id,
              },

              update: {
                $set: {
                  movieTitle:
                    tmdb.title,

                  movieYear:
                    tmdb.year,

                  poster:
                    tmdb.poster,

                  genre:
                    tmdb.genre,

                  originalLanguage:
                    tmdb.originalLanguage,

                  tmdbVoteCount:
                    tmdb.voteCount,

                  tmdbRating:
                    tmdb.rating,

                  watched,
                  liked,
                  watchlisted,
                  rating,
                  lastWatchedAt,
                },
              },

              upsert: true,
            },
          };
        },
      );

    if (
      interactionOps.length >
      0
    ) {
      await MovieInteraction.bulkWrite(
        interactionOps,
        {
          ordered: false,
        },
      );
    }

    /*
     * --------------------------------
     * DIARY + REVIEWS
     * --------------------------------
     */

    const reviewGroups =
      new Map<
        string,
        LetterboxdReviewRow[]
      >();

    for (const review of
      parsed.importData.reviews) {
      const key =
        diaryGroupKey(
          review,
        );

      const group =
        reviewGroups.get(
          key,
        ) ?? [];

      group.push(
        review,
      );

      reviewGroups.set(
        key,
        group,
      );
    }

    const diarySourceRows: Array<
      LetterboxdDiaryRow |
      LetterboxdReviewRow
    > = [
      ...parsed.importData.diary,
    ];

    /*
     * Some reviews can exist without a matching
     * diary row. Add those as standalone diary
     * imports.
     */
    const diaryGroupCounts =
      new Map<
        string,
        number
      >();

    for (const row of
      parsed.importData.diary) {
      const key =
        diaryGroupKey(row);

      diaryGroupCounts.set(
        key,
        (
          diaryGroupCounts.get(
            key,
          ) ?? 0
        ) + 1,
      );
    }

    for (const review of
      parsed.importData.reviews) {
      const key =
        diaryGroupKey(
          review,
        );

      if (
        !diaryGroupCounts.has(
          key,
        )
      ) {
        diarySourceRows.push(
          review,
        );
      }
    }

    const occurrenceByGroup =
      new Map<
        string,
        number
      >();

    const diaryOps:
      Parameters<
        typeof DiaryEntry.bulkWrite
      >[0] = [];

    for (const row of
      diarySourceRows) {
      if (
        !row.watchedDate
      ) {
        continue;
      }

      const filmKey =
        letterboxdFilmKey(
          row,
        );

      const tmdb =
        matchMap.get(
          filmKey,
        );

      if (!tmdb) {
        continue;
      }

      const groupKey =
        diaryGroupKey(
          row,
        );

      const occurrence =
        occurrenceByGroup.get(
          groupKey,
        ) ?? 0;

      occurrenceByGroup.set(
        groupKey,
        occurrence + 1,
      );

      const relatedReviews =
        reviewGroups.get(
          groupKey,
        ) ?? [];

      const review =
        relatedReviews[
          Math.min(
            occurrence,
            relatedReviews.length -
              1,
          )
        ];

      const normalizedFilm =
        parsed.normalizedFilms.find(
          (film) =>
            film.key ===
            filmKey,
        );

      const externalId =
        makeDiaryExternalId(
          row,
          occurrence,
        );

      diaryOps.push({
        updateOne: {
          filter: {
            userId:
              currentUser.id,

            source:
              "letterboxd",

            externalId,
          },

          update: {
            $set: {
              movieId:
                tmdb.id,

              movieTitle:
                tmdb.title,

              movieYear:
                tmdb.year,

              poster:
                tmdb.poster,

              watchedDate:
                row.watchedDate,

              rating:
                row.rating ??
                review?.rating ??
                null,

              review:
                review?.review ??
                (
                  "review" in row
                    ? row.review
                    : ""
                ),

              containsSpoilers:
                false,

              liked:
                normalizedFilm?.liked ??
                false,

              isRewatch:
                row.rewatch,

              source:
                "letterboxd",

              externalId,
            },
          },

          upsert: true,
        },
      });
    }

    if (
      diaryOps.length > 0
    ) {
      await DiaryEntry.bulkWrite(
        diaryOps,
        {
          ordered: false,
        },
      );
    }

    /*
     * --------------------------------
     * CUSTOM LISTS
     * --------------------------------
     */

    const listOps:
      Parameters<
        typeof MovieList.bulkWrite
      >[0] = [];

    for (const list of
      parsed.importData.lists) {
      const movies =
        list.movies
          .map((movie) => {
            const tmdb =
              matchMap.get(
                letterboxdFilmKey(
                  movie,
                ),
              );

            if (!tmdb) {
              return null;
            }

            return {
              movieId:
                tmdb.id,

              title:
                tmdb.title,

              year:
                tmdb.year,

              poster:
                tmdb.poster,

              genre:
                tmdb.genre,

              position:
                movie.position,
            };
          })
          .filter(
            (
              movie,
            ): movie is NonNullable<
              typeof movie
            > =>
              movie !== null,
          );

      const externalId =
        listExternalId(
          list.name,
          list.url,
        );

      listOps.push({
        updateOne: {
          filter: {
            ownerId:
              currentUser.id,

            source:
              "letterboxd",

            externalId,
          },

          update: {
            $set: {
              title:
                list.name.slice(
                  0,
                  100,
                ),

              description:
                list.description.slice(
                  0,
                  1000,
                ),

              isPublic:
                false,

              isRanked:
                movies.some(
                  (movie) =>
                    movie.position !==
                    null,
                ),

              movies,

              /*
               * Letterboxd collaborators are intentionally
               * ignored. A collaborator on Letterboxd does
               * not imply that the same account/person exists
               * in Memento.
               */
              collaborators:
                [],

              source:
                "letterboxd",

              externalId,
            },
          },

          upsert: true,
        },
      });
    }

    if (
      listOps.length > 0
    ) {
      await MovieList.bulkWrite(
        listOps,
        {
          ordered: false,
        },
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Letterboxd data imported successfully.",

      imported: {
        films:
          matchedNormalized.length,

        interactions:
          interactionOps.length,

        diaryEntries:
          diaryOps.length,

        lists:
          listOps.length,

        skippedUnresolvedFilms:
          parsed.normalizedFilms.length -
          matchedNormalized.length,
      },
    });
  } catch (error) {
    console.error(
      "Could not import Letterboxd data:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Could not import Letterboxd data.",
      },
      {
        status: 500,
      },
    );
  }
}