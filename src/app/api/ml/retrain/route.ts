import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

type DatasetResponse = {
  success: boolean;
  message?: string;

  rawCount?: number;
  legacyRemoved?: number;
  afterLegacyFilter?: number;
  afterDeduplication?: number;
  removedDuplicates?: number;
  dedupeWindowMinutes?: number;

  labelDistribution?: Record<
    string,
    number
  >;

  balancing?: {
    neutralLabel: number;
    signalRows: number;
    neutralRowsBefore: number;
    neutralRowsKept: number;
    neutralRowsRemoved: number;
    maxNeutralToSignalRatio: number;
    minimumNeutralRows: number;
  };

  balancedLabelDistribution?: Record<
    string,
    number
  >;

  sampleWeightDistribution?: Record<
    string,
    number
  >;

  count?: number;

  rows?: unknown[];
};

type RetrainResponse = {
  success: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;

  currentDatasetRows?: number;
  trainedDatasetRows?: number;
  newRowsSinceTraining?:
    | number
    | null;
  requiredNewRows?: number;

  training?: {
    datasetRows: number;
    featureCount: number;
    mae: number;
    weightedMae: number;
    rmse: number;
    weightedRmse: number;
    r2: number | null;
    weightedR2: number | null;
    modelPath: string;
  };

  dataset?: {
    rows: number;
    rawCount?: number;
    legacyRemoved?: number;
    removedDuplicates?: number;
  };

  featureCount?: number;
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

    const requestUrl =
      new URL(request.url);

    const autoMode =
      requestUrl.searchParams.get(
        "auto",
      ) === "1";

    const mlServiceUrl =
      process.env.ML_SERVICE_URL;

    const retrainSecret =
      process.env.ML_RETRAIN_SECRET;

    if (
      !mlServiceUrl ||
      !retrainSecret
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ML retraining is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Reuse the existing authenticated
     * dataset route rather than duplicating
     * all cleanup / labeling logic here.
     *
     * Forward the current user's cookies so
     * getCurrentUser() works in that route.
     */
    const datasetUrl =
      new URL(
        "/api/ml/recommendation-dataset",
        requestUrl.origin,
      );

    const cookieHeader =
      request.headers.get(
        "cookie",
      );

    const datasetResponse =
      await fetch(
        datasetUrl,
        {
          method: "GET",

          headers:
            cookieHeader
              ? {
                  cookie:
                    cookieHeader,
                }
              : undefined,

          cache: "no-store",
        },
      );

    const dataset =
      (await datasetResponse.json()) as DatasetResponse;

    if (
      !datasetResponse.ok ||
      !dataset.success
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            dataset.message ??
            "Could not build the training dataset.",
        },
        {
          status:
            datasetResponse.status,
        },
      );
    }

    if (
      !dataset.rows ||
      dataset.rows.length < 10
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Not enough cleaned recommendation data to retrain.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Everything from here happens
     * server-to-server. The retraining secret
     * is never exposed to the browser.
     */
    const retrainResponse =
      await fetch(
        `${mlServiceUrl.replace(
          /\/$/,
          "",
        )}/retrain${
          autoMode
            ? "?auto=1"
            : ""
        }`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "X-ML-Retrain-Secret":
              retrainSecret,
          },

          body:
            JSON.stringify(
              dataset,
            ),

          cache: "no-store",
        },
      );

    const retrainResult =
      (await retrainResponse.json()) as RetrainResponse;

    if (
      !retrainResponse.ok ||
      !retrainResult.success
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            retrainResult.message ??
            "ML retraining failed.",

          error:
            retrainResult.error,
        },
        {
          status:
            retrainResponse.status,
        },
      );
    }

    if (
      retrainResult.skipped
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,

        message:
          retrainResult.message ??
          "Automatic retraining is not needed yet.",

        currentDatasetRows:
          retrainResult.currentDatasetRows,

        trainedDatasetRows:
          retrainResult.trainedDatasetRows,

        newRowsSinceTraining:
          retrainResult.newRowsSinceTraining,

        requiredNewRows:
          retrainResult.requiredNewRows,
      });
    }

    return NextResponse.json({
      success: true,
      skipped: false,

      message:
        "Recommendation model retrained and reloaded.",

      dataset: {
        rawCount:
          dataset.rawCount,

        legacyRemoved:
          dataset.legacyRemoved,

        afterLegacyFilter:
          dataset.afterLegacyFilter,

        afterDeduplication:
          dataset.afterDeduplication,

        removedDuplicates:
          dataset.removedDuplicates,

        balancedCount:
          dataset.count,
      },

      training:
        retrainResult.training,

      featureCount:
        retrainResult.featureCount,
    });
  } catch (error) {
    console.error(
      "Could not retrain recommendation model:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Could not retrain the recommendation model.",

        error:
          error instanceof Error
            ? error.message
            : "Unknown error.",
      },
      {
        status: 500,
      },
    );
  }
}