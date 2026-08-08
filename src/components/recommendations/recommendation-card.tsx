"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  Check,
  EyeOff,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";

import type { RecommendedMovie } from "@/types/recommendation";

type RecommendationCardProps = {
  movie: RecommendedMovie;
};

type Feedback =
  | "interested"
  | "not-interested"
  | "already-seen"
  | null;

export function RecommendationCard({
  movie,
}: RecommendationCardProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);

  function toggleFeedback(nextFeedback: Feedback) {
    setFeedback((current) =>
      current === nextFeedback ? null : nextFeedback,
    );
  }

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#080808] transition-colors hover:border-white/20">
      <Link
        href={`/movies/${movie.id}`}
        className="relative block aspect-[16/10] overflow-hidden bg-[#090909]"
      >
        {movie.backdrop ? (
          <Image
            src={movie.backdrop}
            alt={`${movie.title} backdrop`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <Image
            src={movie.poster}
            alt={`${movie.title} poster`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-[#6D001A]/70 bg-[#6D001A]/80 px-3 py-1.5 backdrop-blur-md">
          <Sparkles className="size-3 text-white" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            {movie.matchScore}% match
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <h2 className="text-2xl font-semibold tracking-[-0.035em] text-white">
            {movie.title}
          </h2>

          <div className="mt-2 flex items-center gap-3 text-xs text-white/55">
            <span>{movie.year}</span>
            <span className="size-1 rounded-full bg-white/30" />
            <span>{movie.genre}</span>
            <span className="size-1 rounded-full bg-white/30" />

            <span className="flex items-center gap-1 text-white">
              <Star className="size-3 fill-[#8E1231] text-[#8E1231]" />
              {movie.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="rounded-2xl border border-white/10 bg-black p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9B1738]">
            Why this film?
          </p>

          <p className="mt-2 text-sm leading-6 text-white/50">
            {movie.reason}
          </p>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/40">
          {movie.overview || "No overview available."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={() => toggleFeedback("interested")}
            className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-[10px] transition ${
              feedback === "interested"
                ? "border-[#6D001A] bg-[#160006] text-white"
                : "border-white/10 text-white/35 hover:border-white/20 hover:text-white"
            }`}
          >
            <Bookmark
              className={`size-4 ${
                feedback === "interested"
                  ? "fill-current"
                  : ""
              }`}
            />

            Interested
          </button>

          <button
            type="button"
            onClick={() => toggleFeedback("already-seen")}
            className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-[10px] transition ${
              feedback === "already-seen"
                ? "border-[#6D001A] bg-[#160006] text-white"
                : "border-white/10 text-white/35 hover:border-white/20 hover:text-white"
            }`}
          >
            <Check className="size-4" />
            Already seen
          </button>

          <button
            type="button"
            onClick={() =>
              toggleFeedback("not-interested")
            }
            className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-[10px] transition ${
              feedback === "not-interested"
                ? "border-[#6D001A] bg-[#160006] text-white"
                : "border-white/10 text-white/35 hover:border-white/20 hover:text-white"
            }`}
          >
            <EyeOff className="size-4" />
            Not for me
          </button>
        </div>
      </div>
    </article>
  );
}