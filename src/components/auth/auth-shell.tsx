import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerHref,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 py-10">
      <div className="pointer-events-none absolute right-[-12%] top-[5%] size-[500px] rounded-full bg-[#6D001A]/20 blur-[160px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1200px] items-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-[#090909] shadow-2xl shadow-black/60 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative hidden min-h-[720px] overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(109,0,26,0.26),transparent_35%),linear-gradient(180deg,#090909_0%,#000000_100%)]" />

            <div className="relative z-10">
              <Link
                href="/"
                className="text-lg font-semibold tracking-[0.22em] text-white"
              >
                MEMENTO
              </Link>
            </div>

            <div className="relative z-10 max-w-md">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/45">
                Your cinema, remembered
              </p>

              <h2 className="mt-5 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-white">
                Build a profile around the films that stayed with you.
              </h2>

              <p className="mt-6 text-base leading-7 text-white/45">
                Keep a diary, rate what you watch, build lists, and discover
                films shaped around your taste.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {["Discover", "Log", "Remember"].map((item, index) => (
                <div key={item}>
                  <p className="text-xs text-[#8A0B29]">
                    0{index + 1}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex min-h-[720px] items-center p-6 sm:p-10 lg:p-12">
            <div className="mx-auto w-full max-w-md">
              <Link
                href="/"
                className="mb-12 inline-block text-lg font-semibold tracking-[0.22em] text-white lg:hidden"
              >
                MEMENTO
              </Link>

              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#8A0B29]">
                {eyebrow}
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white">
                {title}
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/45">
                {description}
              </p>

              <div className="mt-9">{children}</div>

              <p className="mt-8 text-center text-sm text-white/45">
                {footerText}{" "}
                <Link
                  href={footerHref}
                  className="font-medium text-white transition-colors hover:text-[#A51636]"
                >
                  {footerLinkText}
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}