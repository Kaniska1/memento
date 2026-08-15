import JSZip from "jszip";

export type LetterboxdFilmRef = {
  name: string;
  year: string;
  letterboxdUri: string;
};

export type LetterboxdWatchedRow = LetterboxdFilmRef & {
  date: string;
};

export type LetterboxdRatingRow = LetterboxdFilmRef & {
  date: string;
  rating: number;
};

export type LetterboxdDiaryRow = LetterboxdFilmRef & {
  date: string;
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  tags: string[];
};

export type LetterboxdReviewRow = LetterboxdDiaryRow & {
  review: string;
};

export type LetterboxdWatchlistRow = LetterboxdFilmRef & {
  date: string;
};

export type LetterboxdLikeRow = LetterboxdFilmRef & {
  date: string;
};

export type LetterboxdListMovie = LetterboxdFilmRef & {
  position: number | null;
  description: string;
};

export type LetterboxdList = {
  date: string;
  name: string;
  tags: string[];
  url: string;
  description: string;
  movies: LetterboxdListMovie[];
};

export type LetterboxdProfile = {
  dateJoined: string;
  username: string;
  givenName: string;
  familyName: string;
  location: string;
  website: string;
  bio: string;
  pronoun: string;
  favoriteFilmUris: string[];
};

export type NormalizedLetterboxdFilm = {
  key: string;
  name: string;
  year: string;
  letterboxdUri: string;

  watched: boolean;
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;

  watchedDates: string[];
  diaryEntries: number;
  reviews: number;
  listMemberships: number;
};

export type LetterboxdImportData = {
  watched: LetterboxdWatchedRow[];
  ratings: LetterboxdRatingRow[];
  diary: LetterboxdDiaryRow[];
  reviews: LetterboxdReviewRow[];
  watchlist: LetterboxdWatchlistRow[];
  likedFilms: LetterboxdLikeRow[];
  lists: LetterboxdList[];
};

export type LetterboxdImportPreview = {
  exportFiles: string[];
  ignoredFiles: string[];

  profile: LetterboxdProfile | null;

  counts: {
    watched: number;
    ratings: number;
    diary: number;
    reviews: number;
    watchlist: number;
    likedFilms: number;
    lists: number;
    listMovies: number;
    uniqueFilms: number;
  };

  normalizedFilms: NormalizedLetterboxdFilm[];
  lists: LetterboxdList[];

  /*
   * Server-side commit data. The preview API
   * strips this before sending JSON to the
   * browser, but the commit route reparses the
   * ZIP and uses it for diary/list imports.
   */
  importData: LetterboxdImportData;
};

type CsvRow = Record<string, string>;

const MAX_ZIP_ENTRIES = 250;
const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;

function clean(value: string | undefined) {
  return (value ?? "").trim();
}

function parseRating(value: string | undefined) {
  const raw = clean(value);

  if (!raw) {
    return null;
  }

  const number = Number(raw);

  if (
    !Number.isFinite(number) ||
    number < 0.5 ||
    number > 5 ||
    !Number.isInteger(number * 2)
  ) {
    return null;
  }

  return number;
}

function parseBooleanMarker(value: string | undefined) {
  const normalized = clean(value).toLowerCase();

  return (
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "1" ||
    normalized === "rewatch"
  );
}

function parseTags(value: string | undefined) {
  const raw = clean(value);

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Small RFC-4180-style CSV parser.
 *
 * Letterboxd reviews may contain commas, quotes and embedded newlines, so a
 * naive split("\n") / split(",") parser is not safe enough here.
 */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        const next = text[index + 1];

        if (next === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }

      row.push(field);
      field = "";

      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);

    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function rowsToObjects(rows: string[][], headerIndex = 0): CsvRow[] {
  const header = rows[headerIndex]?.map((value) => clean(value)) ?? [];

  if (header.length === 0) {
    return [];
  }

  return rows
    .slice(headerIndex + 1)
    .filter((row) => row.some((value) => clean(value)))
    .map((row) => {
      const object: CsvRow = {};

      header.forEach((column, index) => {
        object[column] = row[index] ?? "";
      });

      return object;
    });
}

function normalizeFilmRef(row: CsvRow): LetterboxdFilmRef | null {
  const name = clean(row.Name);
  const year = clean(row.Year);
  const letterboxdUri = clean(
    row["Letterboxd URI"] ?? row.URL,
  );

  if (!name) {
    return null;
  }

  return {
    name,
    year,
    letterboxdUri,
  };
}

export function letterboxdFilmKey(
  film: LetterboxdFilmRef,
) {
  if (film.letterboxdUri) {
    return `letterboxd:${film.letterboxdUri.toLowerCase()}`;
  }

  return `title:${film.name.toLowerCase()}|year:${film.year}`;
}

async function readZipText(zip: JSZip, path: string) {
  const entry = zip.file(path);

  if (!entry) {
    return null;
  }

  return entry.async("string");
}

async function readStandardCsv(zip: JSZip, path: string) {
  const text = await readZipText(zip, path);

  if (text === null) {
    return [];
  }

  return rowsToObjects(parseCsvRows(text));
}

async function parseLists(zip: JSZip) {
  const paths = Object.keys(zip.files)
    .filter((path) => path.startsWith("lists/") && path.endsWith(".csv"))
    .sort();

  const lists: LetterboxdList[] = [];

  for (const path of paths) {
    const text = await readZipText(zip, path);

    if (text === null) {
      continue;
    }

    const rows = parseCsvRows(text);

    // Letterboxd list exports currently use:
    // row 0: version marker
    // row 1: list metadata headers
    // row 2: list metadata
    // row 3: blank
    // row 4: movie headers
    const metadataRows = rowsToObjects(rows, 1);
    const metadata = metadataRows[0] ?? {};

    const movieHeaderIndex = rows.findIndex(
      (row) => clean(row[0]) === "Position" && clean(row[1]) === "Name",
    );

    const movieRows =
      movieHeaderIndex >= 0
        ? rowsToObjects(rows, movieHeaderIndex)
        : [];

    const movies = movieRows
      .map((row): LetterboxdListMovie | null => {
        const film = normalizeFilmRef(row);

        if (!film) {
          return null;
        }

        const position = Number(clean(row.Position));

        return {
          ...film,
          position: Number.isFinite(position) ? position : null,
          description: clean(row.Description),
        };
      })
      .filter((movie): movie is LetterboxdListMovie => movie !== null);

    lists.push({
      date: clean(metadata.Date),
      name: clean(metadata.Name) || path.split("/").pop()?.replace(/\.csv$/i, "") || "Letterboxd List",
      tags: parseTags(metadata.Tags),
      url: clean(metadata.URL),
      description: clean(metadata.Description),
      movies,
    });
  }

  return lists;
}

export async function parseLetterboxdExport(
  zipBuffer: Buffer,
): Promise<LetterboxdImportPreview> {
  const zip = await JSZip.loadAsync(zipBuffer, {
    checkCRC32: true,
  });

  const fileNames = Object.keys(zip.files).filter(
    (name) => !zip.files[name].dir,
  );

  if (fileNames.length > MAX_ZIP_ENTRIES) {
    throw new Error("This ZIP contains too many files to be a Letterboxd export.");
  }

  let totalUncompressedBytes = 0;

  for (const fileName of fileNames) {
    const entry = zip.files[fileName];
    const data = await entry.async("uint8array");
    totalUncompressedBytes += data.byteLength;

    if (totalUncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
      throw new Error("The uncompressed Letterboxd export is too large.");
    }
  }

  const requiredEvidence = [
    "watched.csv",
    "ratings.csv",
    "diary.csv",
    "watchlist.csv",
  ];

  if (!requiredEvidence.some((path) => fileNames.includes(path))) {
    throw new Error("This ZIP does not look like a Letterboxd data export.");
  }

  const [
    watchedRows,
    ratingRows,
    diaryRows,
    reviewRows,
    watchlistRows,
    likedRows,
    profileRows,
    lists,
  ] = await Promise.all([
    readStandardCsv(zip, "watched.csv"),
    readStandardCsv(zip, "ratings.csv"),
    readStandardCsv(zip, "diary.csv"),
    readStandardCsv(zip, "reviews.csv"),
    readStandardCsv(zip, "watchlist.csv"),
    readStandardCsv(zip, "likes/films.csv"),
    readStandardCsv(zip, "profile.csv"),
    parseLists(zip),
  ]);

  const watched: LetterboxdWatchedRow[] = watchedRows
    .map((row) => {
      const film = normalizeFilmRef(row);
      return film ? { ...film, date: clean(row.Date) } : null;
    })
    .filter((row): row is LetterboxdWatchedRow => row !== null);

  const ratings: LetterboxdRatingRow[] = ratingRows
    .map((row) => {
      const film = normalizeFilmRef(row);
      const rating = parseRating(row.Rating);

      return film && rating !== null
        ? { ...film, date: clean(row.Date), rating }
        : null;
    })
    .filter((row): row is LetterboxdRatingRow => row !== null);

  const diary: LetterboxdDiaryRow[] = diaryRows
    .map((row) => {
      const film = normalizeFilmRef(row);

      return film
        ? {
            ...film,
            date: clean(row.Date),
            watchedDate: clean(row["Watched Date"]),
            rating: parseRating(row.Rating),
            rewatch: parseBooleanMarker(row.Rewatch),
            tags: parseTags(row.Tags),
          }
        : null;
    })
    .filter((row): row is LetterboxdDiaryRow => row !== null);

  const reviews: LetterboxdReviewRow[] = reviewRows
    .map((row) => {
      const film = normalizeFilmRef(row);

      return film
        ? {
            ...film,
            date: clean(row.Date),
            watchedDate: clean(row["Watched Date"]),
            rating: parseRating(row.Rating),
            rewatch: parseBooleanMarker(row.Rewatch),
            tags: parseTags(row.Tags),
            review: row.Review ?? "",
          }
        : null;
    })
    .filter((row): row is LetterboxdReviewRow => row !== null);

  const watchlist: LetterboxdWatchlistRow[] = watchlistRows
    .map((row) => {
      const film = normalizeFilmRef(row);
      return film ? { ...film, date: clean(row.Date) } : null;
    })
    .filter((row): row is LetterboxdWatchlistRow => row !== null);

  const likedFilms: LetterboxdLikeRow[] = likedRows
    .map((row) => {
      const film = normalizeFilmRef(row);
      return film ? { ...film, date: clean(row.Date) } : null;
    })
    .filter((row): row is LetterboxdLikeRow => row !== null);

  const profileRow = profileRows[0];

  const profile: LetterboxdProfile | null = profileRow
    ? {
        dateJoined: clean(profileRow["Date Joined"]),
        username: clean(profileRow.Username),
        givenName: clean(profileRow["Given Name"]),
        familyName: clean(profileRow["Family Name"]),
        location: clean(profileRow.Location),
        website: clean(profileRow.Website),
        bio: profileRow.Bio ?? "",
        pronoun: clean(profileRow.Pronoun),
        favoriteFilmUris: clean(profileRow["Favorite Films"])
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      }
    : null;

  const normalized = new Map<string, NormalizedLetterboxdFilm>();

  const ensureFilm = (film: LetterboxdFilmRef) => {
    const key = letterboxdFilmKey(film);
    const current = normalized.get(key);

    if (current) {
      return current;
    }

    const created: NormalizedLetterboxdFilm = {
      key,
      name: film.name,
      year: film.year,
      letterboxdUri: film.letterboxdUri,
      watched: false,
      liked: false,
      watchlisted: false,
      rating: null,
      watchedDates: [],
      diaryEntries: 0,
      reviews: 0,
      listMemberships: 0,
    };

    normalized.set(key, created);
    return created;
  };

  watched.forEach((row) => {
    ensureFilm(row).watched = true;
  });

  ratings.forEach((row) => {
    const film = ensureFilm(row);
    film.rating = row.rating;
    film.watched = true;
  });

  diary.forEach((row) => {
    const film = ensureFilm(row);
    film.watched = true;
    film.diaryEntries += 1;

    if (row.rating !== null) {
      film.rating = row.rating;
    }

    if (row.watchedDate && !film.watchedDates.includes(row.watchedDate)) {
      film.watchedDates.push(row.watchedDate);
    }
  });

  reviews.forEach((row) => {
    const film = ensureFilm(row);
    film.watched = true;
    film.reviews += 1;

    if (row.rating !== null) {
      film.rating = row.rating;
    }

    if (row.watchedDate && !film.watchedDates.includes(row.watchedDate)) {
      film.watchedDates.push(row.watchedDate);
    }
  });

  likedFilms.forEach((row) => {
    const film = ensureFilm(row);
    film.liked = true;
    film.watched = true;
  });

  watchlist.forEach((row) => {
    const film = ensureFilm(row);
    film.watchlisted = !film.watched;
  });

  lists.forEach((list) => {
    list.movies.forEach((row) => {
      ensureFilm(row).listMemberships += 1;
    });
  });

  const normalizedFilms = Array.from(normalized.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const knownTopLevelFiles = new Set([
    "profile.csv",
    "watched.csv",
    "ratings.csv",
    "diary.csv",
    "reviews.csv",
    "watchlist.csv",
    "comments.csv",
    "likes/films.csv",
    "likes/reviews.csv",
    "likes/lists.csv",
  ]);

  const ignoredFiles = fileNames.filter(
    (path) =>
      path.startsWith("deleted/") ||
      path.startsWith("orphaned/") ||
      (!path.startsWith("lists/") && !knownTopLevelFiles.has(path)),
  );

  return {
    exportFiles: fileNames,
    ignoredFiles,
    profile,
    counts: {
      watched: watched.length,
      ratings: ratings.length,
      diary: diary.length,
      reviews: reviews.length,
      watchlist: watchlist.length,
      likedFilms: likedFilms.length,
      lists: lists.length,
      listMovies: lists.reduce((total, list) => total + list.movies.length, 0),
      uniqueFilms: normalizedFilms.length,
    },
    normalizedFilms,
    lists,

    importData: {
      watched,
      ratings,
      diary,
      reviews,
      watchlist,
      likedFilms,
      lists,
    },
  };
}