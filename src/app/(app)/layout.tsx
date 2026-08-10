import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { MobileNav } from "@/components/app/mobile-nav";
import { getCurrentUser } from "@/lib/current-user";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AppSidebar />

      <div className="min-h-screen lg:pl-64">
        <AppTopbar />

        <main className="pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}