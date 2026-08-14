import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";

import RecommendationImpression from "@/models/RecommendationImpression";

export const runtime = "nodejs";

type RecommendationStyle =
  | "familiar"
  | "balanced"
  | "adventurous";

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

  /*
   * ML-ready features.
   */
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
    RecommendationStyle;

  impressions: ImpressionInput[];
};

const recommendationStyles:
  RecommendationStyle[] = [
    "familiar",
    "balanced",
    "adventurous",
  ];

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(value)
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
     * Prevent oversized requests and
     * discard malformed impressions.
     */
    const impressions =
      body.impressions
        .slice(0, 50)
        .filter(
          (
            impression,
          ) =>
            isFiniteNumber(
              impression.movieId,
            ) &&
            isFiniteNumber(
              impression.position,
            ) &&
            impression.position >=
              0 &&
            isFiniteNumber(
              impression.matchScore,
            ) &&
            isFiniteNumber(
              impression.tmdbRating,
            ) &&
            isFiniteNumber(
              impression.mementoRatingCount,
            ) &&
            isFiniteNumber(
              impression.obscurityScore,
            ) &&
            isFiniteNumber(
              impression.genreAffinity,
            ) &&
            isFiniteNumber(
              impression.seededSimilarity,
            ) &&
            isFiniteNumber(
              impression.qualityScore,
            ) &&
            isFiniteNumber(
              impression.popularityScore,
            ) &&
            isFiniteNumber(
              impression.voteStrength,
            ),
        );

    if (
      impressions.length ===
      0
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

    const watchedCount =
      isFiniteNumber(
        body.watchedCount,
      )
        ? Math.max(
            0,
            body.watchedCount,
          )
        : 0;

    const experienceScore =
      isFiniteNumber(
        body.experienceScore,
      )
        ? Math.max(
            0,
            body.experienceScore,
          )
        : 0;

    const recommendationStyle =
      recommendationStyles.includes(
        body.recommendationStyle,
      )
        ? body.recommendationStyle
        : "balanced";

    await connectDB();

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
            isFiniteNumber(
              impression.mementoRating,
            )
              ? impression.mementoRating
              : null,

          mementoRatingCount:
            impression.mementoRatingCount,

          international:
            Boolean(
              impression.international,
            ),

          obscurityScore:
            impression.obscurityScore,

          /*
           * ML features frozen at the
           * moment the recommendation
           * was actually shown.
           */
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
            Boolean(
              impression.sourceFavourite,
            ),

          sourceGenre:
            Boolean(
              impression.sourceGenre,
            ),

          sourceInternational:
            Boolean(
              impression.sourceInternational,
            ),

          sourceObscure:
            Boolean(
              impression.sourceObscure,
            ),

          watchedCount,

          experienceScore,

          recommendationStyle,
        }),
      ),
    );

    return NextResponse.json({
      success: true,

      recorded:
        impressions.length,
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