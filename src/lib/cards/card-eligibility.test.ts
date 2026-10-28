import { describe, expect, it } from "vitest";
import { ISSUER_RULES } from "@/lib/data/issuer-rules";
import { referenceCards } from "@/lib/data/reference-cards";
import { cardKey } from "@/lib/recommendations/score-cards";
import {
  ELIGIBLE,
  checkCardEligibility,
  countFiveTwentyFour,
  indexCardEligibility,
  type WalletHistoryCard,
} from "./card-eligibility";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const NOW = new Date("2026-10-28T15:00:00Z");

function held(issuer: string, productName: string, overrides: Partial<WalletHistoryCard> = {}): WalletHistoryCard {
  return {
    issuer,
    productName,
    openedOn: day("2020-01-01"),
    closedOn: null,
    isBusiness: false,
    bonusPoints: null,
    bonusMonths: null,
    bonusReceivedOn: null,
    ...overrides,
  };
}

/** `n` personal cards opened a month apart, the newest in `latest`. */
function recentCards(n: number, latest = "2026-10-01"): WalletHistoryCard[] {
  return Array.from({ length: n }, (_, i) => {
    const opened = day(latest);
    opened.setUTCMonth(opened.getUTCMonth() - i);
    return held("Other Bank", `Card ${i}`, { openedOn: opened });
  });
}

function check(card: { issuer: string; name: string }, history: WalletHistoryCard[]) {
  return checkCardEligibility(card, history, countFiveTwentyFour(history, NOW), NOW);
}

const sapphirePreferred = { issuer: "Chase", name: "Sapphire Preferred" };

describe("countFiveTwentyFour", () => {
  it("counts personal cards opened in the last 24 months, closed ones included", () => {
    const history = [
      held("Chase", "A", { openedOn: day("2025-01-10"), closedOn: day("2026-01-01") }),
      held("Citi", "B", { openedOn: day("2026-05-01") }),
      held("Amex", "Old", { openedOn: day("2024-10-27") }),
    ];
    expect(countFiveTwentyFour(history, NOW)).toEqual({
      count: 2,
      undated: 0,
      nextDropOn: day("2027-01-10"),
      underLimitOn: null,
    });
  });

  it("skips business cards except from issuers that report them to personal credit", () => {
    const history = [
      held("Chase", "Ink", { openedOn: day("2026-01-01"), isBusiness: true }),
      held("Capital One", "Spark", { openedOn: day("2026-01-01"), isBusiness: true }),
    ];
    expect(countFiveTwentyFour(history, NOW).count).toBe(1);
  });

  it("says when an over-limit count falls back under", () => {
    // Six cards, oldest 2026-05-01: the second-oldest (2026-06-01) dropping takes it to 4.
    const count = countFiveTwentyFour(recentCards(6), NOW);
    expect(count).toMatchObject({ count: 6, nextDropOn: day("2028-05-01"), underLimitOn: day("2028-06-01") });
  });

  it("counts undated cards separately", () => {
    expect(countFiveTwentyFour([held("Citi", "B", { openedOn: null })], NOW)).toMatchObject({
      count: 0,
      undated: 1,
    });
  });
});

describe("checkCardEligibility — 5/24", () => {
  it("expects a Chase denial at five recent cards", () => {
    expect(check(sapphirePreferred, recentCards(5))).toEqual({
      status: "likely_denied",
      rule: "five_twenty_four",
      count: 5,
      until: day("2028-06-01"),
    });
  });

  it("leaves other issuers alone", () => {
    expect(check({ issuer: "Citi", name: "Double Cash" }, recentCards(5))).toEqual(ELIGIBLE);
  });

  it("warns when undated cards could already make five", () => {
    const history = [...recentCards(3), held("Citi", "X", { openedOn: null }), held("Amex", "Y", { openedOn: null })];
    expect(check(sapphirePreferred, history)).toEqual({ status: "eligible", undatedMayBlock: true });
  });

  it("matches the issuer case-insensitively", () => {
    expect(check({ issuer: "chase", name: "Sapphire Preferred" }, recentCards(5)).status).toBe("likely_denied");
  });
});

describe("checkCardEligibility — bonus rules", () => {
  it("blocks an Amex card held at any point, for good", () => {
    const history = [held("American Express", "Platinum Card", { closedOn: day("2022-01-01") })];
    expect(check({ issuer: "American Express", name: "Platinum Card" }, history)).toEqual({
      status: "no_bonus",
      rule: { kind: "ever_held" },
      blockedBy: { issuer: "American Express", name: "Platinum Card" },
      until: null,
      undated: false,
      verified: true,
    });
  });

  it("applies Amex family language: a Platinum blocks the Gold, not the other way round", () => {
    const platinum = [held("American Express", "Platinum Card")];
    const gold = [held("American Express", "Gold Card")];
    expect(check({ issuer: "American Express", name: "Gold Card" }, platinum)).toMatchObject({
      status: "no_bonus",
      blockedBy: { name: "Platinum Card" },
    });
    expect(check({ issuer: "American Express", name: "Platinum Card" }, gold)).toEqual(ELIGIBLE);
  });

  it("matches a hand-typed card by issuer + name, ignoring case", () => {
    const history = [held("american express ", "platinum card")];
    expect(check({ issuer: "American Express", name: "Gold Card" }, history).status).toBe("no_bonus");
  });

  it("ends a timed block once the window has passed", () => {
    const explorer = { issuer: "Chase", name: "United Explorer" };
    const recent = [held("Chase", "United Explorer", { bonusPoints: 60000, bonusReceivedOn: day("2025-06-01") })];
    expect(check(explorer, recent)).toMatchObject({ status: "no_bonus", until: day("2027-06-01") });

    const old = [held("Chase", "United Explorer", { bonusPoints: 60000, bonusReceivedOn: day("2024-06-01") })];
    expect(check(explorer, old)).toEqual(ELIGIBLE);
  });

  it("assumes a bonus on record was paid at the end of its spend window", () => {
    const history = [held("Chase", "United Explorer", { openedOn: day("2025-03-10"), bonusPoints: 60000, bonusMonths: 3 })];
    expect(check({ issuer: "Chase", name: "United Explorer" }, history)).toMatchObject({
      status: "no_bonus",
      until: day("2027-06-10"),
    });
  });

  it("doesn't block a card that never had a bonus", () => {
    const history = [held("Chase", "United Explorer", { openedOn: day("2026-01-01") })];
    expect(check({ issuer: "Chase", name: "United Explorer" }, history)).toEqual(ELIGIBLE);
  });

  it("makes the Sapphire bonus once per card, ever", () => {
    const history = [held("Chase", "Sapphire Preferred", { bonusPoints: 60000, bonusReceivedOn: day("2018-01-01") })];
    expect(check(sapphirePreferred, history)).toMatchObject({ status: "no_bonus", until: null, undated: false });
    expect(check({ issuer: "Chase", name: "Sapphire Reserve" }, history)).toEqual(ELIGIBLE);
  });

  it("can't place a window without an opened date", () => {
    const history = [held("Wells Fargo", "Active Cash", { openedOn: null })];
    expect(check({ issuer: "Wells Fargo", name: "Active Cash" }, history)).toMatchObject({
      status: "no_bonus",
      until: null,
      undated: true,
    });
  });

  it("keeps the longest block among a family's cards", () => {
    const boundless = { issuer: "Chase", name: "Marriott Bonvoy Boundless" };
    const history = [
      held("Chase", "Marriott Bonvoy Boundless", { bonusPoints: 1, bonusReceivedOn: day("2025-01-01") }),
      held("American Express", "Marriott Bonvoy Brilliant", { bonusPoints: 1, bonusReceivedOn: day("2026-02-01") }),
    ];
    expect(check(boundless, history)).toMatchObject({
      status: "no_bonus",
      blockedBy: { name: "Marriott Bonvoy Brilliant" },
      until: day("2028-02-01"),
      verified: false,
    });
  });

  it("puts 5/24 ahead of the bonus rule", () => {
    const history = [...recentCards(5), held("Chase", "Sapphire Preferred", { bonusPoints: 1 })];
    expect(check(sapphirePreferred, history).status).toBe("likely_denied");
  });

  it("knows nothing about an unlisted issuer", () => {
    expect(check({ issuer: "Bilt", name: "Bilt Mastercard" }, [held("Bilt", "Bilt Mastercard")])).toEqual(ELIGIBLE);
  });
});

describe("indexCardEligibility", () => {
  it("keys every card by id", () => {
    const index = indexCardEligibility(
      [{ id: "csp", ...sapphirePreferred }, { id: "dc", issuer: "Citi", name: "Double Cash" }],
      recentCards(5),
      NOW
    );
    expect(index.get("csp")?.status).toBe("likely_denied");
    expect(index.get("dc")).toEqual(ELIGIBLE);
  });
});

describe("ISSUER_RULES", () => {
  it("names only catalog cards, under their own issuer", () => {
    const catalog = new Set(referenceCards.map((c) => cardKey(c.issuer, c.name)));
    for (const [issuer, rules] of Object.entries(ISSUER_RULES)) {
      for (const name of Object.keys(rules.cards ?? {})) {
        expect(catalog, `${issuer} ${name}`).toContain(cardKey(issuer, name));
      }
    }
  });
});
