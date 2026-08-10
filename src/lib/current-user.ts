import { cookies } from "next/headers";

import {
  sessionCookie,
  verifySessionToken,
} from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    sessionCookie.name,
  )?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  await connectDB();

  const user = await User.findById(session.userId)
    .select(
      "name username email bio avatarUrl onboardingCompleted createdAt",
    )
    .lean();

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
  };
}