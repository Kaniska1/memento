import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createSessionToken,
  sessionCookie,
} from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validations/auth";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check your login details.",
          errors: parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const { email, password } = parsed.data;

    await connectDB();

    const user = await User.findOne({
      email,
    }).select(
      "+passwordHash name username email onboardingCompleted",
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        {
          status: 401,
        },
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        {
          status: 401,
        },
      );
    }

    const token = await createSessionToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    const cookieStore = await cookies();

    cookieStore.set(
      sessionCookie.name,
      token,
      sessionCookie.options,
    );

    return NextResponse.json({
      success: true,
      message: "Logged in successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        onboardingCompleted:
          user.onboardingCompleted,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not log you in. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}