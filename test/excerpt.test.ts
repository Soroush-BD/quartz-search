import { describe, it, expect } from "vitest";
import { highlight, matchingLines, tokenizeTerm } from "../src/components/scripts/excerpt";

const mark = (text: string) => `<span class="highlight">${text}</span>`;

describe("tokenizeTerm", () => {
  it("returns each word and each run of words from the first, longest first", () => {
    expect(tokenizeTerm("cache the result")).toEqual([
      "cache the result",
      "cache the",
      "result",
      "cache",
      "the",
    ]);
  });

  it("ignores extra whitespace", () => {
    expect(tokenizeTerm("  cache  ")).toEqual(["cache"]);
  });
});

describe("highlight", () => {
  it("marks every match", () => {
    expect(highlight("cache", "Use a cache, then cached values")).toBe(
      `Use a ${mark("cache")}, then ${mark("cache")}d values`,
    );
  });

  it("escapes the text once", () => {
    expect(highlight("list", "new CachedList<string>(60)")).toBe(
      `new Cached${mark("List")}&lt;string&gt;(60)`,
    );
  });
});

describe("matchingLines", () => {
  it("returns the first three matching lines, in order", () => {
    const text = [
      "no match",
      "first cache",
      "second cache",
      "nothing",
      "third cache",
      "fourth cache",
    ].join("\n");
    expect(matchingLines("cache", text)).toEqual([
      `first ${mark("cache")}`,
      `second ${mark("cache")}`,
      `third ${mark("cache")}`,
    ]);
  });

  it("keeps a short line whole, indentation included", () => {
    expect(matchingLines("cache", "        if (cached) {")).toEqual([
      `        if (${mark("cache")}d) {`,
    ]);
  });

  it("matches inside words and ignores case", () => {
    expect(matchingLines("cache", "@Inject(CACHE_MANAGER) private cacheManager: Cache,")).toEqual([
      `@Inject(${mark("CACHE")}_MANAGER) private ${mark("cache")}Manager: ${mark("Cache")},`,
    ]);
  });

  it("shortens a long line around its first match, at word boundaries", () => {
    const before = Array.from({ length: 20 }, (_, index) => `word${index}`).join(" ");
    const after = Array.from({ length: 20 }, (_, index) => `tail${index}`).join(" ");
    const excerpt = matchingLines("cache", `${before} the cache layer ${after}`)[0] ?? "";

    expect(excerpt.startsWith("... ")).toBe(true);
    expect(excerpt.endsWith("...")).toBe(true);
    expect(excerpt).toContain(`the ${mark("cache")} layer`);
    // Whole words only on either side, and at most 49 and 50 characters of them.
    const text = excerpt.replace(/<[^>]+>/g, "");
    const words = text.slice("... ".length, -"...".length).split(" ");
    expect(before.split(" ")).toContain(words[0]);
    expect(after.split(" ")).toContain(words[words.length - 1]);
    expect(text.length).toBeLessThanOrEqual(3 + 49 + "cache".length + 50 + 3);
  });

  it("treats punctuation as a word's edge when cutting", () => {
    const line = `import { getCachedResponse } from "@blackdynamix/bd-next-utilities/server";`;
    expect(matchingLines("cache", line)).toEqual([
      `import { get${mark("Cache")}dResponse } from &quot;@blackdynamix/bd-next-utilities...`,
    ]);
  });

  it("keeps the context after the line's last match, not only its first", () => {
    const line = "        const cached = await this.cacheManager.get<User>(`user:${id}`);";
    expect(matchingLines("cache", line)).toEqual([
      `        const ${mark("cache")}d = await this.${mark("cache")}Manager.get&lt;User&gt;(\`user:\${id}\`);`,
    ]);
  });

  it("escapes each line once, and never matches inside an escape", () => {
    expect(matchingLines("user", "cacheManager.get<User>(id)")).toEqual([
      `cacheManager.get&lt;${mark("User")}&gt;(id)`,
    ]);
    expect(matchingLines("lt", "a < b")).toEqual([]);
  });

  it("returns nothing when no line matches", () => {
    expect(matchingLines("cache", "a title-only match\nwith no body text")).toEqual([]);
    expect(matchingLines("   ", "cache")).toEqual([]);
  });
});
