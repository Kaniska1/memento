export type UserProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string;
  joinedAt: string;
};

type ProfileResponse = {
  success: boolean;
  message?: string;
  profile?: UserProfile;
};

async function parseProfileResponse(
  response: Response,
) {
  const data =
    (await response.json()) as ProfileResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Profile request failed.",
    );
  }

  if (!data.profile) {
    throw new Error(
      "Server did not return a profile.",
    );
  }

  return data.profile;
}

export async function fetchProfile() {
  const response = await fetch(
    "/api/profile",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  return parseProfileResponse(
    response,
  );
}

export async function updateProfile(
  payload: {
    name: string;
    username: string;
    bio: string;
  },
) {
  const response = await fetch(
    "/api/profile",
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify(
        payload,
      ),
    },
  );

  return parseProfileResponse(
    response,
  );
}