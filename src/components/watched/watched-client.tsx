"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  Eye,
  LoaderCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { WatchedMovieCard } from "./watched-movie-card";

import { fetchWatchedMovies } from "@/lib/api/watched";

import type { WatchedMovie } from "@/types/watched";

type SortOption =
  | "recent"
  | "rating"
  | "title";

type RatingFilter =
  | "all"
  | "3"
  | "4"
  | "4.5";

export function WatchedClient() {
  const [movies, setMovies] =
    useState<WatchedMovie[]>([]);

  const [query, setQuery] =
    useState("");

  const [sort, setSort] =
    useState<SortOption>("recent");

  const [genre, setGenre] =
    useState("all");

  const [
    minimumRating,
    setMinimumRating,
  ] =
    useState<RatingFilter>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadMovies() {
      try {
        setError("");

        const data =
          await fetchWatchedMovies();

        setMovies(data);
      } catch (loadError) {
        console.error(
          "Could not load watched movies:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your watched movies.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadMovies();
  }, []);

  const genres = useMemo(
    () =>
      Array.from(
        new Set(
          movies
            .map((movie) =>
              movie.genre?.trim(),
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(
                  value &&
                    value !==
                      "Film",
                ),
            ),
        ),
      ).sort((a, b) =>
        a.localeCompare(b),
      ),
    [movies],
  );

  const filteredMovies =
    useMemo(() => {
      const normalized =
        query.trim().toLowerCase();

      const ratingFloor =
        minimumRating === "all"
          ? null
          : Number(
              minimumRating,
            );

      const result = movies.filter(
        (movie) => {
          const matchesQuery =
            normalized.length === 0 ||
            movie.title
              .toLowerCase()
              .includes(normalized);

          const matchesGenre =
            genre === "all" ||
            movie.genre === genre;

          const matchesRating =
            ratingFloor === null ||
            (
              movie.rating !==
                null &&
              movie.rating !==
                undefined &&
              movie.rating >=
                ratingFloor
            );

          return (
            matchesQuery &&
            matchesGenre &&
            matchesRating
          );
        },
      );

      return [...result].sort(
        (a, b) => {
          if (sort === "rating") {
            return (
              (b.rating ?? -1) -
              (a.rating ?? -1)
            );
          }

          if (sort === "title") {
            return a.title.localeCompare(
              b.title,
            );
          }

          const first =
            a.lastWatchedAt
              ? new Date(
                  a.lastWatchedAt,
                ).getTime()
              : 0;

          const second =
            b.lastWatchedAt
              ? new Date(
                  b.lastWatchedAt,
                ).getTime()
              : 0;

          return second - first;
        },
      );
    }, [
      movies,
      query,
      sort,
      genre,
      minimumRating,
    ]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    genre !== "all" ||
    minimumRating !== "all";

  function clearFilters() {
    setQuery("");
    setGenre("all");
    setMinimumRating("all");
  }

  if (isLoading) {
    return (
      <div className="px-5 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-white/[0.05]" />
          <div className="mt-4 h-14 w-72 max-w-full animate-pulse rounded-xl bg-white/[0.05]" />

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({
              length: 12,
            }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse"
              >
                <div className="aspect-[2/3] rounded-2xl border border-white/10 bg-white/[0.04]" />
                <div className="mt-3 h-3 w-3/4 rounded bg-white/[0.06]" />
                <div className="mt-2 h-2.5 w-1/2 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>

          <div className="sr-only">
            <LoaderCircle className="animate-spin" />
            Loading your films...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
              Your cinema
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Watched.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
              Your complete viewing history — from quick marks to ratings,
              rewatches, and diary logs.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/40">
            <Eye className="size-4 text-[#9B1738]" />

            {movies.length}{" "}
            {movies.length === 1
              ? "film"
              : "films"}
          </div>
        </header>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {movies.length > 0 && (
          <section className="mt-10 rounded-2xl border border-white/10 bg-[#080808] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-white/45">
              <SlidersHorizontal className="size-4 text-[#9B1738]" />
              Explore your viewing history
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_170px_200px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                <Input
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search watched films..."
                  className="h-11 border-white/10 bg-black pl-11 text-white placeholder:text-white/25"
                />
              </div>

              <SelectControl
                value={genre}
                onChange={setGenre}
                ariaLabel="Filter watched films by genre"
              >
                <option value="all">
                  All genres
                </option>

                {genres.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ),
                )}
              </SelectControl>

              <SelectControl
                value={minimumRating}
                onChange={(value) =>
                  setMinimumRating(
                    value as RatingFilter,
                  )
                }
                ariaLabel="Filter watched films by your rating"
              >
                <option value="all">
                  Any rating
                </option>
                <option value="3">
                  Rated 3+
                </option>
                <option value="4">
                  Rated 4+
                </option>
                <option value="4.5">
                  Rated 4.5+
                </option>
              </SelectControl>

              <SelectControl
                value={sort}
                onChange={(value) =>
                  setSort(
                    value as SortOption,
                  )
                }
                ariaLabel="Sort watched films"
              >
                <option value="recent">
                  Recently watched
                </option>
                <option value="rating">
                  Highest rated
                </option>
                <option value="title">
                  Film title
                </option>
              </SelectControl>
            </div>

            <div className="mt-4 flex min-h-8 flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
              <p className="text-xs text-white/30">
                Showing{" "}
                <span className="font-medium text-white/60">
                  {filteredMovies.length}
                </span>{" "}
                of {movies.length} films
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-white/35 transition hover:text-white"
                >
                  <RotateCcw className="size-3.5" />
                  Clear filters
                </button>
              )}
            </div>
          </section>
        )}

        {!error &&
          movies.length === 0 && (
            <div className="mt-10 flex min-h-[460px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#060606]">
              <div className="max-w-md px-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
                  <Eye className="size-6" />
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-white">
                  Nothing watched yet.
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Mark a movie as seen or log a viewing and it&apos;ll appear
                  here.
                </p>
              </div>
            </div>
          )}

        {movies.length > 0 &&
          filteredMovies.length === 0 && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-[#060606] px-6 py-16 text-center">
              <SlidersHorizontal className="mx-auto size-6 text-white/20" />

              <h2 className="mt-4 text-lg font-medium text-white">
                No films match those filters.
              </h2>

              <p className="mt-2 text-sm text-white/35">
                Try broadening the title, genre, or rating.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="mt-5 border-white/10 bg-black text-white hover:bg-white hover:text-black"
              >
                Clear filters
              </Button>
            </div>
          )}

        {filteredMovies.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredMovies.map(
              (movie) => (
                <WatchedMovieCard
                  key={movie.movieId}
                  movie={movie}
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectControl({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">
        {ariaLabel}
      </span>

      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 text-sm text-white outline-none transition focus:border-[#6D001A]"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
    </label>
  );
}