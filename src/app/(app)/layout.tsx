import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { MobileNav } from "@/components/app/mobile-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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