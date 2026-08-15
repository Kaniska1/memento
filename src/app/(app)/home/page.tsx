import { DashboardHero } from "@/components/home/dashboard-hero";
import { MovieRow } from "@/components/home/movie-row";
import {
  getTopRatedMovies,
  getTrendingMovies,
} from "@/lib/tmdb";

export default async function HomePage() {
  const [
    trendingMovies,
    topRatedMovies,
  ] = await Promise.all([
    getTrendingMovies(),
    getTopRatedMovies(),
  ]);

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px] space-y-12">
        <header className="flex flex-col gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
            Memento
          </p>

          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            What are we watching today?
          </h1>

          <p className="max-w-xl text-sm leading-6 text-white/35">
            Pick up where you left off, discover something new, or let Memento
            narrow down the noise.
          </p>
        </header>

        <DashboardHero />

        <div className="space-y-12">
          <MovieRow
            eyebrow="Popular now"
            title="Trending this week"
            href="/discover"
            movies={trendingMovies}
          />

          <MovieRow
            eyebrow="Critically acclaimed"
            title="Top rated movies"
            href="/discover?sort=top-rated"
            movies={topRatedMovies}
          />
        </div>
      </div>
    </div>
  );
}