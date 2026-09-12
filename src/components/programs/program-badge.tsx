type ProgramType = "BANK_TRANSFERABLE" | "AIRLINE" | "HOTEL" | "CASHBACK" | "OTHER";

const COLORS_BY_TYPE: Record<ProgramType, string> = {
  BANK_TRANSFERABLE:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  AIRLINE: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  HOTEL: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  CASHBACK: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  OTHER: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
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

  return (
    <span
      className={`flex items-center justify-center rounded-lg text-center font-semibold leading-tight ${COLORS_BY_TYPE[type]} ${
        size === "sm" ? "h-12 w-20 px-1.5 text-[11px]" : "h-16 w-28 px-2 text-xs"
      }`}
    >
      {label}
    </span>
  );
}
