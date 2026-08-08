import type { Metadata } from "next";

import { ListsClient } from "@/components/lists/lists-client";

export const metadata: Metadata = {
  title: "Lists",
  description:
    "Create and manage custom collections of movies.",
};

export default function ListsPage() {
  return <ListsClient />;
}