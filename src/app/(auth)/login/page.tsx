import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

function LoginFormFallback() {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 h-4 w-12 rounded bg-white/5" />

        <div className="h-12 animate-pulse rounded-xl border border-white/10 bg-black/50" />
      </div>

      <div>
        <div className="mb-2 h-4 w-20 rounded bg-white/5" />

        <div className="h-12 animate-pulse rounded-xl border border-white/10 bg-black/50" />
      </div>

      <div className="h-11 animate-pulse rounded-xl bg-[#6D001A]/40" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Pick up where you left off."
      description="Your diary, ratings, lists, and watchlist are waiting."
      footerText="Don't have an account?"
      footerLinkText="Create one"
      footerHref="/signup"
    >
      <Suspense
        fallback={<LoginFormFallback />}
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}