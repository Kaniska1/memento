"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Globe2,
  ListOrdered,
  LoaderCircle,
  Lock,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  addMovieToList,
  removeMovieFromList,
  updateMovieList,
} from "@/lib/list-storage";

import type {
  ListCollaborator,
  ListMovie,
  MovieList,
} from "@/types/list";

type SearchResponse = {
  results: ListMovie[];
  message?: string;
};

type ListDetailsDialogProps = {
  list: MovieList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListUpdated: () => void;
};

export function ListDetailsDialog({
  list,
  open,
  onOpenChange,
  onListUpdated,
}: ListDetailsDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [movies, setMovies] = useState<ListMovie[]>([]);
  const [collaborators, setCollaborators] = useState<
    ListCollaborator[]
  >([]);

  const [collaboratorInput, setCollaboratorInput] =
    useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ListMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!list || !open) {
      return;
    }

    setTitle(list.title);
    setDescription(list.description);
    setIsPublic(list.isPublic);
    setIsRanked(list.isRanked);
    setMovies(list.movies);
    setCollaborators(list.collaborators ?? []);

    setQuery("");
    setResults([]);
    setSearchError("");
    setCollaboratorInput("");
    setSaved(false);
  }, [list, open]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!open || trimmedQuery.length < 2) {
      setResults([]);
      setSearchError("");
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");

      try {
        const response = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(
            trimmedQuery,
          )}`,
          {
            signal: controller.signal,
          },
        );

        const data = (await response.json()) as SearchResponse;

        if (!response.ok) {
          throw new Error(
            data.message || "Could not search for movies.",
          );
        }

        setResults(data.results);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setSearchError(
          error instanceof Error
            ? error.message
            : "Could not search for movies.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, open]);

  if (!list) {
    return null;
  }

  function isMovieAdded(movieId: number) {
    return movies.some((movie) => movie.id === movieId);
  }

  function addMovie(movie: ListMovie) {
    if (isMovieAdded(movie.id)) {
      return;
    }

    const nextMovies = [...movies, movie].map(
      (item, index) => ({
        ...item,
        position: isRanked ? index + 1 : undefined,
      }),
    );

    setMovies(nextMovies);
  }

  function removeMovie(movieId: number) {
    const nextMovies = movies
      .filter((movie) => movie.id !== movieId)
      .map((movie, index) => ({
        ...movie,
        position: isRanked ? index + 1 : undefined,
      }));

    setMovies(nextMovies);
  }

  function moveMovie(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= movies.length
    ) {
      return;
    }

    const nextMovies = [...movies];
    const [movedMovie] = nextMovies.splice(index, 1);

    nextMovies.splice(nextIndex, 0, movedMovie);

    setMovies(
      nextMovies.map((movie, movieIndex) => ({
        ...movie,
        position: movieIndex + 1,
      })),
    );
  }

  function addCollaborator() {
    const username = collaboratorInput
      .trim()
      .replace(/^@/, "");

    if (!username || isPublic) {
      return;
    }

    const alreadyExists = collaborators.some(
      (collaborator) =>
        collaborator.username.toLowerCase() ===
        username.toLowerCase(),
    );

    if (alreadyExists) {
      return;
    }

    setCollaborators((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: username,
        username,
      },
    ]);

    setCollaboratorInput("");
  }

  function removeCollaborator(collaboratorId: string) {
    setCollaborators((current) =>
      current.filter(
        (collaborator) =>
          collaborator.id !== collaboratorId,
      ),
    );
  }

  function saveChanges() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    updateMovieList({
      ...list,
      title: trimmedTitle,
      description: description.trim(),
      isPublic,
      isRanked,
      collaborators: isPublic ? [] : collaborators,
      movies: movies.map((movie, index) => ({
        ...movie,
        position: isRanked ? index + 1 : undefined,
      })),
    });

    setSaved(true);
    onListUpdated();

    window.setTimeout(() => {
      setSaved(false);
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#080808] text-white sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold tracking-[-0.04em] text-white">
            Edit list
          </DialogTitle>

          <DialogDescription className="text-white/40">
            Update the list, manage collaborators, and arrange
            ranked films.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 space-y-8">
          {/* List details */}
          <section className="rounded-2xl border border-white/10 bg-black p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-list-title"
                  className="mb-2 block text-sm font-medium text-white/70"
                >
                  Title
                </label>

                <Input
                  id="edit-list-title"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value.slice(0, 80),
                    )
                  }
                  className="h-11 border-white/10 bg-[#080808] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#080808] px-4">
                  <div className="flex items-center gap-2">
                    {isPublic ? (
                      <Globe2 className="size-4 text-[#9B1738]" />
                    ) : (
                      <Lock className="size-4 text-white/35" />
                    )}

                    <span className="text-sm text-white/65">
                      Public
                    </span>
                  </div>

                  <Switch
                    checked={isPublic}
                    onCheckedChange={(checked) => {
                      setIsPublic(checked);

                      if (checked) {
                        setCollaborators([]);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#080808] px-4">
                  <div className="flex items-center gap-2">
                    <ListOrdered
                      className={`size-4 ${
                        isRanked
                          ? "text-[#9B1738]"
                          : "text-white/35"
                      }`}
                    />

                    <span className="text-sm text-white/65">
                      Ranked
                    </span>
                  </div>

                  <Switch
                    checked={isRanked}
                    onCheckedChange={(checked) => {
                      setIsRanked(checked);

                      setMovies((current) =>
                        current.map((movie, index) => ({
                          ...movie,
                          position: checked
                            ? index + 1
                            : undefined,
                        })),
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="edit-list-description"
                className="mb-2 block text-sm font-medium text-white/70"
              >
                Description
              </label>

              <Textarea
                id="edit-list-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value.slice(0, 400),
                  )
                }
                className="min-h-24 resize-none border-white/10 bg-[#080808] text-white"
              />
            </div>
          </section>

          {/* Collaborators */}
          {!isPublic && (
            <section className="rounded-2xl border border-white/10 bg-black p-5">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-[#9B1738]" />

                <h2 className="text-sm font-medium text-white">
                  Collaborators
                </h2>
              </div>

              <p className="mt-2 text-xs leading-5 text-white/35">
                These usernames are frontend placeholders until
                account invitations exist.
              </p>

              <div className="mt-4 flex gap-2">
                <Input
                  value={collaboratorInput}
                  onChange={(event) =>
                    setCollaboratorInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCollaborator();
                    }
                  }}
                  placeholder="@username"
                  className="h-10 border-white/10 bg-[#080808] text-white placeholder:text-white/25"
                />

                <Button
                  type="button"
                  disabled={!collaboratorInput.trim()}
                  onClick={addCollaborator}
                  className="bg-[#6D001A] text-white hover:bg-[#850522]"
                >
                  Add
                </Button>
              </div>

              {collaborators.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {collaborators.map((collaborator) => (
                    <span
                      key={collaborator.id}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-[#080808] px-3 py-1.5 text-xs text-white/60"
                    >
                      @{collaborator.username}

                      <button
                        type="button"
                        onClick={() =>
                          removeCollaborator(
                            collaborator.id,
                          )
                        }
                        className="text-white/30 hover:text-white"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Add films */}
          <section className="rounded-2xl border border-white/10 bg-black p-5">
            <h2 className="text-sm font-medium text-white">
              Add films
            </h2>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

              <Input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search for a movie..."
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
                {results.map((movie) => {
                  const selected = isMovieAdded(movie.id);

                  return (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() =>
                        selected
                          ? removeMovie(movie.id)
                          : addMovie(movie)
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
                            src={movie.poster}
                            alt={`${movie.title} poster`}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] text-white/25">
                            No poster
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {movie.title}
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          {movie.year} · {movie.genre}
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
                })}
              </div>
            )}
          </section>

          {/* Current movies */}
          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-white">
                Films in this list
              </h2>

              <span className="text-xs text-white/35">
                {movies.length}{" "}
                {movies.length === 1 ? "film" : "films"}
              </span>
            </div>

            {movies.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black px-6 py-14 text-center">
                <p className="text-sm text-white/35">
                  This list contains no films yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {movies.map((movie, index) => (
                  <article
                    key={movie.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black p-3"
                  >
                    {isRanked && (
                      <div className="flex w-10 shrink-0 items-center justify-center text-xl font-semibold text-[#9B1738]">
                        {index + 1}
                      </div>
                    )}

                    <Link
                      href={`/movies/${movie.id}`}
                      className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg bg-white/5"
                    >
                      {movie.poster ? (
                        <Image
                          src={movie.poster}
                          alt={`${movie.title} poster`}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[9px] text-white/25">
                          No poster
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/movies/${movie.id}`}
                        className="truncate text-sm font-medium text-white hover:text-[#A51636]"
                      >
                        {movie.title}
                      </Link>

                      <p className="mt-1 text-xs text-white/35">
                        {movie.year} · {movie.genre}
                      </p>
                    </div>

                    {isRanked && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            moveMovie(index, -1)
                          }
                          className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/35 hover:text-white disabled:opacity-20"
                        >
                          <ArrowUp className="size-4" />
                        </button>

                        <button
                          type="button"
                          disabled={
                            index === movies.length - 1
                          }
                          onClick={() =>
                            moveMovie(index, 1)
                          }
                          className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/35 hover:text-white disabled:opacity-20"
                        >
                          <ArrowDown className="size-4" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeMovie(movie.id)
                      }
                      className="flex size-8 items-center justify-center rounded-lg text-white/25 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/45 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={!title.trim()}
            onClick={saveChanges}
            className="bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
          >
            {saved ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Save className="mr-2 size-4" />
            )}

            {saved ? "Saved" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}