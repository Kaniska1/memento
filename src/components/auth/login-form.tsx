"use client";

import { useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  Mail,
  LockKeyhole,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  success: boolean;
  message?: string;

  user?: {
    id: string;
    name: string;
    username: string;
    email: string;
    onboardingCompleted: boolean;
  };
};

export function LoginForm() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: email
              .trim()
              .toLowerCase(),

            password,
          }),
        },
      );

      const data =
        (await response.json()) as LoginResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not log you in.",
        );
      }

      if (!data.user) {
        throw new Error(
          "Login succeeded but no user was returned.",
        );
      }

      /*
       * Users who haven't completed
       * onboarding must finish it first.
       */
      if (
        !data.user
          .onboardingCompleted
      ) {
        router.replace(
          "/onboarding",
        );

        router.refresh();

        return;
      }

      const requestedNext =
        searchParams.get("next");

      /*
       * Only allow internal redirects.
       *
       * This avoids an open redirect such as:
       *
       * /login?next=https://example.com
       */
      const safeNext =
        requestedNext &&
        requestedNext.startsWith(
          "/",
        ) &&
        !requestedNext.startsWith(
          "//",
        ) &&
        !requestedNext.startsWith(
          "/login",
        ) &&
        !requestedNext.startsWith(
          "/signup",
        )
          ? requestedNext
          : "/home";

      router.replace(safeNext);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not log you in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block text-sm font-medium text-white/75"
        >
          Email
        </label>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />

          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(
                event.target.value,
              );

              setError("");
            }}
            placeholder="you@example.com"
            required
            disabled={isSubmitting}
            className="h-12 border-white/10 bg-black/50 pl-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block text-sm font-medium text-white/75"
        >
          Password
        </label>

        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />

          <Input
            id="login-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(
                event.target.value,
              );

              setError("");
            }}
            placeholder="Enter your password"
            required
            disabled={isSubmitting}
            className="h-12 border-white/10 bg-black/50 px-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) =>
                  !current,
              )
            }
            disabled={isSubmitting}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={
          isSubmitting ||
          !email.trim() ||
          !password
        }
        className="h-11 w-full bg-[#6D001A] text-white hover:bg-[#850522]"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="mr-2 size-4 animate-spin" />
            Logging in...
          </>
        ) : (
          <>
            <LogIn className="mr-2 size-4" />
            Log in
          </>
        )}
      </Button>
    </form>
  );
}