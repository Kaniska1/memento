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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { createMovieList } from "@/lib/list-storage";

import type {
  ListCollaborator,
  ListMovie,
} from "@/types/list";

type SearchResponse = {
  results: Array<{
    id: number;
    title: string;
    year: string;
    poster: string | null;
    rating: number;
    genre: string;
  }>;
  message?: string;
};

type CreateListDialogProps = {
  trigger?: React.ReactNode;
};

export function CreateListDialog({
  trigger,
}: CreateListDialogProps) {
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isRanked, setIsRanked] = useState(false);

  const [movies, setMovies] = useState<ListMovie[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ListMovie[]>([]);
  const [isSearching, setIsSearching] =
    useState(false);
  const [searchError, setSearchError] = useState("");

  const [collaboratorInput, setCollaboratorInput] =
    useState("");
  const [collaborators, setCollaborators] = useState<
    ListCollaborator[]
  >([]);

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

        const data =
          (await response.json()) as SearchResponse;

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not search for movies.",
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

  function resetForm() {
    setTitle("");
    setDescription("");
    setIsPublic(false);
    setIsRanked(false);
    setMovies([]);
    setQuery("");
    setResults([]);
    setSearchError("");
    setCollaboratorInput("");
    setCollaborators([]);
  }

  function addMovie(movie: ListMovie) {
    if (
      movies.some(
        (existingMovie) =>
          existingMovie.id === movie.id,
      )
    ) {
      return;
    }

    setMovies((current) => [...current, movie]);
  }

  function removeMovie(movieId: number) {
    setMovies((current) =>
      current.filter((movie) => movie.id !== movieId),
    );
  }

  function addCollaborator() {
    const username = collaboratorInput
      .trim()
      .replace(/^@/, "");

    if (!username || isPublic) {
      return;
    }

    if (
      collaborators.some(
        (item) => item.username === username,
      )
    ) {
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

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    createMovieList({
      title: trimmedTitle,
      description: description.trim(),
      isPublic,
      isRanked,
      collaborators: isPublic
        ? []
        : collaborators,
      movies,
    });

    setOpen(false);
    resetForm();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
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
              Add details, choose whether it is ranked,
              and begin adding films immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-7 space-y-7">
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
                    event.target.value.slice(0, 80),
                  )
                }
                placeholder="Films for a rainy night"
                required
                className="h-11 border-white/10 bg-black text-white placeholder:text-white/25"
              />
            </div>

            <div>
              <label
                htmlFor="list-description"
                className="mb-2 block text-sm font-medium text-white/70"
              >
                Description
              </label>

              <Textarea
                id="list-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value.slice(0, 400),
                  )
                }
                placeholder="What connects these films?"
                className="min-h-24 resize-none border-white/10 bg-black text-white placeholder:text-white/25"
              />
            </div>

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
                      Anyone can view this list later.
                    </p>
                  </div>
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
                      Films will have numbered positions.
                    </p>
                  </div>
                </div>

                <Switch
                  checked={isRanked}
                  onCheckedChange={setIsRanked}
                />
              </div>
            </div>

            {!isPublic && (
              <section className="rounded-2xl border border-white/10 bg-black p-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-4 text-[#9B1738]" />

                  <p className="text-sm font-medium text-white">
                    Collaborators
                  </p>
                </div>

                <p className="mt-2 text-xs leading-5 text-white/35">
                  Add usernames who may edit this private
                  list later.
                </p>

                <div className="mt-4 flex gap-2">
                  <Input
                    value={collaboratorInput}
                    onChange={(event) =>
                      setCollaboratorInput(
                        event.target.value,
                      )
                    }
                    placeholder="@username"
                    className="h-10 border-white/10 bg-[#080808] text-white placeholder:text-white/25"
                  />

                  <Button
                    type="button"
                    onClick={addCollaborator}
                    disabled={!collaboratorInput.trim()}
                    className="bg-[#6D001A] text-white hover:bg-[#850522]"
                  >
                    Add
                  </Button>
                </div>

                {collaborators.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {collaborators.map(
                      (collaborator) => (
                        <span
                          key={collaborator.id}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-[#080808] px-3 py-1.5 text-xs text-white/60"
                        >
                          @{collaborator.username}

                          <button
                            type="button"
                            onClick={() =>
                              setCollaborators(
                                (current) =>
                                  current.filter(
                                    (item) =>
                                      item.id !==
                                      collaborator.id,
                                  ),
                              )
                            }
                            className="text-white/30 hover:text-white"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ),
                    )}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-black p-4">
              <p className="text-sm font-medium text-white">
                Add films
              </p>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                <Input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
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
                  {results.map((movie) => {
                    const selected = movies.some(
                      (item) => item.id === movie.id,
                    );

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

              {movies.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-xs text-white/35">
                    {movies.length}{" "}
                    {movies.length === 1
                      ? "film"
                      : "films"}{" "}
                    selected
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-white/45 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!title.trim()}
              className="bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
            >
              Create list
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}