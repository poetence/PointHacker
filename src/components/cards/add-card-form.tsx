"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Program = { id: string; name: string; shortName: string | null };

export function AddCardForm({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [issuer, setIssuer] = useState("");
  const [productName, setProductName] = useState("");
  const [nickname, setNickname] = useState("");
  const [rewardsProgramId, setRewardsProgramId] = useState(programs[0]?.id ?? "");
  const [annualFee, setAnnualFee] = useState("");
  const [openedOn, setOpenedOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (programs.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No active programs to link a card to yet.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issuer,
        productName,
        nickname: nickname || undefined,
        rewardsProgramId,
        annualFeeCents: annualFee === "" ? undefined : Math.round(Number(annualFee) * 100),
        openedOn: openedOn || undefined,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    setIssuer("");
    setProductName("");
    setNickname("");
    setAnnualFee("");
    setOpenedOn("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <Field label="Issuer" className="w-36">
        <Input type="text" required placeholder="Chase" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
      </Field>

      <Field label="Card name" className="w-48">
        <Input
          type="text"
          required
          placeholder="Sapphire Preferred"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </Field>

      <Field label="Nickname" className="w-32">
        <Input type="text" placeholder="Optional" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </Field>

      <Field label="Program" className="w-44">
        <Select value={rewardsProgramId} onChange={(e) => setRewardsProgramId(e.target.value)}>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.shortName ?? program.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Annual fee" className="w-28">
        <Input
          type="number"
          min={0}
          step={1}
          placeholder="0"
          prefix="$"
          value={annualFee}
          onChange={(e) => setAnnualFee(e.target.value)}
        />
      </Field>

      <Field label="Opened">
        <Input type="date" value={openedOn} onChange={(e) => setOpenedOn(e.target.value)} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        Add card
      </Button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
