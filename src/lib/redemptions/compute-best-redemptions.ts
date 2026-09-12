// Core "maximize value" logic: given a program's held balance, ranks direct
// redemption against every transfer-partner option by estimated cash value.
// Pure and DB-agnostic — callers map Prisma records into these input shapes.

export type RedemptionProgram = {
  id: string;
  name: string;
  defaultRedemptionValueCents: number;
};

export type TransferPartnerOption = {
  toProgram: RedemptionProgram;
  ratioFrom: number;
  ratioTo: number;
  minimumTransfer?: number | null;
  transferFeeCents?: number | null;
  estimatedRedemptionValueCents?: number | null;
};

export type ComputeBestRedemptionsInput = {
  program: RedemptionProgram;
  balance: number;
  transferPartners: TransferPartnerOption[];
};

export type DirectRedemptionOption = {
  kind: "direct";
  programId: string;
  programName: string;
  pointsUsed: number;
  valuePerPointCents: number;
  totalValueCents: number;
};

export type TransferRedemptionOption = {
  kind: "transfer";
  programId: string;
  programName: string;
  partnerProgramId: string;
  partnerProgramName: string;
  pointsUsed: number;
  pointsReceived: number;
  transferFeeCents: number;
  valuePerPointCents: number;
  totalValueCents: number;
  isViable: boolean;
  minimumTransfer: number | null;
};

export type RedemptionOption = DirectRedemptionOption | TransferRedemptionOption;

export function computeBestRedemptions({
  program,
  balance,
  transferPartners,
}: ComputeBestRedemptionsInput): RedemptionOption[] {
  const direct: DirectRedemptionOption = {
    kind: "direct",
    programId: program.id,
    programName: program.name,
    pointsUsed: balance,
    valuePerPointCents: program.defaultRedemptionValueCents,
    totalValueCents: balance * program.defaultRedemptionValueCents,
  };

  const transfers = transferPartners.map((partner) =>
    computeTransferOption(program, balance, partner)
  );

  return [direct, ...transfers].sort(
    (a, b) => b.totalValueCents - a.totalValueCents
  );
}

function computeTransferOption(
  program: RedemptionProgram,
  balance: number,
  partner: TransferPartnerOption
): TransferRedemptionOption {
  const minimumTransfer = partner.minimumTransfer ?? null;
  const transferFeeCents = partner.transferFeeCents ?? 0;
  const valuePerDestinationPointCents =
    partner.estimatedRedemptionValueCents ??
    partner.toProgram.defaultRedemptionValueCents;

  // Transfers move points in whole ratio blocks — any remainder below one
  // full block can't be transferred and stays in the source balance.
  const usablePoints = Math.floor(balance / partner.ratioFrom) * partner.ratioFrom;
  const pointsReceived = (usablePoints / partner.ratioFrom) * partner.ratioTo;
  const isViable =
    usablePoints > 0 &&
    (minimumTransfer === null || usablePoints >= minimumTransfer);

  const totalValueCents = isViable
    ? pointsReceived * valuePerDestinationPointCents - transferFeeCents
    : 0;

  return {
    kind: "transfer",
    programId: program.id,
    programName: program.name,
    partnerProgramId: partner.toProgram.id,
    partnerProgramName: partner.toProgram.name,
    pointsUsed: isViable ? usablePoints : 0,
    pointsReceived: isViable ? pointsReceived : 0,
    transferFeeCents,
    valuePerPointCents:
      (partner.ratioTo / partner.ratioFrom) * valuePerDestinationPointCents,
    totalValueCents,
    isViable,
    minimumTransfer,
  };
}
