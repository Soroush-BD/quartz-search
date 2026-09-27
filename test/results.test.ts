import { describe, it, expect } from "vitest";
import { matchHeadings, resultPath } from "../src/components/scripts/results";

const heading = (text: string, slug = text.toLowerCase()) => ({ text, slug, depth: 2 });

describe("matchHeadings", () => {
  const pages = {
    "packages/general": {
      headings: [heading("AsyncCachedList"), heading("CachedList"), heading("AsyncCache")],
    },
    "packages/frontend": { headings: [heading("getCachedResponse"), heading("Routing")] },
    "no-headings": {},
  };

  it("ranks by where the match starts, then by length", () => {
    expect(matchHeadings("cache", pages, 10).map((m) => m.heading.text)).toEqual([
      "CachedList",
      "getCachedResponse",
      "AsyncCache",
      "AsyncCachedList",
    ]);
  });

  it("names the page each heading is on", () => {
    expect(matchHeadings("routing", pages, 10)).toEqual([
      { page: "packages/frontend", heading: heading("Routing") },
    ]);
  });

  it("needs every word, in any order", () => {
    expect(matchHeadings("list async", pages, 10).map((m) => m.heading.text)).toEqual([
      "AsyncCachedList",
    ]);
  });

  it("keeps to the limit, and finds nothing for an empty term", () => {
    expect(matchHeadings("cache", pages, 2)).toHaveLength(2);
    expect(matchHeadings("cache", pages, 0)).toEqual([]);
    expect(matchHeadings("  ", pages, 10)).toEqual([]);
  });
});

describe("resultPath", () => {
  it("gives a heading its page's path", () => {
    expect(resultPath("Packages/General Utilities.md", "BlackDynamix", true)).toBe(
      "BlackDynamix/Packages/General Utilities",
    );
  });

  it("gives a page its folder", () => {
    expect(resultPath("Packages/General Utilities.md", "BlackDynamix", false)).toBe(
      "BlackDynamix/Packages",
    );
    expect(resultPath("CICD and Releases.md", "BlackDynamix", false)).toBe("BlackDynamix");
  });

  it("leaves the root out when there is none", () => {
    expect(resultPath("Packages/General Utilities.md", "", true)).toBe(
      "Packages/General Utilities",
    );
    expect(resultPath("index.md", "", false)).toBe("");
  });
});
