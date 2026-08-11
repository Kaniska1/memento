"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Clapperboard,
  Compass,
  Eye,
  Home,
  Sparkles,
  UserRound,
} from "lucide-react";

const links = [
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
    label: "Watchlist",
    href: "/watchlist",
    icon: Bookmark,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-3 py-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-7">
        {links.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] ${
                active ? "text-white" : "text-white/35"
              }`}
            >
              <Icon
                className={`size-4 ${
                  active ? "text-[#9B1738]" : ""
                }`}
              />

              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}