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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {stats.map((stat) => (
    <div
      key={stat.label}
      className="rounded-2xl border border-white/10 bg-[#080808] p-5"
    >
      <div className="flex items-center gap-2 text-white/35">
        <stat.icon className="size-4" />

        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-red-700">
          {stat.label}
        </p>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">
        {stat.value}
      </p>
    </div>
  ))}
</div>
    </section>
  );
}