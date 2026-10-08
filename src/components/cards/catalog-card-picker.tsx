"use client";

import { useId, useRef, useState } from "react";
import { CardArt } from "@/components/recommendations/card-art";
import { controlClass, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PickerDialog } from "@/components/ui/picker-dialog";
import { sectionTitleClass } from "@/components/ui/text";

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
  labelId,
}: {
  cards: PickableCard[];
  selected: PickableCard | null;
  onSelect: (card: PickableCard) => void;
  /** id of the visible label beside the trigger, so it's announced as "Card, Chase Sapphire…". */
  labelId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const triggerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const query = filter.trim().toLowerCase();
  const visible = query
    ? cards.filter((c) => `${c.issuer} ${c.name}`.toLowerCase().includes(query))
    : cards;

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="dialog"
        aria-labelledby={labelId ? `${labelId} ${triggerId}` : undefined}
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
        <PickerDialog label="Choose a card" triggerRef={triggerRef} onClose={() => setIsOpen(false)}>
          <div className="flex items-center justify-between gap-4">
            <h2 className={sectionTitleClass}>Choose a card</h2>
            <Button size="sm" variant="link" type="button" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>

          <Input
            type="search"
            data-autofocus
            aria-label="Filter cards"
            placeholder="Filter by issuer or name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((card) => (
              <button
                key={card.id}
                type="button"
                // CardArt (which shows the name) is hidden from screen readers, so
                // without this every button read as just its issuer: "Chase, Chase…".
                aria-label={`${card.issuer} ${card.name}, earns ${card.programLabel}`}
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
                No catalog cards match “{filter}” — add it as a custom card instead.
              </p>
            )}
          </div>
        </PickerDialog>
      )}
    </>
  );
}
