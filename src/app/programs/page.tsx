import { prisma } from "@/lib/prisma";
import { formatCentsPerPoint } from "@/lib/format";
import { REGION_LABELS, type Region } from "@/lib/regions";
import { ProgramCatalog } from "@/components/programs/program-catalog";
import { BookOpenIcon } from "@/components/icons";

// No dynamic route segment here, so Next would otherwise try to statically
// prerender this at build time — which has no DATABASE_URL in CI.
export const dynamic = "force-dynamic";

export default async function ProgramsCatalogPage() {
  const [programs, transferPartners] = await Promise.all([
    prisma.rewardsProgram.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.transferPartner.findMany({
      where: { isActive: true },
      select: { fromProgramId: true },
    }),
  ]);

  const partnerCountByProgramId = new Map<string, number>();
  for (const partner of transferPartners) {
    partnerCountByProgramId.set(
      partner.fromProgramId,
      (partnerCountByProgramId.get(partner.fromProgramId) ?? 0) + 1
    );
  }

  const entries = programs.map((program) => ({
    id: program.id,
    name: program.name,
    shortName: program.shortName,
    type: program.type,
    valuePerPoint: formatCentsPerPoint(Number(program.defaultRedemptionValueCents)),
    transferPartnerCount: partnerCountByProgramId.get(program.id) ?? 0,
    regionLabels: program.regions.map((r) => REGION_LABELS[r as Region]),
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 shadow-sm dark:from-amber-950 dark:to-amber-900 dark:text-amber-300">
          <BookOpenIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Program catalog
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Browse every reward program, no balance required.
          </p>
        </div>
      </header>

      <ProgramCatalog programs={entries} />
    </div>
  );
}
