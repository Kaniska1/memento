"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Eye,
  Heart,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

import { StarRating } from "@/components/movies/star-rating";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import {
  createDiaryEntry,
  updateDiaryEntry,
} from "@/lib/api/diary";

import { createNotification } from "@/lib/api/notifications";
import type { DiaryEntry } from "@/types/diary";

type LogFilmDialogProps = {
  movieId: number;
  movieTitle: string;
  movieYear?: string;
  moviePoster?: string | null;

  trigger?: React.ReactNode;

  initialEntry?: DiaryEntry | null;
  onSaved?: () => void;

  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function LogFilmDialog({
  movieId,
  movieTitle,
  movieYear,
  moviePoster = null,
  trigger,

  initialEntry = null,
  onSaved,

  controlledOpen,
  onControlledOpenChange,
}: LogFilmDialogProps) {
  const [internalOpen, setInternalOpen] =
    useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const open =
    controlledOpen ?? internalOpen;

  function setOpen(nextOpen: boolean) {
    if (onControlledOpenChange) {
      onControlledOpenChange(nextOpen);
      return;
    }

    setInternalOpen(nextOpen);
  }

  const [watchedDate, setWatchedDate] =
    useState(getTodayDate());

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [
    containsSpoilers,
    setContainsSpoilers,
  ] = useState(false);

  const [isRewatch, setIsRewatch] =
    useState(false);

  const [liked, setLiked] =
    useState(false);

  function resetForm() {
    setWatchedDate(getTodayDate());
    setRating(0);
    setReview("");
    setContainsSpoilers(false);
    setIsRewatch(false);
    setLiked(false);
    setSaveError("");
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    setSaveError("");

    if (initialEntry) {
      setWatchedDate(initialEntry.watchedDate);
      setRating(initialEntry.rating ?? 0);
      setReview(initialEntry.review);
      setContainsSpoilers(
        initialEntry.containsSpoilers,
      );
      setIsRewatch(initialEntry.isRewatch);
      setLiked(initialEntry.liked);

      return;
    }

    resetForm();
  }, [open, initialEntry]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      if (initialEntry) {
        await updateDiaryEntry(
          initialEntry.id,
          {
            movieYear,
            poster: moviePoster,
            watchedDate,
            rating:
              rating > 0
                ? rating
                : null,
            review: review.trim(),
            containsSpoilers,
            isRewatch,
            liked,
          },
        );

        try {
  await createNotification({
    type: "diary",
    title: "Film logged",
    message: `You logged ${movieTitle}.`,
    href: "/diary",
  });
} catch (error) {
  console.error(
    "Could not create notification:",
    error,
  );
}
      } else {
        await createDiaryEntry({
          movieId,
          movieTitle,
          movieYear,
          poster: moviePoster,

          watchedDate,

          rating:
            rating > 0
              ? rating
              : null,

          review: review.trim(),

          containsSpoilers,
          isRewatch,
          liked,

          // API generates the real values.
        });

        try {
  await createNotification({
    type: "diary",
    title: "Film logged",
    message: `You logged ${movieTitle}.`,
    href: "/diary",
  });
} catch (error) {
  console.error(
    "Could not create notification:",
    error,
  );
}
      }

      window.dispatchEvent(
        new CustomEvent(
          "memento:diary-updated",
        ),
      );

      onSaved?.();

      setOpen(false);

      if (!initialEntry) {
        resetForm();
      }
    } catch (error) {
      console.error(
        "Could not save diary entry:",
        error,
      );

      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save this diary entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenChange(
    nextOpen: boolean,
  ) {
    if (isSaving) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen && !initialEntry) {
      resetForm();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}

      {!trigger &&
        controlledOpen === undefined && (
          <DialogTrigger asChild>
            <Button className="bg-[#6D001A] text-white hover:bg-[#850522]">
              <Eye className="mr-2 size-4" />
              Log film
            </Button>
          </DialogTrigger>
        )}

      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#080808] p-0 text-white sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-white/10 px-6 py-5 sm:px-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold tracking-[-0.035em] text-white">
                {initialEntry
                  ? `Edit ${movieTitle}`
                  : `Log ${movieTitle}`}
              </DialogTitle>

              <DialogDescription className="text-white/40">
                {initialEntry
                  ? "Update this diary entry, rating, and review."
                  : "Add this film to your diary and record how it felt this time."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-7 px-6 py-6 sm:px-8">
            {/* Date */}
            <div>
              <label
                htmlFor="watched-date"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70"
              >
                <CalendarDays className="size-4 text-white/35" />
                Watched on
              </label>

              <input
                id="watched-date"
                type="date"
                value={watchedDate}
                max={getTodayDate()}
                onChange={(event) =>
                  setWatchedDate(
                    event.target.value,
                  )
                }
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-[#6D001A]"
              />
            </div>

            {/* Rating */}
            <div>
              <p className="text-sm font-medium text-white/70">
                Your rating
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StarRating
                  value={rating}
                  onChange={setRating}
                  size={28}
                />

                <span className="text-sm text-white/35">
                  {rating > 0
                    ? `${rating.toFixed(1)} / 5`
                    : "No rating"}
                </span>
              </div>
            </div>

            {/* Review */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="review"
                  className="text-sm font-medium text-white/70"
                >
                  Review or comment
                </label>

                <span className="text-xs text-white/25">
                  {review.length}/5000
                </span>
              </div>

              <Textarea
                id="review"
                value={review}
                onChange={(event) =>
                  setReview(
                    event.target.value.slice(
                      0,
                      5000,
                    ),
                  )
                }
                placeholder="What did you think? What stayed with you?"
                className="min-h-36 resize-none border-white/10 bg-black text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
              />
            </div>

            {/* Options */}
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                aria-pressed={containsSpoilers}
                onClick={() =>
                  setContainsSpoilers(
                    (current) => !current,
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  containsSpoilers
                    ? "border-[#6D001A] bg-[#160006]"
                    : "border-white/10 bg-black hover:border-white/20"
                }`}
              >
                <TriangleAlert
                  className={`size-5 ${
                    containsSpoilers
                      ? "text-[#A51636]"
                      : "text-white/35"
                  }`}
                />

                <p className="mt-3 text-sm font-medium text-white">
                  Contains spoilers
                </p>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Hide the review until someone
                  chooses to reveal it.
                </p>
              </button>

              <button
                type="button"
                aria-pressed={isRewatch}
                onClick={() =>
                  setIsRewatch(
                    (current) => !current,
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  isRewatch
                    ? "border-[#6D001A] bg-[#160006]"
                    : "border-white/10 bg-black hover:border-white/20"
                }`}
              >
                <RotateCcw
                  className={`size-5 ${
                    isRewatch
                      ? "text-[#A51636]"
                      : "text-white/35"
                  }`}
                />

                <p className="mt-3 text-sm font-medium text-white">
                  Rewatch
                </p>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Mark this as another viewing
                  rather than your first.
                </p>
              </button>

              <button
                type="button"
                aria-pressed={liked}
                onClick={() =>
                  setLiked(
                    (current) => !current,
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  liked
                    ? "border-[#6D001A] bg-[#160006]"
                    : "border-white/10 bg-black hover:border-white/20"
                }`}
              >
                <Heart
                  className={`size-5 ${
                    liked
                      ? "fill-[#A51636] text-[#A51636]"
                      : "text-white/35"
                  }`}
                />

                <p className="mt-3 text-sm font-medium text-white">
                  Like this film
                </p>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Add it to the films you
                  personally love.
                </p>
              </button>
            </div>

            {saveError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                {saveError}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={() =>
                setOpen(false)
              }
              className="text-white/45 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
            >
              {isSaving && (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              )}

              {isSaving
                ? "Saving..."
                : initialEntry
                  ? "Save changes"
                  : "Save to diary"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}