import { DashboardHero } from "@/components/home/dashboard-hero";
import { MovieRow } from "@/components/home/movie-row";
import { QuickStats } from "@/components/home/quick-stats";
import {
  getTopRatedMovies,
  getTrendingMovies,
} from "@/lib/tmdb";

export default async function HomePage() {
 const [trendingMovies, topRatedMovies] = await Promise.all([
  getTrendingMovies(),
  getTopRatedMovies(),
]);

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px] space-y-10">
        {/* Greeting */}
        <div>
          <p className="text-sm text-white/35">
            Good evening
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-white">
            What are we watching today?
          </h1>
        </div>

        {/* Hero */}
        <DashboardHero />


        {/* Trending movies */}
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
  );
}