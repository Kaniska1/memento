"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/onboarding");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
            className="h-12 border-white/10 bg-black/50 pl-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />
        </div>
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
            className="h-12 border-white/10 bg-black/50 pl-10 text-white placeholder:text-white/25 focus-visible:border-[#6D001A]"
          />
        </div>
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
      </div>

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
        className="h-12 w-full rounded-xl bg-[#6D001A] text-white hover:bg-[#850522]"
      >
        Create profile
      </Button>
    </form>
  );
}