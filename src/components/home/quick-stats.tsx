import {
  Clock3,
  Clapperboard,
  Star,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    label: "Films watched",
    value: "0",
    icon: Clapperboard,
  },
  {
    label: "Hours watched",
    value: "0h",
    icon: Clock3,
  },
  {
    label: "Average rating",
    value: "—",
    icon: Star,
  },
  {
    label: "Current streak",
    value: "0 days",
    icon: TrendingUp,
  },
];

export function QuickStats() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-[#090909] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-white/35">
                  {stat.label}
                </p>

                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {stat.value}
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-xl bg-[#170007] text-[#9B1738]">
                <Icon className="size-4" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}