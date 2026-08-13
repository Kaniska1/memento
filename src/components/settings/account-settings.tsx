"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  LogOut,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type AccountSettingsProps = {
  onResetSettings: () => void | Promise<void>;
};

export function AccountSettings({
  onResetSettings,
}: AccountSettingsProps) {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [isResetting, setIsResetting] =
    useState(false);

  async function handleResetSettings() {
    if (isResetting) {
      return;
    }

    setIsResetting(true);

    try {
      await onResetSettings();
    } finally {
      setIsResetting(false);
    }
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
        throw new Error(
          "Logout failed.",
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Could not log out:",
        error,
      );

      window.alert(
        "Could not log out. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
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
          onClick={
            handleResetSettings
          }
          disabled={isResetting}
          className="h-auto w-full justify-start border-white/10 bg-black px-4 py-4 text-left text-white hover:bg-white/5"
        >
          {isResetting ? (
            <LoaderCircle className="mr-4 size-4 animate-spin text-white/35" />
          ) : (
            <RotateCcw className="mr-4 size-4 text-white/35" />
          )}

          <span>
            <span className="block text-sm font-medium">
              {isResetting
                ? "Resetting..."
                : "Reset settings"}
            </span>

            <span className="mt-1 block text-xs font-normal text-white/35">
              Restore recommendation
              and viewing preferences
              to their defaults.
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
              End your current
              Memento session.
            </span>
          </span>
        </Button>
      </div>
    </section>
  );
}