import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  createSessionToken,
  sessionCookie,
} from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { signupSchema } from "@/lib/validations/auth";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please correct the highlighted fields.",
          errors: parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const {
      name,
      username,
      email,
      password,
    } = parsed.data;

    await connectDB();

    const existingUser = await User.findOne({
      $or: [
        {
          email,
        },
        {
          username,
        },
      ],
    })
      .select("email username")
      .lean();

    if (existingUser) {
      const field =
        existingUser.email === email
          ? "email"
          : "username";

      return NextResponse.json(
        {
          success: false,
          message:
            field === "email"
              ? "An account with this email already exists."
              : "This username is already taken.",
          errors: {
            [field]: [
              field === "email"
                ? "Email is already registered."
                : "Username is unavailable.",
            ],
          },
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      username,
      email,
      passwordHash,
    });

    const token = await createSessionToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          onboardingCompleted:
            user.onboardingCompleted,
        },
      },
      {
        status: 201,
      },
    );

    response.cookies.set(
      sessionCookie.name,
      token,
      sessionCookie.options,
    );

    return response;
  } catch (error) {
    console.error("Signup failed:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with those details already exists.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not create your account. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}