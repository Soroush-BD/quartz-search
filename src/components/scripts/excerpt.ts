import { escapeHTML } from "@quartz-community/utils";

/** How many of a page's matching lines a result shows. */
const excerptLineLimit = 3;
/** Characters of a long line kept before its first match and after its last. */
const excerptContext = 50;

/** The search term's words, then each run of them from the first, longest first. */
export function tokenizeTerm(term: string): string[] {
  const tokens = term.split(/\s+/).filter((t) => t.trim() !== "");
  const tokenLen = tokens.length;
  if (tokenLen > 1) {
    for (let i = 1; i < tokenLen; i++) {
      tokens.push(tokens.slice(0, i + 1).join(" "));
    }
  }
  return tokens.sort((a, b) => b.length - a.length);
}

/** Matches any of the search term's words or runs of words, ignoring case. */
function termPattern(searchTerm: string): RegExp | undefined {
  const terms = tokenizeTerm(searchTerm);
  if (terms.length === 0) return undefined;
  return new RegExp(
    terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "gi",
  );
}

/** `text`, escaped, with each match of `searchTerm` wrapped in a highlight span. */
export function highlight(searchTerm: string, text: string): string {
  const tokenizedTerms = tokenizeTerm(searchTerm);
  return escapeHTML(text)
    .split(/\s+/)
    .filter((t) => t !== "")
    .map((tok) => {
      for (const searchTok of tokenizedTerms) {
        if (tok.toLowerCase().includes(searchTok.toLowerCase())) {
          const regex = new RegExp(searchTok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
          return tok.replace(regex, (match) => `<span class="highlight">${match}</span>`);
        }
      }
      return tok;
    })
    .join(" ");
}

/**
 * A long line cut to its matches, which run from `start` to `end`, with
 * `excerptContext` characters either side ending at word boundaries, and
 * ellipses where text is left out.
 */
function shortenLine(line: string, start: number, end: number): string {
  let from = Math.max(0, start - excerptContext);
  let to = Math.min(line.length, end + excerptContext);

  if (from > 0) {
    const space = line.indexOf(" ", from);
    if (space !== -1 && space < start) from = space;
  }
  if (to < line.length) {
    const space = line.lastIndexOf(" ", to);
    if (space > end) to = space;
  }

  return (from > 0 ? "..." : "") + line.slice(from, to) + (to < line.length ? "..." : "");
}

/** `line`, escaped a piece at a time, with every match wrapped in a highlight span. */
function highlightLine(line: string, pattern: RegExp): string {
  let html = "";
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    const index = match.index ?? 0;
    html += escapeHTML(line.slice(last, index));
    html += `<span class="highlight">${escapeHTML(match[0])}</span>`;
    last = index + match[0].length;
  }
  return html + escapeHTML(line.slice(last));
}

/**
 * The lines of `text` that match `searchTerm`, as Obsidian's own search lists
 * a note's matches: the first few, in order, each escaped with every match
 * highlighted, and a long one shortened around its matches. A page that
 * matched only by its title has none.
 */
export function matchingLines(searchTerm: string, text: string): string[] {
  const pattern = termPattern(searchTerm);
  if (!pattern) return [];

  const excerpts: string[] = [];
  for (const line of text.split("\n")) {
    const matches = [...line.matchAll(pattern)];
    const first = matches[0];
    const last = matches[matches.length - 1];
    if (!first || !last) continue;

    const start = first.index ?? 0;
    const end = (last.index ?? 0) + last[0].length;
    excerpts.push(highlightLine(shortenLine(line, start, end), pattern));
    if (excerpts.length === excerptLineLimit) break;
  }
  return excerpts;
}
