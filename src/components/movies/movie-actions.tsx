"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  Check,
  Eye,
  Heart,
  LoaderCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogFilmDialog } from "@/components/movies/log-film-dialog";
import { StarRating } from "@/components/movies/star-rating";

import {
  fetchMovieInteraction,
  updateMovieInteraction,
  type MovieInteraction,
} from "@/lib/api/movie-interaction";

type MovieActionsProps = {
  movieId: number;
  movieTitle: string;
  movieYear: string;
  moviePoster?: string | null;
  movieGenre: string;
};

const emptyInteraction: MovieInteraction = {
  watched: false,
  liked: false,
  watchlisted: false,
  rating: null,
  lastWatchedAt: null,
  logCount: 0,
};

export function MovieActions({
  movieId,
  movieTitle,
  movieYear,
  moviePoster,
  movieGenre,
}: MovieActionsProps) {
  const [interaction, setInteraction] =
    useState<MovieInteraction>(
      emptyInteraction,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadInteraction() {
    try {
      setError("");

      const data =
        await fetchMovieInteraction(
          movieId,
        );

      setInteraction(data);
    } catch (loadError) {
      console.error(
        "Could not load interaction:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your activity.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInteraction();
  }, [movieId]);

  async function patchInteraction(
    changes: Partial<{
      watched: boolean;
      liked: boolean;
      watchlisted: boolean;
      rating: number | null;
      lastWatchedAt: string | null;
    }>,
  ) {
    if (isUpdating) {
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      const normalizedChanges = {
        ...changes,
      };

      // Liking or rating a film is a strong watched signal.
      if (
        changes.liked === true ||
        (
          changes.rating !== undefined &&
          changes.rating !== null &&
          changes.rating > 0
        )
      ) {
        normalizedChanges.watched = true;

        if (!interaction.lastWatchedAt) {
          normalizedChanges.lastWatchedAt =
            new Date().toISOString();
        }
      }

      const updated =
        await updateMovieInteraction(
          movieId,
          {
            movieTitle,
            movieYear,
            poster:
              moviePoster ?? null,
            genre: movieGenre,
            ...normalizedChanges,
          },
        );

      setInteraction(updated);
    } catch (updateError) {
      console.error(
        "Could not update movie:",
        updateError,
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update this movie.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/45 p-5 backdrop-blur-xl">
        <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-5 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>
        <div className="sr-only">
          <LoaderCircle className="animate-spin" />
          Loading your activity...
        </div>
      </div>
    );
  }

  return (
    <aside className="rounded-3xl border border-white/10 bg-black/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
          Your activity
        </p>
        <p className="mt-2 text-sm text-white/35">
          Keep Memento in sync with your taste.
        </p>
      </div>
      {/* Icon actions */}
      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          active={interaction.liked}
          label="Like"
          onClick={() =>
            patchInteraction({
              liked:
                !interaction.liked,
            })
          }
        >
          <Heart
            className={`size-5 ${
              interaction.liked
                ? "fill-current"
                : ""
            }`}
          />
        </ActionButton>

        <ActionButton
          active={interaction.watched}
          label={
            interaction.watched
              ? "Watched"
              : "Watch"
          }
          onClick={() =>
            patchInteraction({
              watched:
                !interaction.watched,

              lastWatchedAt:
                !interaction.watched
                  ? new Date().toISOString()
                  : null,
            })
          }
        >
          <Eye className="size-5" />
        </ActionButton>

        <ActionButton
          active={
            interaction.watchlisted
          }
          label="Watchlist"
          onClick={() =>
            patchInteraction({
              watchlisted:
                !interaction.watchlisted,
            })
          }
        >
          <Bookmark
            className={`size-5 ${
              interaction.watchlisted
                ? "fill-current"
                : ""
            }`}
          />
        </ActionButton>
      </div>

      {/* Rating */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">
            Your rating
          </p>

          {interaction.rating && (
            <span className="text-xs text-white/35">
              {interaction.rating.toFixed(
                1,
              )}{" "}
              / 5
            </span>
          )}
        </div>

        <div className="mt-3">
          <StarRating
            value={
              interaction.rating ?? 0
            }
            onChange={(rating) =>
              patchInteraction({
                rating:
                  rating > 0
                    ? rating
                    : null,
              })
            }
            size={26}
          />
        </div>
      </div>

      {/* Log */}
      <div className="mt-6">
        <LogFilmDialog
          movieId={movieId}
          movieTitle={movieTitle}
          movieYear={movieYear}
          moviePoster={
            moviePoster
          }
          trigger={
            <Button className="h-11 w-full bg-[#6D001A] text-white hover:bg-[#850522]">
              {interaction.logCount >
              0
                ? "Log again"
                : "Log film"}
            </Button>
          }
          onSaved={() => {
            loadInteraction();
          }}
        />
      </div>

      {interaction.logCount > 0 && (
        <p className="mt-3 text-center text-xs text-white/30">
          Logged{" "}
          {interaction.logCount}{" "}
          {interaction.logCount === 1
            ? "time"
            : "times"}
        </p>
      )}

      {interaction.watched && (
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/30">
          <Check className="size-3.5 text-[#9B1738]" />
          In your watched history
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </aside>
  );
}

type ActionButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function ActionButton({
  active,
  label,
  onClick,
  children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={false}
      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-xs transition duration-200 active:scale-[0.98] ${
        active
          ? "border-[#6D001A] bg-[#160006] text-[#B82648]"
          : "border-white/10 bg-black text-white/40 hover:border-white/20 hover:text-white"
      }`}
    >
      {children}

      <span>{label}</span>
    </button>
  );
}