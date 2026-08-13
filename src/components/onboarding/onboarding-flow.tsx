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
} from "@/types/onboarding";

export function OnboardingFlow() {
  const router = useRouter();

  const [step, setStep] =
    useState(1);

  const [favourites, setFavourites] =
    useState<OnboardingMovie[]>([]);

  const [
    selectedGenres,
    setSelectedGenres,
  ] = useState<number[]>([]);

  const [ratings, setRatings] =
    useState<InitialRating[]>([]);

  const [
    ratingMovies,
    setRatingMovies,
  ] = useState<OnboardingMovie[]>([]);

  const [
    isLoadingMovies,
    setIsLoadingMovies,
  ] = useState(false);

  const [
    movieLoadError,
    setMovieLoadError,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  useEffect(() => {
    if (
      step !== 3 ||
      selectedGenres.length === 0
    ) {
      return;
    }

    const controller =
      new AbortController();

    async function loadMovies() {
      setIsLoadingMovies(true);
      setMovieLoadError("");

      try {
        const genreQuery =
          selectedGenres.join("|");

        const response =
          await fetch(
            `/api/onboarding/movies?genres=${encodeURIComponent(
              genreQuery,
            )}`,
            {
              signal:
                controller.signal,
            },
          );

        const data =
          (await response.json()) as {
            movies?: OnboardingMovie[];
            message?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not load movies.",
          );
        }

        setRatingMovies(
          data.movies ?? [],
        );
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
        if (
          !controller.signal.aborted
        ) {
          setIsLoadingMovies(false);
        }
      }
    }

    loadMovies();

    return () => {
      controller.abort();
    };
  }, [step, selectedGenres]);

  const canContinue =
    step === 1
      ? favourites.length >= 1 &&
        favourites.length <= 5
      : step === 2
        ? selectedGenres.length >= 1
        : true;

  async function continueFlow() {
    if (
      !canContinue ||
      isSubmitting
    ) {
      return;
    }

    if (step < 3) {
      setStep(
        (current) =>
          current + 1,
      );

      return;
    }

    const preferences = {
      favouriteMovies:
        favourites.map(
          (movie) => ({
            movieId: movie.id,

            title:
              movie.title,

            year:
              movie.year,

            poster:
              movie.poster,

            genre:
              movie.genre ??
              "Film",
          }),
        ),

      preferredGenreIds:
        selectedGenres,

      initialRatings:
        ratings,
    };

    setIsSubmitting(true);
    setMovieLoadError("");

    try {
      const response =
        await fetch(
          "/api/onboarding",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify(
                preferences,
              ),
          },
        );

      const data =
        (await response.json()) as {
          success?: boolean;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not save onboarding.",
        );
      }

      /*
       * No localStorage copy.
       * MongoDB is now the source of truth.
       */
      router.replace("/home");
      router.refresh();
    } catch (error) {
      console.error(
        "Could not complete onboarding:",
        error,
      );

      setMovieLoadError(
        error instanceof Error
          ? error.message
          : "Could not save your taste profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
            onClick={() =>
              router.replace(
                "/home",
              )
            }
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
                  Choose your favourites.
                </h1>

                <p className="mt-4 text-white/45">
                  Pick up to five films that
                  best represent your taste.
                  You can change these
                  anytime.
                </p>

                <p className="mt-3 text-xs text-white/30">
                  {favourites.length}/5
                  selected
                </p>

                <div className="mt-10">
                  <FavouritePicker
                    selectedMovies={
                      favourites
                    }
                    onChange={
                      setFavourites
                    }
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
                  Choose at least one genre
                  to shape your first
                  recommendations.
                </p>

                <div className="mt-10">
                  <GenrePicker
                    selectedGenres={
                      selectedGenres
                    }
                    onChange={
                      setSelectedGenres
                    }
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
                  Rate what you&apos;ve
                  seen.
                </h1>

                <p className="mt-4 max-w-xl text-white/45">
                  These are popular films
                  from the genres you chose.
                  Rate any you&apos;ve
                  already watched and skip
                  the rest.
                </p>

                <div className="mt-10">
                  {isLoadingMovies ? (
                    <div className="flex min-h-64 items-center justify-center">
                      <LoaderCircle className="size-6 animate-spin text-[#8E1231]" />
                    </div>
                  ) : movieLoadError ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
                      {movieLoadError}
                    </div>
                  ) : (
                    <InitialRatings
                      movies={
                        ratingMovies
                      }
                      ratings={
                        ratings
                      }
                      onChange={
                        setRatings
                      }
                    />
                  )}
                </div>
              </>
            )}
          </section>

          <footer className="mt-14 flex items-center justify-between border-t border-white/10 pt-8">
            <Button
              type="button"
              variant="ghost"
              disabled={
                step === 1 ||
                isSubmitting
              }
              onClick={() =>
                setStep(
                  (current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                )
              }
              className="text-white/55 hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>

            <div className="flex items-center gap-4">
              {step === 3 && (
                <p className="hidden text-xs text-white/35 sm:block">
                  Ratings are optional
                </p>
              )}

              <Button
                type="button"
                disabled={
                  !canContinue ||
                  isSubmitting
                }
                onClick={
                  continueFlow
                }
                className="h-11 bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : step === 3 ? (
                  "Build my profile"
                ) : (
                  "Continue"
                )}

                {!isSubmitting && (
                  <ArrowRight className="ml-2 size-4" />
                )}
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}