import { describe, expect, it } from "vitest";
import {
  computeBestRedemptions,
  type ComputeBestRedemptionsInput,
} from "./compute-best-redemptions";

const program = { id: "prog-1", name: "Chase Ultimate Rewards", defaultRedemptionValueCents: 1.0 };

describe("computeBestRedemptions", () => {
  it("ranks direct vs transfer options by total value, descending", () => {
    const input: ComputeBestRedemptionsInput = {
      program,
      balance: 1000,
      transferPartners: [
        {
          toProgram: { id: "hyatt", name: "World of Hyatt", defaultRedemptionValueCents: 1.7 },
          ratioFrom: 1,
          ratioTo: 1,
        },
        {
          toProgram: { id: "weak", name: "Weak Partner", defaultRedemptionValueCents: 0.5 },
          ratioFrom: 1,
          ratioTo: 1,
        },
      ],
    };

    const result = computeBestRedemptions(input);

    expect(result.map((r) => r.totalValueCents)).toEqual(
      [...result].sort((a, b) => b.totalValueCents - a.totalValueCents).map((r) => r.totalValueCents)
    );
    expect(result[0].kind).toBe("transfer");
    expect((result[0] as { partnerProgramId?: string }).partnerProgramId).toBe("hyatt");

    const last = result[result.length - 1];
    if (last.kind !== "transfer") throw new Error("expected the weak partner to rank last");
    expect(last.partnerProgramId).toBe("weak");
  });

  it("floors transfers to whole ratio blocks and derives pointsReceived from the floored amount", () => {
    const input: ComputeBestRedemptionsInput = {
      program,
      balance: 1000,
      transferPartners: [
        {
          toProgram: { id: "partner", name: "Partner", defaultRedemptionValueCents: 1.0 },
          ratioFrom: 3,
          ratioTo: 1,
        },
      ],
    };

    const [, transfer] = computeBestRedemptions(input);
    if (transfer.kind !== "transfer") throw new Error("expected transfer option");

    expect(transfer.pointsUsed).toBe(999);
    expect(transfer.pointsReceived).toBe(333);
  });

  it("treats a transfer as non-viable below the minimum, viable at and above it", () => {
    const makeInput = (balance: number): ComputeBestRedemptionsInput => ({
      program,
      balance,
      transferPartners: [
        {
          toProgram: { id: "partner", name: "Partner", defaultRedemptionValueCents: 1.0 },
          ratioFrom: 1,
          ratioTo: 1,
          minimumTransfer: 1000,
        },
      ],
    });

    const below = computeBestRedemptions(makeInput(999))[1];
    const atBoundary = computeBestRedemptions(makeInput(1000))[1];
    const above = computeBestRedemptions(makeInput(1001))[1];

    if (below.kind !== "transfer" || atBoundary.kind !== "transfer" || above.kind !== "transfer") {
      throw new Error("expected transfer options");
    }

    expect(below.isViable).toBe(false);
    expect(below.totalValueCents).toBe(0);
    expect(below.pointsUsed).toBe(0);

    expect(atBoundary.isViable).toBe(true);
    expect(atBoundary.totalValueCents).toBeGreaterThan(0);

    expect(above.isViable).toBe(true);
  });

  it("subtracts a flat transfer fee from the viable total value", () => {
    const input: ComputeBestRedemptionsInput = {
      program,
      balance: 1000,
      transferPartners: [
        {
          toProgram: { id: "partner", name: "Partner", defaultRedemptionValueCents: 1.0 },
          ratioFrom: 1,
          ratioTo: 1,
          transferFeeCents: 250,
        },
      ],
    };

    const [, transfer] = computeBestRedemptions(input);
    if (transfer.kind !== "transfer") throw new Error("expected transfer option");

    expect(transfer.totalValueCents).toBe(1000 * 1.0 - 250);
  });

  it("uses estimatedRedemptionValueCents when set, falling back to the destination program's default", () => {
    const input: ComputeBestRedemptionsInput = {
      program,
      balance: 1000,
      transferPartners: [
        {
          toProgram: { id: "override", name: "Override", defaultRedemptionValueCents: 1.0 },
          ratioFrom: 1,
          ratioTo: 1,
          estimatedRedemptionValueCents: 2.0,
        },
        {
          toProgram: { id: "fallback", name: "Fallback", defaultRedemptionValueCents: 1.5 },
          ratioFrom: 1,
          ratioTo: 1,
        },
      ],
    };

    const result = computeBestRedemptions(input);
    const overrideOption = result.find((r) => r.kind === "transfer" && r.partnerProgramId === "override");
    const fallbackOption = result.find((r) => r.kind === "transfer" && r.partnerProgramId === "fallback");
    if (overrideOption?.kind !== "transfer" || fallbackOption?.kind !== "transfer") {
      throw new Error("expected transfer options");
    }

    expect(overrideOption.totalValueCents).toBe(1000 * 2.0);
    expect(fallbackOption.totalValueCents).toBe(1000 * 1.5);
  });

  it("marks a transfer non-viable when the balance is below one full ratio block", () => {
    const input: ComputeBestRedemptionsInput = {
      program,
      balance: 5,
      transferPartners: [
        {
          toProgram: { id: "partner", name: "Partner", defaultRedemptionValueCents: 1.0 },
          ratioFrom: 10,
          ratioTo: 1,
        },
      ],
    };

    const [direct, transfer] = computeBestRedemptions(input);
    if (transfer.kind !== "transfer") throw new Error("expected transfer option");

    expect(direct.totalValueCents).toBe(5 * program.defaultRedemptionValueCents);
    expect(transfer.isViable).toBe(false);
    expect(transfer.totalValueCents).toBe(0);
    expect(transfer.pointsUsed).toBe(0);
  });
});
