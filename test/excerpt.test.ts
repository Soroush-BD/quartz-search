import { describe, it, expect } from "vitest";
import { highlight, tokenizeTerm } from "../src/components/scripts/excerpt";

const words = (count: number, word = "word") =>
  Array.from({ length: count }, (_, index) => `${word}${index}`);

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
  it("marks every match in the full text when not trimming", () => {
    expect(highlight("cache", "Use a cache, then cached values")).toBe(
      'Use a <span class="highlight">cache</span>, then <span class="highlight">cache</span>d values',
    );
  });

  it("escapes the text once", () => {
    expect(highlight("list", "new CachedList<string>(60)")).toBe(
      'new Cached<span class="highlight">List</span>&lt;string&gt;(60)',
    );
  });

  it("keeps a text shorter than the window whole, without ellipses", () => {
    const text = "a short note about the cache layer";
    const excerpt = highlight("cache", text, true);
    expect(excerpt.startsWith("...")).toBe(false);
    expect(excerpt.endsWith("...")).toBe(false);
    expect(excerpt).toContain('<span class="highlight">cache</span>');
  });

  it("starts a few words before a match far into the text", () => {
    const text = [...words(200), "cache", ...words(200, "tail")].join(" ");
    const excerpt = highlight("cache", text, true);
    expect(
      excerpt.startsWith(
        '...word195 word196 word197 word198 word199 <span class="highlight">cache</span> ',
      ),
    ).toBe(true);
    expect(excerpt.endsWith("...")).toBe(true);
  });

  it("ends without an ellipsis when the excerpt reaches the end of the text", () => {
    const text = [...words(200), "cache"].join(" ");
    const excerpt = highlight("cache", text, true);
    expect(excerpt.startsWith("...")).toBe(true);
    expect(excerpt.endsWith('<span class="highlight">cache</span>')).toBe(true);
  });

  it("shows the text's opening when nothing in it matches", () => {
    const excerpt = highlight("cache", words(200).join(" "), true);
    expect(excerpt.startsWith("word0 ")).toBe(true);
    expect(excerpt.endsWith("...")).toBe(true);
    expect(excerpt).not.toContain("highlight");
  });
});
