"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  ListPlus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteMovieList,
  getMovieLists,
} from "@/lib/list-storage";
import { CreateListDialog } from "./create-list-dialog";
import { ListCard } from "./list-card";
import { ListDetailsDialog } from "./list-details-dialog";

import type { MovieList } from "@/types/list";

export function ListsClient() {
  const [lists, setLists] = useState<MovieList[]>([]);
  const [query, setQuery] = useState("");
  const [selectedListId, setSelectedListId] =
    useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  function loadLists() {
    setLists(getMovieLists());
  }

  useEffect(() => {
    loadLists();

    window.addEventListener(
      "memento:lists-updated",
      loadLists,
    );

    return () => {
      window.removeEventListener(
        "memento:lists-updated",
        loadLists,
      );
    };
  }, []);

  const filteredLists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return lists;
    }

    return lists.filter(
      (list) =>
        list.title.toLowerCase().includes(normalizedQuery) ||
        list.description
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [lists, query]);

  const selectedList =
    lists.find((list) => list.id === selectedListId) ??
    null;

  function openList(list: MovieList) {
    setSelectedListId(list.id);
    setDetailsOpen(true);
  }

  function handleDelete(listId: string) {
    const confirmed = window.confirm(
      "Delete this list? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    deleteMovieList(listId);

    if (selectedListId === listId) {
      setSelectedListId(null);
      setDetailsOpen(false);
    }

    loadLists();
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
              Curated by you
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Your lists.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
              Rank, organise, recommend, or obsessively categorise
              films according to rules only you understand.
            </p>
          </div>

          <CreateListDialog />
        </header>

        {lists.length > 0 && (
          <div className="relative mt-10">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

            <Input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search your lists..."
              className="h-12 border-white/10 bg-[#080808] pl-11 text-white placeholder:text-white/25"
            />
          </div>
        )}

        <div className="mt-9">
          {lists.length === 0 && (
            <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#060606]">
              <div className="max-w-md px-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#160006] text-[#9B1738]">
                  <FolderOpen className="size-6" />
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-white">
                  No lists yet.
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Create collections for favourites, rankings,
                  recommendations, or suspiciously specific moods.
                </p>

                <CreateListDialog
                  trigger={
                    <Button className="mt-7 bg-[#6D001A] text-white hover:bg-[#850522]">
                      <ListPlus className="mr-2 size-4" />
                      Create your first list
                    </Button>
                  }
                />
              </div>
            </div>
          )}

          {lists.length > 0 &&
            filteredLists.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-[#060606] px-6 py-16 text-center">
                <p className="text-sm text-white/40">
                  No lists match “{query}”.
                </p>
              </div>
            )}

          {filteredLists.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  onOpen={openList}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        <ListDetailsDialog
          list={selectedList}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onListUpdated={loadLists}
        />
      </div>
    </div>
  );
}