"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
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
      const updated =
        await updateMovieInteraction(
          movieId,
          {
            movieTitle,
            movieYear,
            poster:
              moviePoster ?? null,
            genre: movieGenre,
            ...changes,
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
      <div className="flex min-h-36 items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-[#8E1231]" />
      </div>
    );
  }

  return (
    <div>
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

      {error && (
        <p className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
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
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-xs transition ${
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