"use client";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileArchive,
  Film,
  Heart,
  ListVideo,
  LoaderCircle,
  Search,
  SkipForward,
  Star,
  TriangleAlert,
  Upload,
  XCircle,
} from "lucide-react";

import Image from "next/image";

import {
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

type NormalizedFilm = {
  key: string;
  name: string;
  year: string;
  letterboxdUri: string;
  watched: boolean;
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;
  watchedDates: string[];
  diaryEntries: number;
  reviews: number;
  listMemberships: number;
};

type TmdbMovie = {
  id: number;
  title: string;
  year: string;
  poster: string | null;
  backdrop?: string | null;
  genre?: string;
  originalLanguage?: string;
  rating: number;
  voteCount?: number;
};

type ResolvedFilm = {
  key: string;
  letterboxd: {
    name: string;
    year: string;
    uri: string;
  };
  status:
    | "matched"
    | "review"
    | "unmatched";
  confidence:
    | "exact"
    | "high"
    | "medium"
    | "none";
  tmdb: TmdbMovie | null;
  alternatives: TmdbMovie[];
};

type PreviewResponse = {
  success: boolean;
  message?: string;
  preview?: {
    ignoredFiles: string[];
    profile: {
      username: string;
    } | null;
    counts: {
      watched: number;
      ratings: number;
      diary: number;
      reviews: number;
      watchlist: number;
      likedFilms: number;
      lists: number;
      listMovies: number;
      uniqueFilms: number;
    };
    normalizedFilms:
      NormalizedFilm[];
  };
};

const RESOLVE_BATCH_SIZE = 30;

function completeTmdb(
  movie: TmdbMovie,
): Required<
  Pick<
    TmdbMovie,
    | "id"
    | "title"
    | "year"
    | "poster"
    | "rating"
  >
> & {
  backdrop: string | null;
  genre: string;
  originalLanguage: string;
  voteCount: number;
} {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    poster:
      movie.poster ?? null,
    backdrop:
      movie.backdrop ?? null,
    genre:
      movie.genre ?? "Film",
    originalLanguage:
      movie.originalLanguage ?? "",
    rating:
      movie.rating ?? 0,
    voteCount:
      movie.voteCount ?? 0,
  };
}

export function LetterboxdImport() {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [file, setFile] =
    useState<File | null>(
      null,
    );

  const [
    preview,
    setPreview,
  ] =
    useState<PreviewResponse | null>(
      null,
    );

  const [
    resolvedFilms,
    setResolvedFilms,
  ] =
    useState<ResolvedFilm[]>(
      [],
    );

  /*
   * key -> explicitly selected TMDB film.
   * This is used for ambiguous and manual
   * matches only. Automatic safe matches stay
   * in resolvedFilms.
   */
  const [
    manualMatches,
    setManualMatches,
  ] =
    useState<
      Record<
        string,
        TmdbMovie
      >
    >({});

  const [
    skippedKeys,
    setSkippedKeys,
  ] =
    useState<
      Record<
        string,
        boolean
      >
    >({});

  const [
    expandedKey,
    setExpandedKey,
  ] =
    useState<
      string | null
    >(null);

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<TmdbMovie[]>(
      [],
    );

  const [
    isSearching,
    setIsSearching,
  ] =
    useState(false);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isResolving,
    setIsResolving,
  ] =
    useState(false);

  const [
    isImporting,
    setIsImporting,
  ] =
    useState(false);

  const [
    resolveProgress,
    setResolveProgress,
  ] =
    useState({
      completed: 0,
      total: 0,
    });

  const [
    importResult,
    setImportResult,
  ] =
    useState<{
      films: number;
      interactions: number;
      diaryEntries: number;
      lists: number;
      skippedUnresolvedFilms: number;
    } | null>(null);

  const [
    error,
    setError,
  ] =
    useState("");

  async function analyzeFile(
    nextFile: File,
  ) {
    setFile(nextFile);
    setPreview(null);
    setResolvedFilms([]);
    setManualMatches({});
    setSkippedKeys({});
    setExpandedKey(null);
    setSearchQuery("");
    setSearchResults([]);
    setImportResult(null);
    setError("");
    setIsLoading(true);

    try {
      const formData =
        new FormData();

      formData.set(
        "file",
        nextFile,
      );

      const response =
        await fetch(
          "/api/import/letterboxd/preview",
          {
            method: "POST",
            body: formData,
            credentials:
              "include",
          },
        );

      const data =
        (await response.json()) as PreviewResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Could not analyze this Letterboxd export.",
        );
      }

      setPreview(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not analyze this Letterboxd export.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function resolveFilms() {
    const films =
      preview?.preview
        ?.normalizedFilms;

    if (
      !films ||
      films.length === 0
    ) {
      return;
    }

    setError("");
    setIsResolving(true);
    setResolvedFilms([]);
    setManualMatches({});
    setSkippedKeys({});
    setImportResult(null);

    const collected:
      ResolvedFilm[] = [];

    setResolveProgress({
      completed: 0,
      total: films.length,
    });

    try {
      for (
        let index = 0;
        index < films.length;
        index +=
          RESOLVE_BATCH_SIZE
      ) {
        const batch =
          films.slice(
            index,
            index +
              RESOLVE_BATCH_SIZE,
          );

        const response =
          await fetch(
            "/api/import/letterboxd/resolve",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              credentials:
                "include",
              body:
                JSON.stringify({
                  films:
                    batch.map(
                      (film) => ({
                        key:
                          film.key,
                        name:
                          film.name,
                        year:
                          film.year,
                        letterboxdUri:
                          film.letterboxdUri,
                      }),
                    ),
                }),
            },
          );

        const data =
          (await response.json()) as {
            success: boolean;
            message?: string;
            results?: ResolvedFilm[];
          };

        if (
          !response.ok ||
          !data.success ||
          !data.results
        ) {
          throw new Error(
            data.message ||
              "Could not match Letterboxd films.",
          );
        }

        collected.push(
          ...data.results,
        );

        setResolvedFilms([
          ...collected,
        ]);

        setResolveProgress({
          completed:
            collected.length,
          total:
            films.length,
        });
      }
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "Could not match Letterboxd films.",
      );
    } finally {
      setIsResolving(false);
    }
  }

  function selectMatch(
    key: string,
    movie: TmdbMovie,
  ) {
    setManualMatches(
      (current) => ({
        ...current,
        [key]:
          completeTmdb(
            movie,
          ),
      }),
    );

    setSkippedKeys(
      (current) => {
        const next = {
          ...current,
        };

        delete next[key];

        return next;
      },
    );
  }

  function skipFilm(
    key: string,
  ) {
    setSkippedKeys(
      (current) => ({
        ...current,
        [key]: true,
      }),
    );

    setManualMatches(
      (current) => {
        const next = {
          ...current,
        };

        delete next[key];

        return next;
      },
    );
  }

  async function searchTmdb(
    film: ResolvedFilm,
  ) {
    const query =
      searchQuery.trim() ||
      film.letterboxd.name;

    if (
      query.length < 2
    ) {
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const params =
        new URLSearchParams({
          q: query,
        });

      if (
        film.letterboxd.year
      ) {
        params.set(
          "year",
          film.letterboxd.year,
        );
      }

      const response =
        await fetch(
          `/api/import/letterboxd/search?${params.toString()}`,
          {
            credentials:
              "include",
          },
        );

      const data =
        (await response.json()) as {
          success: boolean;
          message?: string;
          results?: TmdbMovie[];
        };

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Could not search TMDB.",
        );
      }

      setSearchResults(
        data.results ?? [],
      );
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Could not search TMDB.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function importFilms() {
    if (
      !file ||
      resolvedFilms.length ===
        0
    ) {
      return;
    }

    const matches =
      resolvedFilms
        .map((film) => {
          const manual =
            manualMatches[
              film.key
            ];

          if (manual) {
            return {
              key: film.key,
              tmdb:
                completeTmdb(
                  manual,
                ),
            };
          }

          if (
            film.status ===
              "matched" &&
            film.tmdb
          ) {
            return {
              key: film.key,
              tmdb:
                completeTmdb(
                  film.tmdb,
                ),
            };
          }

          return null;
        })
        .filter(
          (
            value,
          ): value is {
            key: string;
            tmdb: ReturnType<
              typeof completeTmdb
            >;
          } =>
            value !== null,
        );

    if (
      matches.length === 0
    ) {
      setError(
        "There are no matched films to import.",
      );
      return;
    }

    setError("");
    setIsImporting(true);

    try {
      const formData =
        new FormData();

      formData.set(
        "file",
        file,
      );

      formData.set(
        "matches",
        JSON.stringify(
          matches,
        ),
      );

      const response =
        await fetch(
          "/api/import/letterboxd/commit",
          {
            method: "POST",
            body: formData,
            credentials:
              "include",
          },
        );

      const data =
        (await response.json()) as {
          success: boolean;
          message?: string;
          imported?: {
            films: number;
            interactions: number;
            diaryEntries: number;
            lists: number;
            skippedUnresolvedFilms: number;
          };
        };

      if (
        !response.ok ||
        !data.success ||
        !data.imported
      ) {
        throw new Error(
          data.message ||
            "Could not import Letterboxd data.",
        );
      }

      setImportResult(
        data.imported,
      );
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Could not import Letterboxd data.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  const counts =
    preview?.preview
      ?.counts;

  const matchedCount =
    resolvedFilms.filter(
      (film) =>
        film.status ===
        "matched",
    ).length;

  const reviewFilms =
    resolvedFilms.filter(
      (film) =>
        film.status ===
          "review" ||
        film.status ===
          "unmatched",
    );

  const manuallyMatchedCount =
    Object.keys(
      manualMatches,
    ).length;

  const skippedCount =
    Object.keys(
      skippedKeys,
    ).length;

  const unresolvedRemaining =
    reviewFilms.filter(
      (film) =>
        !manualMatches[
          film.key
        ] &&
        !skippedKeys[
          film.key
        ],
    ).length;

  const totalImportable =
    matchedCount +
    manuallyMatchedCount;

  const resolutionComplete =
    Boolean(
      counts &&
      resolvedFilms.length ===
        counts.uniqueFilms &&
      !isResolving,
    );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
          Data portability
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
          Import from Letterboxd.
        </h1>

        <p className="mt-4 text-sm leading-7 text-white/40">
          Upload your Letterboxd export, match it to TMDB, review uncertain films, then merge the result into Memento.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(event) => {
          const selected =
            event.target
              .files?.[0];

          if (selected) {
            void analyzeFile(
              selected,
            );
          }
        }}
      />

      <button
        type="button"
        disabled={
          isLoading ||
          isResolving ||
          isImporting
        }
        onClick={() =>
          inputRef.current?.click()
        }
        onDragOver={(event) =>
          event.preventDefault()
        }
        onDrop={(event) => {
          event.preventDefault();

          const dropped =
            event.dataTransfer
              .files?.[0];

          if (dropped) {
            void analyzeFile(
              dropped,
            );
          }
        }}
        className="mt-10 flex min-h-52 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[#070707] px-6 text-center transition hover:border-[#6D001A]/70 hover:bg-[#090607] disabled:cursor-wait"
      >
        {isLoading ? (
          <LoaderCircle className="size-8 animate-spin text-[#9B1738]" />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/65">
            <Upload className="size-5" />
          </div>
        )}

        <p className="mt-5 text-base font-medium text-white">
          {isLoading
            ? "Reading your Letterboxd export..."
            : "Drop the Letterboxd ZIP here"}
        </p>

        {file && (
          <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
            <FileArchive className="size-3.5" />
            {file.name}
          </div>
        )}
      </button>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {counts &&
        preview?.preview && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-[#080808] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B1738]">
                  Export recognized
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {counts.uniqueFilms} unique films
                </h2>
              </div>

              {!resolutionComplete && (
                <Button
                  type="button"
                  onClick={() =>
                    void resolveFilms()
                  }
                  disabled={
                    isResolving
                  }
                  className="bg-[#6D001A] text-white hover:bg-[#850522]"
                >
                  {isResolving ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 size-4" />
                  )}
                  Match films
                </Button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
              {[
                ["Watched", counts.watched, Film],
                ["Ratings", counts.ratings, Star],
                ["Diary", counts.diary, Film],
                ["Reviews", counts.reviews, Film],
                ["Likes", counts.likedFilms, Heart],
                ["Watchlist", counts.watchlist, ListVideo],
              ].map(
                ([label, value, Icon]) => {
                  const IconComponent =
                    Icon as typeof Film;

                  return (
                    <div
                      key={String(label)}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <IconComponent className="size-4 text-white/35" />
                      <p className="mt-3 text-xl font-semibold text-white">
                        {String(value)}
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        {String(label)}
                      </p>
                    </div>
                  );
                },
              )}
            </div>

            {(isResolving ||
              resolvedFilms.length >
                0) && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-white/45">
                    TMDB matching
                  </span>
                  <span className="text-white">
                    {resolveProgress.completed} /{" "}
                    {resolveProgress.total}
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-[#8E1231] transition-[width]"
                    style={{
                      width:
                        resolveProgress.total
                          ? `${(resolveProgress.completed /
                              resolveProgress.total) *
                            100}%`
                          : "0%",
                    }}
                  />
                </div>

                {resolutionComplete && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat
                      icon={CheckCircle2}
                      label="Auto matched"
                      value={matchedCount}
                    />
                    <Stat
                      icon={Check}
                      label="Manually matched"
                      value={manuallyMatchedCount}
                    />
                    <Stat
                      icon={TriangleAlert}
                      label="Still unresolved"
                      value={unresolvedRemaining}
                    />
                    <Stat
                      icon={SkipForward}
                      label="Skipped"
                      value={skippedCount}
                    />
                  </div>
                )}
              </div>
            )}

            {resolutionComplete &&
              reviewFilms.length >
                0 && (
                <div className="mt-8">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B1738]">
                        Manual review
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        {reviewFilms.length} films need a decision
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-white/35">
                        Pick the correct TMDB film or explicitly skip it. Nothing ambiguous is imported automatically.
                      </p>
                    </div>

                    <p className="text-xs text-white/35">
                      {unresolvedRemaining} remaining
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    {reviewFilms.map(
                      (film) => {
                        const selected =
                          manualMatches[
                            film.key
                          ];

                        const skipped =
                          skippedKeys[
                            film.key
                          ];

                        const expanded =
                          expandedKey ===
                          film.key;

                        return (
                          <div
                            key={film.key}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedKey(
                                  expanded
                                    ? null
                                    : film.key,
                                );

                                setSearchQuery(
                                  film.letterboxd.name,
                                );

                                setSearchResults([]);
                              }}
                              className="flex w-full items-center gap-4 p-4 text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">
                                  {film.letterboxd.name}
                                </p>
                                <p className="mt-1 text-xs text-white/35">
                                  Letterboxd ·{" "}
                                  {film.letterboxd.year ||
                                    "year unknown"}
                                </p>
                              </div>

                              {selected ? (
                                <span className="max-w-56 truncate text-xs text-emerald-300">
                                  → {selected.title} ({selected.year})
                                </span>
                              ) : skipped ? (
                                <span className="text-xs text-white/30">
                                  Skipped
                                </span>
                              ) : (
                                <span className="text-xs text-amber-300">
                                  Needs review
                                </span>
                              )}

                              {expanded ? (
                                <ChevronUp className="size-4 text-white/35" />
                              ) : (
                                <ChevronDown className="size-4 text-white/35" />
                              )}
                            </button>

                            {expanded && (
                              <div className="border-t border-white/10 p-4">
                                {film.tmdb && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                                      Suggested match
                                    </p>

                                    <Candidate
                                      movie={film.tmdb}
                                      selected={
                                        selected?.id ===
                                        film.tmdb.id
                                      }
                                      onSelect={() =>
                                        selectMatch(
                                          film.key,
                                          film.tmdb!,
                                        )
                                      }
                                    />
                                  </div>
                                )}

                                {film.alternatives.length >
                                  0 && (
                                  <div className="mt-5">
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                                      Other candidates
                                    </p>

                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                      {film.alternatives
                                        .filter(
                                          (movie) =>
                                            movie.id !==
                                            film.tmdb?.id,
                                        )
                                        .map(
                                          (movie) => (
                                            <Candidate
                                              key={movie.id}
                                              movie={movie}
                                              selected={
                                                selected?.id ===
                                                movie.id
                                              }
                                              onSelect={() =>
                                                selectMatch(
                                                  film.key,
                                                  movie,
                                                )
                                              }
                                            />
                                          ),
                                        )}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-5">
                                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                                    Search TMDB manually
                                  </p>

                                  <div className="mt-2 flex gap-2">
                                    <input
                                      value={searchQuery}
                                      onChange={(event) =>
                                        setSearchQuery(
                                          event.target.value,
                                        )
                                      }
                                      onKeyDown={(event) => {
                                        if (
                                          event.key ===
                                          "Enter"
                                        ) {
                                          event.preventDefault();
                                          void searchTmdb(
                                            film,
                                          );
                                        }
                                      }}
                                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#6D001A]"
                                      placeholder="Search title"
                                    />

                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={isSearching}
                                      onClick={() =>
                                        void searchTmdb(
                                          film,
                                        )
                                      }
                                      className="border-white/10 bg-black text-white hover:bg-white/5"
                                    >
                                      {isSearching ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                      ) : (
                                        <Search className="size-4" />
                                      )}
                                    </Button>
                                  </div>

                                  {searchResults.length >
                                    0 && (
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                      {searchResults.map(
                                        (movie) => (
                                          <Candidate
                                            key={movie.id}
                                            movie={movie}
                                            selected={
                                              selected?.id ===
                                              movie.id
                                            }
                                            onSelect={() =>
                                              selectMatch(
                                                film.key,
                                                movie,
                                              )
                                            }
                                          />
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="mt-5 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      skipFilm(
                                        film.key,
                                      )
                                    }
                                    className="text-white/40 hover:bg-white/5 hover:text-white"
                                  >
                                    <SkipForward className="mr-2 size-4" />
                                    Skip this film
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

            {resolutionComplete && (
              <div className="mt-8 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-white/60">
                    {totalImportable} films ready to import
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    {unresolvedRemaining > 0
                      ? `${unresolvedRemaining} unresolved films will be skipped unless you review them.`
                      : "Every uncertain film has been matched or explicitly skipped."}
                  </p>
                </div>

                {importResult ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 className="size-4" />
                    Imported to Memento
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={
                      isImporting ||
                      totalImportable ===
                        0
                    }
                    onClick={() =>
                      void importFilms()
                    }
                    className="bg-[#6D001A] text-white hover:bg-[#850522]"
                  >
                    {isImporting && (
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                    )}
                    Import {totalImportable} films
                  </Button>
                )}
              </div>
            )}

            {importResult && (
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-white/60">
                <p className="font-medium text-white">
                  Letterboxd import complete.
                </p>
                <p className="mt-2 text-xs leading-5 text-white/40">
                  {importResult.films} films merged ·{" "}
                  {importResult.diaryEntries} diary entries ·{" "}
                  {importResult.lists} lists ·{" "}
                  {importResult.skippedUnresolvedFilms} unresolved films skipped.
                </p>
              </div>
            )}
          </section>
        )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Film;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <Icon className="size-4 text-white/35" />
      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-white/35">
        {label}
      </p>
    </div>
  );
}

function Candidate({
  movie,
  selected,
  onSelect,
}: {
  movie: TmdbMovie;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mt-2 flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
        selected
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-white/10 bg-[#070707] hover:border-white/20"
      }`}
    >
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-white/5">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt=""
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Film className="size-3 text-white/20" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {movie.title}
        </p>
        <p className="mt-1 text-xs text-white/35">
          {movie.year || "—"} · TMDB #{movie.id}
        </p>
        <p className="mt-1 text-[11px] text-white/25">
          ★ {movie.rating.toFixed(1)}
        </p>
      </div>

      {selected && (
        <Check className="size-4 shrink-0 text-emerald-400" />
      )}
    </button>
  );
}