"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

type SignupResponse = {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    username: string;
    email: string;
    onboardingCompleted: boolean;
  };
  errors?: Partial<
    Record<"name" | "username" | "email" | "password", string[]>
  >;
};

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "username" | "email" | "password", string[]>>
  >({});

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
        }),
      });

      const data = (await response.json()) as SignupResponse;

      if (!response.ok) {
        setFormError(data.message);
        setFieldErrors(data.errors ?? {});
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setFormError("Could not connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-white/75"
        >
          Name
        </label>

        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />

          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 border-white/10 bg-black/50 pl-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />
        </div>

        {fieldErrors.name?.length ? (
          <p className="mt-2 text-sm text-red-300">
            {fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-white/75"
        >
          Username
        </label>

        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />

          <Input
            id="username"
            type="text"
            placeholder="Choose a username"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="h-12 border-white/10 bg-black/50 pl-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />
        </div>

        {fieldErrors.username?.length ? (
          <p className="mt-2 text-sm text-red-300">
            {fieldErrors.username[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-white/75"
        >
          Email
        </label>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />

          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 border-white/10 bg-black/50 pl-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />
        </div>

        {fieldErrors.email?.length ? (
          <p className="mt-2 text-sm text-red-300">
            {fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-white/75"
        >
          Password
        </label>

        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />

          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 border-white/10 bg-black/50 px-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>

        {fieldErrors.password?.length ? (
          <p className="mt-2 text-sm text-red-300">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {formError ? <p className="text-sm text-red-300">{formError}</p> : null}

      <label className="flex items-start gap-3 text-sm leading-6 text-white/45">
        <input
          type="checkbox"
          required
          className="mt-1 size-4 rounded border-white/20 bg-black accent-[#6D001A]"
        />

        <span>
          I agree to the Terms of Service and Privacy Policy.
        </span>
      </label>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full bg-[#6D001A] text-white hover:bg-[#850522]"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}