"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ProgramPickerModal, type PickableProgram } from "@/components/programs/program-picker-modal";
import { sortProgramsByPriority } from "@/lib/program-priority";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { unitLabel } from "@/lib/format";
import { useJsonSubmit } from "@/components/ui/use-json-submit";
import { FormError } from "@/components/ui/form-error";

export function AddBalanceForm({ programs }: { programs: PickableProgram[] }) {
  const router = useRouter();
  const orderedPrograms = sortProgramsByPriority(programs);
  const [selectedProgram, setSelectedProgram] = useState<PickableProgram | null>(
    orderedPrograms[0] ?? null
  );
  const [balance, setBalance] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const { submit, isSubmitting, error, setError } = useJsonSubmit();
  const programLabelId = useId();

  if (programs.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        You already have a balance tracked for every active program.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedProgram) {
      setError("Choose a program first.");
      return;
    }

    const result = await submit("/api/balances", "POST", {
      rewardsProgramId: selectedProgram.id,
      balance: Number(balance),
      expiresOverrideAt: expiresOn || undefined,
    });


    if (!result.ok) return;

    setBalance("");
    setExpiresOn("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5 text-sm">
        <span id={programLabelId} className="font-medium text-zinc-700 dark:text-zinc-300">
          Program
        </span>
        <ProgramPickerModal
          labelId={programLabelId}
          programs={programs}
          selectedProgram={selectedProgram}
          onSelect={setSelectedProgram}
        />
      </div>

      <Field label={unitLabel(selectedProgram?.pointsUnit ?? "points")} className="w-36">
        <Input
          type="number"
          min={0}
          step={1}
          required
          placeholder="0"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
      </Field>

      <Field label="Expires on (optional)">
        <Input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add balance"}
      </Button>

      <FormError message={error} />
    </form>
  );
}
