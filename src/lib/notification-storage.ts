import type { MementoNotification } from "@/types/notification";

const NOTIFICATIONS_STORAGE_KEY = "memento:notifications";

export function getNotifications(): MementoNotification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(
      NOTIFICATIONS_STORAGE_KEY,
    );

    if (!stored) {
      return [];
    }

    const notifications = JSON.parse(
      stored,
    ) as MementoNotification[];

    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

export function saveNotifications(
  notifications: MementoNotification[],
) {
  localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(notifications),
  );

  window.dispatchEvent(
    new CustomEvent("memento:notifications-updated"),
  );
}

export function addNotification(
  notification: Omit<
    MementoNotification,
    "id" | "read" | "createdAt"
  >,
) {
  const notifications = getNotifications();

  const newNotification: MementoNotification = {
    ...notification,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  saveNotifications([
    newNotification,
    ...notifications,
  ].slice(0, 50));
}

export function markNotificationRead(
  notificationId: string,
) {
  saveNotifications(
    getNotifications().map((notification) =>
      notification.id === notificationId
        ? {
            ...notification,
            read: true,
          }
        : notification,
    ),
  );
}

export function markAllNotificationsRead() {
  saveNotifications(
    getNotifications().map((notification) => ({
      ...notification,
      read: true,
    })),
  );
}

export function deleteNotification(
  notificationId: string,
) {
  saveNotifications(
    getNotifications().filter(
      (notification) =>
        notification.id !== notificationId,
    ),
  );
}

export function clearNotifications() {
  saveNotifications([]);
}