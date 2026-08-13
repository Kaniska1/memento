import type {
  MementoSettings,
} from "@/types/settings";

type SettingsResponse = {
  success: boolean;
  message?: string;
  settings?: MementoSettings;
};

async function parseSettingsResponse(
  response: Response,
): Promise<MementoSettings> {
  const data =
    (await response.json()) as SettingsResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Settings request failed.",
    );
  }

  if (!data.settings) {
    throw new Error(
      "Server did not return settings.",
    );
  }

  return data.settings;
}

export async function fetchSettings() {
  const response = await fetch(
    "/api/settings",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  return parseSettingsResponse(
    response,
  );
}

export async function updateSettings(
  settings: MementoSettings,
) {
  const response = await fetch(
    "/api/settings",
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify(
        settings,
      ),
    },
  );

  return parseSettingsResponse(
    response,
  );
}