"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Clapperboard,
  Compass,
  Eye,
  Heart,
  Home,
  ListVideo,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

const primaryLinks = [
  {
    label: "Home",
    href: "/home",
    icon: Home,
  },
  {
    label: "Discover",
    href: "/discover",
    icon: Compass,
  },
  {
    label: "For You",
    href: "/recommendations",
    icon: Sparkles,
  },
  {
    label: "Diary",
    href: "/diary",
    icon: Clapperboard,
  },
  {
    label: "Watched",
    href: "/watched",
    icon: Eye,
  },
  {
    label: "Liked",
    href: "/liked",
    icon: Heart,
  },
  {
    label: "Watchlist",
    href: "/watchlist",
    icon: Bookmark,
  },
  {
    label: "Lists",
    href: "/lists",
    icon: ListVideo,
  },
];

const secondaryLinks = [
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#050505] lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-white/10 px-7">
        <Link
          href="/home"
          className="text-lg font-semibold tracking-[0.22em] text-white"
        >
          MEMENTO
        </Link>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <div>
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/25">
            Cinema
          </p>

          <div className="mt-3 space-y-1">
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
                    transition-colors
                    ${
                      active
                        ? "bg-[#6D001A] text-white"
                        : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                    }
                  `}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-8">
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/25">
            Account
          </p>

          <div className="mt-3 space-y-1">
            {secondaryLinks.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
                    transition-colors
                    ${
                      active
                        ? "bg-[#6D001A] text-white"
                        : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                    }
                  `}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}