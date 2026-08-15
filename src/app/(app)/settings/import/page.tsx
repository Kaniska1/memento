import type { Metadata } from "next";

import { LetterboxdImport } from "@/components/import/letterboxd-import";

export const metadata: Metadata = {
  title: "Import Letterboxd",
  description:
    "Import your Letterboxd watch history, ratings, diary, likes, watchlist and lists into Memento.",
};

export default function LetterboxdImportPage() {
  return <LetterboxdImport />;
}