"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileSearch } from "@/components/app/mobile-search";
import { getSettings } from "@/lib/settings-storage";
import { NotificationPanel } from "@/components/app/notification-panel";

type SearchMovie = {
  id: number;
  title: string;
  year: string;
  poster: string | null;
  rating: number;
  genre: string;
  overview?: string;
};

type SearchResponse = {
  results: SearchMovie[];
  message?: string;
};

export function AppTopbar() {
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState("User");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function loadProfile() {
      setDisplayName(getSettings().displayName || "User");
    }

    loadProfile();

    window.addEventListener("memento:settings-updated", loadProfile);

    return () => {
      window.removeEventListener("memento:settings-updated", loadProfile);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setError("");
      setIsSearching(false);
      setActiveIndex(-1);
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
          throw new Error(
            data.message || "Could not search for movies.",
          );
        }

        setResults(data.results.slice(0, 7));
        setSearchOpen(true);
        setActiveIndex(-1);
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
            : "Could not search for movies.",
        );

        setResults([]);
        setSearchOpen(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(
          event.target as Node,
        )
      ) {
        setSearchOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setError("");
    setSearchOpen(false);
    setActiveIndex(-1);
  }

  function openMovie(movieId: number) {
    clearSearch();
    router.push(`/movies/${movieId}`);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (!searchOpen || results.length === 0) {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        current >= results.length - 1
          ? 0
          : current + 1,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        current <= 0
          ? results.length - 1
          : current - 1,
      );

      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      openMovie(results[activeIndex].id);
      return;
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="flex h-20 items-center gap-4 px-5 sm:px-8">
        <div
          ref={searchContainerRef}
          className="relative hidden max-w-xl flex-1 md:block"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-white/30" />

          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (
                query.trim().length >= 2 ||
                results.length > 0
              ) {
                setSearchOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search films, actors, directors..."
            role="combobox"
            aria-expanded={searchOpen}
            aria-controls="global-search-results"
            aria-activedescendant={
              activeIndex >= 0
                ? `global-search-result-${results[activeIndex]?.id}`
                : undefined
            }
            className="h-11 border-white/10 bg-[#090909] pl-11 pr-11 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />

          <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
            {isSearching && (
              <LoaderCircle className="size-4 animate-spin text-white/35" />
            )}

            {query && !isSearching && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="text-white/30 transition-colors hover:text-white"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {searchOpen && query.trim().length >= 2 && (
            <div
              id="global-search-results"
              className="absolute left-0 right-0 top-[calc(100%+0.75rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-2xl shadow-black/70"
            >
              {error && (
                <div className="px-5 py-6 text-sm text-red-300">
                  {error}
                </div>
              )}

              {!error &&
                !isSearching &&
                results.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-white/40">
                      No films found for “{query}”.
                    </p>
                  </div>
                )}

              {results.length > 0 && (
                <div className="max-h-[460px] overflow-y-auto py-2">
                  {results.map((movie, index) => {
                    const active = index === activeIndex;

                    return (
                      <button
                        key={movie.id}
                        id={`global-search-result-${movie.id}`}
                        type="button"
                        onMouseEnter={() =>
                          setActiveIndex(index)
                        }
                        onClick={() => openMovie(movie.id)}
                        className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
                          active
                            ? "bg-[#160006]"
                            : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
                          {movie.poster ? (
                            <Image
                              src={movie.poster}
                              alt={`${movie.title} poster`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-white/25">
                              No poster
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {movie.title}
                          </p>

                          <p className="mt-1 text-xs text-white/35">
                            {movie.year} · {movie.genre}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-white/40">
                          {movie.rating.toFixed(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                <p className="text-[10px] text-white/25">
                  Use ↑ ↓ and Enter
                </p>

                <Link
                  href={
                    query.trim().length >= 2
                      ? `/discover?query=${encodeURIComponent(
                          query.trim(),
                        )}`
                      : "/discover"
                  }
                  onClick={() => setSearchOpen(false)}
                  className="text-xs font-medium text-white/45 transition-colors hover:text-white"
                >
                  View all results
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <MobileSearch />

          <NotificationPanel />

          <button
    type="button"
    onClick={() => router.push("/profile")}
    className="flex items-center gap-3 rounded-full border border-white/10 bg-[#090909] py-1.5 pl-1.5 pr-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
  >
    <div className="flex size-8 items-center justify-center rounded-full bg-[#6D001A] text-xs font-semibold text-white">
      {initials}
    </div>

    <div className="hidden text-left sm:block">
      <p className="max-w-28 truncate text-xs font-medium text-white">
        {displayName}
      </p>

      <p className="text-[10px] text-white/35">
        View profile
      </p>
    </div>
  </button>
</div>
      </div>
    </header>
  );
}