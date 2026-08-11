"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  Globe2,
  ListOrdered,
  ListPlus,
  LoaderCircle,
  Lock,
  Plus,
  Search,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { createList } from "@/lib/api/lists";

import type {
  ListMovie,
  MovieList,
} from "@/types/list";

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

type CreateListDialogProps = {
  trigger?: React.ReactNode;

  onCreated?: (
    list: MovieList,
  ) => void;
};

export function CreateListDialog({
  trigger,
  onCreated,
}: CreateListDialogProps) {
  const [open, setOpen] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [isPublic, setIsPublic] =
    useState(false);

  const [isRanked, setIsRanked] =
    useState(false);

  const [movies, setMovies] =
    useState<ListMovie[]>([]);

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<SearchMovie[]>([]);

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState("");

  useEffect(() => {
    const trimmedQuery =
      query.trim();

    if (
      !open ||
      trimmedQuery.length < 2
    ) {
      setResults([]);
      setSearchError("");
      return;
    }

    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        async () => {
          setIsSearching(true);
          setSearchError("");

          try {
            const response =
              await fetch(
                `/api/tmdb/search?query=${encodeURIComponent(
                  trimmedQuery,
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
                  "Could not search for movies.",
              );
            }

            setResults(
              data.results ?? [],
            );
          } catch (error) {
            if (
              error instanceof
                DOMException &&
              error.name ===
                "AbortError"
            ) {
              return;
            }

            setSearchError(
              error instanceof Error
                ? error.message
                : "Could not search for movies.",
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
        400,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );

      controller.abort();
    };
  }, [query, open]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setIsPublic(false);
    setIsRanked(false);

    setMovies([]);

    setQuery("");
    setResults([]);

    setSearchError("");
    setCreateError("");

    setIsCreating(false);
  }

  function isMovieSelected(
    movieId: number,
  ) {
    return movies.some(
      (movie) =>
        movie.movieId === movieId,
    );
  }

  function addMovie(
    movie: SearchMovie,
  ) {
    if (
      isMovieSelected(movie.id)
    ) {
      return;
    }

    setMovies((current) => [
      ...current,
      {
        movieId: movie.id,

        title: movie.title,
        year: movie.year,

        poster:
          movie.poster ?? null,

        genre:
          movie.genre || "Film",

        position: isRanked
          ? current.length + 1
          : null,
      },
    ]);
  }

  function removeMovie(
    movieId: number,
  ) {
    setMovies((current) =>
      current
        .filter(
          (movie) =>
            movie.movieId !==
            movieId,
        )
        .map(
          (movie, index) => ({
            ...movie,

            position: isRanked
              ? index + 1
              : null,
          }),
        ),
    );
  }

  function toggleRanked(
    checked: boolean,
  ) {
    setIsRanked(checked);

    setMovies((current) =>
      current.map(
        (movie, index) => ({
          ...movie,

          position: checked
            ? index + 1
            : null,
        }),
      ),
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedTitle =
      title.trim();

    if (
      !trimmedTitle ||
      isCreating
    ) {
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const created =
        await createList({
          title: trimmedTitle,

          description:
            description.trim(),

          isPublic,

          isRanked,

          movies:
            movies.map(
              (
                movie,
                index,
              ) => ({
                ...movie,

                position: isRanked
                  ? index + 1
                  : null,
              }),
            ),
        });

      onCreated?.(created);

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(
        "Could not create list:",
        error,
      );

      setCreateError(
        error instanceof Error
          ? error.message
          : "Could not create this list.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isCreating) {
          return;
        }

        setOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-[#6D001A] text-white hover:bg-[#850522]">
            <ListPlus className="mr-2 size-4" />
            Create list
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#080808] text-white sm:max-w-4xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold tracking-[-0.035em] text-white">
              Create a new list
            </DialogTitle>

            <DialogDescription className="text-white/40">
              Add details, choose whether
              the list is ranked, and start
              adding films.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-7 space-y-7">
            {/* Title */}
            <div>
              <label
                htmlFor="list-title"
                className="mb-2 block text-sm font-medium text-white/70"
              >
                List title
              </label>

              <Input
                id="list-title"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value.slice(
                      0,
                      100,
                    ),
                  )
                }
                placeholder="Films for a rainy night"
                required
                className="h-11 border-white/10 bg-black text-white placeholder:text-white/25"
              />
            </div>

            {/* Description */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="list-description"
                  className="text-sm font-medium text-white/70"
                >
                  Description
                </label>

                <span className="text-xs text-white/25">
                  {description.length}/1000
                </span>
              </div>

              <Textarea
                id="list-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value.slice(
                      0,
                      1000,
                    ),
                  )
                }
                placeholder="What connects these films?"
                className="min-h-24 resize-none border-white/10 bg-black text-white placeholder:text-white/25"
              />
            </div>

            {/* Settings */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-black p-4">
                <div className="flex items-start gap-3">
                  {isPublic ? (
                    <Globe2 className="mt-0.5 size-4 text-[#9B1738]" />
                  ) : (
                    <Lock className="mt-0.5 size-4 text-white/35" />
                  )}

                  <div>
                    <p className="text-sm font-medium text-white">
                      Public list
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Anyone will be able
                      to view this list.
                    </p>
                  </div>
                </div>

                <Switch
                  checked={isPublic}
                  onCheckedChange={
                    setIsPublic
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-black p-4">
                <div className="flex items-start gap-3">
                  <ListOrdered
                    className={`mt-0.5 size-4 ${
                      isRanked
                        ? "text-[#9B1738]"
                        : "text-white/35"
                    }`}
                  />

                  <div>
                    <p className="text-sm font-medium text-white">
                      Ranked list
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Films will keep
                      numbered positions.
                    </p>
                  </div>
                </div>

                <Switch
                  checked={isRanked}
                  onCheckedChange={
                    toggleRanked
                  }
                />
              </div>
            </div>

            {/* Films */}
            <section className="rounded-2xl border border-white/10 bg-black p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Add films
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    You can add or reorder
                    more films later.
                  </p>
                </div>

                {movies.length > 0 && (
                  <span className="text-xs text-white/35">
                    {movies.length}{" "}
                    {movies.length === 1
                      ? "film"
                      : "films"}
                  </span>
                )}
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                <Input
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search movies..."
                  className="h-11 border-white/10 bg-[#080808] pl-11 pr-11 text-white placeholder:text-white/25"
                />

                {isSearching && (
                  <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/35" />
                )}
              </div>

              {searchError && (
                <p className="mt-3 text-sm text-red-300">
                  {searchError}
                </p>
              )}

              {results.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {results.map(
                    (movie) => {
                      const selected =
                        isMovieSelected(
                          movie.id,
                        );

                      return (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() =>
                            selected
                              ? removeMovie(
                                  movie.id,
                                )
                              : addMovie(
                                  movie,
                                )
                          }
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-[#6D001A] bg-[#160006]"
                              : "border-white/10 bg-[#080808] hover:border-white/20"
                          }`}
                        >
                          <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
                            {movie.poster ? (
                              <Image
                                src={
                                  movie.poster
                                }
                                alt={`${movie.title} poster`}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-white/25">
                                No poster
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {
                                movie.title
                              }
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                              {
                                movie.year
                              }{" "}
                              ·{" "}
                              {
                                movie.genre
                              }
                            </p>
                          </div>

                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                              selected
                                ? "bg-[#6D001A]"
                                : "border border-white/10"
                            }`}
                          >
                            {selected ? (
                              <Check className="size-4" />
                            ) : (
                              <Plus className="size-4" />
                            )}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              )}

              {/* Selected movies */}
              {movies.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/30">
                    Selected films
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {movies.map(
                      (movie, index) => (
                        <button
                          key={
                            movie.movieId
                          }
                          type="button"
                          onClick={() =>
                            removeMovie(
                              movie.movieId,
                            )
                          }
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-[#080808] px-3 py-1.5 text-xs text-white/55 transition hover:border-red-500/30 hover:text-red-300"
                        >
                          {isRanked && (
                            <span className="text-[#9B1738]">
                              {index + 1}.
                            </span>
                          )}

                          <span className="max-w-40 truncate">
                            {
                              movie.title
                            }
                          </span>

                          <span className="text-white/25">
                            ×
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </section>

            {createError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                {createError}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-5">
            <Button
              type="button"
              variant="ghost"
              disabled={isCreating}
              onClick={() =>
                setOpen(false)
              }
              className="text-white/45 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                !title.trim() ||
                isCreating
              }
              className="bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
            >
              {isCreating && (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              )}

              {isCreating
                ? "Creating..."
                : "Create list"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}