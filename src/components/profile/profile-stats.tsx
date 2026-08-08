import {
  Bookmark,
  Clapperboard,
  Clock3,
  Heart,
  RotateCcw,
  Star,
} from "lucide-react";

type ProfileStatsProps = {
  filmsWatched: number;
  hoursWatched: number;
  averageRating: number;
  rewatchCount: number;
  likedCount: number;
  watchlistCount: number;
};

export function ProfileStats({
  filmsWatched,
  hoursWatched,
  averageRating,
  rewatchCount,
  likedCount,
  watchlistCount,
}: ProfileStatsProps) {
  const stats = [
    {
      label: "Films watched",
      value: filmsWatched.toString(),
      icon: Clapperboard,
    },
    {
      label: "Hours watched",
      value: `${hoursWatched}h`,
      icon: Clock3,
    },
    {
      label: "Average rating",
      value:
        averageRating > 0
          ? averageRating.toFixed(1)
          : "—",
      icon: Star,
    },
    {
      label: "Rewatches",
      value: rewatchCount.toString(),
      icon: RotateCcw,
    },
    {
      label: "Liked films",
      value: likedCount.toString(),
      icon: Heart,
    },
    {
      label: "Watchlist",
      value: watchlistCount.toString(),
      icon: Bookmark,
    },
  ];

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-[#080808] p-5"
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

                <div className="flex size-9 items-center justify-center rounded-xl bg-[#160006] text-[#9B1738]">
                  <Icon className="size-4" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}