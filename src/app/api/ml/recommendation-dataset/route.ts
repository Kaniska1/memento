import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";

import MovieInteraction from "@/models/MovieInteraction";
import RecommendationFeedback from "@/models/RecommendationFeedback";
import RecommendationImpression from "@/models/RecommendationImpression";
import User from "@/models/User";

export const runtime = "nodejs";

const DEDUPE_WINDOW_MS =
  10 * 60 * 1000;

/*
 * Untouched recommendations currently receive
 * the neutral/default label 0.2.
 *
 * Keep enough neutral examples to teach the
 * model what "no engagement" looks like, but
 * stop them from overwhelming explicit signals.
 */
const NEUTRAL_LABEL = 0.2;
const MAX_NEUTRAL_TO_SIGNAL_RATIO = 2;
const MIN_NEUTRAL_ROWS = 40;

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

function getImpressionSignature(
  impression: {
    movieId: number;
    matchScore: number;
    tmdbRating: number;
    mementoRating?: number | null;
    mementoRatingCount?: number;
    international?: boolean;
    obscurityScore?: number;
    watchedCount?: number;
    experienceScore?: number;
    recommendationStyle?: string;
    genreAffinity?: number;
    seededSimilarity?: number;
    qualityScore?: number;
    popularityScore?: number;
    voteStrength?: number;
    sourceFavourite?: boolean;
    sourceGenre?: boolean;
    sourceInternational?: boolean;
    sourceObscure?: boolean;
  },
) {
  return [
    impression.movieId,
    impression.matchScore,
    impression.tmdbRating,
    impression.mementoRating ?? 0,
    impression.mementoRatingCount ?? 0,
    impression.international ? 1 : 0,
    impression.obscurityScore ?? 0,
    impression.watchedCount ?? 0,
    impression.experienceScore ?? 0,
    impression.recommendationStyle ??
      "balanced",
    impression.genreAffinity ?? 0,
    impression.seededSimilarity ?? 0,
    impression.qualityScore ?? 0,
    impression.popularityScore ?? 0,
    impression.voteStrength ?? 0,
    impression.sourceFavourite ? 1 : 0,
    impression.sourceGenre ? 1 : 0,
    impression.sourceInternational
      ? 1
      : 0,
    impression.sourceObscure ? 1 : 0,
  ].join("|");
}


function isLegacyImpression(
  impression: {
    genreAffinity?: number;
    seededSimilarity?: number;
    qualityScore?: number;
    popularityScore?: number;
    voteStrength?: number;
    sourceFavourite?: boolean;
    sourceGenre?: boolean;
    sourceInternational?: boolean;
    sourceObscure?: boolean;
  },
) {
  /*
   * Legacy impressions were created before
   * the richer ML feature set existed.
   *
   * Important: we check whether ALL richer
   * fields are missing, not whether they are
   * equal to zero. Zero is a valid value for
   * several of these features.
   */
  return (
    impression.genreAffinity ===
      undefined &&
    impression.seededSimilarity ===
      undefined &&
    impression.qualityScore ===
      undefined &&
    impression.popularityScore ===
      undefined &&
    impression.voteStrength ===
      undefined &&
    impression.sourceFavourite ===
      undefined &&
    impression.sourceGenre ===
      undefined &&
    impression.sourceInternational ===
      undefined &&
    impression.sourceObscure ===
      undefined
  );
}


function getSampleWeight({
  label,
  opened,
  markedSeen,
  watchlisted,
  liked,
  favourite,
  userRating,
  notInterested,
}: {
  label: number;
  opened: boolean;
  markedSeen: boolean;
  watchlisted: boolean;
  liked: boolean;
  favourite: boolean;
  userRating: number;
  notInterested: boolean;
}) {
  /*
   * Confidence in the training target.
   *
   * Explicit actions receive high weight.
   * Passive "shown but untouched" examples
   * remain useful, but are deliberately weak
   * evidence rather than hard negatives.
   */
  if (notInterested) {
    return 1;
  }

  if (
    favourite ||
    liked ||
    userRating > 0
  ) {
    return 1;
  }

  if (watchlisted) {
    return 1;
  }

  if (markedSeen) {
    return 0.75;
  }

  if (opened) {
    return 0.5;
  }

  if (label === NEUTRAL_LABEL) {
    return 0.2;
  }

  return 0.5;
}

export async function GET() {
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

    await connectDB();

    const [
      impressions,
      feedback,
      interactions,
      user,
    ] = await Promise.all([
      RecommendationImpression.find({
        userId: currentUser.id,
      })
        .sort({
          createdAt: -1,
        })
        .lean(),

      RecommendationFeedback.find({
        userId: currentUser.id,
      }).lean(),

      MovieInteraction.find({
        userId: currentUser.id,
      }).lean(),

      User.findById(
        currentUser.id,
      )
        .select(
          "favouriteMovies preferredGenreIds settings",
        )
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        },
      );
    }


    /*
     * --------------------------------
     * REMOVE LEGACY IMPRESSIONS
     * --------------------------------
     *
     * Older rows were recorded before the
     * richer recommendation-time feature set
     * existed. Letting `?? 0` convert those
     * missing fields into zero would make
     * "unknown" indistinguishable from a real
     * zero-valued feature.
     *
     * Keep the raw MongoDB records intact;
     * filter them only for ML dataset export.
     */

    const modernImpressions =
      impressions.filter(
        (impression) =>
          !isLegacyImpression(
            impression,
          ),
      );

    const legacyRemoved =
      impressions.length -
      modernImpressions.length;

    /*
     * --------------------------------
     * DEDUPLICATE IMPRESSIONS
     * --------------------------------
     *
     * Raw MongoDB impressions are kept.
     * We only collapse repeated exposure
     * noise while building ML training data.
     *
     * Position is deliberately excluded
     * from the signature because a refresh
     * can move the same candidate slightly
     * without making it a meaningfully new
     * recommendation example.
     */

    const deduplicatedImpressions:
      typeof impressions = [];

    const lastSeenBySignature =
      new Map<string, number>();

    for (const impression of
      modernImpressions) {
      const signature =
        getImpressionSignature(
          impression,
        );

      const timestamp =
        new Date(
          impression.createdAt,
        ).getTime();

      if (
        !Number.isFinite(
          timestamp,
        )
      ) {
        deduplicatedImpressions.push(
          impression,
        );

        continue;
      }

      const newestTimestamp =
        lastSeenBySignature.get(
          signature,
        );

      /*
       * Impressions are sorted newest-first.
       * Keep the newest representative row
       * and skip identical older rows inside
       * the 10-minute dedupe window.
       */
      if (
        newestTimestamp !==
          undefined &&
        newestTimestamp -
          timestamp <
          DEDUPE_WINDOW_MS
      ) {
        continue;
      }

      lastSeenBySignature.set(
        signature,
        timestamp,
      );

      deduplicatedImpressions.push(
        impression,
      );
    }

    /*
     * --------------------------------
     * FEEDBACK LOOKUP
     * --------------------------------
     */

    const feedbackByMovie =
      new Map<
        number,
        Set<string>
      >();

    for (const item of feedback) {
      const current =
        feedbackByMovie.get(
          item.movieId,
        ) ??
        new Set<string>();

      current.add(
        item.action,
      );

      feedbackByMovie.set(
        item.movieId,
        current,
      );
    }

    /*
     * --------------------------------
     * INTERACTION LOOKUP
     * --------------------------------
     */

    const interactionByMovie =
      new Map(
        interactions.map(
          (interaction) => [
            interaction.movieId,
            interaction,
          ],
        ),
      );

    const favouriteIds =
      new Set(
        (
          user.favouriteMovies ??
          []
        ).map(
          (movie) =>
            movie.movieId,
        ),
      );

    /*
     * --------------------------------
     * DATASET
     * --------------------------------
     */

    const rows =
      deduplicatedImpressions.map(
        (impression) => {
          const actions =
            feedbackByMovie.get(
              impression.movieId,
            ) ??
            new Set<string>();

          const interaction =
            interactionByMovie.get(
              impression.movieId,
            );

          const favourite =
            favouriteIds.has(
              impression.movieId,
            );

          /*
           * --------------------------------
           * TARGET LABEL
           * --------------------------------
           *
           * Strongest known positive signal
           * wins, except explicit rejection.
           */

          let label = 0.2;

          if (
            actions.has(
              "not_interested",
            )
          ) {
            label = 0;
          } else {
            if (
              actions.has(
                "opened",
              )
            ) {
              label = Math.max(
                label,
                0.5,
              );
            }

            if (
              actions.has(
                "seen",
              )
            ) {
              label = Math.max(
                label,
                0.6,
              );
            }

            if (
              interaction?.watchlisted
            ) {
              label = Math.max(
                label,
                0.7,
              );
            }

            if (
              interaction?.liked
            ) {
              label = Math.max(
                label,
                0.85,
              );
            }

            if (
              interaction?.rating !=
              null
            ) {
              const ratingLabel =
                clamp(
                  interaction.rating /
                    5,
                  0,
                  1,
                );

              label = Math.max(
                label,
                ratingLabel,
              );
            }

            if (favourite) {
              label = 1;
            }
          }

          const opened =
            actions.has(
              "opened",
            );

          const markedSeen =
            actions.has(
              "seen",
            );

          const notInterested =
            actions.has(
              "not_interested",
            );

          const liked =
            Boolean(
              interaction?.liked,
            );

          const watchlisted =
            Boolean(
              interaction?.watchlisted,
            );

          const userRating =
            interaction?.rating ??
            0;

          const sampleWeight =
            getSampleWeight({
              label,
              opened,
              markedSeen,
              watchlisted,
              liked,
              favourite,
              userRating,
              notInterested,
            });

          return {
            /*
             * --------------------------------
             * IDENTIFIERS / ANALYSIS
             * --------------------------------
             *
             * position is stored for exposure
             * analysis only and must NOT be
             * included in prepare_features().
             */

            movieId:
              impression.movieId,

            position:
              impression.position,

            /*
             * --------------------------------
             * PRE-RECOMMENDATION FEATURES
             * --------------------------------
             */

            matchScore:
              impression.matchScore,

            tmdbRating:
              impression.tmdbRating,

            mementoRating:
              impression.mementoRating ??
              0,

            mementoRatingCount:
              impression.mementoRatingCount ??
              0,

            international:
              impression.international
                ? 1
                : 0,

            obscurityScore:
              impression.obscurityScore ??
              0,

            watchedCount:
              impression.watchedCount ??
              0,

            experienceScore:
              impression.experienceScore ??
              0,

            recommendationStyle:
              impression.recommendationStyle ??
              "balanced",

            genreAffinity:
              impression.genreAffinity ??
              0,

            seededSimilarity:
              impression.seededSimilarity ??
              0,

            qualityScore:
              impression.qualityScore ??
              0,

            popularityScore:
              impression.popularityScore ??
              0,

            voteStrength:
              impression.voteStrength ??
              0,

            sourceFavourite:
              impression.sourceFavourite
                ? 1
                : 0,

            sourceGenre:
              impression.sourceGenre
                ? 1
                : 0,

            sourceInternational:
              impression.sourceInternational
                ? 1
                : 0,

            sourceObscure:
              impression.sourceObscure
                ? 1
                : 0,

            /*
             * --------------------------------
             * POST-RECOMMENDATION OUTCOMES
             * --------------------------------
             *
             * Keep for label construction and
             * analysis, but NEVER include them
             * in the model feature matrix.
             */

            alreadyWatched:
              interaction?.watched
                ? 1
                : 0,

            liked:
              liked ? 1 : 0,

            watchlisted:
              watchlisted ? 1 : 0,

            userRating,

            favourite:
              favourite
                ? 1
                : 0,

            opened:
              opened ? 1 : 0,

            markedSeen:
              markedSeen ? 1 : 0,

            notInterested:
              notInterested
                ? 1
                : 0,

            label,

            /*
             * Confidence supplied separately
             * to the ML trainer through
             * RandomForestRegressor.fit(
             *   ...,
             *   sample_weight=...
             * )
             */
            sampleWeight,

            shownAt:
              impression.createdAt,
          };
        },
      );

    /*
     * --------------------------------
     * LABEL DIAGNOSTICS
     * --------------------------------
     */

    const labelDistribution =
      rows.reduce<
        Record<string, number>
      >((distribution, row) => {
        const key =
          String(row.label);

        distribution[key] =
          (distribution[key] ?? 0) +
          1;

        return distribution;
      }, {});

    /*
     * --------------------------------
     * BALANCE NEUTRAL ROWS
     * --------------------------------
     *
     * Default 0.2 rows are useful, but a
     * large majority of untouched cards can
     * drown out explicit user feedback.
     *
     * Preserve every non-neutral row.
     * Keep at most 2 neutral rows per signal
     * row, with a floor of 40 neutral rows
     * while enough neutral data exists.
     *
     * Rows are already newest-first because
     * impressions were queried that way, so
     * slicing also prefers the freshest
     * neutral examples.
     */

    const signalRows =
      rows.filter(
        (row) =>
          row.label !==
          NEUTRAL_LABEL,
      );

    const neutralRows =
      rows.filter(
        (row) =>
          row.label ===
          NEUTRAL_LABEL,
      );

    const neutralLimit =
      signalRows.length > 0
        ? Math.min(
            neutralRows.length,
            Math.max(
              MIN_NEUTRAL_ROWS,
              signalRows.length *
                MAX_NEUTRAL_TO_SIGNAL_RATIO,
            ),
          )
        : Math.min(
            neutralRows.length,
            MIN_NEUTRAL_ROWS,
          );

    const keptNeutralRows =
      neutralRows.slice(
        0,
        neutralLimit,
      );

    /*
     * Re-sort after combining the two groups
     * so exported training rows retain their
     * original newest-first chronology.
     */
    const balancedRows = [
      ...signalRows,
      ...keptNeutralRows,
    ].sort(
      (a, b) =>
        new Date(
          b.shownAt,
        ).getTime() -
        new Date(
          a.shownAt,
        ).getTime(),
    );

    const balancedLabelDistribution =
      balancedRows.reduce<
        Record<string, number>
      >((distribution, row) => {
        const key =
          String(row.label);

        distribution[key] =
          (distribution[key] ?? 0) +
          1;

        return distribution;
      }, {});

    const sampleWeightDistribution =
      balancedRows.reduce<
        Record<string, number>
      >((distribution, row) => {
        const key =
          String(
            row.sampleWeight,
          );

        distribution[key] =
          (distribution[key] ?? 0) +
          1;

        return distribution;
      }, {});

    return NextResponse.json({
      success: true,

      rawCount:
        impressions.length,

      legacyRemoved,

      afterLegacyFilter:
        modernImpressions.length,

      afterDeduplication:
        rows.length,

      removedDuplicates:
        modernImpressions.length -
        rows.length,

      dedupeWindowMinutes:
        DEDUPE_WINDOW_MS /
        60_000,

      labelDistribution,

      balancing: {
        neutralLabel:
          NEUTRAL_LABEL,

        signalRows:
          signalRows.length,

        neutralRowsBefore:
          neutralRows.length,

        neutralRowsKept:
          keptNeutralRows.length,

        neutralRowsRemoved:
          neutralRows.length -
          keptNeutralRows.length,

        maxNeutralToSignalRatio:
          MAX_NEUTRAL_TO_SIGNAL_RATIO,

        minimumNeutralRows:
          MIN_NEUTRAL_ROWS,
      },

      balancedLabelDistribution,

      sampleWeightDistribution,

      count:
        balancedRows.length,

      rows:
        balancedRows,
    });
  } catch (error) {
    console.error(
      "Could not build recommendation dataset:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not build recommendation dataset.",
      },
      {
        status: 500,
      },
    );
  }
}