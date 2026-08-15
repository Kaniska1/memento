import {
  Clock3,
  Clapperboard,
  Star,
  TrendingUp,
} from "lucide-react";

type QuickStatsProps = {
  filmsWatched: number;
  hoursWatched?: number | null;
  averageRating?: number | null;
  currentStreak?: number | null;
};

export function QuickStats({
  filmsWatched,
  hoursWatched = null,
  averageRating = null,
  currentStreak = null,
}: QuickStatsProps) {
  const stats = [
    {
      label: "Films watched",
      value: filmsWatched.toLocaleString(),
      icon: Clapperboard,
    },
    {
      label: "Hours watched",
      value:
        hoursWatched === null
          ? "—"
          : `${Math.round(hoursWatched).toLocaleString()}h`,
      icon: Clock3,
    },
    {
      label: "Average rating",
      value:
        averageRating === null
          ? "—"
          : averageRating.toFixed(1),
      icon: Star,
    },
    {
      label: "Current streak",
      value:
        currentStreak === null
          ? "—"
          : `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a0a] to-[#070707] p-5 transition hover:-translate-y-0.5 hover:border-white/[0.16]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-white/35">
                  {stat.label}
                </p>

                <p className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-white">
                  {stat.value}
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-xl border border-[#6D001A]/25 bg-[#170007] text-[#A92748] transition group-hover:border-[#6D001A]/50">
                <Icon className="size-4" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}