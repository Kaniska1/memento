import {
  defaultSettings,
  type MementoSettings,
} from "@/types/settings";

const SETTINGS_STORAGE_KEY = "memento:settings";

export function getSettings(): MementoSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const storedSettings = localStorage.getItem(
      SETTINGS_STORAGE_KEY,
    );

    if (!storedSettings) {
      return defaultSettings;
    }

    const parsedSettings = JSON.parse(
      storedSettings,
    ) as Partial<MementoSettings>;

    return {
      ...defaultSettings,
      ...parsedSettings,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: MementoSettings) {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  );

  window.dispatchEvent(
    new CustomEvent("memento:settings-updated"),
  );
}