"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInlineEdit } from "@/components/ui/use-inline-edit";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { useJsonSubmit } from "@/components/ui/use-json-submit";
import { FormError } from "@/components/ui/form-error";
import { dollarsToCents, localDateInputValue } from "@/lib/format";

/** A wallet card's editable fields, as plain values; dates are `YYYY-MM-DD`. */
export type EditableCard = {
  id: string;
  /** Names the row for screen readers, which otherwise hear a column of identical buttons. */
  cardName: string;
  nickname: string | null;
  annualFeeCents: number | null;
  openedOn: string | null;
  isClosed: boolean;
  isBusiness: boolean;
  bonusPoints: number | null;
  bonusSpendCents: number | null;
  bonusMonths: number | null;
  bonusSpentCents: number | null;
  bonusReceivedOn: string | null;
};

const centsToDollarsInput = (cents: number | null) => (cents !== null ? String(cents / 100) : "");
const intOrNull = (value: string) => (value === "" ? null : Number(value));
const centsOrNull = (dollars: string) => (dollars === "" ? null : dollarsToCents(dollars));

export function CardRowActions({ card }: { card: EditableCard }) {
  const router = useRouter();
  const { isEditing, setIsEditing, editButtonRef, editorRef } = useInlineEdit<HTMLFormElement>();
  const [nickname, setNickname] = useState(card.nickname ?? "");
  const [annualFee, setAnnualFee] = useState(centsToDollarsInput(card.annualFeeCents));
  const [openedOn, setOpenedOn] = useState(card.openedOn ?? "");
  const [isBusiness, setIsBusiness] = useState(card.isBusiness);
  const [bonusPoints, setBonusPoints] = useState(card.bonusPoints?.toString() ?? "");
  const [bonusSpend, setBonusSpend] = useState(centsToDollarsInput(card.bonusSpendCents));
  const [bonusMonths, setBonusMonths] = useState(card.bonusMonths?.toString() ?? "");
  const [bonusSpent, setBonusSpent] = useState(centsToDollarsInput(card.bonusSpentCents));
  const [bonusReceivedOn, setBonusReceivedOn] = useState(card.bonusReceivedOn ?? "");
  const { submit, isSubmitting, error } = useJsonSubmit();
  const closing = useJsonSubmit();

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    const result = await submit(`/api/cards/${card.id}`, "PATCH", {
      nickname: nickname || null,
      annualFeeCents: centsOrNull(annualFee),
      openedOn: openedOn || null,
      isBusiness,
      bonusPoints: intOrNull(bonusPoints),
      bonusSpendCents: centsOrNull(bonusSpend),
      bonusMonths: intOrNull(bonusMonths),
      bonusSpentCents: centsOrNull(bonusSpent),
      bonusReceivedOn: bonusReceivedOn || null,
    });

    if (!result.ok) return;

    setIsEditing(false);
    router.refresh();
  }

  async function toggleClosed() {
    const result = await closing.submit(`/api/cards/${card.id}`, "PATCH", {
      closedOn: card.isClosed ? null : localDateInputValue(new Date()),
    });
    if (result.ok) router.refresh();
  }

  if (isEditing) {
    return (
      <form ref={editorRef} onSubmit={handleSave} className="flex w-full flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Nickname" className="w-32">
            <Input size="sm" type="text" placeholder="Optional" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </Field>
          <Field label="Annual fee" className="w-24">
            <Input size="sm" type="number" min={0} step={1} placeholder="0" prefix="$" value={annualFee} onChange={(e) => setAnnualFee(e.target.value)} />
          </Field>
          <Field label="Opened">
            <Input size="sm" type="date" value={openedOn} onChange={(e) => setOpenedOn(e.target.value)} />
          </Field>
          <Checkbox
            label="Business card"
            checked={isBusiness}
            onChange={(e) => setIsBusiness(e.target.checked)}
            className="pb-1.5"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Bonus points" className="w-28">
            <Input size="sm" type="number" min={0} step={1} placeholder="None" value={bonusPoints} onChange={(e) => setBonusPoints(e.target.value)} />
          </Field>
          <Field label="Spend needed" className="w-28">
            <Input size="sm" type="number" min={0} step={1} prefix="$" value={bonusSpend} onChange={(e) => setBonusSpend(e.target.value)} />
          </Field>
          <Field label="Months" className="w-20">
            <Input size="sm" type="number" min={1} step={1} value={bonusMonths} onChange={(e) => setBonusMonths(e.target.value)} />
          </Field>
          <Field label="Spent so far" className="w-28">
            <Input size="sm" type="number" min={0} step={1} prefix="$" value={bonusSpent} onChange={(e) => setBonusSpent(e.target.value)} />
          </Field>
          <Field label="Bonus received">
            <Input size="sm" type="date" value={bonusReceivedOn} onChange={(e) => setBonusReceivedOn(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="link" type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <FormError message={error} />
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        ref={editButtonRef}
        size="sm"
        variant="link"
        onClick={() => setIsEditing(true)}
        aria-label={`Edit ${card.cardName}`}
      >
        Edit
      </Button>
      <Button
        size="sm"
        variant="link"
        onClick={toggleClosed}
        disabled={closing.isSubmitting}
        aria-label={`${card.isClosed ? "Reopen" : "Close"} ${card.cardName}`}
      >
        {closing.isSubmitting ? "Saving…" : card.isClosed ? "Reopen" : "Close card"}
      </Button>
      <DeleteButton
        url={`/api/cards/${card.id}`}
        itemLabel={card.cardName}
        confirmMessage={
          card.isClosed
            ? "Remove this card for good? It will stop counting toward 5/24 and issuer bonus rules."
            : "Remove this card? If you closed it, use Close card instead so it still counts toward 5/24 and issuer bonus rules."
        }
      />
      <FormError message={closing.error} />
    </div>
  );
}
