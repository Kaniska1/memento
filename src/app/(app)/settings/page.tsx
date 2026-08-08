import type { Metadata } from "next";

import { SettingsClient } from "@/components/settings/settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your Memento profile and viewing preferences.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}