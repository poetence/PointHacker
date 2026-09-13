import type { ComponentType, SVGProps } from "react";
import { BankIcon, CashIcon, HotelIcon, PlaneIcon, SparkleIcon } from "@/components/icons";

type ProgramType = "BANK_TRANSFERABLE" | "AIRLINE" | "HOTEL" | "CASHBACK" | "OTHER";

const COLORS_BY_TYPE: Record<ProgramType, string> = {
  BANK_TRANSFERABLE:
    "bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 dark:from-indigo-950 dark:to-indigo-900 dark:text-indigo-300",
  AIRLINE:
    "bg-gradient-to-br from-sky-100 to-sky-50 text-sky-700 dark:from-sky-950 dark:to-sky-900 dark:text-sky-300",
  HOTEL:
    "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 dark:from-amber-950 dark:to-amber-900 dark:text-amber-300",
  CASHBACK:
    "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300",
  OTHER:
    "bg-gradient-to-br from-zinc-100 to-zinc-50 text-zinc-700 dark:from-zinc-800 dark:to-zinc-800/60 dark:text-zinc-300",
};

const ICON_BY_TYPE: Record<ProgramType, ComponentType<SVGProps<SVGSVGElement>>> = {
  BANK_TRANSFERABLE: BankIcon,
  AIRLINE: PlaneIcon,
  HOTEL: HotelIcon,
  CASHBACK: CashIcon,
  OTHER: SparkleIcon,
};

export function ProgramBadge({
  name,
  shortName,
  type,
  size = "md",
}: {
  name: string;
  shortName: string | null;
  type: ProgramType;
  size?: "sm" | "md";
}) {
  const label = shortName ?? name;
  const Icon = ICON_BY_TYPE[type];

  return (
    <span
      className={`flex flex-col items-center justify-center gap-1 rounded-xl text-center font-semibold leading-tight shadow-sm ${COLORS_BY_TYPE[type]} ${
        size === "sm" ? "h-14 w-20 px-1.5 text-[11px]" : "h-20 w-28 px-2 text-xs"
      }`}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      <span>{label}</span>
    </span>
  );
}
