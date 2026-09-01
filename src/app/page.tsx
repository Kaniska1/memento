import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/layout/navbar";
import {
  getLandingMoviePosters,
  pickRandomPosters,
} from "@/lib/landing-movies";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posterPool = await getLandingMoviePosters();
  const heroPosters = pickRandomPosters(posterPool, 28);

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <Hero posters={heroPosters} />
    </main>
  );
}