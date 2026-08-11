"use client";

import { useEffect, useMemo, useState } from "react";

import { EditFavouritesDialog } from "./edit-favourites-dialog";
import { FavouriteFilms } from "./favourite-films";
import { ProfileHeader } from "./profile-header";
import { ProfileStats } from "./profile-stats";
import { RatingDistribution } from "./rating-distribution";
import { RecentWatches } from "./recent-watches";
import { TasteDna } from "./taste-dna";

import { fetchDiaryEntries } from "@/lib/api/diary";
import { fetchProfileFavourites } from "@/lib/api/profile-favourites";
import { fetchWatchlist } from "@/lib/api/watchlist";
import { fetchWatchedMovies } from "@/lib/api/watched";
import {
  getSettings,
  saveSettings,
} from "@/lib/settings-storage";

import type { DiaryEntry } from "@/types/diary";
import type {
  ProfileFavouriteMovie,
  RatingDistributionItem,
  TasteCategory,
} from "@/types/profile";
import type { StoredOnboardingPreferences } from "@/types/recommendation";
import {
  defaultSettings,
  type MementoSettings,
} from "@/types/settings";
import type { WatchedMovie } from "@/types/watched";
import type { WatchlistMovie } from "@/types/watchlist";

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

type StoredFavourite = ProfileFavouriteMovie;

export function ProfileClient() {
  const [diaryEntries, setDiaryEntries] =
    useState<DiaryEntry[]>([]);

  const [watchlist, setWatchlist] =
    useState<WatchlistMovie[]>([]);

  const [preferences, setPreferences] =
    useState<StoredOnboardingPreferences | null>(null);

  const [favourites, setFavourites] =
    useState<StoredFavourite[]>([]);

  const [settings, setSettings] =
    useState<MementoSettings>(defaultSettings);

  const [watchedMovies, setWatchedMovies] =
    useState<WatchedMovie[]>([]);

  useEffect(() => {
    setSettings(getSettings());

    async function loadProfileData() {
      try {
        const [
          diaryData,
          watchlistData,
          favouriteData,
          watchedData,
        ] = await Promise.all([
          fetchDiaryEntries(),
          fetchWatchlist(),
          fetchProfileFavourites(),
          fetchWatchedMovies(),
        ]);

        setDiaryEntries(diaryData);
        setWatchlist(watchlistData);
        setFavourites(favouriteData);
        setWatchedMovies(watchedData);
      } catch (error) {
        console.error(
          "Could not load profile data:",
          error,
        );
      }
    }

    loadProfileData();

    const storedPreferences =
      localStorage.getItem(
        "memento:onboarding",
      );

    if (storedPreferences) {
      try {
        setPreferences(
          JSON.parse(
            storedPreferences,
          ) as StoredOnboardingPreferences,
        );
      } catch {
        setPreferences(null);
      }
    }
  }, []);

  const averageRating = useMemo(() => {
    const ratedMovies =
      watchedMovies.filter(
        (movie) =>
          movie.rating !== null &&
          movie.rating > 0,
      );

    if (ratedMovies.length === 0) {
      return 0;
    }

    const total = ratedMovies.reduce(
      (sum, movie) =>
        sum + (movie.rating ?? 0),
      0,
    );

    return total / ratedMovies.length;
  }, [watchedMovies]);

  const likedWatchedMovies =
    watchedMovies.filter(
      (movie) => movie.liked,
    ).length;

  const ratingDistribution =
    useMemo<RatingDistributionItem[]>(() => {
      const values = [
        0.5,
        1,
        1.5,
        2,
        2.5,
        3,
        3.5,
        4,
        4.5,
        5,
      ];

      return values.map((rating) => ({
        rating,

        count: watchedMovies.filter(
          (movie) =>
            movie.rating === rating,
        ).length,
      }));
    }, [watchedMovies]);

  const tasteDna =
    useMemo<TasteCategory[]>(() => {
      const selectedGenres =
        preferences?.preferredGenreIds ?? [];

      if (selectedGenres.length === 0) {
        return [
          {
            label: "Still discovering",
            percentage: 100,
          },
        ];
      }

      const weights = selectedGenres.map(
        (genreId, index) => ({
          label:
            genreMap[genreId] || "Film",

          score: Math.max(
            30 - index * 4,
            10,
          ),
        }),
      );

      const totalScore = weights.reduce(
        (sum, item) =>
          sum + item.score,
        0,
      );

      return weights
        .slice(0, 5)
        .map((item) => ({
          label: item.label,

          percentage: Math.round(
            (item.score /
              totalScore) *
              100,
          ),
        }));
    }, [preferences]);

  const estimatedHours = Math.round(
    diaryEntries.length * 2,
  );

  function handleProfileSave(profile: {
    name: string;
    username: string;
    bio: string;
  }) {
    const nextSettings: MementoSettings = {
      ...settings,

      displayName: profile.name,
      username: profile.username,
      bio: profile.bio,
    };

    setSettings(nextSettings);
    saveSettings(nextSettings);
  }

    return (
  <div className="px-5 py-8 sm:px-8 lg:py-10">
    <div className="mx-auto max-w-[1500px] space-y-10">
      {/* PROFILE HEADER */}
      <ProfileHeader
        name={settings.displayName}
        username={settings.username}
        bio={settings.bio}
        joinedAt="2026-08-01"
        onSave={handleProfileSave}
      />

      {/* MAIN PROFILE CONTENT */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)] xl:items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-10">
          <ProfileStats
            filmsWatched={watchedMovies.length}
            hoursWatched={estimatedHours}
            averageRating={averageRating}
            rewatchCount={
              diaryEntries.filter(
                (entry) => entry.isRewatch,
              ).length
            }
            likedCount={likedWatchedMovies}
            watchlistCount={watchlist.length}
          />

          <RecentWatches
            movies={diaryEntries.slice(0, 5)}
          />

          <FavouriteFilms
            movies={favourites}
            onUpdated={setFavourites}
          />
        </div>

        {/* RIGHT COLUMN */}
        <aside className="space-y-6 xl:sticky xl:top-24">
          <TasteDna
            categories={tasteDna}
          />

          <RatingDistribution
            distribution={ratingDistribution}
          />
        </aside>
      </div>
    </div>
  </div>
);
}