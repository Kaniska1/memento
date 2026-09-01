const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w500";

type TmdbMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_count: number;
  popularity: number;
};

type TmdbMovieResponse = {
  results: TmdbMovie[];
};

export type LandingMoviePoster = {
  id: number;
  title: string;
  poster: string;
  popularity: number;
  voteCount: number;
};

async function getPopularMoviePage(
  page: number,
  accessToken: string,
): Promise<TmdbMovie[]> {
  try {
    const params = new URLSearchParams({
      language: "en-US",
      page: String(page),
    });

    const response = await fetch(
      `${TMDB_API_URL}/movie/popular?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
        next: {
          revalidate: 3600,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `TMDB popular movies request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as TmdbMovieResponse;
    return data.results ?? [];
  } catch (error) {
    console.error(
      `Could not load TMDB popular movies page ${page}:`,
      error,
    );
    return [];
  }
}

export async function getLandingMoviePosters(): Promise<
  LandingMoviePoster[]
> {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("TMDB_ACCESS_TOKEN is missing.");
    return [];
  }

  const pages = await Promise.all([
    getPopularMoviePage(1, accessToken),
    getPopularMoviePage(2, accessToken),
    getPopularMoviePage(3, accessToken),
  ]);

  const unique = new Map<number, TmdbMovie>();

  for (const movie of pages.flat()) {
    if (
      !movie.poster_path ||
      !movie.title ||
      movie.vote_count < 250
    ) {
      continue;
    }

    unique.set(movie.id, movie);
  }

  return Array.from(unique.values())
    .sort(
      (a, b) =>
        b.popularity - a.popularity ||
        b.vote_count - a.vote_count,
    )
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster: `${TMDB_POSTER_URL}${movie.poster_path}`,
      popularity: movie.popularity,
      voteCount: movie.vote_count,
    }));
}

export function pickRandomPosters(
  movies: LandingMoviePoster[],
  count = 28,
): LandingMoviePoster[] {
  if (movies.length === 0) {
    return [];
  }

  const shuffled = [...movies];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1),
    );

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  if (shuffled.length >= count) {
    return shuffled.slice(0, count);
  }

  const result: LandingMoviePoster[] = [];

  while (result.length < count) {
    result.push(
      ...shuffled.slice(0, count - result.length),
    );
  }

  return result;
}
