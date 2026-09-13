"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groups = new Map<string, PromoPartner[]>();
  for (const partner of partners) {
    const group = groups.get(partner.fromProgramName) ?? [];
    group.push(partner);
    groups.set(partner.fromProgramName, group);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transferPartnerId,
        bonusPercent: Number(bonusPercent),
        startsOn,
        endsOn,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

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
        Add promo
      </Button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
