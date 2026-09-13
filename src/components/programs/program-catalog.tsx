"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProgramBadge } from "@/components/programs/program-badge";
import { Input } from "@/components/ui/input";

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
  const [filter, setFilter] = useState("");

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
        placeholder="Filter by name…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      {TYPE_GROUPS.map(({ type, label }) => {
        const group = filtered.filter((p) => p.type === type);
        if (group.length === 0) return null;

        return (
          <section key={type} className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
              {label}
            </h2>
            <ul className="flex flex-col gap-3">
              {group.map((program) => (
                <li
                  key={program.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50"
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
                      {program.shortName ?? program.name}
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No programs match &quot;{filter}&quot;.</p>
      )}
    </div>
  );
}
