import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const listMovieSchema =
  new Schema(
    {
      movieId: {
        type: Number,
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      year: {
        type: String,
        default: "",
      },

      poster: {
        type: String,
        default: null,
      },

      genre: {
        type: String,
        default: "Film",
      },

      position: {
        type: Number,
        default: null,
      },
    },
    {
      _id: false,
    },
  );

const collaboratorSchema =
  new Schema(
    {
      userId: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    },
    {
      _id: false,
    },
  );

const movieListSchema =
  new Schema(
    {
      ownerId: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      description: {
        type: String,
        default: "",
        maxlength: 1000,
      },

      isPublic: {
        type: Boolean,
        default: false,
      },

      isRanked: {
        type: Boolean,
        default: false,
      },

      movies: {
        type:
          [listMovieSchema],
        default: [],
      },

      collaborators: {
        type:
          [collaboratorSchema],
        default: [],
      },

      source: {
        type: String,
        enum: [
          "memento",
          "letterboxd",
        ],
        default: "memento",
        index: true,
      },

      externalId: {
        type: String,
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

movieListSchema.index({
  ownerId: 1,
  updatedAt: -1,
});

movieListSchema.index({
  "collaborators.userId": 1,
});

movieListSchema.index(
  {
    ownerId: 1,
    source: 1,
    externalId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      source:
        "letterboxd",

      externalId: {
        $type:
          "string",
      },
    },
  },
);

export type MovieListDocument =
  InferSchemaType<
    typeof movieListSchema
  >;

const MovieList =
  (models.MovieList as Model<MovieListDocument>) ||
  model<MovieListDocument>(
    "MovieList",
    movieListSchema,
  );

export default MovieList;