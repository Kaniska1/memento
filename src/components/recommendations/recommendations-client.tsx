"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  LoaderCircle,
  RefreshCcw,
  Sparkles,
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
          } else {
            setRecommendationMeta(
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
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#9B1738]">
              <Sparkles className="size-4" />

              <p className="text-[10px] font-medium uppercase tracking-[0.22em]">
                Your taste,
                interpreted
              </p>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Made for you.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40 sm:text-base">
              Recommendations shaped
              by your favourite films,
              preferred genres,
              ratings, and viewing
              behaviour.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={
              handleRefreshPicks
            }
            disabled={isLoading}
            className="border-white/10 bg-[#090909] text-white hover:bg-white hover:text-black"
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
        </header>

        <div className="mt-10">
          {isLoading && (
            <div className="flex min-h-[560px] items-center justify-center rounded-3xl border border-white/10 bg-[#060606]">
              <div className="text-center">
                <LoaderCircle className="mx-auto size-7 animate-spin text-[#8E1231]" />

                <p className="mt-4 text-sm text-white/35">
                  Studying your
                  cinematic taste...
                </p>
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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