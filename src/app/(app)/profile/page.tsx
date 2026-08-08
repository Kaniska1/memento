import type { Metadata } from "next";

import { ProfileClient } from "@/components/profile/profile-client";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Your Memento film profile, favourites, stats, and Taste DNA.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}