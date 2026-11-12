import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectTermsHeuristic, parseDetectTermsJson } from "./detectTerms";

describe("detectTermsHeuristic", () => {
  const body = `A vector is an ordered list. **dot product** measures alignment.`;

  it("proposes bold phrase", () => {
    const suggestions = detectTermsHeuristic(body, "ch-01", [], []);
    assert.ok(suggestions.some((s) => s.normalized === "dot product"));
  });

  it("skips rejected terms", () => {
    const existing = [
      {
        id: "t1",
        term: "dot product",
        normalized: "dot product",
        chapterId: "ch-01",
        ranges: [],
        source: "manual" as const,
        status: "rejected" as const,
        createdAt: new Date().toISOString(),
      },
    ];
    const suggestions = detectTermsHeuristic(body, "ch-01", existing, []);
    assert.equal(
      suggestions.some((s) => s.normalized === "dot product"),
      false,
    );
  });
});

describe("parseDetectTermsJson", () => {
  it("parses array", () => {
    const { items, error } = parseDetectTermsJson('[{"term":"A","excerpt":"a","reason":"r"}]');
    assert.equal(error, undefined);
    assert.equal(items[0]?.term, "A");
  });

  it("errors on malformed", () => {
    const { items, error } = parseDetectTermsJson("not json");
    assert.equal(items.length, 0);
    assert.equal(error, "Could not parse suggestions");
  });
});
