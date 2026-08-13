import type {
  ListCollaborator,
  ListMovie,
} from "@/types/list";

export type PublicMovieList = {
  id: string;

  title: string;
  description: string;

  isPublic: boolean;
  isRanked: boolean;

  owner: {
    id: string;
    username: string;
    name: string;
  };

  isOwner: boolean;
  isCollaborator: boolean;

  movies: ListMovie[];

  collaborators: ListCollaborator[];

  createdAt: string;
  updatedAt: string;
};