"use client";

import { useState } from "react";
import { CalendarDays, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProfileHeaderProps = {
  name: string;
  username: string;
  bio: string;
  joinedAt: string;
  onSave: (profile: {
    name: string;
    username: string;
    bio: string;
  }) => void;
};

export function ProfileHeader({
  name,
  username,
  bio,
  joinedAt,
  onSave,
}: ProfileHeaderProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(name);
  const [profileUsername, setProfileUsername] =
    useState(username);
  const [profileBio, setProfileBio] = useState(bio);

  function openEditor() {
    setDisplayName(name);
    setProfileUsername(username);
    setProfileBio(bio);
    setOpen(true);
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = displayName.trim();
    const trimmedUsername = profileUsername
      .trim()
      .replace(/^@/, "")
      .replace(/\s+/g, "");

    if (!trimmedName || !trimmedUsername) {
      return;
    }

    onSave({
      name: trimmedName,
      username: trimmedUsername,
      bio: profileBio.trim(),
    });

    setOpen(false);
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-[#080808] p-6 sm:p-8">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#6D001A] text-3xl font-semibold text-white">
              {initials}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9B1738]">
                Film profile
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-white">
                {name}
              </h1>

              <p className="mt-1 text-sm text-white/35">
                @{username}
              </p>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
                {bio || "No bio yet."}
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
                <CalendarDays className="size-3.5" />
                Joined{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  month: "long",
                  year: "numeric",
                }).format(new Date(joinedAt))}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={openEditor}
            className="border-white/10 bg-black text-white hover:bg-white hover:text-black"
          >
            <Pencil className="mr-2 size-4" />
            Edit profile
          </Button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[#080808] text-white sm:max-w-xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold tracking-[-0.035em] text-white">
                Edit profile
              </DialogTitle>

              <DialogDescription className="text-white/40">
                Update how your profile appears across Memento.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-7 space-y-6">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-medium text-white/70"
                >
                  Display name
                </label>

                <Input
                  id="profile-name"
                  value={displayName}
                  onChange={(event) =>
                    setDisplayName(
                      event.target.value.slice(0, 60),
                    )
                  }
                  className="h-11 border-white/10 bg-black text-white"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="profile-username"
                  className="mb-2 block text-sm font-medium text-white/70"
                >
                  Username
                </label>

                <Input
                  id="profile-username"
                  value={profileUsername}
                  onChange={(event) =>
                    setProfileUsername(
                      event.target.value
                        .replace(/\s+/g, "")
                        .slice(0, 30),
                    )
                  }
                  className="h-11 border-white/10 bg-black text-white"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="profile-bio"
                    className="text-sm font-medium text-white/70"
                  >
                    Bio
                  </label>

                  <span className="text-xs text-white/25">
                    {profileBio.length}/240
                  </span>
                </div>

                <Textarea
                  id="profile-bio"
                  value={profileBio}
                  onChange={(event) =>
                    setProfileBio(
                      event.target.value.slice(0, 240),
                    )
                  }
                  className="min-h-28 resize-none border-white/10 bg-black text-white"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-white/45 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
              >
                Save profile
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}