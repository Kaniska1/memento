"use client";

import {
  EyeOff,
  Lock,
  Play,
  RotateCcw,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";

import type {
  MementoSettings,
  StreamingProvider,
} from "@/types/settings";

const providers: Array<{
  id: StreamingProvider;
  name: string;
}> = [
  { id: "netflix", name: "Netflix" },
  { id: "prime-video", name: "Prime Video" },
  { id: "jiohotstar", name: "JioHotstar" },
  { id: "sonyliv", name: "SonyLIV" },
  { id: "zee5", name: "ZEE5" },
  { id: "mubi", name: "MUBI" },
  { id: "apple-tv", name: "Apple TV+" },
  { id: "youtube", name: "YouTube" },
];

type ViewingSettingsProps = {
  settings: MementoSettings;
  onChange: (settings: MementoSettings) => void;
};

export function ViewingSettings({
  settings,
  onChange,
}: ViewingSettingsProps) {
  function toggleProvider(provider: StreamingProvider) {
    const selected =
      settings.streamingProviders.includes(provider);

    onChange({
      ...settings,
      streamingProviders: selected
        ? settings.streamingProviders.filter(
            (item) => item !== provider,
          )
        : [...settings.streamingProviders, provider],
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#080808] p-6 sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
        Watching preferences
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
        Viewing
      </h2>

      <div className="mt-7">
        <p className="text-sm font-medium text-white/70">
          Your streaming services
        </p>

        <p className="mt-2 text-xs leading-5 text-white/35">
          Memento can prioritize movies available through services you already
          use.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {providers.map((provider) => {
            const selected =
              settings.streamingProviders.includes(provider.id);

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => toggleProvider(provider.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selected
                    ? "border-[#6D001A] bg-[#6D001A] text-white"
                    : "border-white/10 bg-black text-white/45 hover:border-white/25 hover:text-white"
                }`}
              >
                {provider.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 space-y-3 border-t border-white/10 pt-7">
        <SettingToggle
          icon={EyeOff}
          title="Blur spoilers by default"
          description="Hide spoiler-marked reviews until you choose to reveal them."
          checked={settings.blurSpoilersByDefault}
          onCheckedChange={(checked) =>
            onChange({
              ...settings,
              blurSpoilersByDefault: checked,
            })
          }
        />

        <SettingToggle
          icon={RotateCcw}
          title="Default to rewatch"
          description="Preselect the rewatch option when opening the log-film dialog."
          checked={settings.defaultRewatchState}
          onCheckedChange={(checked) =>
            onChange({
              ...settings,
              defaultRewatchState: checked,
            })
          }
        />

        <div className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-black p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-4 text-white/35" />

            <div>
              <p className="text-sm font-medium text-white">
                Diary visibility
              </p>

              <p className="mt-1 text-xs leading-5 text-white/35">
                Choose whether other users may view your diary.
              </p>
            </div>
          </div>

          <select
            value={settings.diaryPrivacy}
            onChange={(event) =>
              onChange({
                ...settings,
                diaryPrivacy: event.target.value as
                  | "private"
                  | "public",
              })
            }
            className="h-10 rounded-xl border border-white/10 bg-[#080808] px-3 text-sm text-white outline-none focus:border-[#6D001A]"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>
      </div>
    </section>
  );
}

type SettingToggleProps = {
  icon: typeof Play;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 size-4 ${
            checked ? "text-[#9B1738]" : "text-white/35"
          }`}
        />

        <div>
          <p className="text-sm font-medium text-white">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/35">
            {description}
          </p>
        </div>
      </div>

      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}