"use client";

import { useEffect, useState } from "react";
import {
  LoaderCircle,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { RecommendationCard } from "./recommendation-card";

import type {
  RecommendedMovie,
  StoredOnboardingPreferences,
} from "@/types/recommendation";

type RecommendationResponse = {
  results: RecommendedMovie[];
  message?: string;
};

export function RecommendationsClient() {
  const [movies, setMovies] = useState<RecommendedMovie[]>([]);
  const [preferences, setPreferences] =
    useState<StoredOnboardingPreferences | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const storedPreferences = localStorage.getItem(
      "memento:onboarding",
    );

    if (!storedPreferences) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(
        storedPreferences,
      ) as StoredOnboardingPreferences;

      setPreferences(parsed);
    } catch {
      setError("Your saved taste profile could not be read.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!preferences) {
      return;
    }

    const controller = new AbortController();

    async function loadRecommendations() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          favourites:
            preferences?.favouriteMovieIds.join(",") ?? "",
          genres:
            preferences?.preferredGenreIds.join(",") ?? "",
        });

        const response = await fetch(
          `/api/tmdb/recommendations?${params.toString()}`,
          {
            signal: controller.signal,
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

        setMovies(data.results);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load recommendations.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => controller.abort();
  }, [preferences, reloadKey]);

  if (!preferences && !isLoading && !error) {
    return (
      <div className="px-5 py-10 sm:px-8">
        <div className="mx-auto flex min-h-[600px] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-[#080808] p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
              <Sparkles className="size-5" />
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-white">
              Build your taste profile first.
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/40">
              Choose your favourites, genres, and initial
              ratings so Memento has something better than
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
                Your taste, interpreted
              </p>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Made for you.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40 sm:text-base">
              Recommendations shaped by your favourite films,
              preferred genres, and ratings.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setReloadKey((current) => current + 1)
            }
            disabled={isLoading}
            className="border-white/10 bg-[#090909] text-white hover:bg-white hover:text-black"
          >
            <RefreshCcw
              className={`mr-2 size-4 ${
                isLoading ? "animate-spin" : ""
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
                  Studying your cinematic taste...
                </p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-14 text-center">
              <p className="text-sm text-red-300">
                {error}
              </p>

              <Button
                type="button"
                onClick={() =>
                  setReloadKey((current) => current + 1)
                }
                className="mt-5 bg-[#6D001A] text-white hover:bg-[#850522]"
              >
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !error && movies.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {movies.map((movie) => (
                <RecommendationCard
                  key={movie.id}
                  movie={movie}
                />
              ))}
            </div>
          )}

          {!isLoading &&
            !error &&
            preferences &&
            movies.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-[#080808] px-6 py-14 text-center">
                <p className="text-sm text-white/40">
                  We could not find enough recommendations for
                  that taste profile yet.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}