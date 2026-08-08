"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getWatchlist,
  removeFromWatchlist,
} from "@/lib/watchlist-storage";
import type { WatchlistMovie } from "@/types/watchlist";

import { WatchlistCard } from "./watchlist-card";

type SortOption =
  | "recent"
  | "title"
  | "rating"
  | "year";

export function WatchlistClient() {
  const [movies, setMovies] = useState<WatchlistMovie[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  function loadWatchlist() {
    setMovies(getWatchlist());
  }

  useEffect(() => {
    loadWatchlist();

    window.addEventListener("memento:watchlist-updated", loadWatchlist);

    return () => {
      window.removeEventListener("memento:watchlist-updated", loadWatchlist);
    };
  }, []);

  const filteredMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = movies.filter((movie) =>
      movie.title.toLowerCase().includes(normalizedQuery),
    );

    return [...result].sort((a, b) => {
      switch (sort) {
        case "title":
          return a.title.localeCompare(b.title);

        case "rating":
          return b.rating - a.rating;

        case "year":
          return Number(b.year) - Number(a.year);

        default:
          return (
            new Date(b.addedAt).getTime() -
            new Date(a.addedAt).getTime()
          );
      }
    });
  }, [movies, query, sort]);

  function handleRemove(movieId: number) {
    removeFromWatchlist(movieId);
    loadWatchlist();
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-375">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
              Saved for later
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Your watchlist.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
              Films you intend to watch—assuming choosing one doesn’t become a feature-length event.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/35">
            <Bookmark className="size-4" />
            {movies.length} {movies.length === 1 ? "film" : "films"}
          </div>
        </header>

        {movies.length > 0 && (
          <section className="mt-10 rounded-2xl border border-white/10 bg-[#080808] p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_210px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your watchlist..."
                  className="h-11 border-white/10 bg-black pl-11 text-white placeholder:text-white/25"
                />
              </div>

              <label className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black pl-11 pr-4 text-sm text-white outline-none focus:border-[#6D001A]"
                >
                  <option value="recent">Recently added</option>
                  <option value="title">Title A–Z</option>
                  <option value="rating">Highest rated</option>
                  <option value="year">Newest release</option>
                </select>
              </label>
            </div>
          </section>
        )}

        <div className="mt-9">
          {movies.length === 0 && (
            <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#060606]">
              <div className="max-w-md px-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
                  <Bookmark className="size-6" />
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-white">
                  Nothing saved yet.
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Browse films and add anything that deserves a future evening.
                </p>

                <Button asChild className="mt-7 bg-[#6D001A] text-white hover:bg-[#850522]">
                  <Link href="/discover">Discover movies</Link>
                </Button>
              </div>
            </div>
          )}

          {movies.length > 0 && filteredMovies.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-[#060606] px-6 py-16 text-center">
              <p className="text-sm text-white/40">
                No watchlist films match “{query}”.
              </p>
            </div>
          )}

          {filteredMovies.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredMovies.map((movie) => (
                <WatchlistCard key={movie.id} movie={movie} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}