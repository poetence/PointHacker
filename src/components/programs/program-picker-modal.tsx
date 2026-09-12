"use client";

import { useEffect, useState } from "react";
import { ProgramBadge } from "@/components/programs/program-badge";
import { sortProgramsByPriority } from "@/lib/program-priority";

export type PickableProgram = {
  id: string;
  name: string;
  shortName: string | null;
  type: "BANK_TRANSFERABLE" | "AIRLINE" | "HOTEL" | "CASHBACK" | "OTHER";
};

export function ProgramPickerModal({
  programs,
  selectedProgram,
  onSelect,
}: {
  programs: PickableProgram[];
  selectedProgram: PickableProgram | null;
  onSelect: (program: PickableProgram) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ordered = sortProgramsByPriority(programs);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {selectedProgram ? (
          <ProgramBadge
            name={selectedProgram.name}
            shortName={selectedProgram.shortName}
            type={selectedProgram.type}
            size="sm"
          />
        ) : (
          "Choose a program"
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose a program"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-lg bg-white p-6 dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                Choose a program
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {ordered.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => {
                    onSelect(program);
                    setIsOpen(false);
                  }}
                  title={program.name}
                  className="flex flex-col items-center gap-2 rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <ProgramBadge name={program.name} shortName={program.shortName} type={program.type} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
