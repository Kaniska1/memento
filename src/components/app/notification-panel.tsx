"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  CheckCheck,
  Clapperboard,
  ListVideo,
  LoaderCircle,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";

import type {
  MementoNotification,
  MementoNotificationType,
} from "@/types/notification";

const notificationIcons: Record<
  MementoNotificationType,
  typeof Bell
> = {
  diary: Clapperboard,
  watchlist: Bookmark,
  list: ListVideo,
  recommendation: Sparkles,
  system: Bell,
};

function formatRelativeTime(date: string) {
  const difference =
    Date.now() - new Date(date).getTime();

  const minutes = Math.floor(
    difference / (1000 * 60),
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    },
  ).format(new Date(date));
}

export function NotificationPanel() {
  const router = useRouter();

  const containerRef =
    useRef<HTMLDivElement>(null);

  const [open, setOpen] =
    useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState<
    MementoNotification[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isMarkingAllRead,
    setIsMarkingAllRead,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  async function loadNotifications() {
    try {
      const data =
        await fetchNotifications();

      setNotifications(data);
    } catch (error) {
      console.error(
        "Could not load notifications:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read,
    ).length;

  async function openNotification(
    notification: MementoNotification,
  ) {
    try {
      if (!notification.read) {
        await markNotificationRead(
          notification.id,
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      read: true,
                    }
                  : item,
            ),
        );
      }

      setOpen(false);

      if (notification.href) {
        router.push(
          notification.href,
        );
      }
    } catch (error) {
      console.error(
        "Could not open notification:",
        error,
      );
    }
  }

  async function handleMarkAllRead() {
    if (
      isMarkingAllRead ||
      unreadCount === 0
    ) {
      return;
    }

    setIsMarkingAllRead(true);

    try {
      await markAllNotificationsRead();

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              read: true,
            }),
          ),
      );
    } catch (error) {
      console.error(
        "Could not mark all notifications read:",
        error,
      );
    } finally {
      setIsMarkingAllRead(false);
    }
  }

  async function handleDelete(
    notificationId: string,
  ) {
    if (deletingId) {
      return;
    }

    setDeletingId(notificationId);

    try {
      await deleteNotification(
        notificationId,
      );

      setNotifications(
        (current) =>
          current.filter(
            (notification) =>
              notification.id !==
              notificationId,
          ),
      );
    } catch (error) {
      console.error(
        "Could not delete notification:",
        error,
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        className="relative rounded-full text-white/55 hover:bg-white/[0.06] hover:text-white"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="size-4" />

        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#8E1231] px-1 text-[9px] font-semibold text-white">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-2xl shadow-black/70">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Notifications
              </h2>

              <p className="mt-1 text-xs text-white/30">
                {unreadCount} unread
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  void handleMarkAllRead()
                }
                disabled={
                  isMarkingAllRead
                }
                className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMarkingAllRead ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}

                {isMarkingAllRead
                  ? "Marking..."
                  : "Mark all read"}
              </button>
            )}
          </header>

          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <LoaderCircle className="size-5 animate-spin text-[#8E1231]" />
            </div>
          ) : notifications.length ===
            0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
                <Bell className="size-5" />
              </div>

              <p className="mt-4 text-sm font-medium text-white">
                Nothing new
              </p>

              <p className="mt-2 text-xs leading-5 text-white/35">
                Diary updates, list
                activity, and
                recommendation notices
                will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto py-2">
              {notifications.map(
                (notification) => {
                  const Icon =
                    notificationIcons[
                      notification.type
                    ];

                  const isDeleting =
                    deletingId ===
                    notification.id;

                  return (
                    <article
                      key={
                        notification.id
                      }
                      className={`group flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] ${
                        notification.read
                          ? ""
                          : "bg-[#160006]/45"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          void openNotification(
                            notification,
                          )
                        }
                        className="flex min-w-0 flex-1 gap-3 text-left"
                      >
                        <div
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                            notification.read
                              ? "bg-white/5 text-white/35"
                              : "bg-[#6D001A] text-white"
                          }`}
                        >
                          <Icon className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <p className="flex-1 text-sm font-medium text-white">
                              {
                                notification.title
                              }
                            </p>

                            {!notification.read && (
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#A51636]" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">
                            {
                              notification.message
                            }
                          </p>

                          <p className="mt-2 text-[10px] text-white/25">
                            {formatRelativeTime(
                              notification.createdAt,
                            )}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={
                          isDeleting
                        }
                        onClick={() =>
                          void handleDelete(
                            notification.id,
                          )
                        }
                        aria-label="Delete notification"
                        className="mt-1 text-white/20 opacity-0 transition hover:text-red-400 group-hover:opacity-100 disabled:opacity-40"
                      >
                        {isDeleting ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </article>
                  );
                },
              )}
            </div>
          )}

          {!isLoading &&
            notifications.length >
              0 && (
              <footer className="border-t border-white/10 px-4 py-3">
                <p className="text-center text-[10px] text-white/25">
                  Synced with your Memento account
                </p>
              </footer>
            )}
        </div>
      )}
    </div>
  );
}