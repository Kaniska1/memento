"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FavouritePicker } from "./favourite-picker";
import { GenrePicker } from "./genre-picker";
import { InitialRatings } from "./initial-ratings";
import { OnboardingProgress } from "./onboarding-progress";

import type {
  InitialRating,
  OnboardingMovie,
  OnboardingMoviesResponse,
} from "@/types/onboarding";

export function OnboardingFlow() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [favourites, setFavourites] = useState<OnboardingMovie[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [ratings, setRatings] = useState<InitialRating[]>([]);

  const [ratingMovies, setRatingMovies] = useState<OnboardingMovie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [movieLoadError, setMovieLoadError] = useState("");

  useEffect(() => {
    if (step !== 3 || selectedGenres.length === 0) {
      return;
    }

    const controller = new AbortController();

    async function loadRatingMovies() {
      setIsLoadingMovies(true);
      setMovieLoadError("");

      try {
        const response = await fetch(
          `/api/tmdb/onboarding-movies?genres=${selectedGenres.join(",")}`,
          {
            signal: controller.signal,
          },
        );

        const data =
          (await response.json()) as OnboardingMoviesResponse;

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load movies for your genres.",
          );
        }

        const favouriteIds = new Set(
          favourites.map((movie) => movie.id),
        );

        const uniqueMovies = data.results.filter(
          (movie) => !favouriteIds.has(movie.id),
        );

        setRatingMovies(uniqueMovies.slice(0, 10));
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setMovieLoadError(
          error instanceof Error
            ? error.message
            : "Could not load movies.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingMovies(false);
        }
      }
    }

    loadRatingMovies();

    return () => {
      controller.abort();
    };
  }, [step, selectedGenres, favourites]);

  const canContinue =
    step === 1
      ? favourites.length === 4
      : step === 2
        ? selectedGenres.length >= 3
        : ratings.length >= 5;

  function continueFlow() {
    if (!canContinue) return;

    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    const preferences = {
      favouriteMovieIds: favourites.map((movie) => movie.id),
      preferredGenreIds: selectedGenres,
      initialRatings: ratings,
    };
    
    localStorage.setItem(
      "memento:onboarding",
      JSON.stringify(preferences),
    );

    localStorage.setItem(
      "memento:favourite-movies",
      JSON.stringify(
        favourites.map((movie) => ({
          id: movie.id,
          title: movie.title,
          year: movie.year,
          poster: movie.poster,
        })),
      ),
    );

    router.push("/home");
  }

  function retryMovieLoad() {
    setStep(2);

    window.setTimeout(() => {
      setStep(3);
    }, 0);
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <p className="text-lg font-semibold tracking-[0.22em] text-white">
            MEMENTO
          </p>

          <button
            type="button"
            className="text-sm text-white/35 transition-colors hover:text-white"
          >
            Save and exit
          </button>
        </header>

        <div className="mx-auto mt-16 max-w-4xl">
          <OnboardingProgress
            currentStep={step}
            totalSteps={3}
          />

          <section className="mt-12">
            {step === 1 && (
              <>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8E1231]">
                  Start with what you love
                </p>

                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white md:text-6xl">
                  Choose four favourites.
                </h1>

                <p className="mt-4 text-white/45">
                  Search for four films that best represent your taste.
                </p>

                <div className="mt-10">
                  <FavouritePicker
                    selectedMovies={favourites}
                    onChange={setFavourites}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8E1231]">
                  Shape your taste
                </p>

                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white md:text-6xl">
                  Which genres pull you in?
                </h1>

                <p className="mt-4 text-white/45">
                  Choose at least three genres to shape your first
                  recommendations.
                </p>

                <div className="mt-10">
                  <GenrePicker
                    selectedGenres={selectedGenres}
                    onChange={setSelectedGenres}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8E1231]">
                  A few first impressions
                </p>

                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white md:text-6xl">
                  Rate what you remember.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
                  Rate at least five films you have seen. Leave unfamiliar
                  titles blank. These ratings will help build your first
                  recommendation profile.
                </p>

                <div className="mt-10">
                  {isLoadingMovies && (
                    <div className="flex min-h-72 items-center justify-center rounded-2xl border border-white/10 bg-[#080808]">
                      <div className="text-center">
                        <LoaderCircle className="mx-auto size-6 animate-spin text-[#8E1231]" />

                        <p className="mt-4 text-sm text-white/40">
                          Finding familiar films from your genres...
                        </p>
                      </div>
                    </div>
                  )}

                  {movieLoadError && !isLoadingMovies && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                      <p className="text-sm text-red-300">
                        {movieLoadError}
                      </p>

                      <button
                        type="button"
                        onClick={retryMovieLoad}
                        className="mt-4 text-sm font-medium text-white underline underline-offset-4"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {!isLoadingMovies &&
                    !movieLoadError &&
                    ratingMovies.length > 0 && (
                      <InitialRatings
                        movies={ratingMovies}
                        ratings={ratings}
                        onChange={setRatings}
                      />
                    )}

                  {!isLoadingMovies &&
                    !movieLoadError &&
                    ratingMovies.length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-[#080808] p-8 text-center">
                        <p className="text-sm text-white/40">
                          No suitable films were found for those genres.
                        </p>
                      </div>
                    )}
                </div>
              </>
            )}
          </section>

          <footer className="mt-14 flex items-center justify-between border-t border-white/10 pt-8">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 1}
              onClick={() =>
                setStep((current) => Math.max(1, current - 1))
              }
              className="text-white/55 hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>

            <div className="flex items-center gap-4">
              {step === 3 && (
                <p className="hidden text-xs text-white/35 sm:block">
                  {ratings.length}/5 minimum ratings
                </p>
              )}

              <Button
                type="button"
                disabled={!canContinue}
                onClick={continueFlow}
                className="h-11 bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
              >
                {step === 3 ? "Build my profile" : "Continue"}

                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}