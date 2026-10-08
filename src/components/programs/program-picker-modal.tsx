"use client";

import { useId, useRef, useState } from "react";
import { ProgramBadge } from "@/components/programs/program-badge";
import { sortProgramsByPriority } from "@/lib/program-priority";
import { controlClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PickerDialog } from "@/components/ui/picker-dialog";
import { sectionTitleClass } from "@/components/ui/text";

export type PickableProgram = {
  id: string;
  name: string;
  shortName: string | null;
  type: "BANK_TRANSFERABLE" | "AIRLINE" | "HOTEL" | "CASHBACK" | "OTHER";
  pointsUnit: string;
};

export function ProgramPickerModal({
  programs,
  selectedProgram,
  onSelect,
  labelId,
}: {
  programs: PickableProgram[];
  selectedProgram: PickableProgram | null;
  onSelect: (program: PickableProgram) => void;
  /** id of the visible label beside the trigger, so it's announced as "Program, Amex MR". */
  labelId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ordered = sortProgramsByPriority(programs);
  const triggerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="dialog"
        aria-labelledby={labelId ? `${labelId} ${triggerId}` : undefined}
        onClick={() => setIsOpen(true)}
        className={`${controlClass} flex items-center gap-2 p-1.5`}
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
        <PickerDialog label="Choose a program" triggerRef={triggerRef} onClose={() => setIsOpen(false)}>
          <div className="flex items-center justify-between">
            <h2 className={sectionTitleClass}>Choose a program</h2>
            <Button size="sm" variant="link" type="button" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {ordered.map((program) => (
              <button
                key={program.id}
                type="button"
                // Opening lands on the current choice rather than on Close.
                data-autofocus={program.id === selectedProgram?.id ? true : undefined}
                aria-pressed={program.id === selectedProgram?.id}
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
        </PickerDialog>
      )}
    </>
  );
}
