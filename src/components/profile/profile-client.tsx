"use client";

import { useEffect, useMemo, useState } from "react";

import { FavouriteFilms } from "./favourite-films";
import { ProfileHeader } from "./profile-header";
import { ProfileStats } from "./profile-stats";
import { RatingDistribution } from "./rating-distribution";
import { TasteDna } from "./taste-dna";

import { getDiaryEntries } from "@/lib/diary-storage";
import { getWatchlist } from "@/lib/watchlist-storage";

import type { DiaryEntry } from "@/types/diary";
import type {
  ProfileFavouriteMovie,
  RatingDistributionItem,
  TasteCategory,
} from "@/types/profile";
import type { StoredOnboardingPreferences } from "@/types/recommendation";
import type { WatchlistMovie } from "@/types/watchlist";
import {
  getSettings,
  saveSettings,
} from "@/lib/settings-storage";
import {
  defaultSettings,
  type MementoSettings,
} from "@/types/settings";

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
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
  const [preferences, setPreferences] =
    useState<StoredOnboardingPreferences | null>(null);
  const [favourites, setFavourites] =
    useState<StoredFavourite[]>([]);
  const [settings, setSettings] =
    useState<MementoSettings>(defaultSettings);

  useEffect(() => {
    setDiaryEntries(getDiaryEntries());
    setWatchlist(getWatchlist());
    setSettings(getSettings());

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

    const storedPreferences = localStorage.getItem(
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

    const storedFavourites = localStorage.getItem(
      "memento:favourite-movies",
    );

    if (storedFavourites) {
      try {
        setFavourites(
          JSON.parse(storedFavourites) as StoredFavourite[],
        );
      } catch {
        setFavourites([]);
      }
    }
  }, []);

  const watchedEntries = diaryEntries.filter(
    (entry) => !entry.isRewatch,
  );

  const averageRating = useMemo(() => {
    const ratedEntries = diaryEntries.filter(
      (entry) => entry.rating > 0,
    );

    if (ratedEntries.length === 0) {
      return 0;
    }

    return (
      ratedEntries.reduce(
        (sum, entry) => sum + entry.rating,
        0,
      ) / ratedEntries.length
    );
  }, [diaryEntries]);

  const ratingDistribution = useMemo<RatingDistributionItem[]>(() => {
    const values = [
      0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
    ];

    return values.map((rating) => ({
      rating,
      count: diaryEntries.filter(
        (entry) => entry.rating === rating,
      ).length,
    }));
  }, [diaryEntries]);

  const tasteDna = useMemo<TasteCategory[]>(() => {
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

    const weights = selectedGenres.map((genreId, index) => ({
      label: genreMap[genreId] || "Film",
      score: Math.max(30 - index * 4, 10),
    }));

    const totalScore = weights.reduce(
      (sum, item) => sum + item.score,
      0,
    );

    return weights.slice(0, 5).map((item) => ({
      label: item.label,
      percentage: Math.round(
        (item.score / totalScore) * 100,
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
        <ProfileHeader
            name={settings.displayName}
            username={settings.username}
            bio={settings.bio}
            joinedAt="2026-08-01"
            onSave={handleProfileSave}
        />

        <ProfileStats
          filmsWatched={watchedEntries.length}
          hoursWatched={estimatedHours}
          averageRating={averageRating}
          rewatchCount={
            diaryEntries.filter(
              (entry) => entry.isRewatch,
            ).length
          }
          likedCount={
            diaryEntries.filter((entry) => entry.liked)
              .length
          }
          watchlistCount={watchlist.length}
        />

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <TasteDna categories={tasteDna} />

          <RatingDistribution
            distribution={ratingDistribution}
          />
        </div>

        <FavouriteFilms movies={favourites} />
      </div>
    </div>
  );
}

