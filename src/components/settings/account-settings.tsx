"use client";

import {
  Download,
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
  function exportData() {
    const data = {
      onboarding: localStorage.getItem(
        "memento:onboarding",
      ),
      favouriteMovies: localStorage.getItem(
        "memento:favourite-movies",
      ),
      diary: localStorage.getItem("memento:diary"),
      watchlist: localStorage.getItem(
        "memento:watchlist",
      ),
      lists: localStorage.getItem("memento:lists"),
      settings: localStorage.getItem(
        "memento:settings",
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
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function clearLocalData() {
    const confirmed = window.confirm(
      "Delete all local Memento data? This cannot be undone.",
    );

    if (!confirmed) return;

    [
      "memento:onboarding",
      "memento:favourite-movies",
      "memento:diary",
      "memento:watchlist",
      "memento:lists",
      "memento:settings",
    ].forEach((key) => localStorage.removeItem(key));

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
              Download your current frontend data as JSON.
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
          className="h-auto w-full justify-start border-white/10 bg-black px-4 py-4 text-left text-white hover:bg-white/5"
        >
          <LogOut className="mr-4 size-4 text-white/35" />

          <span>
            <span className="block text-sm font-medium">
              Log out
            </span>

            <span className="mt-1 block text-xs font-normal text-white/35">
              Authentication will be connected during the backend phase.
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
              Remove all diary, watchlist, lists, and onboarding data.
            </span>
          </span>
        </Button>
      </div>
    </section>
  );
}