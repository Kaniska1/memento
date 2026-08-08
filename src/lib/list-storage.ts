import type {
  ListCollaborator,
  ListMovie,
  MovieList,
} from "@/types/list";

const LISTS_STORAGE_KEY = "memento:lists";

export function getMovieLists(): MovieList[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedLists = localStorage.getItem(
      LISTS_STORAGE_KEY,
    );

    if (!storedLists) {
      return [];
    }

    const lists = JSON.parse(storedLists) as MovieList[];

    return lists
      .map((list) => ({
        ...list,
        isRanked: list.isRanked ?? false,
        collaborators: list.collaborators ?? [],
      }))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime(),
      );
  } catch {
    return [];
  }
}

export function saveMovieLists(lists: MovieList[]) {
  localStorage.setItem(
    LISTS_STORAGE_KEY,
    JSON.stringify(lists),
  );

  window.dispatchEvent(
    new CustomEvent("memento:lists-updated"),
  );
}

export function createMovieList(
  list: Omit<
    MovieList,
    "id" | "createdAt" | "updatedAt"
  >,
) {
  const lists = getMovieLists();
  const now = new Date().toISOString();

  const movies = list.movies.map((movie, index) => ({
    ...movie,
    position: list.isRanked ? index + 1 : undefined,
  }));

  const newList: MovieList = {
    ...list,
    movies,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  saveMovieLists([newList, ...lists]);

  return newList;
}

export function updateMovieList(updatedList: MovieList) {
  const lists = getMovieLists();

  const movies = updatedList.movies.map(
    (movie, index) => ({
      ...movie,
      position: updatedList.isRanked
        ? index + 1
        : undefined,
    }),
  );

  saveMovieLists(
    lists.map((list) =>
      list.id === updatedList.id
        ? {
            ...updatedList,
            movies,
            updatedAt: new Date().toISOString(),
          }
        : list,
    ),
  );
}

export function deleteMovieList(listId: string) {
  const lists = getMovieLists();

  saveMovieLists(
    lists.filter((list) => list.id !== listId),
  );
}

export function addMovieToList(
  listId: string,
  movie: ListMovie,
) {
  const lists = getMovieLists();

  saveMovieLists(
    lists.map((list) => {
      if (list.id !== listId) {
        return list;
      }

      if (
        list.movies.some(
          (existingMovie) =>
            existingMovie.id === movie.id,
        )
      ) {
        return list;
      }

      const nextMovies = [...list.movies, movie].map(
        (item, index) => ({
          ...item,
          position: list.isRanked
            ? index + 1
            : undefined,
        }),
      );

      return {
        ...list,
        movies: nextMovies,
        updatedAt: new Date().toISOString(),
      };
    }),
  );
}

export function removeMovieFromList(
  listId: string,
  movieId: number,
) {
  const lists = getMovieLists();

  saveMovieLists(
    lists.map((list) => {
      if (list.id !== listId) {
        return list;
      }

      const nextMovies = list.movies
        .filter((movie) => movie.id !== movieId)
        .map((movie, index) => ({
          ...movie,
          position: list.isRanked
            ? index + 1
            : undefined,
        }));

      return {
        ...list,
        movies: nextMovies,
        updatedAt: new Date().toISOString(),
      };
    }),
  );
}

export function reorderListMovies(
  listId: string,
  movieIds: number[],
) {
  const lists = getMovieLists();

  saveMovieLists(
    lists.map((list) => {
      if (list.id !== listId || !list.isRanked) {
        return list;
      }

      const movieMap = new Map(
        list.movies.map((movie) => [
          movie.id,
          movie,
        ]),
      );

      const reordered = movieIds
        .map((id) => movieMap.get(id))
        .filter(
          (movie): movie is ListMovie =>
            movie !== undefined,
        )
        .map((movie, index) => ({
          ...movie,
          position: index + 1,
        }));

      return {
        ...list,
        movies: reordered,
        updatedAt: new Date().toISOString(),
      };
    }),
  );
}

export function addCollaboratorToList(
  listId: string,
  collaborator: ListCollaborator,
) {
  const lists = getMovieLists();

  saveMovieLists(
    lists.map((list) => {
      if (list.id !== listId || list.isPublic) {
        return list;
      }

      if (
        list.collaborators.some(
          (item) =>
            item.username === collaborator.username,
        )
      ) {
        return list;
      }

      return {
        ...list,
        collaborators: [
          ...list.collaborators,
          collaborator,
        ],
        updatedAt: new Date().toISOString(),
      };
    }),
  );
}

export function removeCollaboratorFromList(
  listId: string,
  collaboratorId: string,
) {
  const lists = getMovieLists();

  saveMovieLists(
    lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            collaborators:
              list.collaborators.filter(
                (collaborator) =>
                  collaborator.id !== collaboratorId,
              ),
            updatedAt: new Date().toISOString(),
          }
        : list,
    ),
  );
}

export function getMovieListById(listId: string) {
  return (
    getMovieLists().find((list) => list.id === listId) ?? null
  );
}