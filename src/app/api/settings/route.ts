import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { updateSettingsSchema } from "@/lib/validations/settings";

import User from "@/models/User";

import {
  defaultSettings,
  type MementoSettings,
} from "@/types/settings";

export const runtime = "nodejs";

function normalizeSettings(
  settings:
    | Partial<MementoSettings>
    | null
    | undefined,
): MementoSettings {
  return {
    streamingProviders:
      settings?.streamingProviders ??
      defaultSettings.streamingProviders,

    hideWatchedFromRecommendations:
      settings
        ?.hideWatchedFromRecommendations ??
      defaultSettings.hideWatchedFromRecommendations,

    prioritizeAvailableMovies:
      settings
        ?.prioritizeAvailableMovies ??
      defaultSettings.prioritizeAvailableMovies,

    includePopularMovies:
      settings?.includePopularMovies ??
      defaultSettings.includePopularMovies,

    allowOlderMovies:
      settings?.allowOlderMovies ??
      defaultSettings.allowOlderMovies,

    blurSpoilersByDefault:
      settings?.blurSpoilersByDefault ??
      defaultSettings.blurSpoilersByDefault,

    defaultRewatchState:
      settings?.defaultRewatchState ??
      defaultSettings.defaultRewatchState,

    diaryPrivacy:
      settings?.diaryPrivacy ??
      defaultSettings.diaryPrivacy,

    recommendationStyle:
      settings?.recommendationStyle ??
      defaultSettings.recommendationStyle,
  };
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

    const user = await User.findById(
      currentUser.id,
    )
      .select("settings")
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    const settings =
      normalizeSettings(
        user.settings as
          | Partial<MementoSettings>
          | undefined,
      );

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Could not load settings:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load settings.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
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

    const body: unknown =
      await request.json();

    const parsed =
      updateSettingsSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid settings.",

          errors:
            parsed.error.flatten()
              .fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const user =
      await User.findByIdAndUpdate(
        currentUser.id,
        {
          $set: {
            settings:
              parsed.data,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .select("settings")
        .lean();

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

    const settings =
      normalizeSettings(
        user.settings as
          | Partial<MementoSettings>
          | undefined,
      );

    return NextResponse.json({
      success: true,

      message:
        "Settings updated.",

      settings,
    });
  } catch (error) {
    console.error(
      "Could not update settings:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not update settings.",
      },
      {
        status: 500,
      },
    );
  }
}