"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { groupBy } from "@/lib/group-by";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useJsonSubmit } from "@/components/ui/use-json-submit";
import { FormError } from "@/components/ui/form-error";

export type PromoPartner = {
  id: string;
  fromProgramName: string;
  toProgramName: string;
};

export function AddPromoForm({ partners }: { partners: PromoPartner[] }) {
  const router = useRouter();
  const [transferPartnerId, setTransferPartnerId] = useState(partners[0]?.id ?? "");
  const [bonusPercent, setBonusPercent] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const { submit, isSubmitting, error } = useJsonSubmit();

  const groups = groupBy(partners, (partner) => partner.fromProgramName);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = await submit("/api/promos", "POST", {
      transferPartnerId,
      bonusPercent: Number(bonusPercent),
      startsOn,
      endsOn,
    });

    if (!result.ok) return;

    setBonusPercent("");
    setStartsOn("");
    setEndsOn("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <Field label="Transfer" className="w-64">
        <Select value={transferPartnerId} onChange={(e) => setTransferPartnerId(e.target.value)}>
          {[...groups.entries()].map(([fromName, group]) => (
            <optgroup key={fromName} label={fromName}>
              {group.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {fromName} → {partner.toProgramName}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>

      <Field label="Bonus" className="w-24">
        <Input
          type="number"
          min={1}
          max={500}
          step={1}
          required
          placeholder="30"
          suffix="%"
          value={bonusPercent}
          onChange={(e) => setBonusPercent(e.target.value)}
        />
      </Field>

      <Field label="Starts">
        <Input type="date" required value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
      </Field>

      <Field label="Ends">
        <Input type="date" required value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add promo"}
      </Button>

      <FormError message={error} />
    </form>
  );
}
