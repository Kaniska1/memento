"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const genres = [
  { id: "", name: "All genres" },
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "99", name: "Documentary" },
  { id: "18", name: "Drama" },
  { id: "10751", name: "Family" },
  { id: "14", name: "Fantasy" },
  { id: "36", name: "History" },
  { id: "27", name: "Horror" },
  { id: "10402", name: "Music" },
  { id: "9648", name: "Mystery" },
  { id: "10749", name: "Romance" },
  { id: "878", name: "Science Fiction" },
  { id: "53", name: "Thriller" },
  { id: "10752", name: "War" },
  { id: "37", name: "Western" },
];

const sortOptions = [
  {
    value: "popularity.desc",
    label: "Most popular",
  },
  {
    value: "vote_average.desc",
    label: "Highest rated",
  },
  {
    value: "primary_release_date.desc",
    label: "Newest releases",
  },
  {
    value: "primary_release_date.asc",
    label: "Oldest releases",
  },
  {
    value: "revenue.desc",
    label: "Highest grossing",
  },
];

type DiscoverFiltersProps = {
  query: string;
  genre: string;
  sort: string;
  year: string;
  rating: number;
  onQueryChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onReset: () => void;
};

export function DiscoverFilters({
  query,
  genre,
  sort,
  year,
  rating,
  onQueryChange,
  onGenreChange,
  onSortChange,
  onYearChange,
  onRatingChange,
  onReset,
}: DiscoverFiltersProps) {
  const hasFilters =
    query ||
    genre ||
    year ||
    rating > 0 ||
    sort !== "popularity.desc";

  return (
    <section className="rounded-3xl border border-white/10 bg-[#080808] p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

          <Input
            value={query}
            onChange={(event) =>
              onQueryChange(event.target.value)
            }
            placeholder="Search for a film..."
            className="h-12 border-white/10 bg-black pl-11 pr-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />

          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs text-white/35">
              Genre
            </span>

            <select
              value={genre}
              onChange={(event) =>
                onGenreChange(event.target.value)
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-[#6D001A]"
            >
              {genres.map((item) => (
                <option
                  key={item.id || "all"}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs text-white/35">
              Sort by
            </span>

            <select
              value={sort}
              onChange={(event) =>
                onSortChange(event.target.value)
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-[#6D001A]"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs text-white/35">
              Release year
            </span>

            <Input
              type="number"
              min="1900"
              max={new Date().getFullYear() + 5}
              value={year}
              onChange={(event) =>
                onYearChange(event.target.value)
              }
              placeholder="Any year"
              className="h-11 border-white/10 bg-black text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center justify-between text-xs text-white/35">
              Minimum rating

              <span className="text-white/60">
                {rating > 0 ? `${rating}/10` : "Any"}
              </span>
            </span>

            <input
              type="range"
              min="0"
              max="9"
              step="1"
              value={rating}
              onChange={(event) =>
                onRatingChange(Number(event.target.value))
              }
              className="mt-3 w-full accent-[#6D001A]"
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <SlidersHorizontal className="size-3.5" />
            Refine your discovery
          </div>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-white/40 hover:bg-white/5 hover:text-white"
            >
              Reset filters
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}