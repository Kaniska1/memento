import type { TasteCategory } from "@/types/profile";

type TasteDnaProps = {
  categories: TasteCategory[];
};

export function TasteDna({
  categories,
}: TasteDnaProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#080808] p-6 sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
        Your cinematic identity
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
        Taste DNA
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-6 text-white/40">
        A first approximation of the genres and moods that shape
        your film taste.
      </p>

      <div className="mt-8 space-y-6">
        {categories.map((category) => (
          <div key={category.label}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-white/70">
                {category.label}
              </p>

              <p className="text-sm font-semibold text-white">
                {category.percentage}%
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#41000F] via-[#6D001A] to-[#9B1738]"
                style={{
                  width: `${category.percentage}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}