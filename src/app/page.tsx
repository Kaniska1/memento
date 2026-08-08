import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/layout/navbar";
import { getTopTrendingMovie } from "@/lib/tmdb";

export default async function Home() {
  const trendingMovie = await getTopTrendingMovie();

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <Hero trendingMovie={trendingMovie} />
    </main>
  );
}