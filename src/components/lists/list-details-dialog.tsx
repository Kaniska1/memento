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
  addListCollaborator,
  removeListCollaborator,
  updateList,
} from "@/lib/api/lists";

import type {
  ListCollaborator,
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

type ListDetailsDialogProps = {
  list: MovieList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListUpdated: () => void | Promise<void>;
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

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [collaborators, setCollaborators] = useState<
    ListCollaborator[]
  >([]);

  const [collaboratorUsername, setCollaboratorUsername] =
    useState("");

  const [collaboratorError, setCollaboratorError] =
    useState("");

  const [
    isAddingCollaborator,
    setIsAddingCollaborator,
  ] = useState(false);

  const [
    removingCollaboratorId,
    setRemovingCollaboratorId,
  ] = useState<string | null>(null);

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
    setSaveError("");

    setCollaboratorUsername("");
    setCollaboratorError("");

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

        const data =
          (await response.json()) as SearchResponse;

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not search for movies.",
          );
        }

        setResults(data.results ?? []);
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
    return movies.some(
      (movie) => movie.movieId === movieId,
    );
  }

  function addMovie(movie: SearchMovie) {
    if (isMovieAdded(movie.id)) {
      return;
    }

    const newMovie: ListMovie = {
      movieId: movie.id,
      title: movie.title,
      year: movie.year,
      poster: movie.poster ?? null,
      genre: movie.genre || "Film",
      position: isRanked
        ? movies.length + 1
        : null,
    };

    setMovies((current) => [
      ...current,
      newMovie,
    ]);
  }

  function removeMovie(movieId: number) {
    setMovies((current) =>
      current
        .filter(
          (movie) =>
            movie.movieId !== movieId,
        )
        .map((movie, index) => ({
          ...movie,

          position: isRanked
            ? index + 1
            : null,
        })),
    );
  }

  function moveMovie(
    index: number,
    direction: -1 | 1,
  ) {
    const nextIndex = index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= movies.length
    ) {
      return;
    }

    const nextMovies = [...movies];

    const [movedMovie] = nextMovies.splice(
      index,
      1,
    );

    nextMovies.splice(
      nextIndex,
      0,
      movedMovie,
    );

    setMovies(
      nextMovies.map(
        (movie, movieIndex) => ({
          ...movie,
          position: movieIndex + 1,
        }),
      ),
    );
  }

  function toggleRanked(checked: boolean) {
    if (!list || !list.isOwner) {
      return;
    }

    setIsRanked(checked);

    setMovies((current) =>
      current.map((movie, index) => ({
        ...movie,

        position: checked
          ? index + 1
          : null,
      })),
    );
  }

  async function handleAddCollaborator() {
    if (
      !list ||
      !list.isOwner ||
      isPublic ||
      isAddingCollaborator
    ) {
      return;
    }

    const username = collaboratorUsername
      .trim()
      .replace(/^@/, "");

    if (!username) {
      return;
    }

    setIsAddingCollaborator(true);
    setCollaboratorError("");

    try {
      const collaborator =
        await addListCollaborator(
          list.id,
          username,
        );

      setCollaborators((current) => [
        ...current,
        collaborator,
      ]);

      setCollaboratorUsername("");

      await onListUpdated();
    } catch (error) {
      setCollaboratorError(
        error instanceof Error
          ? error.message
          : "Could not add collaborator.",
      );
    } finally {
      setIsAddingCollaborator(false);
    }
  }

  async function handleRemoveCollaborator(
    userId: string,
  ) {
    const currentList = list;

    if (
      !currentList ||
      !currentList.isOwner ||
      removingCollaboratorId
    ) {
      return;
    }

    setRemovingCollaboratorId(userId);
    setCollaboratorError("");

    try {
      await removeListCollaborator(
        currentList.id,
        userId,
      );

      setCollaborators((current) =>
        current.filter(
          (collaborator) =>
            collaborator.userId !== userId,
        ),
      );

      await onListUpdated();
    } catch (error) {
      setCollaboratorError(
        error instanceof Error
          ? error.message
          : "Could not remove collaborator.",
      );
    } finally {
      setRemovingCollaboratorId(null);
    }
  }

  async function saveChanges() {
    const trimmedTitle = title.trim();
    const currentList = list;

    if (
      !trimmedTitle ||
      isSaving ||
      !currentList
    ) {
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      /*
       * The backend should enforce these
       * permissions as well.
       *
       * Owners can update everything.
       * Collaborators only submit movies.
       */
      if (list.isOwner) {
        await updateList(currentList.id, {
          title: trimmedTitle,

          description:
            description.trim(),

          isPublic,
          isRanked,

          movies: movies.map(
            (movie, index) => ({
              ...movie,

              position: isRanked
                ? index + 1
                : null,
            }),
          ),
        });

        /*
         * Making a list public removes
         * private collaborators on the
         * backend.
         */
        if (isPublic) {
          setCollaborators([]);
        }
      } else {
        await updateList(currentList.id, {
          movies: movies.map(
            (movie, index) => ({
              ...movie,

              position: isRanked
                ? index + 1
                : null,
            }),
          ),
        });
      }

      setSaved(true);

      await onListUpdated();

      window.setTimeout(() => {
        setSaved(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Could not update list:",
        error,
      );

      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not update this list.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (
          isSaving ||
          isAddingCollaborator ||
          removingCollaboratorId
        ) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#080808] text-white sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold tracking-[-0.04em] text-white">
            {list.isOwner
              ? "Edit list"
              : "Edit shared list"}
          </DialogTitle>

          <DialogDescription className="text-white/40">
            {list.isOwner
              ? "Update the list, manage collaborators, and arrange films."
              : "Add, remove, and arrange films in this shared list."}
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
                  disabled={!list.isOwner}
                  onChange={(event) =>
                    setTitle(
                      event.target.value.slice(
                        0,
                        100,
                      ),
                    )
                  }
                  className="h-11 border-white/10 bg-[#080808] text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                    disabled={!list.isOwner}
                    onCheckedChange={
                      setIsPublic
                    }
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
                    disabled={!list.isOwner}
                    onCheckedChange={
                      toggleRanked
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="edit-list-description"
                  className="text-sm font-medium text-white/70"
                >
                  Description
                </label>

                <span className="text-xs text-white/25">
                  {description.length}/1000
                </span>
              </div>

              <Textarea
                id="edit-list-description"
                value={description}
                disabled={!list.isOwner}
                onChange={(event) =>
                  setDescription(
                    event.target.value.slice(
                      0,
                      1000,
                    ),
                  )
                }
                className="min-h-24 resize-none border-white/10 bg-[#080808] text-white disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {!list.isOwner && (
              <p className="mt-4 text-xs text-white/30">
                Only the owner can change
                the list title, description,
                privacy, or ranking mode.
              </p>
            )}
          </section>

          {/* Collaborators */}
          {!isPublic && (
            <section className="rounded-2xl border border-white/10 bg-black p-5">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9B1738]">
                  Shared list
                </p>

                <h2 className="mt-2 text-sm font-medium text-white">
                  Collaborators
                </h2>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Collaborators can add,
                  remove, and reorder films
                  in this private list.
                </p>
              </div>

              {list.isOwner && (
                <div className="mt-5 flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/25">
                      @
                    </span>

                    <Input
                      value={
                        collaboratorUsername
                      }
                      onChange={(event) => {
                        setCollaboratorUsername(
                          event.target.value.replace(
                            /^@/,
                            "",
                          ),
                        );

                        setCollaboratorError(
                          "",
                        );
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();

                          void handleAddCollaborator();
                        }
                      }}
                      placeholder="username"
                      disabled={
                        isAddingCollaborator
                      }
                      className="h-11 border-white/10 bg-[#080808] pl-8 text-white placeholder:text-white/25"
                    />
                  </div>

                  <Button
                    type="button"
                    disabled={
                      !collaboratorUsername.trim() ||
                      isAddingCollaborator
                    }
                    onClick={() =>
                      void handleAddCollaborator()
                    }
                    className="bg-[#6D001A] text-white hover:bg-[#850522]"
                  >
                    {isAddingCollaborator ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="mr-2 size-4" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              )}

              {collaboratorError && (
                <p className="mt-3 text-sm text-red-300">
                  {collaboratorError}
                </p>
              )}

              {collaborators.length >
              0 ? (
                <div className="mt-5 space-y-2">
                  {collaborators.map(
                    (collaborator) => (
                      <div
                        key={
                          collaborator.userId
                        }
                        className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#080808] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            @
                            {
                              collaborator.username
                            }
                          </p>

                          <p className="mt-0.5 text-[11px] text-white/30">
                            Can edit films
                          </p>
                        </div>

                        {list.isOwner && (
                          <button
                            type="button"
                            disabled={
                              removingCollaboratorId ===
                              collaborator.userId
                            }
                            onClick={() =>
                              void handleRemoveCollaborator(
                                collaborator.userId,
                              )
                            }
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/25 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                            aria-label={`Remove @${collaborator.username}`}
                          >
                            {removingCollaboratorId ===
                            collaborator.userId ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <X className="size-4" />
                            )}
                          </button>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-5 text-xs text-white/25">
                  No collaborators yet.
                </p>
              )}

              {!list.isOwner && (
                <p className="mt-4 border-t border-white/10 pt-4 text-xs text-white/30">
                  Only the list owner can
                  manage collaborators.
                </p>
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
                  setQuery(
                    event.target.value,
                  )
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
                  const selected =
                    isMovieAdded(movie.id);

                  return (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() =>
                        selected
                          ? removeMovie(
                              movie.id,
                            )
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
                          {movie.title}
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          {movie.year} ·{" "}
                          {movie.genre}
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

          {/* Current films */}
          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-white">
                Films in this list
              </h2>

              <span className="text-xs text-white/35">
                {movies.length}{" "}
                {movies.length === 1
                  ? "film"
                  : "films"}
              </span>
            </div>

            {movies.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black px-6 py-14 text-center">
                <p className="text-sm text-white/35">
                  This list contains no
                  films yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {movies.map(
                  (movie, index) => (
                    <article
                      key={movie.movieId}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black p-3"
                    >
                      {isRanked && (
                        <div className="flex w-10 shrink-0 items-center justify-center text-xl font-semibold text-[#9B1738]">
                          {index + 1}
                        </div>
                      )}

                      <Link
                        href={`/movies/${movie.movieId}`}
                        className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg bg-white/5"
                      >
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
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/movies/${movie.movieId}`}
                          className="block truncate text-sm font-medium text-white hover:text-[#A51636]"
                        >
                          {movie.title}
                        </Link>

                        <p className="mt-1 text-xs text-white/35">
                          {movie.year || "—"}{" "}
                          · {movie.genre}
                        </p>
                      </div>

                      {isRanked && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={
                              index === 0
                            }
                            onClick={() =>
                              moveMovie(
                                index,
                                -1,
                              )
                            }
                            className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/35 hover:text-white disabled:opacity-20"
                            aria-label={`Move ${movie.title} up`}
                          >
                            <ArrowUp className="size-4" />
                          </button>

                          <button
                            type="button"
                            disabled={
                              index ===
                              movies.length - 1
                            }
                            onClick={() =>
                              moveMovie(
                                index,
                                1,
                              )
                            }
                            className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/35 hover:text-white disabled:opacity-20"
                            aria-label={`Move ${movie.title} down`}
                          >
                            <ArrowDown className="size-4" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeMovie(
                            movie.movieId,
                          )
                        }
                        className="flex size-8 items-center justify-center rounded-lg text-white/25 hover:bg-red-500/10 hover:text-red-400"
                        aria-label={`Remove ${movie.title}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>

          {saveError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {saveError}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-5">
          <Button
            type="button"
            variant="ghost"
            disabled={
              isSaving ||
              isAddingCollaborator
            }
            onClick={() =>
              onOpenChange(false)
            }
            className="text-white/45 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={
              !title.trim() ||
              isSaving
            }
            onClick={() =>
              void saveChanges()
            }
            className="bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
          >
            {isSaving ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Save className="mr-2 size-4" />
            )}

            {isSaving
              ? "Saving..."
              : saved
                ? "Saved"
                : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}