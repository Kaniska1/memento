"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";
import {
  Check,
  FileArchive,
  LoaderCircle,
  Save,
  Settings2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  fetchSettings,
  updateSettings,
} from "@/lib/api/settings";

import {
  defaultSettings,
  type MementoSettings,
} from "@/types/settings";

import { AccountSettings } from "./account-settings";
import { RecommendationSettings } from "./recommendation-settings";
import { ViewingSettings } from "./viewing-settings";

export function SettingsClient() {
  const [settings, setSettings] =
    useState<MementoSettings>(
      defaultSettings,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setError("");

        const data =
          await fetchSettings();

        setSettings(data);
      } catch (error) {
        console.error(
          "Could not load settings:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Could not load settings.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSave() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaved(false);
    setError("");

    try {
      const updated =
        await updateSettings(
          settings,
        );

      setSettings(updated);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Could not save settings:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Could not save settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function resetSettings() {
    const confirmed =
      window.confirm(
        "Reset all settings to their defaults?",
      );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setSaved(false);
    setError("");

    try {
      const updated =
        await updateSettings(
          defaultSettings,
        );

      setSettings(updated);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Could not reset settings:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Could not reset settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="px-5 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="h-4 w-32 animate-pulse rounded bg-white/[0.05]" />
          <div className="mt-4 h-14 w-72 max-w-full animate-pulse rounded-xl bg-white/[0.05]" />
          <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-white/[0.04]" />

          <div className="mt-10 space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
              />
            ))}
          </div>

          <div className="sr-only">
            <LoaderCircle className="animate-spin" />
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(142,18,49,0.12),transparent_32%),linear-gradient(180deg,#090909,#070707)] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-[#9B1738]">
                <Settings2 className="size-4" />

                <p className="text-[10px] font-medium uppercase tracking-[0.22em]">
                  Make Memento yours
                </p>
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                Settings.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
                Tune your viewing, diary, recommendation, import, and account
                preferences from one place.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#6D001A] text-white shadow-[0_8px_28px_rgba(109,0,26,0.2)] hover:bg-[#850522]"
            >
              {isSaving ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : saved ? (
                <Check className="mr-2 size-4" />
              ) : (
                <Save className="mr-2 size-4" />
              )}

              {isSaving
                ? "Saving..."
                : saved
                  ? "Saved"
                  : "Save changes"}
            </Button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-10 space-y-6">
          <ViewingSettings
            settings={settings}
            onChange={setSettings}
          />

          <RecommendationSettings
            settings={settings}
            onChange={setSettings}
          />

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#090909,#070707)] transition hover:border-white/[0.16]">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#9B1738]">
                  <FileArchive className="size-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Import from Letterboxd
                  </p>

                  <p className="mt-1.5 max-w-xl text-xs leading-5 text-white/35">
                    Bring your watched films, ratings, likes, diary entries,
                    watchlist, reviews, and lists into Memento from a Letterboxd
                    data export.
                  </p>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="shrink-0 border-white/10 bg-[#0b0b0b] text-white hover:border-[#6D001A]/70 hover:bg-[#160006] hover:text-white"
              >
                <Link href="/settings/import">
                  <Upload className="mr-2 size-4" />
                  Import data
                </Link>
              </Button>
            </div>
          </section>

          <AccountSettings
            onResetSettings={
              resetSettings
            }
          />
        </div>
      </div>
    </div>
  );
}