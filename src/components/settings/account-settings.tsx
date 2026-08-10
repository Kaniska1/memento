"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  LoaderCircle,
  LogOut,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type AccountSettingsProps = {
  onResetSettings: () => void;
};

export function AccountSettings({
  onResetSettings,
}: AccountSettingsProps) {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function exportData() {
    const data = {
      onboarding: localStorage.getItem(
        "memento:onboarding",
      ),
      favouriteMovies: localStorage.getItem(
        "memento:favourite-movies",
      ),
      favourites: localStorage.getItem(
        "memento:favourites",
      ),
      diary: localStorage.getItem(
        "memento:diary",
      ),
      watchlist: localStorage.getItem(
        "memento:watchlist",
      ),
      lists: localStorage.getItem(
        "memento:lists",
      ),
      settings: localStorage.getItem(
        "memento:settings",
      ),
      notifications: localStorage.getItem(
        "memento:notifications",
      ),
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      {
        type: "application/json",
      },
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "memento-data.json";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Could not log out:", error);

      window.alert(
        "Could not log out. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  function clearLocalData() {
    const confirmed = window.confirm(
      "Delete all local Memento data? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    [
      "memento:onboarding",
      "memento:favourite-movies",
      "memento:favourites",
      "memento:diary",
      "memento:watchlist",
      "memento:lists",
      "memento:settings",
      "memento:notifications",
    ].forEach((key) => {
      localStorage.removeItem(key);
    });

    window.location.href = "/";
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#080808] p-6 sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
        Account management
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
        Account
      </h2>

      <div className="mt-7 space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={exportData}
          className="h-auto w-full justify-start border-white/10 bg-black px-4 py-4 text-left text-white hover:bg-white/5"
        >
          <Download className="mr-4 size-4 text-[#9B1738]" />

          <span>
            <span className="block text-sm font-medium">
              Export your data
            </span>

            <span className="mt-1 block text-xs font-normal text-white/35">
              Download your current Memento data as JSON.
            </span>
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onResetSettings}
          className="h-auto w-full justify-start border-white/10 bg-black px-4 py-4 text-left text-white hover:bg-white/5"
        >
          <RotateCcw className="mr-4 size-4 text-white/35" />

          <span>
            <span className="block text-sm font-medium">
              Reset settings
            </span>

            <span className="mt-1 block text-xs font-normal text-white/35">
              Restore recommendation and viewing preferences.
            </span>
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="h-auto w-full justify-start border-white/10 bg-black px-4 py-4 text-left text-white hover:bg-white/5"
        >
          {isLoggingOut ? (
            <LoaderCircle className="mr-4 size-4 animate-spin text-white/35" />
          ) : (
            <LogOut className="mr-4 size-4 text-white/35" />
          )}

          <span>
            <span className="block text-sm font-medium">
              {isLoggingOut
                ? "Logging out..."
                : "Log out"}
            </span>

            <span className="mt-1 block text-xs font-normal text-white/35">
              End your current Memento session.
            </span>
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={clearLocalData}
          className="h-auto w-full justify-start border-red-500/20 bg-red-500/[0.03] px-4 py-4 text-left text-red-300 hover:bg-red-500/10 hover:text-red-200"
        >
          <Trash2 className="mr-4 size-4" />

          <span>
            <span className="block text-sm font-medium">
              Delete local data
            </span>

            <span className="mt-1 block text-xs font-normal text-red-300/50">
              Remove local diary, watchlist, lists, favourites,
              settings, and onboarding data.
            </span>
          </span>
        </Button>
      </div>
    </section>
  );
}