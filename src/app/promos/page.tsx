import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { isBonusActive } from "@/lib/redemptions/transfer-bonus";
import { AddPromoForm } from "@/components/promos/add-promo-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { SparkleIcon } from "@/components/icons";
import { rowCardClass } from "@/components/ui/card";
import { programLabel } from "@/lib/format";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";

// No dynamic route segment here, so Next would otherwise try to statically
// prerender this at build time — which has no DATABASE_URL in CI.
export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type PromoWithPartner = Prisma.TransferBonusGetPayload<{
  include: { transferPartner: { include: { fromProgram: true; toProgram: true } } };
}>;

function PromoList({ title, items }: { title: string; items: PromoWithPartner[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className={sectionTitleClass}>
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((promo) => {
          const from = promo.transferPartner.fromProgram;
          const to = promo.transferPartner.toProgram;
          return (
            <li
              key={promo.id}
              className={`flex flex-wrap items-center justify-between gap-4 ${rowCardClass}`}
            >
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  {programLabel(from)} → {programLabel(to)}
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    +{promo.bonusPercent}%
                  </span>
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(promo.startsOn)} – {formatDate(promo.endsOn)}
                </p>
              </div>
              <DeleteButton
                url={`/api/promos/${promo.id}`}
                itemLabel={`promo: ${programLabel(from)} to ${programLabel(to)}, +${promo.bonusPercent}%`}
                confirmMessage="Remove this promo for everyone?"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function PromosPage() {
  await requireSessionUserId();

  const [partners, promos] = await Promise.all([
    prisma.transferPartner.findMany({
      where: { isActive: true },
      include: { fromProgram: true, toProgram: true },
      orderBy: [{ fromProgram: { name: "asc" } }, { toProgram: { name: "asc" } }],
    }),
    prisma.transferBonus.findMany({
      include: { transferPartner: { include: { fromProgram: true, toProgram: true } } },
      orderBy: { endsOn: "desc" },
    }),
  ]);

  const now = new Date();
  const active = promos.filter((p) => isBonusActive(p, now));
  const upcoming = promos.filter((p) => p.startsOn > now);
  const expired = promos.filter((p) => p.endsOn < now);

  const partnerOptions = partners.map((p) => ({
    id: p.id,
    fromProgramName: programLabel(p.fromProgram),
    toProgramName: programLabel(p.toProgram),
  }));

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={SparkleIcon} tone="emerald" title="Transfer bonuses">
        Time-limited promos that boost a transfer ratio. Shared with everyone and folded into
        rankings while active.
      </PageHeader>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Add a promo</h2>
        <AddPromoForm partners={partnerOptions} />
      </section>

      {promos.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
          <SparkleIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No promos recorded yet — add one above when you spot a transfer bonus.
          </p>
        </div>
      )}

      <PromoList title="Active now" items={active} />
      <PromoList title="Upcoming" items={upcoming} />
      <PromoList title="Expired" items={expired} />
    </div>
  );
}
