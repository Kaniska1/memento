import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const state = mongoose.connection.readyState;

    return NextResponse.json({
      success: true,
      database: "connected",
      readyState: state,
    });
  } catch (error) {
    console.error("MongoDB health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        database: "disconnected",
        message:
          error instanceof Error
            ? error.message
            : "Could not connect to MongoDB.",
      },
      {
        status: 500,
      },
    );
  }
}