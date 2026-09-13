import type { TransferPartnerOption } from "./compute-best-redemptions";

export function isBonusActive(
  bonus: { startsOn: Date; endsOn: Date },
  now: Date = new Date()
): boolean {
  return bonus.startsOn.getTime() <= now.getTime() && bonus.endsOn.getTime() >= now.getTime();
}

/** Scales a partner's ratio by a % bonus while keeping whole-point transfer blocks. */
export function applyTransferBonus(
  partner: TransferPartnerOption,
  bonusPercent: number
): TransferPartnerOption {
  if (bonusPercent <= 0) {
    return partner;
  }

  const rawFrom = partner.ratioFrom * 100;
  const rawTo = partner.ratioTo * (100 + bonusPercent);
  const divisor = gcd(rawFrom, rawTo);

  return {
    ...partner,
    ratioFrom: rawFrom / divisor,
    ratioTo: rawTo / divisor,
    activeBonusPercent: bonusPercent,
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
