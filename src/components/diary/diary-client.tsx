"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  Film,
  LoaderCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { LogFilmDialog } from "@/components/movies/log-film-dialog";
import { Input } from "@/components/ui/input";

import {
  deleteDiaryEntry,
  fetchDiaryEntries,
} from "@/lib/api/diary";

import { DiaryEntryCard } from "./diary-entry-card";

import type { DiaryEntry } from "@/types/diary";

function getMonthKey(date: string) {
  const parsedDate = new Date(
    `${date}T00:00:00`,
  );

  return `${parsedDate.getFullYear()}-${parsedDate.getMonth()}`;
}

export function DiaryClient() {
  const [entries, setEntries] =
    useState<DiaryEntry[]>([]);

  const [query, setQuery] =
    useState("");

  const [sortOrder, setSortOrder] =
    useState<"newest" | "oldest">(
      "newest",
    );

  const [entryType, setEntryType] =
    useState<
      "all" | "liked" | "rewatch" | "reviewed"
    >("all");

  const [year, setYear] =
    useState("all");

  const [
    editingEntry,
    setEditingEntry,
  ] = useState<DiaryEntry | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadEntries =
    useCallback(async () => {
      setError("");

      try {
        const diaryEntries =
          await fetchDiaryEntries();

        setEntries(diaryEntries);
      } catch (loadError) {
        console.error(
          "Could not load diary:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your diary.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadEntries();

    function handleDiaryUpdate() {
      loadEntries();
    }

    window.addEventListener(
      "memento:diary-updated",
      handleDiaryUpdate,
    );

    return () => {
      window.removeEventListener(
        "memento:diary-updated",
        handleDiaryUpdate,
      );
    };
  }, [loadEntries]);

  const filteredEntries =
    useMemo(() => {
      const normalizedQuery =
        query.trim().toLowerCase();

      const result = entries.filter(
        (entry) => {
          const matchesQuery =
            normalizedQuery.length === 0 ||
            entry.movieTitle
              .toLowerCase()
              .includes(
                normalizedQuery,
              );

          const watchedYear =
            entry.watchedDate.slice(
              0,
              4,
            );

          const matchesYear =
            year === "all" ||
            watchedYear === year;

          const matchesType =
            entryType === "all" ||
            (
              entryType === "liked" &&
              entry.liked
            ) ||
            (
              entryType === "rewatch" &&
              entry.isRewatch
            ) ||
            (
              entryType === "reviewed" &&
              Boolean(
                entry.review?.trim(),
              )
            );

          return (
            matchesQuery &&
            matchesYear &&
            matchesType
          );
        },
      );

      return [...result].sort(
        (a, b) => {
          const first =
            new Date(
              `${a.watchedDate}T00:00:00`,
            ).getTime();

          const second =
            new Date(
              `${b.watchedDate}T00:00:00`,
            ).getTime();

          return sortOrder ===
            "newest"
            ? second - first
            : first - second;
        },
      );
    }, [
      entries,
      query,
      sortOrder,
      entryType,
      year,
    ]);

  const diaryYears =
    useMemo(
      () =>
        Array.from(
          new Set(
            entries.map(
              (entry) =>
                entry.watchedDate.slice(
                  0,
                  4,
                ),
            ),
          ),
        ).sort(
          (a, b) =>
            Number(b) -
            Number(a),
        ),
      [entries],
    );

  const hasActiveFilters =
    query.trim().length > 0 ||
    entryType !== "all" ||
    year !== "all";

  function clearFilters() {
    setQuery("");
    setEntryType("all");
    setYear("all");
  }

  async function handleDelete(
    entryId: string,
  ) {
    const confirmed =
      window.confirm(
        "Delete this diary entry?",
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDiaryEntry(
        entryId,
      );

      setEntries((current) =>
        current.filter(
          (entry) =>
            entry.id !== entryId,
        ),
      );
    } catch (deleteError) {
      console.error(
        "Could not delete diary entry:",
        deleteError,
      );

      window.alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this entry.",
      );
    }
  }

  function handleEdit(
    entry: DiaryEntry,
  ) {
    setEditingEntry(entry);
  }

  return (
    <>
      <div className="px-5 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-[1500px]">
          <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
                Your viewing history
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                Film diary.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
                Every watch, rewatch,
                rating, and thought—kept
                in one place.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/40">
              <CalendarDays className="size-4 text-[#9B1738]" />

              {entries.length}{" "}
              {entries.length === 1
                ? "entry"
                : "entries"}
            </div>
          </header>

          {/* Filters */}
          {entries.length > 0 && (
            <section className="mt-10 rounded-2xl border border-white/10 bg-[#080808] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-white/45">
                <SlidersHorizontal className="size-4 text-[#9B1738]" />
                Browse your diary
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_170px_170px_190px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                  <Input
                    value={query}
                    onChange={(event) =>
                      setQuery(
                        event.target.value,
                      )
                    }
                    placeholder="Search your diary..."
                    className="h-11 border-white/10 bg-black pl-11 text-white placeholder:text-white/25"
                  />
                </div>

                <label className="relative">
                  <select
                    value={year}
                    onChange={(event) =>
                      setYear(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 text-sm text-white outline-none focus:border-[#6D001A]"
                  >
                    <option value="all">
                      All years
                    </option>

                    {diaryYears.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                </label>

                <label className="relative">
                  <select
                    value={entryType}
                    onChange={(event) =>
                      setEntryType(
                        event.target
                          .value as
                          | "all"
                          | "liked"
                          | "rewatch"
                          | "reviewed",
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 text-sm text-white outline-none focus:border-[#6D001A]"
                  >
                    <option value="all">
                      All entries
                    </option>
                    <option value="liked">
                      Liked
                    </option>
                    <option value="rewatch">
                      Rewatches
                    </option>
                    <option value="reviewed">
                      With reviews
                    </option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                </label>

                <label className="relative">
                  <select
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(
                        event.target
                          .value as
                          | "newest"
                          | "oldest",
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 text-sm text-white outline-none focus:border-[#6D001A]"
                  >
                    <option value="newest">
                      Newest watches
                    </option>

                    <option value="oldest">
                      Oldest watches
                    </option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                </label>
              </div>

              <div className="mt-4 flex min-h-8 flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                <p className="text-xs text-white/30">
                  Showing{" "}
                  <span className="font-medium text-white/60">
                    {filteredEntries.length}
                  </span>{" "}
                  of {entries.length} entries
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-white/35 transition hover:text-white"
                  >
                    <RotateCcw className="size-3.5" />
                    Clear filters
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="mt-10 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
                />
              ))}

              <div className="sr-only">
                <LoaderCircle className="animate-spin" />
                Opening your diary...
              </div>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="mt-10 rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-14 text-center">
              <p className="text-sm text-red-300">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  loadEntries();
                }}
                className="mt-5 text-sm font-medium text-white hover:text-[#A51636]"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading &&
            !error && (
              <>
                {/* Column headers */}
                {filteredEntries.length >
                  0 && (
                  <div className="mt-8 hidden grid-cols-[82px_48px_64px_minmax(220px,1fr)_80px_150px_58px_72px_72px_48px] items-center gap-4 border-b border-white/10 pb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white/30 md:grid">
                    <span>
                      Month
                    </span>

                    <span>
                      Day
                    </span>

                    <span>
                      Poster
                    </span>

                    <span>
                      Film
                    </span>

                    <span>
                      Released
                    </span>

                    <span>
                      Rating
                    </span>

                    <span className="text-center">
                      Like
                    </span>

                    <span className="text-center">
                      Rewatch
                    </span>

                    <span className="text-center">
                      Review
                    </span>

                    <span className="text-center">
                      Edit
                    </span>
                  </div>
                )}

                {/* Empty diary */}
                {entries.length ===
                  0 && (
                  <div className="mt-8 flex min-h-[460px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#060606]">
                    <div className="max-w-md px-6 text-center">
                      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
                        <Film className="size-6" />
                      </div>

                      <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-white">
                        Your diary is
                        still unwritten.
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-white/40">
                        Open any movie
                        and choose “Log
                        film” to record
                        your first watch.
                      </p>
                    </div>
                  </div>
                )}

                {/* Filtered empty */}
                {entries.length > 0 &&
                  filteredEntries.length ===
                    0 && (
                    <div className="mt-8 rounded-3xl border border-white/10 bg-[#060606] px-6 py-16 text-center">
                      <SlidersHorizontal className="mx-auto size-6 text-white/20" />

                      <h2 className="mt-4 text-lg font-medium text-white">
                        No diary entries match those filters.
                      </h2>

                      <p className="mt-2 text-sm text-white/35">
                        Try another year, entry type, or title.
                      </p>

                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-5 text-sm font-medium text-white transition hover:text-[#A51636]"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}

                {/* Entries */}
                {filteredEntries.map(
                  (
                    entry,
                    index,
                  ) => {
                    const currentMonth =
                      getMonthKey(
                        entry.watchedDate,
                      );

                    const previousMonth =
                      index > 0
                        ? getMonthKey(
                            filteredEntries[
                              index - 1
                            ]
                              .watchedDate,
                          )
                        : null;

                    return (
                      <DiaryEntryCard
                        key={
                          entry.id
                        }
                        entry={
                          entry
                        }
                        showMonth={
                          index ===
                            0 ||
                          currentMonth !==
                            previousMonth
                        }
                        onDelete={
                          handleDelete
                        }
                        onEdit={
                          handleEdit
                        }
                      />
                    );
                  },
                )}
              </>
            )}
        </div>
      </div>

      {/* Edit dialog */}
      {editingEntry && (
        <LogFilmDialog
          movieId={
            editingEntry.movieId
          }
          movieTitle={
            editingEntry.movieTitle
          }
          movieYear={
            editingEntry.movieYear
          }
          moviePoster={
            editingEntry.poster
          }
          initialEntry={
            editingEntry
          }
          controlledOpen={Boolean(
            editingEntry,
          )}
          onControlledOpenChange={(
            open,
          ) => {
            if (!open) {
              setEditingEntry(
                null,
              );
            }
          }}
          onSaved={() => {
            setEditingEntry(null);
            loadEntries();
          }}
        />
      )}
    </>
  );
}