"use client";

import { useEffect, useState } from "react";
import { CardArt } from "@/components/recommendations/card-art";
import { controlClass, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type PickableCard = {
  id: string;
  issuer: string;
  name: string;
  programLabel: string;
  annualFeeCents: number;
};

export function CatalogCardPicker({
  cards,
  selected,
  onSelect,
}: {
  cards: PickableCard[];
  selected: PickableCard | null;
  onSelect: (card: PickableCard) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const query = filter.trim().toLowerCase();
  const visible = query
    ? cards.filter((c) => `${c.issuer} ${c.name}`.toLowerCase().includes(query))
    : cards;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${controlClass} flex items-center gap-3 p-1.5 pr-3`}
      >
        {selected ? (
          <>
            <CardArt issuer={selected.issuer} name={selected.name} />
            <span className="text-left">
              <span className="block font-medium">
                {selected.issuer} {selected.name}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                earns {selected.programLabel}
              </span>
            </span>
          </>
        ) : (
          <span className="px-1.5">Choose a card</span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose a card"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-lg bg-white p-6 dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
                Choose a card
              </h2>
              <Button size="sm" variant="link" type="button" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>

            <Input
              type="search"
              autoFocus
              placeholder="Filter by issuer or name…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visible.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    onSelect(card);
                    setIsOpen(false);
                    setFilter("");
                  }}
                  className="flex flex-col items-center gap-2 rounded-lg p-2 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <CardArt issuer={card.issuer} name={card.name} />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{card.issuer}</span>
                </button>
              ))}
              {visible.length === 0 && (
                <p className="col-span-full text-sm text-zinc-500 dark:text-zinc-400">
                  No catalog cards match &quot;{filter}&quot; — add it as a custom card instead.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
