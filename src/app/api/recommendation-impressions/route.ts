import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";

import RecommendationImpression from "@/models/RecommendationImpression";

export const runtime = "nodejs";

const AUTO_RETRAIN_CHECK_EVERY_RAW =
  Number(
    process.env
      .ML_RETRAIN_CHECK_EVERY_RAW ??
      50,
  );

type ImpressionInput = {
  movieId: number;
  position: number;

  matchScore: number;
  tmdbRating: number;

  mementoRating:
    | number
    | null;

  mementoRatingCount: number;

  international: boolean;
  obscurityScore: number;

  genreAffinity: number;
seededSimilarity: number;

qualityScore: number;
popularityScore: number;
voteStrength: number;

sourceFavourite: boolean;
sourceGenre: boolean;
sourceInternational: boolean;
sourceObscure: boolean;
};

type ImpressionRequest = {
  watchedCount: number;
  experienceScore: number;

  recommendationStyle:
    | "familiar"
    | "balanced"
    | "adventurous";

  impressions: ImpressionInput[];
};

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

    const body =
      (await request.json()) as ImpressionRequest;

    if (
      !Array.isArray(
        body.impressions,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid impression data.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Never allow an arbitrary client
     * to dump thousands of records into
     * the database in one request.
     */
    const impressions =
      body.impressions
        .slice(0, 50)
        .filter(
          (impression) =>
            Number.isFinite(
              impression.movieId,
            ) &&
            Number.isFinite(
              impression.position,
            ) &&
            Number.isFinite(
              impression.matchScore,
            ),
        );

    if (
      impressions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid impressions supplied.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const rawCountBefore =
      await RecommendationImpression.countDocuments({
        userId:
          currentUser.id,
      });

    await RecommendationImpression.insertMany(
      impressions.map(
        (impression) => ({
          userId:
            currentUser.id,

          movieId:
            impression.movieId,

          position:
            impression.position,

          matchScore:
            impression.matchScore,

          tmdbRating:
            impression.tmdbRating,

          mementoRating:
            impression.mementoRating,

          mementoRatingCount:
            impression.mementoRatingCount,

          international:
            impression.international,

          obscurityScore:
            impression.obscurityScore,

          genreAffinity:
  impression.genreAffinity,

seededSimilarity:
  impression.seededSimilarity,

qualityScore:
  impression.qualityScore,

popularityScore:
  impression.popularityScore,

voteStrength:
  impression.voteStrength,

sourceFavourite:
  impression.sourceFavourite,

sourceGenre:
  impression.sourceGenre,

sourceInternational:
  impression.sourceInternational,

sourceObscure:
  impression.sourceObscure,

          watchedCount:
            Number.isFinite(
              body.watchedCount,
            )
              ? body.watchedCount
              : 0,

          experienceScore:
            Number.isFinite(
              body.experienceScore,
            )
              ? body.experienceScore
              : 0,

          recommendationStyle:
            body.recommendationStyle ??
            "balanced",
        }),
      ),
    );

    const rawCountAfter =
      rawCountBefore +
      impressions.length;

    const previousBucket =
      Math.floor(
        rawCountBefore /
          AUTO_RETRAIN_CHECK_EVERY_RAW,
      );

    const currentBucket =
      Math.floor(
        rawCountAfter /
          AUTO_RETRAIN_CHECK_EVERY_RAW,
      );

    const crossedRetrainCheck =
      currentBucket >
      previousBucket;

    /*
     * Avoid rebuilding the cleaned dataset
     * after every impression flush. We only
     * ask for an automatic retrain check when
     * another block of raw impressions has
     * accumulated.
     *
     * The retrain endpoint still applies the
     * real threshold using CLEANED/BALANCED
     * dataset rows, so duplicate impressions
     * do not cause unnecessary model updates.
     */
    if (crossedRetrainCheck) {
      try {
        const requestUrl =
          new URL(request.url);

        const cookie =
          request.headers.get(
            "cookie",
          );

        await fetch(
          new URL(
            "/api/ml/retrain?auto=1",
            requestUrl.origin,
          ),
          {
            method: "POST",

            headers:
              cookie
                ? {
                    cookie,
                  }
                : undefined,

            cache:
              "no-store",
          },
        );
      } catch (retrainError) {
        /*
         * Impression recording must never fail
         * just because automatic retraining is
         * temporarily unavailable.
         */
        console.error(
          "Automatic ML retrain check failed:",
          retrainError,
        );
      }
    }

    return NextResponse.json({
      success: true,

      recorded:
        impressions.length,

      rawImpressionCount:
        rawCountAfter,

      automaticRetrainCheck:
        crossedRetrainCheck,
    });
  } catch (error) {
    console.error(
      "Could not record recommendation impressions:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not record recommendation impressions.",
      },
      {
        status: 500,
      },
    );
  }
}