"use client";

import { useState } from "react";
import { Eye, TriangleAlert } from "lucide-react";

type SpoilerReviewProps = {
  review: string;
  containsSpoilers: boolean;
};

export function SpoilerReview({
  review,
  containsSpoilers,
}: SpoilerReviewProps) {
  const [revealed, setRevealed] = useState(false);

  if (!review) {
    return null;
  }

  if (!containsSpoilers || revealed) {
    return (
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/55">
        {review}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="mt-4 flex w-full items-center gap-3 rounded-xl border border-[#6D001A]/40 bg-[#160006] p-4 text-left"
    >
      <TriangleAlert className="size-4 shrink-0 text-[#A51636]" />

      <div>
        <p className="text-sm font-medium text-white">
          This review contains spoilers
        </p>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
          <Eye className="size-3" />
          Click to reveal
        </p>
      </div>
    </button>
  );
}