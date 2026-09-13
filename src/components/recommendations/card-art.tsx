import { referenceCards } from "@/lib/data/reference-cards";

const ISSUER_THEME: Record<string, string> = {
  Chase: "from-sky-700 to-blue-900",
  "American Express": "from-teal-500 to-cyan-800",
  "Capital One": "from-slate-600 to-slate-900",
  Citi: "from-blue-500 to-indigo-800",
  Bilt: "from-zinc-700 to-zinc-900",
  "Wells Fargo": "from-red-600 to-rose-900",
  Discover: "from-orange-400 to-orange-700",
};

const PREMIUM_THEME = "from-zinc-800 via-zinc-600 to-zinc-900";
const FALLBACK_THEME = "from-emerald-600 to-emerald-900";

function themeFor(issuer: string, name: string): string {
  const ref = referenceCards.find((c) => c.issuer === issuer && c.name === name);
  if (ref?.tier === "premium") return PREMIUM_THEME;
  return ISSUER_THEME[issuer] ?? FALLBACK_THEME;
}

export function CardArt({ issuer, name }: { issuer: string; name: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex aspect-[1.586] w-28 shrink-0 flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br p-2 text-white shadow-md ${themeFor(issuer, name)}`}
    >
      <span className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-white/10" />
      <span className="text-[8px] font-medium uppercase tracking-wider text-white/70">{issuer}</span>
      <span className="h-3.5 w-5 rounded-sm bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
      <span className="font-display text-[10px] font-semibold leading-tight">{name}</span>
    </span>
  );
}
