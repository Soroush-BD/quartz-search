import { escapeHTML } from "@quartz-community/utils";

const contextWindowWords = 30;
// Words of an excerpt shown ahead of its first match, so that even a line or
// two of it reaches the match.
const contextWordsBefore = 5;

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

/**
 * `text`, escaped, with each match of `searchTerm` wrapped in a highlight
 * span. With `trim`, only an excerpt: the run of words with the most matches,
 * from a few words before its first, with ellipses where text is left out.
 */
export function highlight(searchTerm: string, text: string, trim?: boolean): string {
  const tokenizedTerms = tokenizeTerm(searchTerm);
  let tokenizedText = escapeHTML(text)
    .split(/\s+/)
    .filter((t) => t !== "");
  const wordCount = tokenizedText.length;

  let startIndex = 0;
  let endIndex = wordCount;

  if (trim) {
    const includesCheck = (tok: string) => {
      return tokenizedTerms.some((term) => tok.toLowerCase().startsWith(term.toLowerCase()));
    };
    const occurrencesIndices = tokenizedText.map(includesCheck);

    let bestSum = 0;
    let bestIndex = 0;
    for (let i = 0; i < Math.max(tokenizedText.length - contextWindowWords, 0); i++) {
      const window = occurrencesIndices.slice(i, i + contextWindowWords);
      const windowSum = window.reduce((total, cur) => total + (cur ? 1 : 0), 0);
      if (windowSum >= bestSum) {
        bestSum = windowSum;
        bestIndex = i;
      }
    }

    // Start just ahead of the first match in the best window. With no match
    // in the text at all, the excerpt is its opening.
    const firstMatch = occurrencesIndices.indexOf(true, bestIndex);
    startIndex = firstMatch === -1 ? 0 : Math.max(firstMatch - contextWordsBefore, 0);
    endIndex = Math.min(startIndex + 2 * contextWindowWords, wordCount);
    tokenizedText = tokenizedText.slice(startIndex, endIndex);
  }

  const slice = tokenizedText
    .map((tok) => {
      let result = tok;
      for (const searchTok of tokenizedTerms) {
        if (tok.toLowerCase().includes(searchTok.toLowerCase())) {
          const regex = new RegExp(searchTok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
          result = tok.replace(regex, (match) => `<span class="highlight">${match}</span>`);
          break;
        }
      }
      return result;
    })
    .join(" ");

  return (startIndex === 0 ? "" : "...") + slice + (endIndex === wordCount ? "" : "...");
}
