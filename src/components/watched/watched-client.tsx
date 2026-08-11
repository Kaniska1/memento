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
  Search,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { WatchedMovieCard } from "./watched-movie-card";

import { fetchWatchedMovies } from "@/lib/api/watched";

import type { WatchedMovie } from "@/types/watched";

type SortOption =
  | "recent"
  | "rating"
  | "title";

export function WatchedClient() {
  const [movies, setMovies] =
    useState<WatchedMovie[]>([]);

  const [query, setQuery] =
    useState("");

  const [sort, setSort] =
    useState<SortOption>("recent");

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

    loadMovies();
  }, []);

  const filteredMovies =
    useMemo(() => {
      const normalized =
        query.trim().toLowerCase();

      const result = movies.filter(
        (movie) =>
          movie.title
            .toLowerCase()
            .includes(normalized),
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
    }, [movies, query, sort]);

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-[#8E1231]" />

          <p className="mt-4 text-sm text-white/35">
            Loading your films...
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
              Your cinema
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Watched.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
              Every film you&apos;ve marked
              as watched, whether you logged
              the viewing or not.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/35">
            <Eye className="size-4" />

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
            <div className="grid gap-3 md:grid-cols-[1fr_190px]">
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

              <label className="relative">
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target
                        .value as SortOption,
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 text-sm text-white outline-none focus:border-[#6D001A]"
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
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              </label>
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
                  Use the eye button on any
                  movie, or log a film, and
                  it&apos;ll appear here.
                </p>
              </div>
            </div>
          )}

        {movies.length > 0 &&
          filteredMovies.length === 0 && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-[#060606] px-6 py-16 text-center">
              <p className="text-sm text-white/40">
                No watched films match
                &ldquo;{query}&rdquo;.
              </p>
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