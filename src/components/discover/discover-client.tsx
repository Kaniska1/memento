"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DiscoverFilters } from "./discover-filters";
import {
  MovieGrid,
  type DiscoverMovie,
} from "./movie-grid";

type DiscoverResponse = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: DiscoverMovie[];
  message?: string;
};

type DiscoverClientProps = {
  initialQuery?: string;
};



export function DiscoverClient({
  initialQuery = "",
}: DiscoverClientProps) {
  const [query, setQuery] = useState(initialQuery);
const [debouncedQuery, setDebouncedQuery] = useState(
  initialQuery.trim(),
);

  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("popularity.desc");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState(0);
  const [page, setPage] = useState(1);

  const [movies, setMovies] = useState<DiscoverMovie[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [genre, sort, year, rating]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMovies() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          sort,
          rating: String(rating),
        });

        if (debouncedQuery.length >= 2) {
          params.set("query", debouncedQuery);
        }

        if (genre) {
          params.set("genre", genre);
        }

        if (year) {
          params.set("year", year);
        }

        const response = await fetch(
          `/api/tmdb/discover?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        const data =
          (await response.json()) as DiscoverResponse;

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load movies.",
          );
        }

        setMovies(data.results);
        setTotalPages(data.totalPages);
        setTotalResults(data.totalResults);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load movies.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      controller.abort();
    };
  }, [
    debouncedQuery,
    genre,
    sort,
    year,
    rating,
    page,
  ]);

  function resetFilters() {
    setQuery("");
    setDebouncedQuery("");
    setGenre("");
    setSort("popularity.desc");
    setYear("");
    setRating(0);
    setPage(1);
  }

  function changePage(nextPage: number) {
    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px]">
        <header>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
            Explore cinema
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
            Discover films.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40 sm:text-base">
            Search across genres, decades, ratings, and popularity
            to find something worth remembering.
          </p>
        </header>

        <div className="mt-10">
          <DiscoverFilters
            query={query}
            genre={genre}
            sort={sort}
            year={year}
            rating={rating}
            onQueryChange={setQuery}
            onGenreChange={setGenre}
            onSortChange={setSort}
            onYearChange={setYear}
            onRatingChange={setRating}
            onReset={resetFilters}
          />
        </div>

        <div className="mt-10 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs text-white/35">
              {isLoading
                ? "Searching..."
                : `${totalResults.toLocaleString()} films found`}
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-white">
              {debouncedQuery.length >= 2
                ? `Results for “${debouncedQuery}”`
                : "Browse movies"}
            </h2>
          </div>

          {!isLoading && totalPages > 1 && (
            <p className="text-xs text-white/30">
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        <div className="mt-7">
          {isLoading && (
            <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-white/10 bg-[#060606]">
              <div className="text-center">
                <LoaderCircle className="mx-auto size-7 animate-spin text-[#8E1231]" />

                <p className="mt-4 text-sm text-white/35">
                  Searching the archives...
                </p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
              <p className="text-sm text-red-300">
                {error}
              </p>

              <Button
                type="button"
                onClick={() => setPage((current) => current)}
                className="mt-5 bg-[#6D001A] text-white hover:bg-[#850522]"
              >
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <MovieGrid movies={movies} />
          )}
        </div>

        {!isLoading &&
          !error &&
          movies.length > 0 &&
          totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3 border-t border-white/10 pt-8">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => changePage(page - 1)}
                className="border-white/10 bg-[#090909] text-white hover:bg-white hover:text-black"
              >
                <ArrowLeft className="mr-2 size-4" />
                Previous
              </Button>

              <div className="rounded-xl border border-white/10 bg-[#090909] px-4 py-2 text-sm text-white/50">
                {page} / {totalPages}
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => changePage(page + 1)}
                className="border-white/10 bg-[#090909] text-white hover:bg-white hover:text-black"
              >
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}