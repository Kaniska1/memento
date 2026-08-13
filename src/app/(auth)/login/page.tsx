import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

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
      <LoginForm />
    </AuthShell>
  );
}