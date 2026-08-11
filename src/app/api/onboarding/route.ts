import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { onboardingSchema } from "@/lib/validations/onboarding";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
      onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid onboarding data.",
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

    const {
      favouriteMovies,
      preferredGenreIds,
      initialRatings,
    } = parsed.data;

    const user =
      await User.findByIdAndUpdate(
        currentUser.id,
        {
          $set: {
            favouriteMovies,
            preferredGenreIds,
            initialRatings,
            onboardingCompleted: true,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      ).select(
        "favouriteMovies preferredGenreIds initialRatings onboardingCompleted",
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,

      onboarding: {
        favouriteMovies:
          user.favouriteMovies,

        preferredGenreIds:
          user.preferredGenreIds,

        initialRatings:
          user.initialRatings,

        onboardingCompleted:
          user.onboardingCompleted,
      },
    });
  } catch (error) {
    console.error(
      "Could not save onboarding:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not save your taste profile.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authenticated.",
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
      .select(
        "favouriteMovies preferredGenreIds initialRatings onboardingCompleted",
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
  success: true,

  onboarding: {
    favouriteMovies:
      user.favouriteMovies ?? [],

    preferredGenreIds:
      user.preferredGenreIds ?? [],

    initialRatings:
      user.initialRatings ?? [],

    onboardingCompleted:
      user.onboardingCompleted,
  },
});
  } catch (error) {
    console.error(
      "Could not load onboarding:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load your taste profile.",
      },
      {
        status: 500,
      },
    );
  }
}