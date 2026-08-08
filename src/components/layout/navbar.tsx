"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-6 lg:px-10">
        {/* Brand */}
        <Link
          href="/"
          className="text-xl font-semibold tracking-[0.18em] text-white"
        >
          MEMENTO
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/discover"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Discover
          </Link>

          <Link
            href="/community"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Community
          </Link>

          <Link
            href="/about"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:bg-white/[0.06] hover:text-white"
          >
            <Search className="size-4" />
          </Button>

          <Button asChild variant="ghost">
  <Link href="/login">Log in</Link>
</Button>

<Button asChild className="bg-[#6D001A] text-white hover:bg-[#850522]">
  <Link href="/signup">Join Memento</Link>
</Button>
        </div>
      </div>
    </header>
  );
}