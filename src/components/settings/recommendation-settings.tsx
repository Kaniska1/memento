"use client";

import {
  Compass,
  EyeOff,
  History,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";

import type { MementoSettings } from "@/types/settings";

type RecommendationSettingsProps = {
  settings: MementoSettings;
  onChange: (settings: MementoSettings) => void;
};

const recommendationStyles = [
  {
    id: "familiar",
    title: "Familiar",
    description:
      "Stay close to genres and films you already love.",
  },
  {
    id: "balanced",
    title: "Balanced",
    description:
      "Mix reliable choices with occasional surprises.",
  },
  {
    id: "adventurous",
    title: "Adventurous",
    description:
      "Explore unfamiliar genres, countries, and decades.",
  },
] as const;

export function RecommendationSettings({
  settings,
  onChange,
}: RecommendationSettingsProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#080808] p-6 sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
        Taste engine
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
        Recommendations
      </h2>

      <div className="mt-7">
        <p className="text-sm font-medium text-white/70">
          Recommendation style
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {recommendationStyles.map((style) => {
            const selected =
              settings.recommendationStyle === style.id;

            return (
              <button
                key={style.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...settings,
                    recommendationStyle: style.id,
                  })
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-[#6D001A] bg-[#160006]"
                    : "border-white/10 bg-black hover:border-white/20"
                }`}
              >
                <Compass
                  className={`size-4 ${
                    selected
                      ? "text-[#9B1738]"
                      : "text-white/30"
                  }`}
                />

                <p className="mt-4 text-sm font-medium text-white">
                  {style.title}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/35">
                  {style.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 space-y-3 border-t border-white/10 pt-7">
        <RecommendationToggle
          icon={EyeOff}
          title="Hide watched films"
          description="Avoid recommending movies already present in your diary."
          checked={settings.hideWatchedFromRecommendations}
          onCheckedChange={(checked) =>
            onChange({
              ...settings,
              hideWatchedFromRecommendations: checked,
            })
          }
        />

        <RecommendationToggle
          icon={Sparkles}
          title="Prioritize available movies"
          description="Prefer films available through your selected streaming services."
          checked={settings.prioritizeAvailableMovies}
          onCheckedChange={(checked) =>
            onChange({
              ...settings,
              prioritizeAvailableMovies: checked,
            })
          }
        />

        <RecommendationToggle
          icon={TrendingUp}
          title="Include popular movies"
          description="Allow mainstream and currently trending films in your recommendations."
          checked={settings.includePopularMovies}
          onCheckedChange={(checked) =>
            onChange({
              ...settings,
              includePopularMovies: checked,
            })
          }
        />

        <RecommendationToggle
          icon={History}
          title="Include older cinema"
          description="Recommend films from earlier decades alongside recent releases."
          checked={settings.allowOlderMovies}
          onCheckedChange={(checked) =>
            onChange({
              ...settings,
              allowOlderMovies: checked,
            })
          }
        />
      </div>
    </section>
  );
}

type RecommendationToggleProps = {
  icon: typeof Sparkles;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function RecommendationToggle({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: RecommendationToggleProps) {
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