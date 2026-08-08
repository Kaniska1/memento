import type { Metadata } from "next";

import { DiscoverClient } from "@/components/discover/discover-client";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Search and explore movies across genres, years, ratings, and popularity.",
};

export default function DiscoverPage() {
  return <DiscoverClient />;
}