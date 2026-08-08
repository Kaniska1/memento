"use client";

import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getSettings,
  saveSettings,
} from "@/lib/settings-storage";
import {
  defaultSettings,
  type MementoSettings,
} from "@/types/settings";

import { AccountSettings } from "./account-settings";
import { ProfileSettings } from "./profile-settings";
import { RecommendationSettings } from "./recommendation-settings";
import { ViewingSettings } from "./viewing-settings";

export function SettingsClient() {
  const [settings, setSettings] =
    useState<MementoSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function handleSave() {
    saveSettings(settings);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1800);
  }

  function resetSettings() {
    const confirmed = window.confirm(
      "Reset all settings to their defaults?",
    );

    if (!confirmed) return;

    setSettings(defaultSettings);
    saveSettings(defaultSettings);
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
              Control your profile, viewing preferences, diary, and recommendation behavior.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            className="bg-[#6D001A] text-white hover:bg-[#850522]"
          >
            {saved ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Save className="mr-2 size-4" />
            )}

            {saved ? "Saved" : "Save changes"}
          </Button>
        </header>

        <div className="mt-10 space-y-6">
          <ProfileSettings
            settings={settings}
            onChange={setSettings}
          />

          <ViewingSettings
            settings={settings}
            onChange={setSettings}
          />

          <RecommendationSettings
            settings={settings}
            onChange={setSettings}
          />

          <AccountSettings
            onResetSettings={resetSettings}
          />
        </div>
      </div>
    </div>
  );
}