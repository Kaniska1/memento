"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Bookmark,
  ChevronDown,
  LoaderCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { WatchlistCard } from "./watchlist-card";

import { fetchWatchlist } from "@/lib/api/watchlist";
import { updateMovieInteraction } from "@/lib/api/movie-interaction";

import type { WatchlistMovie } from "@/types/watchlist";

type SortOption =
  | "recent"
  | "title"
  | "rating"
  | "year";

type RatingFilter =
  | "all"
  | "7"
  | "8"
  | "9";

export function WatchlistClient() {
  const [movies, setMovies] =
    useState<WatchlistMovie[]>([]);

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

  const loadWatchlist =
    useCallback(async () => {
      try {
        setError("");

        const data =
          await fetchWatchlist();

        setMovies(data);
      } catch (loadError) {
        console.error(
          "Could not load watchlist:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your watchlist.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadWatchlist();
  }, [loadWatchlist]);

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
                Boolean(value),
            ),
        ),
      ).sort((a, b) =>
        a.localeCompare(b),
      ),
    [movies],
  );

  const filteredMovies =
    useMemo(() => {
      const normalizedQuery =
        query.trim().toLowerCase();

      const ratingFloor =
        minimumRating === "all"
          ? null
          : Number(
              minimumRating,
            );

      const result =
        movies.filter((movie) => {
          const matchesQuery =
            normalizedQuery.length === 0 ||
            movie.title
              .toLowerCase()
              .includes(
                normalizedQuery,
              );

          const matchesGenre =
            genre === "all" ||
            movie.genre === genre;

          const matchesRating =
            ratingFloor === null ||
            (
              movie.tmdbRating !==
                null &&
              movie.tmdbRating !==
                undefined &&
              movie.tmdbRating >=
                ratingFloor
            );

          return (
            matchesQuery &&
            matchesGenre &&
            matchesRating
          );
        });

      return [...result].sort(
        (a, b) => {
          switch (sort) {
            case "title":
              return a.title.localeCompare(
                b.title,
              );

            case "rating":
              return (
                (b.tmdbRating ?? -1) -
                (a.tmdbRating ?? -1)
              );

            case "year":
              return (
                Number(b.year || 0) -
                Number(a.year || 0)
              );

            default:
              return (
                new Date(
                  b.addedAt,
                ).getTime() -
                new Date(
                  a.addedAt,
                ).getTime()
              );
          }
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

  async function handleRemove(
    movie: WatchlistMovie,
  ) {
    try {
      await updateMovieInteraction(
        movie.movieId,
        {
          movieTitle: movie.title,
          movieYear: movie.year,
          poster: movie.poster,
          genre: movie.genre,

          watchlisted: false,
        },
      );

      setMovies((current) =>
        current.filter(
          (item) =>
            item.movieId !==
            movie.movieId,
        ),
      );
    } catch (removeError) {
      console.error(
        "Could not remove from watchlist:",
        removeError,
      );

      window.alert(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove this film.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="px-5 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-white/[0.05]" />
          <div className="mt-4 h-14 w-80 max-w-full animate-pulse rounded-xl bg-white/[0.05]" />

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
            Loading your watchlist...
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
              Saved for later
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Your watchlist.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
              Films you mean to watch someday,
              unless choosing one becomes the
              evening&apos;s main activity.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/40">
            <Bookmark className="size-4 text-[#9B1738]" />

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
              Find something worth watching
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
                  placeholder="Search your watchlist..."
                  className="h-11 border-white/10 bg-black pl-11 text-white placeholder:text-white/25"
                />
              </div>

              <SelectControl
                value={genre}
                onChange={setGenre}
                ariaLabel="Filter by genre"
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
                ariaLabel="Filter by TMDB rating"
              >
                <option value="all">
                  Any rating
                </option>
                <option value="7">
                  7.0+ rating
                </option>
                <option value="8">
                  8.0+ rating
                </option>
                <option value="9">
                  9.0+ rating
                </option>
              </SelectControl>

              <SelectControl
                value={sort}
                onChange={(value) =>
                  setSort(
                    value as SortOption,
                  )
                }
                ariaLabel="Sort watchlist"
              >
                <option value="recent">
                  Recently added
                </option>
                <option value="title">
                  Title A–Z
                </option>
                <option value="rating">
                  Highest TMDB rated
                </option>
                <option value="year">
                  Newest release
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

        <div className="mt-9">
          {!error &&
            movies.length === 0 && (
              <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#060606]">
                <div className="max-w-md px-6 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
                    <Bookmark className="size-6" />
                  </div>

                  <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-white">
                    Nothing saved yet.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/40">
                    Use the bookmark icon on any
                    movie to save it here.
                  </p>

                  <Button
                    asChild
                    className="mt-7 bg-[#6D001A] text-white hover:bg-[#850522]"
                  >
                    <Link href="/discover">
                      Discover movies
                    </Link>
                  </Button>
                </div>
              </div>
            )}

          {movies.length > 0 &&
            filteredMovies.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-[#060606] px-6 py-16 text-center">
                <SlidersHorizontal className="mx-auto size-6 text-white/20" />

                <h2 className="mt-4 text-lg font-medium text-white">
                  No films match those filters.
                </h2>

                <p className="mt-2 text-sm text-white/35">
                  Try broadening your search,
                  genre, or rating.
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredMovies.map(
                (movie) => (
                  <WatchlistCard
                    key={movie.movieId}
                    movie={movie}
                    onRemove={
                      handleRemove
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>
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