import type {
  MementoNotification,
  MementoNotificationType,
} from "@/types/notification";

type NotificationsResponse = {
  success: boolean;
  message?: string;
  notifications?: MementoNotification[];
  notification?: MementoNotification;
};

async function parseResponse(
  response: Response,
) {
  const data =
    (await response.json()) as NotificationsResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Notification request failed.",
    );
  }

  return data;
}

export async function fetchNotifications() {
  const response = await fetch(
    "/api/notifications",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data =
    await parseResponse(response);

  return data.notifications ?? [];
}

export async function createNotification(
  payload: {
    type: MementoNotificationType;
    title: string;
    message: string;
    href?: string | null;
  },
) {
  const response = await fetch(
    "/api/notifications",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify(payload),
    },
  );

  const data =
    await parseResponse(response);

  if (!data.notification) {
    throw new Error(
      "Server did not return notification.",
    );
  }

  return data.notification;
}

export async function markNotificationRead(
  notificationId: string,
) {
  const response = await fetch(
    `/api/notifications/${notificationId}`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );

  await parseResponse(response);
}

export async function markAllNotificationsRead() {
  const response = await fetch(
    "/api/notifications/read-all",
    {
      method: "PATCH",
      credentials: "include",
    },
  );

  await parseResponse(response);
}

export async function deleteNotification(
  notificationId: string,
) {
  const response = await fetch(
    `/api/notifications/${notificationId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await parseResponse(response);
}