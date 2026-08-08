"use client";

import Image from "next/image";
import { Check, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import type { OnboardingMovie } from "@/types/onboarding";

type FavouritePickerProps = {
  selectedMovies: OnboardingMovie[];
  onChange: (movies: OnboardingMovie[]) => void;
};

type SearchResponse = {
  results: OnboardingMovie[];
  message?: string;
};

export function FavouritePicker({
  selectedMovies,
  onChange,
}: FavouritePickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OnboardingMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setError("");

      try {
        const response = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(trimmedQuery)}`,
          {
            signal: controller.signal,
          },
        );

        const data = (await response.json()) as SearchResponse;

        if (!response.ok) {
          throw new Error(data.message || "Could not search for films.");
        }

        setResults(data.results);
      } catch (searchError) {
        if (
          searchError instanceof DOMException &&
          searchError.name === "AbortError"
        ) {
          return;
        }

        setError(
          searchError instanceof Error
            ? searchError.message
            : "Could not search for films.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function isSelected(movieId: number) {
    return selectedMovies.some((movie) => movie.id === movieId);
  }

  function toggleMovie(movie: OnboardingMovie) {
    if (isSelected(movie.id)) {
      onChange(
        selectedMovies.filter(
          (selectedMovie) => selectedMovie.id !== movie.id,
        ),
      );

      return;
    }

    if (selectedMovies.length >= 4) {
      return;
    }

    onChange([...selectedMovies, movie]);
  }

  function removeMovie(movieId: number) {
    onChange(selectedMovies.filter((movie) => movie.id !== movieId));
  }

  return (
    <div>
      {/* Selected favourites */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => {
          const movie = selectedMovies[index];

          if (!movie) {
            return (
              <div
                key={`empty-${index}`}
                className="flex aspect-[2/3] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#080808]"
              >
                <div className="text-center">
                  <span className="text-2xl font-medium text-white/15">
                    0{index + 1}
                  </span>

                  <p className="mt-2 text-xs text-white/25">
                    Choose a film
                  </p>
                </div>
              </div>
            );
          }

          return (
            <article
              key={movie.id}
              className="group relative aspect-[2/3] overflow-hidden rounded-2xl border border-[#6D001A]/70 bg-[#080808]"
            >
              {movie.poster ? (
                <Image
                  src={movie.poster}
                  alt={`${movie.title} poster`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 45vw, 180px"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white/30">
                  {movie.title}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />

              <button
                type="button"
                onClick={() => removeMovie(movie.id)}
                aria-label={`Remove ${movie.title}`}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur-md transition hover:bg-[#6D001A]"
              >
                <X className="size-4" />
              </button>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="line-clamp-2 text-sm font-medium text-white">
                  {movie.title}
                </p>

                <p className="mt-1 text-xs text-white/45">{movie.year}</p>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-4 text-right text-xs text-white/35">
        {selectedMovies.length}/4 selected
      </p>

      {/* Search */}
      <div className="relative mt-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a film..."
          className="h-12 border-white/10 bg-[#090909] pl-11 pr-11 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
        />

        {isSearching && (
          <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/40" />
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {query.trim().length === 1 && (
        <p className="mt-4 text-sm text-white/30">
          Enter at least two characters.
        </p>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {results.map((movie) => {
            const selected = isSelected(movie.id);
            const selectionDisabled =
              !selected && selectedMovies.length >= 4;

            return (
              <button
                key={movie.id}
                type="button"
                disabled={selectionDisabled}
                onClick={() => toggleMovie(movie)}
                className={`
                  group flex gap-4 rounded-2xl border p-3 text-left
                  transition-all duration-200
                  ${
                    selected
                      ? "border-[#6D001A] bg-[#160006]"
                      : "border-white/10 bg-[#090909] hover:border-white/20"
                  }
                  disabled:cursor-not-allowed disabled:opacity-35
                `}
              >
                <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                  {movie.poster ? (
                    <Image
                      src={movie.poster}
                      alt={`${movie.title} poster`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-white/25">
                      No poster
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium text-white">
                        {movie.title}
                      </h3>

                      <p className="mt-1 text-xs text-white/35">
                        {movie.year}
                      </p>
                    </div>

                    <span
                      className={`
                        flex size-7 shrink-0 items-center justify-center
                        rounded-full border
                        ${
                          selected
                            ? "border-[#6D001A] bg-[#6D001A] text-white"
                            : "border-white/10 text-transparent"
                        }
                      `}
                    >
                      <Check className="size-4" />
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/35">
                    {movie.overview || "No overview available."}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isSearching &&
        query.trim().length >= 2 &&
        results.length === 0 &&
        !error && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#080808] p-8 text-center">
            <p className="text-sm text-white/40">
              No films found for “{query}”.
            </p>
          </div>
        )}
    </div>
  );
}