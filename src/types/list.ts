export type ListMovie = {
  id: number;
  title: string;
  year: string;
  poster: string | null;
  rating: number;
  genre: string;
  position?: number;
};

export type ListCollaborator = {
  id: string;
  name: string;
  username: string;
};

export type MovieList = {
  id: string;
  title: string;
  description: string;

  isPublic: boolean;
  isRanked: boolean;

  collaborators: ListCollaborator[];
  movies: ListMovie[];

  createdAt: string;
  updatedAt: string;
};