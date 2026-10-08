import { describe, expect, it } from "vitest";
import { groupBy } from "./group-by";

describe("groupBy", () => {
  it("buckets by key in first-seen order, keeping each bucket's input order", () => {
    const groups = groupBy(["apple", "bean", "avocado", "beet", "cherry"], (word) => word[0]);
    expect([...groups.entries()]).toEqual([
      ["a", ["apple", "avocado"]],
      ["b", ["bean", "beet"]],
      ["c", ["cherry"]],
    ]);
  });

  it("returns an empty map for no items", () => {
    expect(groupBy([], () => "x").size).toBe(0);
  });
});
