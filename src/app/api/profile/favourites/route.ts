import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { profileFavouritesSchema } from "@/lib/validations/profile-favourites";
import User from "@/models/User";

export const runtime = "nodejs";

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
      .select("favouriteMovies")
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

    return NextResponse.json({
      success: true,

      movies:
        user.favouriteMovies ?? [],
    });
  } catch (error) {
    console.error(
      "Could not load favourites:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load your favourite films.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authenticated.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    console.log("========== FAVOURITES DEBUG ==========");
    console.log("USER ID:", currentUser.id);
    console.log("RAW BODY:", JSON.stringify(body, null, 2));

    const parsed =
      profileFavouritesSchema.safeParse(body);

    if (!parsed.success) {
      console.log(
        "VALIDATION ERROR:",
        parsed.error.flatten(),
      );

      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    console.log(
      "PARSED MOVIES:",
      JSON.stringify(
        parsed.data.movies,
        null,
        2,
      ),
    );

    await connectDB();

    // Check user BEFORE update
    const before = await User.findById(
      currentUser.id,
    );

    console.log(
      "USER BEFORE:",
      JSON.stringify(
        before?.toObject(),
        null,
        2,
      ),
    );

    if (!before) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    // Assign directly instead of findByIdAndUpdate
    (before as any).favouriteMovies =
      parsed.data.movies;

    console.log(
      "AFTER ASSIGNMENT:",
      JSON.stringify(
        before.favouriteMovies,
        null,
        2,
      ),
    );

    await before.save();

    // Fetch fresh copy from MongoDB
    const after = await User.findById(
      currentUser.id,
    ).lean();

    console.log(
      "USER AFTER SAVE:",
      JSON.stringify(after, null, 2),
    );

    console.log(
      "======================================",
    );

    return NextResponse.json({
      success: true,

      debug: {
        receivedMovies:
          parsed.data.movies.length,

        savedMovies:
          after?.favouriteMovies?.length ??
          0,
      },

      movies:
        after?.favouriteMovies ?? [],
    });
  } catch (error) {
    console.error(
      "FAVOURITES PUT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      { status: 500 },
    );
  }
}