"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProgramBadge } from "@/components/programs/program-badge";
import { Input } from "@/components/ui/input";
import { rowCardClass } from "@/components/ui/card";
import { programLabel } from "@/lib/format";

type ProgramType = "BANK_TRANSFERABLE" | "AIRLINE" | "HOTEL" | "CASHBACK" | "OTHER";

type ProgramEntry = {
  id: string;
  name: string;
  shortName: string | null;
  type: ProgramType;
  valuePerPoint: string;
  transferPartnerCount: number;
  regionLabels: string[];
};

const TYPE_GROUPS: { type: ProgramType; label: string }[] = [
  { type: "BANK_TRANSFERABLE", label: "Bank-Transferable" },
  { type: "AIRLINE", label: "Airline" },
  { type: "HOTEL", label: "Hotel" },
  { type: "CASHBACK", label: "Cashback" },
  { type: "OTHER", label: "Other" },
];

export function ProgramCatalog({ programs }: { programs: ProgramEntry[] }) {
  // The filter lives in ?q= so a filtered view can be linked or reloaded.
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("q") ?? "");

  function updateFilter(value: string) {
    setFilter(value);
    // replaceState rather than router.replace: no server round trip per
    // keystroke, and Next keeps useSearchParams in sync with it.
    const query = value.trim();
    window.history.replaceState(
      null,
      "",
      query ? `?q=${encodeURIComponent(query)}` : window.location.pathname
    );
  }

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return programs;
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(query) || p.shortName?.toLowerCase().includes(query)
    );
  }, [filter, programs]);

  return (
    <div className="flex flex-col gap-8">
      <Input
        type="search"
        aria-label="Filter programs"
        placeholder="Filter by name…"
        value={filter}
        onChange={(e) => updateFilter(e.target.value)}
        className="max-w-sm"
      />

      {TYPE_GROUPS.map(({ type, label }) => {
        const group = filtered.filter((p) => p.type === type);
        if (group.length === 0) return null;

        return (
          <section key={type} className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
              {label}
            </h2>
            <ul className="flex flex-col gap-3">
              {group.map((program) => (
                <li
                  key={program.id}
                  className={`flex flex-wrap items-center gap-4 ${rowCardClass}`}
                >
                  <ProgramBadge
                    name={program.name}
                    shortName={program.shortName}
                    type={program.type}
                    size="sm"
                  />
                  <div>
                    <Link
                      href={`/programs/${program.id}`}
                      className="font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
                    >
                      {programLabel(program)}
                    </Link>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {program.valuePerPoint}/point &middot; {program.transferPartnerCount} transfer
                      partners
                    </p>
                    {program.regionLabels.length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-1">
                        {program.regionLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {label}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No programs match “{filter}”.</p>
      )}
    </div>
  );
}
