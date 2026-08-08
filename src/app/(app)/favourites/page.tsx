import type { Metadata } from "next";

import { FavouritesClient } from "@/components/favourites/favourites-client";

export const metadata: Metadata = {
  title: "Favourites",
  description:
    "The movies you have marked as personal favourites.",
};

export default function FavouritesPage() {
  return <FavouritesClient />;
}