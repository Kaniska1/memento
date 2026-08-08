import type { DiaryEntry } from "@/types/diary";

const DIARY_STORAGE_KEY = "memento:diary";

export function getDiaryEntries(): DiaryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedEntries = localStorage.getItem(DIARY_STORAGE_KEY);

    if (!storedEntries) {
      return [];
    }

    const entries = JSON.parse(storedEntries) as DiaryEntry[];

    return entries.sort(
      (a, b) =>
        new Date(b.watchedDate).getTime() -
        new Date(a.watchedDate).getTime(),
    );
  } catch {
    return [];
  }
}

export function saveDiaryEntries(entries: DiaryEntry[]) {
  localStorage.setItem(
    DIARY_STORAGE_KEY,
    JSON.stringify(entries),
  );
}

export function addDiaryEntry(entry: DiaryEntry) {
  const entries = getDiaryEntries();

  saveDiaryEntries([entry, ...entries]);
}

export function updateDiaryEntry(updatedEntry: DiaryEntry) {
  const entries = getDiaryEntries();

  saveDiaryEntries(
    entries.map((entry) =>
      entry.id === updatedEntry.id
        ? updatedEntry
        : entry,
    ),
  );
}

export function deleteDiaryEntry(entryId: string) {
  const entries = getDiaryEntries();

  saveDiaryEntries(
    entries.filter((entry) => entry.id !== entryId),
  );
}