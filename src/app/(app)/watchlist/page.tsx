import type { Metadata } from "next";

import { WatchlistClient } from "@/components/watchlist/watchlist-client";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Movies saved to your personal Memento watchlist.",
};

export default function WatchlistPage() {
  return <WatchlistClient />;
}