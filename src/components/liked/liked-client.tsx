"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  Eye,
  Heart,
  LoaderCircle,
  Search,
  Star,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { fetchLikedMovies } from "@/lib/api/liked";
import { updateMovieInteraction } from "@/lib/api/movie-interaction";

import type { LikedMovie } from "@/types/liked";

export function LikedClient() {
  const [movies, setMovies] =
    useState<LikedMovie[]>([]);

  const [query, setQuery] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadMovies() {
      try {
        setError("");

        const data =
          await fetchLikedMovies();

        setMovies(data);
      } catch (loadError) {
        console.error(
          "Could not load liked films:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load liked films.",
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

      return movies.filter((movie) =>
        movie.title
          .toLowerCase()
          .includes(normalized),
      );
    }, [movies, query]);

  async function removeLike(
    movie: LikedMovie,
  ) {
    try {
      await updateMovieInteraction(
        movie.movieId,
        {
          movieTitle: movie.title,
          movieYear: movie.year,
          poster: movie.poster,
          genre: movie.genre,

          liked: false,
        },
      );

      setMovies((current) =>
        current.filter(
          (item) =>
            item.movieId !== movie.movieId,
        ),
      );
    } catch (removeError) {
      console.error(
        "Could not remove like:",
        removeError,
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-[#8E1231]" />
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
              Films that stayed
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Liked films.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
              Every film you&apos;ve given a
              heart, regardless of whether
              you&apos;ve logged it.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/35">
            <Heart className="size-4" />

            {movies.length}{" "}
            {movies.length === 1
              ? "film"
              : "films"}
          </div>
        </header>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {movies.length > 0 && (
          <div className="relative mt-10">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

            <Input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search liked films..."
              className="h-11 border-white/10 bg-[#080808] pl-11 text-white"
            />
          </div>
        )}

        {!error &&
          movies.length === 0 && (
            <div className="mt-10 flex min-h-[460px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#060606]">
              <div className="text-center">
                <Heart className="mx-auto size-7 text-[#9B1738]" />

                <h2 className="mt-5 text-xl font-semibold text-white">
                  Nothing liked yet.
                </h2>

                <p className="mt-2 text-sm text-white/35">
                  Give a movie a heart and
                  it&apos;ll appear here.
                </p>
              </div>
            </div>
          )}

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredMovies.map((movie) => (
            <article
              key={movie.movieId}
              className="group"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#080808]">
                <Link
                  href={`/movies/${movie.movieId}`}
                >
                  {movie.poster ? (
                    <Image
                      src={movie.poster}
                      alt={movie.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-white/25">
                      No poster
                    </div>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    removeLike(movie)
                  }
                  className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/80 text-[#A51636]"
                >
                  <Heart className="size-4 fill-current" />
                </button>

                {movie.watched && (
                  <div className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/80 text-white">
                    <Eye className="size-4" />
                  </div>
                )}
              </div>

              <Link
                href={`/movies/${movie.movieId}`}
                className="mt-3 block truncate text-sm font-medium text-white hover:text-[#A51636]"
              >
                {movie.title}
              </Link>

              <div className="mt-1 flex items-center gap-2 text-xs text-white/35">
                <span>
                  {movie.year || "—"}
                </span>

                {movie.rating !== null && (
                  <>
                    <span>·</span>

                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-[#A51636] text-[#A51636]" />
                      {movie.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}