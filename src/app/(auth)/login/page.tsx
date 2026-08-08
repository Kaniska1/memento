import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Create your profile"
      title="Start remembering."
      description="Build your film diary and shape recommendations around what you actually love."
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerHref="/login"
    >
      <SignupForm />
    </AuthShell>
  );
}