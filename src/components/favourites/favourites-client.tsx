"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Heart,
  LoaderCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  fetchProfileFavourites,
} from "@/lib/api/profile-favourites";

import { FavouriteCard } from "./favourite-card";

import type {
  ProfileFavouriteMovie,
} from "@/types/profile";

type SortOption =
  | "recent"
  | "title"
  | "year";

export function FavouritesClient() {
  const [movies, setMovies] =
    useState<ProfileFavouriteMovie[]>([]);

  const [query, setQuery] =
    useState("");

  const [sort, setSort] =
    useState<SortOption>("recent");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFavourites() {
      try {
        setError("");

        const data =
          await fetchProfileFavourites();

        if (!cancelled) {
          setMovies(data);
        }
      } catch (error) {
        console.error(
          "Could not load favourites:",
          error,
        );

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not load favourites.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFavourites();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMovies =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      const result =
        movies.filter((movie) =>
          movie.title
            .toLowerCase()
            .includes(
              normalizedQuery,
            ),
        );

      return [...result].sort(
        (a, b) => {
          switch (sort) {
            case "title":
              return a.title.localeCompare(
                b.title,
              );

            case "year":
              return (
                Number(b.year) -
                Number(a.year)
              );

            /*
             * The backend favourites
             * array already represents
             * the user's chosen order.
             */
            default:
              return 0;
          }
        },
      );
    }, [movies, query, sort]);

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-6 animate-spin text-[#9B1738]" />

          <p className="mt-4 text-sm text-white/35">
            Loading favourites...
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
              The essential five
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Your favourites.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
              Up to five films that
              define your taste — the
              ones that stayed,
              haunted, comforted, or
              permanently rearranged
              your brain chemistry.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/35">
            <Heart className="size-4" />

            {movies.length}/5
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
                  onChange={(
                    event,
                  ) =>
                    setQuery(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search your favourites..."
                  className="h-11 border-white/10 bg-black pl-11 text-white placeholder:text-white/25"
                />
              </div>

              <label className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                <select
                  value={sort}
                  onChange={(
                    event,
                  ) =>
                    setSort(
                      event.target
                        .value as SortOption,
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black pl-11 pr-4 text-sm text-white outline-none focus:border-[#6D001A]"
                >
                  <option value="recent">
                    Your order
                  </option>

                  <option value="title">
                    Title A–Z
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
            movies.length ===
              0 && (
              <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#060606]">
                <div className="max-w-md px-6 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
                    <Heart className="size-6" />
                  </div>

                  <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-white">
                    No favourites yet.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/40">
                    Choose up to five
                    films that best
                    represent your
                    taste.
                  </p>

                  <Button
                    asChild
                    className="mt-7 bg-[#6D001A] text-white hover:bg-[#850522]"
                  >
                    <Link href="/profile">
                      Choose favourites
                    </Link>
                  </Button>
                </div>
              </div>
            )}

          {movies.length > 0 &&
            filteredMovies.length ===
              0 && (
              <div className="rounded-3xl border border-white/10 bg-[#060606] px-6 py-16 text-center">
                <p className="text-sm text-white/40">
                  No favourite films
                  match “{query}”.
                </p>
              </div>
            )}

          {filteredMovies.length >
            0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {filteredMovies.map(
                (movie) => (
                  <FavouriteCard
                    key={
                      movie.movieId
                    }
                    movie={movie}
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