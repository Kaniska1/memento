"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SearchMovie = {
  id: number;
  title: string;
  year: string;
  poster: string | null;
  rating: number;
  genre: string;
};

type SearchResponse = {
  results: SearchMovie[];
  message?: string;
};

type MobileSearchProps = {
  trigger?: React.ReactNode;
};

export function MobileSearch({
  trigger,
}: MobileSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!open || trimmedQuery.length < 2) {
      setResults([]);
      setError("");
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setError("");

      try {
        const response = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(
            trimmedQuery,
          )}`,
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

        setResults(data.results.slice(0, 15));
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
  }, [query, open]);

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setError("");
  }

  function openMovie(movieId: number) {
    closeSearch();
    router.push(`/movies/${movieId}`);
  }

  function viewAllResults() {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return;
    }

    closeSearch();

    router.push(
      `/discover?query=${encodeURIComponent(trimmedQuery)}`,
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setQuery("");
          setResults([]);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-white/55 hover:bg-white/[0.06] hover:text-white md:hidden"
            aria-label="Search movies"
          >
            <Search className="size-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="
          inset-0
          h-dvh
          w-screen
          max-w-none
          translate-x-0
          translate-y-0
          rounded-none
          border-0
          bg-black
          p-0
          text-white
          md:hidden
        "
      >
        <DialogTitle className="sr-only">
          Search movies
        </DialogTitle>

        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/95 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="size-5" />
            </button>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

              <Input
                ref={inputRef}
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    viewAllResults();
                  }
                }}
                placeholder="Search movies..."
                className="h-12 border-white/10 bg-[#090909] pl-11 pr-11 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
              />

              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                {isSearching ? (
                  <LoaderCircle className="size-4 animate-spin text-white/35" />
                ) : query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="text-white/30 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-5">
          {query.trim().length < 2 && (
            <div className="flex min-h-[55vh] items-center justify-center">
              <div className="max-w-xs text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
                  <Search className="size-6" />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-white">
                  Search the archive
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/35">
                  Find movies by title and open their Memento page.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">
              {error}
            </div>
          )}

          {!error &&
            !isSearching &&
            query.trim().length >= 2 &&
            results.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#080808] px-5 py-12 text-center">
                <p className="text-sm text-white/40">
                  No movies found for “{query}”.
                </p>
              </div>
            )}

          {results.length > 0 && (
            <>
              <div className="space-y-2">
                {results.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => openMovie(movie.id)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[#080808] p-3 text-left transition hover:border-white/20 hover:bg-[#0C0C0C]"
                  >
                    <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-white/5">
                      {movie.poster ? (
                        <Image
                          src={movie.poster}
                          alt={`${movie.title} poster`}
                          fill
                          className="object-cover"
                          sizes="56px"
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
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={viewAllResults}
                className="mt-5 h-11 w-full border-white/10 bg-[#090909] text-white hover:bg-white hover:text-black"
              >
                View all results
              </Button>
            </>
          )}
        </main>
      </DialogContent>
    </Dialog>
  );
}