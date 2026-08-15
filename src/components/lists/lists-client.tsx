"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  FolderOpen,
  ListPlus,
  LoaderCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  deleteList,
  fetchLists,
} from "@/lib/api/lists";

import { CreateListDialog } from "./create-list-dialog";
import { ListCard } from "./list-card";
import { ListDetailsDialog } from "./list-details-dialog";

import type { MovieList } from "@/types/list";

type VisibilityFilter =
  | "all"
  | "public"
  | "private";

type ListTypeFilter =
  | "all"
  | "ranked"
  | "standard";

export function ListsClient() {
  const [lists, setLists] =
    useState<MovieList[]>([]);

  const [query, setQuery] =
    useState("");

  const [
    visibility,
    setVisibility,
  ] =
    useState<VisibilityFilter>(
      "all",
    );

  const [
    listType,
    setListType,
  ] =
    useState<ListTypeFilter>(
      "all",
    );

  const [
    selectedListId,
    setSelectedListId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    detailsOpen,
    setDetailsOpen,
  ] =
    useState(false);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState<string | null>(
      null,
    );

  const [error, setError] =
    useState("");

  const loadLists =
    useCallback(async () => {
      try {
        setError("");

        const data =
          await fetchLists();

        setLists(data);
      } catch (loadError) {
        console.error(
          "Could not load lists:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your lists.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadLists();

    function handleListsUpdated() {
      void loadLists();
    }

    window.addEventListener(
      "memento:lists-updated",
      handleListsUpdated,
    );

    return () => {
      window.removeEventListener(
        "memento:lists-updated",
        handleListsUpdated,
      );
    };
  }, [loadLists]);

  const filteredLists =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      return lists.filter(
        (list) => {
          const matchesQuery =
            normalizedQuery.length ===
              0 ||
            list.title
              .toLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            list.description
              .toLowerCase()
              .includes(
                normalizedQuery,
              );

          const matchesVisibility =
            visibility === "all" ||
            (
              visibility ===
                "public" &&
              list.isPublic
            ) ||
            (
              visibility ===
                "private" &&
              !list.isPublic
            );

          const matchesType =
            listType === "all" ||
            (
              listType ===
                "ranked" &&
              list.isRanked
            ) ||
            (
              listType ===
                "standard" &&
              !list.isRanked
            );

          return (
            matchesQuery &&
            matchesVisibility &&
            matchesType
          );
        },
      );
    }, [
      lists,
      query,
      visibility,
      listType,
    ]);

  const selectedList =
    lists.find(
      (list) =>
        list.id ===
        selectedListId,
    ) ?? null;

  const totalFilms =
    useMemo(
      () =>
        lists.reduce(
          (
            total,
            list,
          ) =>
            total +
            list.movies.length,
          0,
        ),
      [lists],
    );

  const hasActiveFilters =
    query.trim().length > 0 ||
    visibility !== "all" ||
    listType !== "all";

  function clearFilters() {
    setQuery("");
    setVisibility("all");
    setListType("all");
  }

  function openList(
    list: MovieList,
  ) {
    setSelectedListId(
      list.id,
    );

    setDetailsOpen(
      true,
    );
  }

  async function handleDelete(
    listId: string,
  ) {
    const confirmed =
      window.confirm(
        "Delete this list? This cannot be undone.",
      );

    if (!confirmed) {
      return;
    }

    setIsDeleting(
      listId,
    );

    try {
      await deleteList(
        listId,
      );

      setLists(
        (current) =>
          current.filter(
            (list) =>
              list.id !==
              listId,
          ),
      );

      if (
        selectedListId ===
        listId
      ) {
        setSelectedListId(
          null,
        );

        setDetailsOpen(
          false,
        );
      }
    } catch (deleteError) {
      console.error(
        "Could not delete list:",
        deleteError,
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this list.",
      );
    } finally {
      setIsDeleting(
        null,
      );
    }
  }

  if (isLoading) {
    return (
      <div className="px-5 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-white/[0.05]" />
          <div className="mt-4 h-14 w-72 max-w-full animate-pulse rounded-xl bg-white/[0.05]" />

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map(
              (
                _,
                index,
              ) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#080808]"
                >
                  <div className="aspect-[16/9] animate-pulse bg-white/[0.04]" />
                  <div className="p-5">
                    <div className="h-5 w-1/2 animate-pulse rounded bg-white/[0.06]" />
                    <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-white/[0.04]" />
                    <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="sr-only">
            <LoaderCircle className="animate-spin" />
            Loading lists...
          </div>
        </div>
      </div>
    );
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
              Rank, organise, recommend, or obsessively categorise films
              according to rules only you understand.
            </p>

            {lists.length >
              0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[11px] text-white/40">
                  {lists.length}{" "}
                  {lists.length === 1
                    ? "list"
                    : "lists"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[11px] text-white/40">
                  {totalFilms} film{" "}
                  {totalFilms === 1
                    ? ""
                    : "entries"}
                </span>
              </div>
            )}
          </div>

          <CreateListDialog
            onCreated={() => {
              void loadLists();
            }}
          />
        </header>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {lists.length > 0 && (
          <section className="mt-10 rounded-2xl border border-white/10 bg-[#080808] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-white/45">
              <SlidersHorizontal className="size-4 text-[#9B1738]" />
              Find a collection
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />

                <Input
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search titles or descriptions..."
                  className="h-11 border-white/10 bg-black pl-11 text-white placeholder:text-white/25"
                />
              </div>

              <SelectControl
                value={visibility}
                onChange={(value) =>
                  setVisibility(
                    value as VisibilityFilter,
                  )
                }
                ariaLabel="Filter lists by visibility"
              >
                <option value="all">
                  All visibility
                </option>
                <option value="public">
                  Public
                </option>
                <option value="private">
                  Private
                </option>
              </SelectControl>

              <SelectControl
                value={listType}
                onChange={(value) =>
                  setListType(
                    value as ListTypeFilter,
                  )
                }
                ariaLabel="Filter lists by type"
              >
                <option value="all">
                  All list types
                </option>
                <option value="ranked">
                  Ranked
                </option>
                <option value="standard">
                  Unranked
                </option>
              </SelectControl>
            </div>

            <div className="mt-4 flex min-h-8 flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
              <p className="text-xs text-white/30">
                Showing{" "}
                <span className="font-medium text-white/60">
                  {
                    filteredLists.length
                  }
                </span>{" "}
                of {lists.length} lists
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="flex items-center gap-1.5 text-xs text-white/35 transition hover:text-white"
                >
                  <RotateCcw className="size-3.5" />
                  Clear filters
                </button>
              )}
            </div>
          </section>
        )}

        <div className="mt-9">
          {!error &&
            lists.length ===
              0 && (
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
                    onCreated={() => {
                      void loadLists();
                    }}
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
            filteredLists.length ===
              0 && (
              <div className="rounded-3xl border border-white/10 bg-[#060606] px-6 py-16 text-center">
                <SlidersHorizontal className="mx-auto size-6 text-white/20" />

                <h2 className="mt-4 text-lg font-medium text-white">
                  No lists match those filters.
                </h2>

                <p className="mt-2 text-sm text-white/35">
                  Try another title, visibility, or list type.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    clearFilters
                  }
                  className="mt-5 border-white/10 bg-black text-white hover:bg-white hover:text-black"
                >
                  Clear filters
                </Button>
              </div>
            )}

          {filteredLists.length >
            0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredLists.map(
                (list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onOpen={
                      openList
                    }
                    onDelete={
                      handleDelete
                    }
                    isDeleting={
                      isDeleting ===
                      list.id
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>

        <ListDetailsDialog
          list={selectedList}
          open={detailsOpen}
          onOpenChange={
            setDetailsOpen
          }
          onListUpdated={
            loadLists
          }
        />
      </div>
    </div>
  );
}

function SelectControl({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (
    value: string,
  ) => void;
  ariaLabel: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">
        {ariaLabel}
      </span>

      <select
        value={value}
        aria-label={
          ariaLabel
        }
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 text-sm text-white outline-none transition focus:border-[#6D001A]"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
    </label>
  );
}