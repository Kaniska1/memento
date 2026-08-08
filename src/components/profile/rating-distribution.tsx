import type { RatingDistributionItem } from "@/types/profile";

type RatingDistributionProps = {
  distribution: RatingDistributionItem[];
};

export function RatingDistribution({
  distribution,
}: RatingDistributionProps) {
  const maximum = Math.max(
    ...distribution.map((item) => item.count),
    1,
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-[#080808] p-6 sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
        Rating habits
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
        Rating distribution
      </h2>

      <div className="mt-8 flex h-56 items-end gap-2">
        {distribution.map((item) => {
          const height =
            item.count > 0
              ? Math.max((item.count / maximum) * 100, 8)
              : 3;

          return (
            <div
              key={item.rating}
              className="flex min-w-0 flex-1 flex-col items-center justify-end"
            >
              <p className="mb-2 text-[10px] text-white/30">
                {item.count}
              </p>

              <div className="flex h-40 w-full items-end justify-center">
                <div
                  className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-[#41000F] to-[#8E1231]"
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-[10px] text-white/35">
                {item.rating}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}