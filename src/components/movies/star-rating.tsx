"use client";

import { Star } from "lucide-react";

type StarRatingProps = {
  value: number;
  onChange: (rating: number) => void;
  readonly?: boolean;
  size?: number;
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 26,
}: StarRatingProps) {
  function handleClick(
    event: React.MouseEvent<HTMLButtonElement>,
    star: number,
  ) {
    if (readonly) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const isLeftHalf = clickPosition < rect.width / 2;

    // Left half = x.5, right half = whole star
    const newRating = isLeftHalf ? star - 0.5 : star;

    // Clicking the exact same rating again clears it
    onChange(value === newRating ? 0 : newRating);
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage =
          value >= star
            ? 100
            : value >= star - 0.5
              ? 50
              : 0;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={(event) => handleClick(event, star)}
            aria-label={`Rate ${star - 0.5} or ${star} stars`}
            className="relative p-1 disabled:cursor-default"
          >
            {/* Empty star */}
            <Star
              style={{
                width: size,
                height: size,
              }}
              className="text-white/20"
            />

            {/* Filled star / half-star */}
            {fillPercentage > 0 && (
              <div
                className="pointer-events-none absolute left-1 top-1 overflow-hidden"
                style={{
                  width: `${fillPercentage}%`,
                }}
              >
                <Star
                  style={{
                    width: size,
                    height: size,
                  }}
                  className="fill-[#8E1231] text-[#8E1231]"
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}