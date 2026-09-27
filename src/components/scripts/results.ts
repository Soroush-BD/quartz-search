/** A page's heading, as the content index lists it when it includes headings. */
export interface Heading {
  text: string;
  slug: string;
  depth: number;
}

/** A heading that matches the search, and the page it is on. */
export interface HeadingMatch {
  page: string;
  heading: Heading;
}

/**
 * The headings whose text contains every word of `term`, ignoring case, best
 * first, as Obsidian ranks them: the earlier the first word falls in a
 * heading, the better, then the shorter the heading. Ties keep the order of
 * the index.
 */
export function matchHeadings(
  term: string,
  pages: Record<string, { headings?: Heading[] }>,
  limit: number,
): HeadingMatch[] {
  const words = term
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== "");
  const first = words[0];
  if (first === undefined || limit <= 0) return [];

  const ranked: Array<HeadingMatch & { position: number }> = [];
  for (const [page, { headings }] of Object.entries(pages)) {
    for (const heading of headings ?? []) {
      const text = heading.text.toLowerCase();
      if (!words.every((word) => text.includes(word))) continue;
      ranked.push({ page, heading, position: text.indexOf(first) });
    }
  }

  return ranked
    .sort((a, b) => a.position - b.position || a.heading.text.length - b.heading.text.length)
    .slice(0, limit)
    .map(({ page, heading }) => ({ page, heading }));
}

/**
 * Where a result is, as Obsidian's search notes it under the result: the
 * page's own path for one of its headings, and the folder it is in for the
 * page itself. `filePath` is the page's path in the content folder, and
 * `root` the folder that stands for the content folder, since the vault that
 * Obsidian names paths from can hold more than the site.
 */
export function resultPath(filePath: string, root: string, heading: boolean): string {
  const segments = filePath.replace(/\.[^/.]+$/, "").split("/");
  if (!heading) segments.pop();
  return [root, ...segments].filter((segment) => segment !== "").join("/");
}
