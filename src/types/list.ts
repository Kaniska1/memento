export type ListMovie = {
  movieId: number;
  title: string;
  year: string;
  poster: string | null;
  genre: string;
  position?: number | null;
};

export type ListCollaborator = {
  userId: string;
  username: string;
};

export type MovieList = {
  id: string;

  title: string;
  description: string;

  isPublic: boolean;
  isRanked: boolean;

  ownerId: string;
  isOwner: boolean;

  movies: ListMovie[];

  collaborators: ListCollaborator[];

  createdAt: string;
  updatedAt: string;
};