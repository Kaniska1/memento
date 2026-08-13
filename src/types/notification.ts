export type MementoNotificationType =
  | "diary"
  | "watchlist"
  | "list"
  | "recommendation"
  | "system";

export type MementoNotification = {
  id: string;
  type: MementoNotificationType;
  title: string;
  message: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
};