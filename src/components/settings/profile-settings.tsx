"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { MementoSettings } from "@/types/settings";

type ProfileSettingsProps = {
  settings: MementoSettings;
  onChange: (settings: MementoSettings) => void;
};

export function ProfileSettings({
  settings,
  onChange,
}: ProfileSettingsProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#080808] p-6 sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
        Public identity
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
        Profile
      </h2>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="display-name"
            className="mb-2 block text-sm font-medium text-white/70"
          >
            Display name
          </label>

          <Input
            id="display-name"
            value={settings.displayName}
            onChange={(event) =>
              onChange({
                ...settings,
                displayName: event.target.value.slice(0, 60),
              })
            }
            className="h-11 border-white/10 bg-black text-white"
          />
        </div>

        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-sm font-medium text-white/70"
          >
            Username
          </label>

          <Input
            id="username"
            value={settings.username}
            onChange={(event) =>
              onChange({
                ...settings,
                username: event.target.value
                  .replace(/\s+/g, "")
                  .slice(0, 30),
              })
            }
            className="h-11 border-white/10 bg-black text-white"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="bio"
            className="text-sm font-medium text-white/70"
          >
            Bio
          </label>

          <span className="text-xs text-white/25">
            {settings.bio.length}/240
          </span>
        </div>

        <Textarea
          id="bio"
          value={settings.bio}
          onChange={(event) =>
            onChange({
              ...settings,
              bio: event.target.value.slice(0, 240),
            })
          }
          className="min-h-28 resize-none border-white/10 bg-black text-white"
        />
      </div>
    </section>
  );
}