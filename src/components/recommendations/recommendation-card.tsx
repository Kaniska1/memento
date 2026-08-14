"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Check,
  EyeOff,
  LoaderCircle,
  Sparkles,
  Star,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  removeRecommendationFeedback,
  saveRecommendationFeedback,
} from "@/lib/api/recommendation-feedback";

import type {
  RecommendedMovie,
} from "@/types/recommendation";

type RecommendationCardProps = {
  movie: RecommendedMovie;

  onImpression?: (
    movie: RecommendedMovie,
  ) => void;
};

type Feedback =
  | "seen"
  | "not_interested"
  | null;

export function RecommendationCard({
  movie,
  onImpression,
}: RecommendationCardProps) {
  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const [
    isSavingFeedback,
    setIsSavingFeedback,
  ] = useState(false);

  const cardRef =
    useRef<HTMLElement>(null);

  const impressionRecorded =
    useRef(false);

  useEffect(() => {
    const element =
      cardRef.current;

    if (
      !element ||
      !onImpression
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry =
            entries[0];

          if (
            !entry ||
            !entry.isIntersecting ||
            entry.intersectionRatio <
              0.5 ||
            impressionRecorded.current
          ) {
            return;
          }

          impressionRecorded.current =
            true;

          onImpression(movie);

          observer.disconnect();
        },
        {
          threshold: 0.5,
        },
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [
    movie,
    onImpression,
  ]);

  async function handleFeedback(
    nextFeedback: Exclude<
      Feedback,
      null
    >,
  ) {
    if (isSavingFeedback) {
      return;
    }

    setIsSavingFeedback(true);

    try {
      if (
        feedback ===
        nextFeedback
      ) {
        await removeRecommendationFeedback(
          movie.id,
          nextFeedback,
        );

        setFeedback(null);

        return;
      }

      if (feedback) {
        await removeRecommendationFeedback(
          movie.id,
          feedback,
        );
      }

      await saveRecommendationFeedback(
        movie,
        nextFeedback,
      );

      setFeedback(
        nextFeedback,
      );
    } catch (error) {
      console.error(
        "Could not update recommendation feedback:",
        error,
      );
    } finally {
      setIsSavingFeedback(false);
    }
  }

  async function handleOpen() {
    try {
      await saveRecommendationFeedback(
        movie,
        "opened",
      );
    } catch (error) {
      console.error(
        "Could not record recommendation open:",
        error,
      );
    }
  }

  return (
    <article
      ref={cardRef}
      className="group min-w-0"
    >
      <Link
        href={`/movies/${movie.id}`}
        className="block"
        onClick={() => {
          void handleOpen();
        }}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#080808]">
          <Image
            src={movie.poster}
            alt={`${movie.title} poster`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, 20vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/15" />
{/*
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#6D001A]/70 bg-[#6D001A]/85 px-2.5 py-1 backdrop-blur-md">
            <Sparkles className="size-3 text-white" />

            <span className="text-[10px] font-semibold text-white">
              {movie.matchScore}%
            </span>
          </div>
          */}

          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="truncate text-sm font-medium text-white">
              {movie.title}
            </p>

            <div className="mt-1 flex items-center gap-2 text-xs text-white/45">
              <span>
                {movie.year}
              </span>

              <span>·</span>

              <span className="truncate">
                {movie.genre}
              </span>

              <span className="ml-auto flex shrink-0 items-center gap-1 text-white/70">
                <Star className="size-3 fill-[#A51636] text-[#A51636]" />

                {movie.rating.toFixed(
                  1,
                )}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-3">
        <div className="rounded-xl border border-white/10 bg-[#080808] p-3">
          <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#9B1738]">
            Why this film?
          </p>

          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/45">
            {movie.reason}
          </p>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={
              isSavingFeedback
            }
            onClick={() =>
              void handleFeedback(
                "seen",
              )
            }
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
              feedback === "seen"
                ? "border-[#6D001A] bg-[#160006] text-white"
                : "border-white/10 text-white/35 hover:border-white/20 hover:text-white"
            }`}
          >
            {isSavingFeedback &&
            feedback !==
              "not_interested" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}

            Seen
          </button>

          <button
            type="button"
            disabled={
              isSavingFeedback
            }
            onClick={() =>
              void handleFeedback(
                "not_interested",
              )
            }
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
              feedback ===
              "not_interested"
                ? "border-[#6D001A] bg-[#160006] text-white"
                : "border-white/10 text-white/35 hover:border-white/20 hover:text-white"
            }`}
          >
            {isSavingFeedback &&
            feedback !== "seen" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <EyeOff className="size-3.5" />
            )}

            Not for me
          </button>
        </div>
      </div>
    </article>
  );
}