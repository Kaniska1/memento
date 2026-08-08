"use client";

const genres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

type GenrePickerProps = {
  selectedGenres: number[];
  onChange: (genreIds: number[]) => void;
};

export function GenrePicker({
  selectedGenres,
  onChange,
}: GenrePickerProps) {
  function toggleGenre(genreId: number) {
    const isSelected = selectedGenres.includes(genreId);

    if (isSelected) {
      onChange(selectedGenres.filter((id) => id !== genreId));
      return;
    }

    onChange([...selectedGenres, genreId]);
  }

  return (
    <div>
      <p className="text-sm text-white/45">
        Choose at least three. You can update these later.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {genres.map((genre) => {
          const selected = selectedGenres.includes(genre.id);

          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre.id)}
              className={`rounded-full border px-5 py-2.5 text-sm transition-all ${
                selected
                  ? "border-[#6D001A] bg-[#6D001A] text-white"
                  : "border-white/10 bg-[#0A0A0A] text-white/55 hover:border-white/25 hover:text-white"
              }`}
            >
              {genre.name}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-white/35">
        {selectedGenres.length} selected
      </p>
    </div>
  );
}