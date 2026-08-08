import type { Metadata } from "next";

import { DiaryClient } from "@/components/diary/diary-client";

export const metadata: Metadata = {
  title: "Diary",
  description:
    "Your personal movie diary, ratings, reviews, and rewatches.",
};

export default function DiaryPage() {
  return <DiaryClient />;
}