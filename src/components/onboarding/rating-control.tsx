"use client";

import { Star } from "lucide-react";

type RatingControlProps = {
  value?: number;
  onChange: (rating: number) => void;
};

export function RatingControl({
  value = 0,
  onChange,
}: RatingControlProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = value >= star;

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} stars`}
            className="p-0.5"
          >
            <Star
              className={`size-5 transition-colors ${
                active
                  ? "fill-[#8E1231] text-[#8E1231]"
                  : "text-white/20 hover:text-white/50"
              }`}
            />
          </button>
        );
      })}

      {value > 0 && (
        <span className="ml-2 text-xs text-white/45">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}