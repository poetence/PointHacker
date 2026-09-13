"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  CatalogCardPicker,
  type PickableCard,
} from "@/components/cards/catalog-card-picker";

type Program = { id: string; name: string; shortName: string | null };

export function AddCardForm({
  programs,
  catalog,
}: {
  programs: Program[];
  catalog: PickableCard[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"catalog" | "custom">(
    catalog.length > 0 ? "catalog" : "custom",
  );
  const [selectedCard, setSelectedCard] = useState<PickableCard | null>(
    catalog[0] ?? null,
  );
  const [issuer, setIssuer] = useState("");
  const [productName, setProductName] = useState("");
  const [nickname, setNickname] = useState("");
  const [rewardsProgramId, setRewardsProgramId] = useState(
    programs[0]?.id ?? "",
  );
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

    if (mode === "catalog" && !selectedCard) {
      setError("Choose a card first.");
      setIsSubmitting(false);
      return;
    }

    const shared = {
      nickname: nickname || undefined,
      openedOn: openedOn || undefined,
    };
    const payload =
      mode === "catalog"
        ? { ...shared, cardProductId: selectedCard!.id }
        : {
            ...shared,
            issuer,
            productName,
            rewardsProgramId,
            annualFeeCents:
              annualFee === ""
                ? undefined
                : Math.round(Number(annualFee) * 100),
          };

    const response = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {catalog.length > 0 && (
        <div className="flex gap-1 self-start rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {(["catalog", "custom"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`rounded-md px-3 py-1 font-medium transition ${
                mode === option
                  ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {option === "catalog" ? "From catalog" : "Custom card"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        {mode === "catalog" ? (
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Card
            </span>
            <CatalogCardPicker
              cards={catalog}
              selected={selectedCard}
              onSelect={setSelectedCard}
            />
          </div>
        ) : (
          <>
            <Field label="Issuer" className="w-36">
              <Input
                type="text"
                required
                placeholder="Chase"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
              />
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
              <Input
                type="text"
                placeholder="Optional"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </Field>

            <Field label="Program" className="w-44">
              <Select
                value={rewardsProgramId}
                onChange={(e) => setRewardsProgramId(e.target.value)}
              >
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
          </>
        )}

        {mode === "catalog" && (
          <Field label="Nickname" className="w-32">
            <Input
              type="text"
              placeholder="Optional"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </Field>
        )}

        <Field label="Opened">
          <Input
            type="date"
            value={openedOn}
            onChange={(e) => setOpenedOn(e.target.value)}
          />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          Add card
        </Button>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </form>
  );
}
