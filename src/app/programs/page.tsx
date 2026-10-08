import { prisma } from "@/lib/prisma";
import { formatCentsPerPoint } from "@/lib/format";
import { groupBy } from "@/lib/group-by";
import { REGION_LABELS, type Region } from "@/lib/regions";
import { ProgramCatalog } from "@/components/programs/program-catalog";
import { BookOpenIcon } from "@/components/icons";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";

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

  const partnersByProgramId = groupBy(transferPartners, (partner) => partner.fromProgramId);

  const entries = programs.map((program) => ({
    id: program.id,
    name: program.name,
    shortName: program.shortName,
    type: program.type,
    valuePerPoint: formatCentsPerPoint(Number(program.defaultRedemptionValueCents)),
    transferPartnerCount: partnersByProgramId.get(program.id)?.length ?? 0,
    regionLabels: program.regions.map((r) => REGION_LABELS[r as Region]),
  }));

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={BookOpenIcon} tone="amber" title="Program catalog">
        Browse every reward program, no balance required.
      </PageHeader>

      <ProgramCatalog programs={entries} />
    </div>
  );
}
