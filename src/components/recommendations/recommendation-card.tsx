"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Bookmark,
  Check,
  CircleCheckBig,
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
  onImpression?: () => void;
};

type Feedback =
  | "seen"
  | "not_interested"
  | null;

type InteractionResponse = {
  success: boolean;
  message?: string;

  interaction?: {
    watched: boolean;
    liked: boolean;
    watchlisted: boolean;
    rating: number | null;
    lastWatchedAt: string | null;
    logCount: number;
  };
};

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

  const [
    isWatchlisted,
    setIsWatchlisted,
  ] = useState(false);

  const [
    isSavingWatchlist,
    setIsSavingWatchlist,
  ] = useState(false);

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const actionTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const cardRef =
    useRef<HTMLElement | null>(
      null,
    );

  const impressionSent =
    useRef(false);

  /*
   * Count an impression once the card is
   * meaningfully visible to the user.
   */
  useEffect(() => {
    const element =
      cardRef.current;

    if (
      !element ||
      !onImpression ||
      impressionSent.current
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry =
            entries[0];

          if (
            entry?.isIntersecting &&
            entry.intersectionRatio >=
              0.5 &&
            !impressionSent.current
          ) {
            impressionSent.current =
              true;

            onImpression();

            observer.disconnect();
          }
        },
        {
          threshold: [0.5],
        },
      );

    observer.observe(
      element,
    );

    return () => {
      observer.disconnect();
    };
  }, [onImpression]);

  useEffect(() => {
    return () => {
      if (actionTimer.current) {
        clearTimeout(
          actionTimer.current,
        );
      }
    };
  }, []);

  function showActionMessage(
    message: string,
  ) {
    setActionMessage(
      message,
    );

    if (actionTimer.current) {
      clearTimeout(
        actionTimer.current,
      );
    }

    actionTimer.current =
      setTimeout(() => {
        setActionMessage("");
        actionTimer.current =
          null;
      }, 1600);
  }

  async function patchInteraction(
    patch: {
      watched?: boolean;
      watchlisted?: boolean;
      lastWatchedAt?:
        | string
        | null;
    },
  ) {
    const response =
      await fetch(
        `/api/movies/${movie.id}/interaction`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials:
            "include",

          body: JSON.stringify({
            movieTitle:
              movie.title,

            movieYear:
              movie.year,

            poster:
              movie.poster,

            genre:
              movie.genre,

            ...patch,
          }),
        },
      );

    const data =
      (await response.json()) as InteractionResponse;

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          "Could not update this movie.",
      );
    }

    return data.interaction;
  }

  async function handleWatchlist() {
    if (isSavingWatchlist) {
      return;
    }

    const nextWatchlisted =
      !isWatchlisted;

    setIsSavingWatchlist(
      true,
    );

    try {
      const interaction =
        await patchInteraction({
          watchlisted:
            nextWatchlisted,
        });

      const savedWatchlisted =
        interaction?.watchlisted ??
        nextWatchlisted;

      setIsWatchlisted(
        savedWatchlisted,
      );

      showActionMessage(
        savedWatchlisted
          ? "Added to watchlist"
          : "Removed from watchlist",
      );
    } catch (error) {
      console.error(
        "Could not update watchlist:",
        error,
      );
    } finally {
      setIsSavingWatchlist(
        false,
      );
    }
  }

  async function handleFeedback(
    nextFeedback: Exclude<
      Feedback,
      null
    >,
  ) {
    if (isSavingFeedback) {
      return;
    }

    setIsSavingFeedback(
      true,
    );

    try {
      if (
        feedback ===
        nextFeedback
      ) {
        /*
         * Removing recommendation feedback
         * should not silently undo a real
         * watched interaction. Once "Seen"
         * has added the film to Watched, it
         * stays there until the user changes
         * it from the normal movie controls.
         */
        await removeRecommendationFeedback(
          movie.id,
          nextFeedback,
        );

        setFeedback(
          null,
        );

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

      if (
        nextFeedback ===
        "seen"
      ) {
        const interaction =
          await patchInteraction({
            watched: true,

            /*
             * A watched film should no longer
             * remain in "watch later".
             */
            watchlisted:
              false,

            lastWatchedAt:
              new Date().toISOString(),
          });

        setIsWatchlisted(
          interaction?.watchlisted ??
            false,
        );
      }

      setFeedback(
        nextFeedback,
      );

      showActionMessage(
        nextFeedback === "seen"
          ? "Added to watched"
          : "Got it — less like this",
      );
    } catch (error) {
      console.error(
        "Could not update recommendation feedback:",
        error,
      );
    } finally {
      setIsSavingFeedback(
        false,
      );
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
      <div className="relative">
        <Link
          href={`/movies/${movie.id}`}
          className="block"
          onClick={() => {
            void handleOpen();
          }}
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20 group-hover:shadow-[0_18px_50px_rgba(0,0,0,0.34)]">
            <Image
              src={movie.poster}
              alt={`${movie.title} poster`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, 20vw"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/20" />

            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#8E1231]/70 bg-[#5D0017]/85 px-2.5 py-1 shadow-lg backdrop-blur-md">
              <Sparkles className="size-3 text-white" />

              <span className="text-[10px] font-semibold text-white">
                {movie.matchScore}%
              </span>
            </div>

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

        <button
          type="button"
          aria-label={
            isWatchlisted
              ? `Remove ${movie.title} from watchlist`
              : `Add ${movie.title} to watchlist`
          }
          title={
            isWatchlisted
              ? "Remove from watchlist"
              : "Add to watchlist"
          }
          disabled={
            isSavingWatchlist ||
            feedback === "seen"
          }
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            void handleWatchlist();
          }}
          className={`absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isWatchlisted
              ? "border-[#A51636]/80 bg-[#6D001A] text-white"
              : "border-white/15 bg-black/70 text-white/75 hover:border-[#A51636]/70 hover:bg-[#6D001A] hover:text-white"
          }`}
        >
          {isSavingWatchlist ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Bookmark
              className={`size-4 ${
                isWatchlisted
                  ? "fill-current"
                  : ""
              }`}
            />
          )}
        </button>

        {actionMessage && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/85 px-3 py-1.5 text-[10px] font-medium text-white shadow-xl backdrop-blur-md">
              <CircleCheckBig className="size-3.5 text-emerald-400" />
              {actionMessage}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a0a0a] to-[#070707] p-3 transition-colors group-hover:border-white/[0.14]">
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
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
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