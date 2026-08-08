import type { Metadata } from "next";

import { RecommendationsClient } from "@/components/recommendations/recommendations-client";

export const metadata: Metadata = {
  title: "For You",
  description:
    "Personalized movie recommendations based on your taste.",
};

export default function RecommendationsPage() {
  return <RecommendationsClient />;
}