import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { rankWithMl } from "@/lib/ml-ranker";

import MovieInteraction from "@/models/MovieInteraction";
import RecommendationFeedback from "@/models/RecommendationFeedback";
import User from "@/models/User";

const TMDB_API_URL =
  "https://api.themoviedb.org/3";

const TMDB_POSTER_URL =
  "https://image.tmdb.org/t/p/w500";

const TMDB_BACKDROP_URL =
  "https://image.tmdb.org/t/p/original";

const MIN_TMDB_RATING = 7;
const MIN_TMDB_VOTES = 100;

const MIN_MEMENTO_RATING = 3.5;
const MIN_MEMENTO_RATINGS = 5;

/*
 * Early-stage hybrid weights.
 *
 * ML gets the largest share, but deterministic
 * taste relevance still acts as a stabilizer
 * while the personal training dataset is small.
 *
 * Diversity is applied as a controlled bonus
 * instead of being allowed to replace the ML
 * ordering wholesale.
 */
const ML_WEIGHT = 0.55;
const MATCH_WEIGHT = 0.30;
const DIVERSITY_WEIGHT = 0.15;

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const internationalLanguages = [
  "ko",
  "ja",
  "fr",
  "es",
  "it",
  "de",
  "hi",
  "bn",
  "zh",
  "fa",
];

const genreNameToId =
  new Map<string, number>(
    Object.entries(
      genreMap,
    ).map(
      ([id, name]) => [
        name.toLowerCase(),
        Number(id),
      ],
    ),
  );

const MAX_LEARNED_GENRES = 5;
const MAX_HISTORY_SEEDS = 12;

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;

  release_date?: string;

  poster_path: string | null;
  backdrop_path: string | null;

  vote_average: number;
  vote_count: number;

  popularity: number;

  genre_ids: number[];

  original_language: string;
};

type TmdbMovieResponse = {
  results: TmdbMovie[];
};

type CandidateSource =
  | "favourite"
  | "genre"
  | "international"
  | "obscure";

type RecommendationCandidate =
  TmdbMovie & {
    sources: Set<CandidateSource>;
  };

type MementoRatingAggregate = {
  _id: number;
  averageRating: number;
  ratingCount: number;
};

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    Math.max(value, min),
    max,
  );
}

function normalize(
  value: number,
  min: number,
  max: number,
) {
  if (max <= min) {
    return 0;
  }

  return clamp(
    (value - min) /
      (max - min),
    0,
    1,
  );
}

function getExperienceScore(
  watchedCount: number,
) {
  return clamp(
    watchedCount / 200,
    0,
    1,
  );
}

function getObscurityScore(
  movie: TmdbMovie,
) {
  /*
   * Obscurity should primarily describe how
   * widely a film has been seen / rated over
   * time, not whether it happens to be trending
   * on TMDB today.
   *
   * vote_count therefore carries 80% of the
   * signal. Current popularity is only a small
   * secondary correction.
   *
   * Rough behaviour:
   * - ~200 votes     => very obscure
   * - ~2,000 votes   => moderately niche
   * - ~10,000 votes  => well known
   * - ~16,000+ votes => strongly mainstream
   */
  const voteCountObscurity =
    1 -
    normalize(
      Math.log10(
        Math.max(
          movie.vote_count,
          1,
        ),
      ),
      2.3,
      4.2,
    );

  const currentPopularityObscurity =
    1 -
    normalize(
      movie.popularity,
      5,
      150,
    );

  return clamp(
    voteCountObscurity *
      0.8 +
      currentPopularityObscurity *
        0.2,
    0,
    1,
  );
}

function getExplorationWeight(
  style:
    | "familiar"
    | "balanced"
    | "adventurous",
) {
  switch (style) {
    case "familiar":
      return 0.55;

    case "adventurous":
      return 1.35;

    default:
      return 1;
  }
}

async function fetchTmdbMovies(
  path: string,
  headers: HeadersInit,
): Promise<TmdbMovie[]> {
  const response =
    await fetch(
      `${TMDB_API_URL}${path}`,
      {
        headers,
        cache: "no-store",
      },
    );

  if (!response.ok) {
    return [];
  }

  const data =
    (await response.json()) as TmdbMovieResponse;

  return data.results ?? [];
}

export async function GET(
  request: Request,
) {
  const accessToken =
    process.env.TMDB_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      {
        message:
          "TMDB access token is missing.",
      },
      {
        status: 500,
      },
    );
  }

  /*
   * Recent recommendation batches are
   * temporary presentation-state exclusions.
   *
   * They are intentionally NOT persisted to
   * MongoDB and do not affect ML feedback.
   */
  const requestUrl =
    new URL(request.url);

  const rawRecentBatches =
    requestUrl.searchParams.get(
      "recentBatches",
    );

  let recentBatches:
    number[][] = [];

  if (rawRecentBatches) {
    try {
      const parsed =
        JSON.parse(
          rawRecentBatches,
        ) as unknown;

      if (Array.isArray(parsed)) {
        recentBatches =
          parsed
            .slice(-4)
            .map((batch) =>
              Array.isArray(batch)
                ? batch
                    .filter(
                      (
                        movieId,
                      ): movieId is number =>
                        typeof movieId ===
                          "number" &&
                        Number.isFinite(
                          movieId,
                        ),
                    )
                    .slice(0, 24)
                : [],
            )
            .filter(
              (batch) =>
                batch.length > 0,
            );
      }
    } catch {
      recentBatches = [];
    }
  }

  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message:
            "You are not authenticated.",
        },
        {
          status: 401,
        },
      );
    }

    await connectDB();

    const user =
      await User.findById(
        currentUser.id,
      )
        .select(
          [
            "favouriteMovies",
            "preferredGenreIds",
            "initialRatings",
            "settings",
          ].join(" "),
        )
        .lean();

    if (!user) {
      return NextResponse.json(
        {
          message:
            "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    const interactions =
      await MovieInteraction.find({
        userId: currentUser.id,
      })
        .select(
          [
            "movieId",
            "watched",
            "liked",
            "rating",
            "watchlisted",
            "genre",
            "originalLanguage",
            "tmdbVoteCount",
            "tmdbRating",
            "lastWatchedAt",
          ].join(" "),
        )
        .lean();

    const recommendationFeedback =
      await RecommendationFeedback.find({
        userId: currentUser.id,
      })
        .select(
          [
            "movieId",
            "action",
            "matchScore",
            "international",
            "obscurityScore",
            "tmdbRating",
          ].join(" "),
        )
        .lean();

    const notInterestedIds =
      new Set<number>(
        recommendationFeedback
          .filter(
            (feedback) =>
              feedback.action ===
              "not_interested",
          )
          .map(
            (feedback) =>
              feedback.movieId,
          ),
      );

    const feedbackSeenIds =
      new Set<number>(
        recommendationFeedback
          .filter(
            (feedback) =>
              feedback.action ===
              "seen",
          )
          .map(
            (feedback) =>
              feedback.movieId,
          ),
      );

    const openedIds =
      new Set<number>(
        recommendationFeedback
          .filter(
            (feedback) =>
              feedback.action ===
              "opened",
          )
          .map(
            (feedback) =>
              feedback.movieId,
          ),
      );

    const favouriteIds =
      (
        user.favouriteMovies ??
        []
      ).map(
        (movie) =>
          movie.movieId,
      );

    const onboardingGenreIds =
      user.preferredGenreIds ??
      [];

    const watchedIds =
      new Set<number>(
        interactions
          .filter(
            (interaction) =>
              interaction.watched,
          )
          .map(
            (interaction) =>
              interaction.movieId,
          ),
      );

    /*
     * Movies already in the user's
     * watchlist should not appear in
     * For You again.
     */
    const watchlistedIds =
      new Set<number>(
        interactions
          .filter(
            (interaction) =>
              interaction.watchlisted,
          )
          .map(
            (interaction) =>
              interaction.movieId,
          ),
      );

    const combinedSeenIds =
      new Set<number>([
        ...watchedIds,
        ...feedbackSeenIds,
      ]);

    const watchedCount =
      combinedSeenIds.size;

    const likedIds =
      new Set<number>(
        interactions
          .filter(
            (interaction) =>
              interaction.liked,
          )
          .map(
            (interaction) =>
              interaction.movieId,
          ),
      );

    const highlyRatedIds =
      new Set<number>(
        interactions
          .filter(
            (interaction) =>
              interaction.rating !=
                null &&
              interaction.rating >=
                4,
          )
          .map(
            (interaction) =>
              interaction.movieId,
          ),
      );

    for (const rating of
      user.initialRatings ??
      []) {
      if (rating.rating >= 4) {
        highlyRatedIds.add(
          rating.movieId,
        );
      }
    }

    /*
     * --------------------------------------------------
     * IMPORTED / HISTORICAL TASTE PROFILE
     * --------------------------------------------------
     *
     * Letterboxd history lives in MovieInteraction,
     * not RecommendationImpression. That is exactly
     * what we want: imported history should improve
     * taste context and candidate generation without
     * pretending those films were Memento recs.
     */

    const genreScores =
      new Map<number, number>();

    let internationalPositiveWeight =
      0;

    let positiveHistoryWeight =
      0;

    let obscurePositiveWeight =
      0;

    for (const interaction of
      interactions) {
      if (!interaction.watched) {
        continue;
      }

      const rating =
        interaction.rating;

      const positive =
        interaction.liked ||
        (
          rating !== null &&
          rating !== undefined &&
          rating >= 3.5
        );

      /*
       * Watched-only data contributes lightly;
       * explicit likes/high ratings contribute
       * much more strongly.
       */
      let weight = 0.25;

      if (
        rating !== null &&
        rating !== undefined
      ) {
        weight +=
          normalize(
            rating,
            2.5,
            5,
          ) * 1.5;
      }

      if (interaction.liked) {
        weight += 1;
      }

      const genreId =
        genreNameToId.get(
          (
            interaction.genre ??
            ""
          ).toLowerCase(),
        );

      if (genreId) {
        genreScores.set(
          genreId,
          (
            genreScores.get(
              genreId,
            ) ?? 0
          ) + weight,
        );
      }

      if (positive) {
        const positiveWeight =
          Math.max(
            weight,
            0.5,
          );

        positiveHistoryWeight +=
          positiveWeight;

        if (
          interaction.originalLanguage &&
          interaction.originalLanguage !==
            "en"
        ) {
          internationalPositiveWeight +=
            positiveWeight;
        }

        const voteCount =
          interaction.tmdbVoteCount;

        /*
         * Treat low-lifetime-vote films as
         * evidence of a genuine deep-cut taste.
         * This mirrors obscurity v2's emphasis
         * on lifetime exposure rather than
         * current trending popularity.
         */
        if (
          voteCount !== null &&
          voteCount !== undefined &&
          voteCount > 0 &&
          voteCount <= 2500
        ) {
          obscurePositiveWeight +=
            positiveWeight;
        }
      }
    }

    const learnedGenreIds =
      Array.from(
        genreScores.entries(),
      )
        .sort(
          (a, b) =>
            b[1] - a[1],
        )
        .slice(
          0,
          MAX_LEARNED_GENRES,
        )
        .map(
          ([genreId]) =>
            genreId,
        );

    const preferredGenreIds =
      Array.from(
        new Set<number>([
          ...onboardingGenreIds,
          ...learnedGenreIds,
        ]),
      );

    const internationalTasteScore =
      positiveHistoryWeight > 0
        ? clamp(
            internationalPositiveWeight /
              positiveHistoryWeight,
            0,
            1,
          )
        : 0;

    const obscureTasteScore =
      positiveHistoryWeight > 0
        ? clamp(
            obscurePositiveWeight /
              positiveHistoryWeight,
            0,
            1,
          )
        : 0;

    /*
     * Strong history seeds are selected by
     * explicit preference rather than MongoDB
     * iteration order. This matters a lot once
     * imports add hundreds of liked/rated films.
     */
    const historySeedIds =
      interactions
        .filter(
          (interaction) =>
            interaction.watched &&
            (
              interaction.liked ||
              (
                interaction.rating !==
                  null &&
                interaction.rating !==
                  undefined &&
                interaction.rating >=
                  4
              )
            ),
        )
        .map(
          (interaction) => {
            const rating =
              interaction.rating ?? 0;

            const ratingScore =
              normalize(
                rating,
                3.5,
                5,
              );

            const likeScore =
              interaction.liked
                ? 1
                : 0;

            const recentScore =
              interaction.lastWatchedAt
                ? normalize(
                    new Date(
                      interaction.lastWatchedAt,
                    ).getTime(),
                    Date.now() -
                      1000 *
                        60 *
                        60 *
                        24 *
                        365 *
                        10,
                    Date.now(),
                  )
                : 0;

            return {
              movieId:
                interaction.movieId,

              score:
                ratingScore *
                  0.65 +
                likeScore *
                  0.25 +
                recentScore *
                  0.1,
            };
          },
        )
        .sort(
          (a, b) =>
            b.score - a.score,
        )
        .slice(
          0,
          MAX_HISTORY_SEEDS,
        )
        .map(
          (seed) =>
            seed.movieId,
        );

    const recommendationStyle =
      user.settings
        ?.recommendationStyle ??
      "balanced";

    const hideWatched =
      user.settings
        ?.hideWatchedFromRecommendations ??
      true;

    const includePopular =
      user.settings
        ?.includePopularMovies ??
      true;

    const allowOlder =
      user.settings
        ?.allowOlderMovies ??
      true;

    /*
     * --------------------------------------------------
     * HARD EXCLUSIONS
     * --------------------------------------------------
     *
     * These movies should never appear in
     * the final recommendation feed.
     */
    const excludedMovieIds =
      new Set<number>([
        ...favouriteIds,
        ...watchlistedIds,
        ...notInterestedIds,
      ]);

    if (hideWatched) {
      for (
        const movieId of
        combinedSeenIds
      ) {
        excludedMovieIds.add(
          movieId,
        );
      }
    }

    const experienceScore =
      getExperienceScore(
        watchedCount,
      );

    const explorationWeight =
      getExplorationWeight(
        recommendationStyle,
      );

    const headers = {
      Authorization:
        `Bearer ${accessToken}`,
      accept:
        "application/json",
    };

    const seedIds =
      Array.from(
        new Set<number>([
          /*
           * Explicit onboarding favourites
           * keep first priority.
           */
          ...favouriteIds,

          /*
           * Then use the strongest historical
           * likes/ratings, including imported
           * Letterboxd history.
           */
          ...historySeedIds,

          /*
           * Native Memento browsing remains a
           * small live-interest signal.
           */
          ...Array.from(
            openedIds,
          ).slice(0, 3),

          /*
           * Fallback coverage for old accounts.
           */
          ...highlyRatedIds,
          ...likedIds,
        ]),
      ).slice(
        0,
        MAX_HISTORY_SEEDS,
      );

    const favouriteRequests =
      seedIds.map(
        async (movieId) => {
          const movies =
            await fetchTmdbMovies(
              `/movie/${movieId}/recommendations?language=en-US&page=1`,
              headers,
            );

          return movies.map(
            (movie) => ({
              ...movie,

              sources:
                new Set<CandidateSource>([
                  "favourite",
                ]),
            }),
          );
        },
      );

    const genreRequest =
      preferredGenreIds.length >
      0
        ? fetchTmdbMovies(
            `/discover/movie?${new URLSearchParams(
              {
                language:
                  "en-US",

                include_adult:
                  "false",

                include_video:
                  "false",

                sort_by:
                  includePopular
                    ? "popularity.desc"
                    : "vote_average.desc",

                "vote_average.gte":
                  MIN_TMDB_RATING.toString(),

                "vote_count.gte":
                  "300",

                with_genres:
                  preferredGenreIds.join(
                    "|",
                  ),

                page: "1",
              },
            )}`,
            headers,
          ).then((movies) =>
            movies.map(
              (movie) => ({
                ...movie,

                sources:
                  new Set<CandidateSource>([
                    "genre",
                  ]),
              }),
            ),
          )
        : Promise.resolve(
            [] as RecommendationCandidate[],
          );

    const shouldExploreInternational =
      watchedCount >= 20 ||
      recommendationStyle ===
        "adventurous" ||
      internationalTasteScore >=
        0.15;

    const internationalRequests =
      shouldExploreInternational
        ? internationalLanguages
            .slice(
              0,
              internationalTasteScore >=
                0.35
                ? 10
                : internationalTasteScore >=
                      0.2 ||
                    watchedCount >= 150
                  ? 8
                  : watchedCount >= 75
                    ? 6
                    : 4,
            )
            .map(
              async (
                language,
              ) => {
                const movies =
                  await fetchTmdbMovies(
                    `/discover/movie?${new URLSearchParams(
                      {
                        language:
                          "en-US",

                        include_adult:
                          "false",

                        include_video:
                          "false",

                        with_original_language:
                          language,

                        sort_by:
                          "vote_average.desc",

                        "vote_average.gte":
                          MIN_TMDB_RATING.toString(),

                        "vote_count.gte":
                          watchedCount >=
                          150
                            ? "80"
                            : "150",

                        page: "1",
                      },
                    )}`,
                    headers,
                  );

                return movies.map(
                  (movie) => ({
                    ...movie,

                    sources:
                      new Set<CandidateSource>([
                        "international",
                      ]),
                  }),
                );
              },
            )
        : [];

    const shouldExploreObscure =
      watchedCount >= 40 ||
      recommendationStyle ===
        "adventurous" ||
      obscureTasteScore >=
        0.12;

    const obscureRequests =
      shouldExploreObscure
        ? [1, 2, 3].map(
            async (page) => {
              const movies =
                await fetchTmdbMovies(
                  `/discover/movie?${new URLSearchParams(
                    {
                      language:
                        "en-US",

                      include_adult:
                        "false",

                      include_video:
                        "false",

                      sort_by:
                        "vote_average.desc",

                      "vote_average.gte":
                        MIN_TMDB_RATING.toString(),

                      "vote_count.gte":
                        watchedCount >=
                        150
                          ? "60"
                          : "120",

                      page:
                        page.toString(),
                    },
                  )}`,
                  headers,
                );

              return movies.map(
                (movie) => ({
                  ...movie,

                  sources:
                    new Set<CandidateSource>([
                      "obscure",
                    ]),
                }),
              );
            },
          )
        : [];

    const [
      genreMovies,
      ...otherPools
    ] = await Promise.all([
      genreRequest,
      ...favouriteRequests,
      ...internationalRequests,
      ...obscureRequests,
    ]);

    const allCandidates = [
      ...genreMovies,
      ...otherPools.flat(),
    ];

    const uniqueCandidates =
      new Map<
        number,
        RecommendationCandidate
      >();

    for (const movie of
      allCandidates) {
      if (
        !movie.poster_path ||
        !movie.title
      ) {
        continue;
      }

      /*
       * Exclude:
       *
       * - favourites
       * - watchlisted films
       * - explicit "not interested"
       * - watched / marked-seen films
       *   when hideWatched is enabled
       */
      if (
        excludedMovieIds.has(
          movie.id,
        )
      ) {
        continue;
      }

      if (
        !allowOlder &&
        movie.release_date
      ) {
        const year =
          Number(
            movie.release_date.slice(
              0,
              4,
            ),
          );

        if (
          Number.isFinite(
            year,
          ) &&
          year < 1980
        ) {
          continue;
        }
      }

      const existing =
        uniqueCandidates.get(
          movie.id,
        );

      if (existing) {
        for (const source of
          movie.sources) {
          existing.sources.add(
            source,
          );
        }

        continue;
      }

      uniqueCandidates.set(
        movie.id,
        movie,
      );
    }

    const candidateIds =
      Array.from(
        uniqueCandidates.keys(),
      );

    const mementoRatings =
      candidateIds.length > 0
        ? ((await MovieInteraction.aggregate(
            [
              {
                $match: {
                  movieId: {
                    $in:
                      candidateIds,
                  },

                  rating: {
                    $ne: null,
                  },
                },
              },

              {
                $group: {
                  _id: "$movieId",

                  averageRating: {
                    $avg: "$rating",
                  },

                  ratingCount: {
                    $sum: 1,
                  },
                },
              },
            ],
          )) as MementoRatingAggregate[])
        : [];

    const mementoRatingMap =
      new Map<
        number,
        MementoRatingAggregate
      >(
        mementoRatings.map(
          (rating) => [
            rating._id,
            rating,
          ],
        ),
      );

    const scored =
      Array.from(
        uniqueCandidates.values(),
      )
        .filter((movie) => {
          const memento =
            mementoRatingMap.get(
              movie.id,
            );

          const hasReliableMementoRating =
            Boolean(
              memento &&
                memento.ratingCount >=
                  MIN_MEMENTO_RATINGS,
            );

          if (
            hasReliableMementoRating
          ) {
            return (
              memento!
                .averageRating >=
              MIN_MEMENTO_RATING
            );
          }

          return (
            movie.vote_average >=
              MIN_TMDB_RATING &&
            movie.vote_count >=
              MIN_TMDB_VOTES
          );
        })
        .map((movie) => {
          const matchingGenres =
            movie.genre_ids.filter(
              (genreId) =>
                preferredGenreIds.includes(
                  genreId,
                ),
            );

          const memento =
            mementoRatingMap.get(
              movie.id,
            );

          const isInternational =
            movie.original_language !==
            "en";

          const obscurityScore =
            getObscurityScore(
              movie,
            );

          const openedBefore =
            openedIds.has(
              movie.id,
            );

          const openedInterestScore =
            openedBefore
              ? 0.08
              : 0;

          /*
           * --------------------------------
           * ML-READY FEATURES
           * --------------------------------
           */

          const genreAffinity =
            clamp(
              matchingGenres.length /
                3,
              0,
              1,
            );

          const seededSimilarity =
            movie.sources.has(
              "favourite",
            )
              ? 1
              : 0;

          const qualityScore =
            memento &&
            memento.ratingCount >=
              MIN_MEMENTO_RATINGS
              ? normalize(
                  memento.averageRating,
                  3.5,
                  5,
                )
              : normalize(
                  movie.vote_average,
                  7,
                  9,
                );

          const popularityScore =
            normalize(
              movie.popularity,
              0,
              120,
            );

          const voteStrength =
            normalize(
              Math.log10(
                Math.max(
                  movie.vote_count,
                  1,
                ),
              ),
              2,
              4.5,
            );

          /*
           * --------------------------------
           * EXPLORATION
           * --------------------------------
           */

          const internationalScore =
            isInternational
              ? clamp(
                  experienceScore *
                    0.7 +
                    internationalTasteScore *
                      0.3,
                  0,
                  1,
                )
              : 0;

          const deepCutScore =
            obscurityScore *
            clamp(
              experienceScore *
                0.75 +
                obscureTasteScore *
                  0.25,
              0,
              1,
            );

          const explorationScore =
            clamp(
              internationalScore *
                0.55 +
                deepCutScore *
                  0.45,
              0,
              1,
            ) *
            explorationWeight;

          /*
           * --------------------------------
           * STYLE WEIGHTS
           * --------------------------------
           */

          let relevanceWeight =
            0.72;

          let explorationFinalWeight =
            0.18;

          if (
            recommendationStyle ===
            "familiar"
          ) {
            relevanceWeight =
              0.82;

            explorationFinalWeight =
              0.08;
          }

          if (
            recommendationStyle ===
            "adventurous"
          ) {
            relevanceWeight =
              0.58;

            explorationFinalWeight =
              0.32;
          }

          const relevanceScore =
            genreAffinity *
              0.42 +
            seededSimilarity *
              0.38 +
            qualityScore *
              0.2;

          const popularitySupport =
            includePopular
              ? popularityScore *
                0.1
              : 0;

          const rawScore =
            relevanceScore *
              relevanceWeight +
            explorationScore *
              explorationFinalWeight +
            popularitySupport +
            openedInterestScore;

          const matchScore =
            clamp(
              Math.round(
                rawScore * 100,
              ),
              35,
              99,
            );

          /*
           * --------------------------------
           * EXPLANATION
           * --------------------------------
           */

          let reason =
            "A strong match for your taste.";

          if (
            isInternational &&
            watchedCount >= 75 &&
            obscurityScore >=
              0.55
          ) {
            reason =
              "A highly rated international deep cut selected as your film history expands.";
          } else if (
            isInternational &&
            watchedCount >= 25
          ) {
            reason =
              "A highly rated international film that fits your evolving taste.";
          } else if (
            obscurityScore >=
              0.65 &&
            watchedCount >= 40
          ) {
            reason =
              "A lesser-known but highly rated film chosen to push beyond the obvious picks.";
          } else if (
            movie.sources.has(
              "favourite",
            )
          ) {
            reason =
              watchedCount >= 100
                ? "Similar to films you have rated highly or liked across your viewing history."
                : "Similar to films you already rate, like, open, or consider favourites.";
          } else if (
            matchingGenres.length >
            1
          ) {
            reason =
              `Matches ${matchingGenres.length} of your preferred genres.`;
          } else if (
            matchingGenres.length ===
            1
          ) {
            reason =
              `Fits your interest in ${
                genreMap[
                  matchingGenres[0]
                ] ??
                "this genre"
              }.`;
          }

          return {
            id: movie.id,

            title:
              movie.title,

            overview:
              movie.overview,

            year:
              movie.release_date?.slice(
                0,
                4,
              ) ??
              "Upcoming",

            poster:
              `${TMDB_POSTER_URL}${movie.poster_path}`,

            backdrop:
              movie.backdrop_path
                ? `${TMDB_BACKDROP_URL}${movie.backdrop_path}`
                : null,

            rating:
              movie.vote_average ??
              0,

            voteCount:
              movie.vote_count ??
              0,

            mementoRating:
              memento?.averageRating ??
              null,

            mementoRatingCount:
              memento?.ratingCount ??
              0,

            genre:
              genreMap[
                movie.genre_ids[0]
              ] ??
              "Film",

            originalLanguage:
              movie.original_language,

            international:
              isInternational,

            obscurityScore:
              Math.round(
                obscurityScore *
                  100,
              ),

            genreAffinity:
              Math.round(
                genreAffinity *
                  100,
              ),

            seededSimilarity,

            qualityScore:
              Math.round(
                qualityScore *
                  100,
              ),

            popularityScore:
              Math.round(
                popularityScore *
                  100,
              ),

            voteStrength:
              Math.round(
                voteStrength *
                  100,
              ),

            sourceFavourite:
              movie.sources.has(
                "favourite",
              ),

            sourceGenre:
              movie.sources.has(
                "genre",
              ),

            sourceInternational:
              movie.sources.has(
                "international",
              ),

            sourceObscure:
              movie.sources.has(
                "obscure",
              ),

            matchScore,

            reason,
          };
        })
        .sort(
          (a, b) =>
            b.matchScore -
              a.matchScore ||
            b.rating -
              a.rating,
        );

    /*
     * --------------------------------------------------
     * ML RERANKING
     * --------------------------------------------------
     */

    const mlRanked =
      await rankWithMl(
        scored,
        {
          watchedCount,

          experienceScore:
            Math.round(
              experienceScore *
                100,
            ),

          recommendationStyle,
        },
      );

    /*
     * --------------------------------------------------
     * HYBRID SCORING
     * --------------------------------------------------
     *
     * Previously the ML ranker sorted the list, but
     * the diversity pass could then pull arbitrary
     * international/obscure movies far above stronger
     * ML candidates.
     *
     * Now every candidate receives one explicit score:
     *
     *   55% learned ML preference
     *   30% deterministic taste match
     *   15% controlled exploration/diversity
     *
     * If ML is unavailable we fall back cleanly to the
     * deterministic score instead of manufacturing an
     * ML value.
     */

    const rankedCandidates =
      (mlRanked ?? scored)
        .map((movie) => {
          const normalizedMatchScore =
            clamp(
              movie.matchScore /
                100,
              0,
              1,
            );

          const mlScore =
            "mlScore" in movie &&
            typeof movie.mlScore ===
              "number"
              ? clamp(
                  movie.mlScore,
                  0,
                  1,
                )
              : null;

          /*
           * This is deliberately a candidate-level
           * exploration signal. The later selection
           * loop adds only a small quota-aware bonus;
           * it no longer jumps deep candidates ahead
           * of the ranking simply because a quota is
           * currently unfilled.
           */
          const internationalBonus =
            movie.international
              ? clamp(
                  0.35 +
                    experienceScore *
                      0.65,
                  0,
                  1,
                )
              : 0;

          const obscureBonus =
            clamp(
              movie.obscurityScore /
                100,
              0,
              1,
            );

          const diversityScore =
            clamp(
              internationalBonus *
                0.45 +
                obscureBonus *
                  0.55,
              0,
              1,
            );

          const finalScore =
            mlScore !== null
              ? clamp(
                  mlScore *
                    ML_WEIGHT +
                    normalizedMatchScore *
                      MATCH_WEIGHT +
                    diversityScore *
                      DIVERSITY_WEIGHT,
                  0,
                  1,
                )
              : normalizedMatchScore;

          return {
            ...movie,

            mlScore,

            diversityScore,

            finalScore,
          };
        })
        .sort(
          (a, b) =>
            b.finalScore -
              a.finalScore ||
            (b.mlScore ?? 0) -
              (a.mlScore ?? 0) ||
            b.matchScore -
              a.matchScore ||
            b.rating -
              a.rating,
        );

    /*
     * --------------------------------------------------
     * REFRESH ROTATION
     * --------------------------------------------------
     *
     * Avoid movies from the previous four
     * recommendation batches.
     *
     * If that would leave fewer than 24 candidates,
     * relax the OLDEST batch first.
     */
    const targetCount = 24;

    const activeRecentBatches =
      recentBatches.map(
        (batch) => [
          ...batch,
        ],
      );

    function buildRecentExclusionSet() {
      return new Set<number>(
        activeRecentBatches.flat(),
      );
    }

    let recentExclusionIds =
      buildRecentExclusionSet();

    let availableRankedCandidates =
      rankedCandidates.filter(
        (movie) =>
          !recentExclusionIds.has(
            movie.id,
          ),
      );

    while (
      availableRankedCandidates.length <
        Math.min(
          targetCount,
          rankedCandidates.length,
        ) &&
      activeRecentBatches.length >
        0
    ) {
      activeRecentBatches.shift();

      recentExclusionIds =
        buildRecentExclusionSet();

      availableRankedCandidates =
        rankedCandidates.filter(
          (movie) =>
            !recentExclusionIds.has(
              movie.id,
            ),
        );
    }

    /*
     * --------------------------------------------------
     * CONTROLLED DIVERSITY SELECTION
     * --------------------------------------------------
     *
     * The hybrid score remains authoritative.
     *
     * We only add a small temporary bonus while an
     * international/obscure target is underfilled.
     * This gives the feed variety without allowing
     * a weak candidate to leap arbitrarily far up
     * the recommendation list.
     */

    const desiredInternational =
      Math.round(
        targetCount *
          clamp(
            0.08 +
              experienceScore *
                0.22 *
                explorationWeight,
            0.08,
            0.35,
          ),
      );

    const desiredObscure =
      Math.round(
        targetCount *
          clamp(
            0.06 +
              experienceScore *
                0.18 *
                explorationWeight,
            0.06,
            0.30,
          ),
      );

    const finalResults:
      typeof rankedCandidates = [];

    const remaining = [
      ...availableRankedCandidates,
    ];

    while (
      remaining.length > 0 &&
      finalResults.length <
        targetCount
    ) {
      const internationalCount =
        finalResults.filter(
          (movie) =>
            movie.international,
        ).length;

      const obscureCount =
        finalResults.filter(
          (movie) =>
            movie.obscurityScore >=
            60,
        ).length;

      let bestIndex = 0;
      let bestSelectionScore =
        Number.NEGATIVE_INFINITY;

      for (
        let index = 0;
        index <
        remaining.length;
        index += 1
      ) {
        const candidate =
          remaining[index];

        let quotaBonus = 0;

        if (
          internationalCount <
            desiredInternational &&
          candidate.international
        ) {
          quotaBonus += 0.015;
        }

        if (
          obscureCount <
            desiredObscure &&
          candidate.obscurityScore >=
            60
        ) {
          quotaBonus += 0.01;
        }

        /*
         * Keep quota influence intentionally small.
         * finalScore does the real ranking work.
         */
        const selectionScore =
          candidate.finalScore +
          quotaBonus;

        if (
          selectionScore >
          bestSelectionScore
        ) {
          bestSelectionScore =
            selectionScore;

          bestIndex =
            index;
        }
      }

      const [nextMovie] =
        remaining.splice(
          bestIndex,
          1,
        );

      finalResults.push(
        nextMovie,
      );
    }

    return NextResponse.json({
      results:
        finalResults,

      meta: {
        /*
         * totalSeenCount includes both database
         * watched interactions and recommendation
         * feedback marked as seen.
         */
        totalSeenCount:
          watchedCount,

        watchedInteractionCount:
          watchedIds.size,

        /*
         * Handy sanity check when
         * debugging exclusions.
         */
        watchlistedCount:
          watchlistedIds.size,

        feedbackSeenCount:
          feedbackSeenIds.size,

        notInterestedCount:
          notInterestedIds.size,

        openedCount:
          openedIds.size,

        historicalTaste: {
          learnedGenreIds,

          learnedGenres:
            learnedGenreIds.map(
              (genreId) =>
                genreMap[
                  genreId
                ] ??
                "Unknown",
            ),

          historySeedCount:
            historySeedIds.length,

          internationalAffinity:
            Math.round(
              internationalTasteScore *
                100,
            ),

          obscureAffinity:
            Math.round(
              obscureTasteScore *
                100,
            ),
        },

        refreshRotation: {
          requestedBatches:
            recentBatches.length,

          enforcedBatches:
            activeRecentBatches.length,

          temporarilyExcluded:
            recentExclusionIds.size,
        },

        experienceScore:
          Math.round(
            experienceScore *
              100,
          ),

        recommendationStyle,

        rankingMode:
          mlRanked
            ? "hybrid-ml"
            : "deterministic",

        hybridWeights:
          mlRanked
            ? {
                ml:
                  ML_WEIGHT,

                deterministicMatch:
                  MATCH_WEIGHT,

                diversity:
                  DIVERSITY_WEIGHT,
              }
            : null,

        obscurityVersion: 2,

        obscurityWeights: {
          lifetimeVoteCount: 0.8,
          currentPopularity: 0.2,
        },

        diversityTargets: {
          international:
            desiredInternational,

          obscure:
            desiredObscure,
        },

        diversityQuotaBonuses: {
          international: 0.015,
          obscure: 0.01,
        },

        qualityFloor: {
          tmdb:
            MIN_TMDB_RATING,

          memento:
            MIN_MEMENTO_RATING,

          minimumMementoRatings:
            MIN_MEMENTO_RATINGS,
        },
      },
    });
  } catch (error) {
    console.error(
      "Could not create recommendations:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Could not generate recommendations.",
      },
      {
        status: 500,
      },
    );
  }
}