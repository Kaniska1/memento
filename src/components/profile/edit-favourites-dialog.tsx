"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";

import {
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { updateProfileFavourites } from "@/lib/api/profile-favourites";

import type { ProfileFavouriteMovie } from "@/types/profile";

type SearchMovie = {
  id: number;
  title: string;
  year: string;
  poster: string | null;
  rating: number;
  genre: string;
};

type SearchResponse = {
  results: SearchMovie[];
  message?: string;
};

type EditFavouritesDialogProps = {
  favourites: ProfileFavouriteMovie[];

  onUpdated: (
    favourites: ProfileFavouriteMovie[],
  ) => void;
};

export function EditFavouritesDialog({
  favourites,
  onUpdated,
}: EditFavouritesDialogProps) {
  const [open, setOpen] =
    useState(false);

  const [selected, setSelected] =
    useState<ProfileFavouriteMovie[]>(
      favourites,
    );

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<SearchMovie[]>([]);

  const [isSearching, setIsSearching] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (open) {
      setSelected(favourites);
    }
  }, [open, favourites]);

  useEffect(() => {
    const trimmed =
      query.trim();

    if (
      !open ||
      trimmed.length < 2
    ) {
      setResults([]);
      return;
    }

    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        async () => {
          setIsSearching(true);
          setError("");

          try {
            const response =
              await fetch(
                `/api/tmdb/search?query=${encodeURIComponent(
                  trimmed,
                )}`,
                {
                  signal:
                    controller.signal,
                },
              );

            const data =
              (await response.json()) as SearchResponse;

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Could not search movies.",
              );
            }

            setResults(
              data.results,
            );
          } catch (searchError) {
            if (
              searchError instanceof
                DOMException &&
              searchError.name ===
                "AbortError"
            ) {
              return;
            }

            setError(
              searchError instanceof Error
                ? searchError.message
                : "Could not search movies.",
            );
          } finally {
            if (
              !controller.signal
                .aborted
            ) {
              setIsSearching(false);
            }
          }
        },
        350,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );

      controller.abort();
    };
  }, [query, open]);

  function isSelected(
    movieId: number,
  ) {
    return selected.some(
      (movie) =>
        movie.movieId === movieId,
    );
  }

  function toggleMovie(
    movie: SearchMovie,
  ) {
    if (isSelected(movie.id)) {
      setSelected((current) =>
        current.filter(
          (item) =>
            item.movieId !==
            movie.id,
        ),
      );

      return;
    }

    if (selected.length >= 5) {
      return;
    }

    setSelected((current) => [
      ...current,

      {
        movieId: movie.id,
        title: movie.title,
        year: movie.year,
        poster: movie.poster,
        genre: movie.genre,
      },
    ]);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    try {
      const updated =
        await updateProfileFavourites(
          selected,
        );

      onUpdated(updated);

      setOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save favourites.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-white/10 bg-black text-white hover:bg-white hover:text-black"
        >
          <Pencil className="mr-2 size-4" />

          Edit favourites
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#080808] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            Your favourite films
          </DialogTitle>

          <DialogDescription className="text-white/40">
            Choose up to five films that
            best represent your taste.
          </DialogDescription>
        </DialogHeader>

        {/* Selected */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/70">
              Selected
            </p>

            <span className="text-xs text-white/35">
              {selected.length}/5
            </span>
          </div>

          {selected.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.map(
                (movie) => (
                  <div
                    key={
                      movie.movieId
                    }
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-black py-1.5 pl-2 pr-3"
                  >
                    <div className="relative size-7 overflow-hidden rounded-full">
                      {movie.poster && (
                        <Image
                          src={
                            movie.poster
                          }
                          alt=""
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <span className="max-w-36 truncate text-xs text-white/60">
                      {movie.title}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setSelected(
                          (
                            current,
                          ) =>
                            current.filter(
                              (
                                item,
                              ) =>
                                item.movieId !==
                                movie.movieId,
                            ),
                        )
                      }
                    >
                      <X className="size-3 text-white/30 hover:text-white" />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

          <Input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="Search for a film..."
            className="h-11 border-white/10 bg-black pl-11 pr-11 text-white"
          />

          {isSearching && (
            <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/30" />
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {results.map(
              (movie) => {
                const active =
                  isSelected(
                    movie.id,
                  );

                const disabled =
                  !active &&
                  selected.length >=
                    5;

                return (
                  <button
                    key={movie.id}
                    type="button"
                    disabled={
                      disabled
                    }
                    onClick={() =>
                      toggleMovie(
                        movie,
                      )
                    }
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-[#6D001A] bg-[#160006]"
                        : "border-white/10 bg-black hover:border-white/20"
                    } disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-md bg-white/5">
                      {movie.poster && (
                        <Image
                          src={
                            movie.poster
                          }
                          alt=""
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">
                        {
                          movie.title
                        }
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {movie.year}
                      </p>
                    </div>

                    {active ? (
                      <Check className="size-4 text-[#A51636]" />
                    ) : (
                      <Plus className="size-4 text-white/30" />
                    )}
                  </button>
                );
              },
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3 border-t border-white/10 pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="bg-[#6D001A] text-white hover:bg-[#850522]"
          >
            {isSaving && (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            )}

            Save favourites
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}