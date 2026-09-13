import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { isBonusActive } from "@/lib/redemptions/transfer-bonus";
import { AddPromoForm } from "@/components/promos/add-promo-form";
import { PromoRowActions } from "@/components/promos/promo-row-actions";
import { SparkleIcon } from "@/components/icons";

// No dynamic route segment here, so Next would otherwise try to statically
// prerender this at build time — which has no DATABASE_URL in CI.
export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type PromoWithPartner = Prisma.TransferBonusGetPayload<{
  include: { transferPartner: { include: { fromProgram: true; toProgram: true } } };
}>;

function PromoList({ title, items }: { title: string; items: PromoWithPartner[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((promo) => {
          const from = promo.transferPartner.fromProgram;
          const to = promo.transferPartner.toProgram;
          return (
            <li
              key={promo.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  {from.shortName ?? from.name} → {to.shortName ?? to.name}
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    +{promo.bonusPercent}%
                  </span>
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(promo.startsOn)} – {formatDate(promo.endsOn)}
                </p>
              </div>
              <PromoRowActions id={promo.id} />
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
    fromProgramName: p.fromProgram.shortName ?? p.fromProgram.name,
    toProgramName: p.toProgram.shortName ?? p.toProgram.name,
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 shadow-sm dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300">
          <SparkleIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Transfer bonuses
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Time-limited promos that boost a transfer ratio. Shared with everyone and folded into
            rankings while active.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Add a promo
        </h2>
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
