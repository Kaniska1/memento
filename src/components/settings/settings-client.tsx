"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Check,
  LoaderCircle,
  Save,
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
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <LoaderCircle className="size-4 animate-spin" />

          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
              Make Memento yours
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Settings.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
              Control your viewing,
              diary, and recommendation
              preferences.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#6D001A] text-white hover:bg-[#850522]"
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