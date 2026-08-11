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
  LoaderCircle,
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

export function WatchlistClient() {
  const [movies, setMovies] =
    useState<WatchlistMovie[]>([]);

  const [query, setQuery] =
    useState("");

  const [sort, setSort] =
    useState<SortOption>("recent");

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
    loadWatchlist();
  }, [loadWatchlist]);

  const filteredMovies =
    useMemo(() => {
      const normalizedQuery =
        query.trim().toLowerCase();

      const result = movies.filter(
        (movie) =>
          movie.title
            .toLowerCase()
            .includes(normalizedQuery),
      );

      return [...result].sort(
        (a, b) => {
          switch (sort) {
            case "title":
              return a.title.localeCompare(
                b.title,
              );

            case "rating":
              return (
                (b.rating ?? -1) -
                (a.rating ?? -1)
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
    }, [movies, query, sort]);

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
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-[#8E1231]" />

          <p className="mt-4 text-sm text-white/35">
            Loading your watchlist...
          </p>
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

          <div className="flex items-center gap-2 text-xs text-white/35">
            <Bookmark className="size-4" />

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
          <section className="mt-10 rounded-2xl border border-white/10 bg-[#080808] p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_210px]">
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

              <label className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target
                        .value as SortOption,
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black pl-11 pr-4 text-sm text-white outline-none focus:border-[#6D001A]"
                >
                  <option value="recent">
                    Recently added
                  </option>

                  <option value="title">
                    Title A–Z
                  </option>

                  <option value="rating">
                    Highest rated
                  </option>

                  <option value="year">
                    Newest release
                  </option>
                </select>
              </label>
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
                <p className="text-sm text-white/40">
                  No watchlist films match
                  &ldquo;{query}&rdquo;.
                </p>
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