"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  Clapperboard,
  LoaderCircle,
  RefreshCcw,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  fetchOnboardingPreferences,
} from "@/lib/api/onboarding";

import {
  recordRecommendationImpressions,
  type RecommendationImpressionInput,
  type RecommendationMeta,
} from "@/lib/api/recommendation-impressions";

import { RecommendationCard } from "./recommendation-card";

import type {
  RecommendedMovie,
  StoredOnboardingPreferences,
} from "@/types/recommendation";

const MAX_RECENT_BATCHES = 4;

type RecommendationResponse = {
  results: RecommendedMovie[];

  meta?: {
    /*
     * API naming: totalSeenCount includes
     * watched interactions + "seen" feedback.
     *
     * RecommendationMeta still calls this
     * watchedCount, so we map it explicitly
     * below when recording impressions.
     */
    totalSeenCount: number;

    experienceScore: number;

    recommendationStyle:
      | "familiar"
      | "balanced"
      | "adventurous";

    refreshRotation?: {
      requestedBatches: number;
      enforcedBatches: number;
      temporarilyExcluded: number;
    };

    historicalTaste?: {
      learnedGenres?: string[];
      historySeedCount?: number;
      internationalAffinity?: number;
      obscureAffinity?: number;
    };
  };

  message?: string;
};

export function RecommendationsClient() {
  const [movies, setMovies] =
    useState<RecommendedMovie[]>([]);

  const [
    preferences,
    setPreferences,
  ] =
    useState<StoredOnboardingPreferences | null>(
      null,
    );

  const [
    recommendationMeta,
    setRecommendationMeta,
  ] =
    useState<RecommendationMeta | null>(
      null,
    );

  const [
    displayMeta,
    setDisplayMeta,
  ] = useState<{
    totalSeenCount: number;
    experienceScore: number;
    recommendationStyle:
      | "familiar"
      | "balanced"
      | "adventurous";
    learnedGenres: string[];
  } | null>(null);

  const [
    isLoadingPreferences,
    setIsLoadingPreferences,
  ] = useState(true);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Oldest -> newest recommendation batches.
   *
   * This is intentionally kept only in
   * memory. Refresh rotation is temporary UI
   * state, not user taste or ML feedback.
   */
  const recentBatches =
    useRef<number[][]>([]);

  const pendingImpressions =
    useRef<
      RecommendationImpressionInput[]
    >([]);

  const recordedMovieIds =
    useRef<Set<number>>(
      new Set(),
    );

  const flushTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  /*
   * Load taste profile from MongoDB.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      setIsLoadingPreferences(true);
      setError("");

      try {
        const data =
          await fetchOnboardingPreferences();

        if (!cancelled) {
          setPreferences(data);
        }
      } catch (loadError) {
        console.error(
          "Could not load taste profile:",
          loadError,
        );

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your taste profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreferences(
            false,
          );
        }
      }
    }

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadRecommendations =
    useCallback(
      async (
        batches:
          number[][] = [],
      ) => {
        if (!preferences) {
          return;
        }

        setIsLoading(true);
        setError("");

        try {
          const params =
            new URLSearchParams();

          if (
            batches.length > 0
          ) {
            params.set(
              "recentBatches",
              JSON.stringify(
                batches,
              ),
            );
          }

          const query =
            params.toString();

          const endpoint =
            query
              ? `/api/tmdb/recommendations?${query}`
              : "/api/tmdb/recommendations";

          const response =
            await fetch(
              endpoint,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              },
            );

          const data =
            (await response.json()) as RecommendationResponse;

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Could not load your recommendations.",
            );
          }

          /*
           * New recommendation batch =
           * new impression tracking session.
           */
          recordedMovieIds.current.clear();

          pendingImpressions.current =
            [];

          if (flushTimer.current) {
            clearTimeout(
              flushTimer.current,
            );

            flushTimer.current =
              null;
          }

          const nextMovies =
            data.results ?? [];

          setMovies(
            nextMovies,
          );

          if (data.meta) {
            setRecommendationMeta({
              watchedCount:
                data.meta.totalSeenCount,

              experienceScore:
                data.meta.experienceScore,

              recommendationStyle:
                data.meta.recommendationStyle,
            });

            setDisplayMeta({
              totalSeenCount:
                data.meta.totalSeenCount,

              experienceScore:
                data.meta.experienceScore,

              recommendationStyle:
                data.meta.recommendationStyle,

              learnedGenres:
                data.meta.historicalTaste
                  ?.learnedGenres ??
                [],
            });
          } else {
            setRecommendationMeta(
              null,
            );

            setDisplayMeta(
              null,
            );
          }
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load recommendations.",
          );
        } finally {
          setIsLoading(false);
        }
      },
      [preferences],
    );

  /*
   * Initial load has no temporary exclusions.
   */
  useEffect(() => {
    if (!preferences) {
      return;
    }

    void loadRecommendations(
      [],
    );
  }, [
    preferences,
    loadRecommendations,
  ]);

  const flushImpressions =
    useCallback(() => {
      if (
        pendingImpressions.current
          .length === 0 ||
        !recommendationMeta
      ) {
        return;
      }

      const pending = [
        ...pendingImpressions.current,
      ];

      pendingImpressions.current =
        [];

      void recordRecommendationImpressions(
        pending,
        recommendationMeta,
      ).catch((error) => {
        console.error(
          "Could not record recommendation impressions:",
          error,
        );
      });
    }, [recommendationMeta]);

  const handleImpression =
    useCallback(
      (
        movie: RecommendedMovie,
        position: number,
      ) => {
        if (
          recordedMovieIds.current.has(
            movie.id,
          )
        ) {
          return;
        }

        recordedMovieIds.current.add(
          movie.id,
        );

        pendingImpressions.current.push({
          movie,
          position,
        });

        if (
          flushTimer.current
        ) {
          clearTimeout(
            flushTimer.current,
          );
        }

        flushTimer.current =
          setTimeout(() => {
            flushTimer.current =
              null;

            flushImpressions();
          }, 600);
      },
      [flushImpressions],
    );

  /*
   * Flush any pending impressions
   * before the component disappears.
   */
  useEffect(() => {
    return () => {
      if (flushTimer.current) {
        clearTimeout(
          flushTimer.current,
        );
      }

      flushImpressions();
    };
  }, [flushImpressions]);

  const handleRefreshPicks =
    useCallback(() => {
      if (
        isLoading ||
        movies.length === 0
      ) {
        return;
      }

      const currentBatch =
        movies.map(
          (movie) =>
            movie.id,
        );

      const nextBatches =
        [
          ...recentBatches.current,
          currentBatch,
        ].slice(
          -MAX_RECENT_BATCHES,
        );

      /*
       * Store first so the next click sees
       * the updated history, then pass the
       * exact same array directly into this
       * refresh request.
       *
       * No reloadKey/useEffect indirection:
       * the click itself creates the request.
       */
      recentBatches.current =
        nextBatches;

      void loadRecommendations(
        nextBatches,
      );
    }, [
      isLoading,
      movies,
      loadRecommendations,
    ]);

  if (isLoadingPreferences) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-[#8E1231]" />

          <p className="mt-4 text-sm text-white/35">
            Loading your taste
            profile...
          </p>
        </div>
      </div>
    );
  }

  if (
    !preferences &&
    !error
  ) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <div className="mx-auto flex min-h-[600px] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-[#080808] p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
              <Sparkles className="size-5" />
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-white">
              Build your taste
              profile first.
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/40">
              Choose your favourites,
              genres, and any initial
              ratings so Memento has
              something better than
              guesswork.
            </p>

            <Button
              asChild
              className="mt-7 bg-[#6D001A] text-white hover:bg-[#850522]"
            >
              <Link href="/onboarding">
                Complete onboarding
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(142,18,49,0.16),transparent_34%),linear-gradient(180deg,#090909,#060606)] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[#B21E44]">
                <WandSparkles className="size-4" />

                <p className="text-[10px] font-medium uppercase tracking-[0.22em]">
                  Your taste, interpreted
                </p>
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-white md:text-6xl">
                Made for you.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
                A living recommendation feed shaped by your ratings, viewing history,
                imported Letterboxd data, and the films you actually engage with.
              </p>

              {displayMeta && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] text-white/45">
                    {displayMeta.totalSeenCount} films learned from
                  </span>

                  <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] capitalize text-white/45">
                    {displayMeta.recommendationStyle} discovery
                  </span>

                  {displayMeta.learnedGenres
                    .slice(0, 3)
                    .map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-[#6D001A]/40 bg-[#160006]/70 px-3 py-1.5 text-[11px] text-[#D77A92]"
                      >
                        {genre}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                asChild
                variant="outline"
                className="border-white/10 bg-black/30 text-white/70 hover:bg-white hover:text-black"
              >
                <Link href="/watchlist">
                  <Clapperboard className="mr-2 size-4" />
                  Watchlist
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={
                  handleRefreshPicks
                }
                disabled={
                  isLoading
                }
                className="border-[#6D001A]/50 bg-[#160006] text-white hover:bg-[#6D001A] hover:text-white"
              >
                <RefreshCcw
                  className={`mr-2 size-4 ${
                    isLoading
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh picks
              </Button>
            </div>
          </div>
        </header>

        <div className="mt-10">
          {isLoading && (
            <div>
              <div className="mb-5 flex items-center gap-2 text-sm text-white/35">
                <LoaderCircle className="size-4 animate-spin text-[#8E1231]" />
                Re-ranking your next set of films...
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from(
                  {
                    length: 10,
                  },
                ).map((_, index) => (
                  <RecommendationSkeleton
                    key={index}
                  />
                ))}
              </div>
            </div>
          )}

          {error &&
            !isLoading && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-14 text-center">
                <p className="text-sm text-red-300">
                  {error}
                </p>

                <Button
                  type="button"
                  onClick={() =>
                    void loadRecommendations(
                      recentBatches.current,
                    )
                  }
                  className="mt-5 bg-[#6D001A] text-white hover:bg-[#850522]"
                >
                  Try again
                </Button>
              </div>
            )}

          {!isLoading &&
            !error &&
            movies.length > 0 && (
              <div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
                      Current selection
                    </p>

                    <p className="mt-1 text-sm text-white/45">
                      {movies.length} films ranked for your current taste
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {movies.map(
                  (
                    movie,
                    index,
                  ) => (
                    <RecommendationCard
                      key={
                        movie.id
                      }
                      movie={
                        movie
                      }
                      onImpression={() =>
                        handleImpression(
                          movie,
                          index,
                        )
                      }
                    />
                  ),
                )}
                </div>
              </div>
            )}

          {!isLoading &&
            !error &&
            preferences !== null &&
            movies.length ===
              0 && (
              <div className="rounded-3xl border border-white/10 bg-[#080808] px-6 py-14 text-center">
                <p className="text-sm text-white/40">
                  We could not find
                  enough recommendations
                  for that taste profile
                  yet.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="aspect-[2/3] rounded-2xl border border-white/10 bg-white/[0.045]" />

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
        <div className="h-2.5 w-20 rounded bg-white/10" />
        <div className="mt-3 h-2.5 w-full rounded bg-white/[0.08]" />
        <div className="mt-2 h-2.5 w-3/4 rounded bg-white/[0.06]" />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="h-9 rounded-xl border border-white/10 bg-white/[0.025]" />
        <div className="h-9 rounded-xl border border-white/10 bg-white/[0.025]" />
      </div>
    </div>
  );
}