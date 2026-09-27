import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import { i18n } from "../i18n";
import style from "./styles/search.scss";
// @ts-expect-error - inline script imported as string by esbuild loader
import script from "./scripts/search.inline.ts";

export type SearchField = "title" | "content" | "tags";

export interface SearchOptions {
  enablePreview: boolean;
  fieldPriority: SearchField[];
  /** The search field's placeholder. Defaults to the locale's wording. */
  placeholder?: string;
  /** The search button's text and label. Defaults to the locale's wording. */
  title?: string;
  /**
   * How many results to list: matching headings first, when the content
   * index includes them, then pages.
   */
  resultLimit: number;
  /** Whether to note where each result is, under it. */
  showPath: boolean;
  /** The folder those paths start from, standing for the content folder. */
  pathRoot?: string;
}

const defaultOptions: SearchOptions = {
  enablePreview: true,
  fieldPriority: ["title", "content", "tags"],
  resultLimit: 8,
  showPath: false,
};

export default ((userOpts?: Partial<SearchOptions>) => {
  const Search: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const opts = { ...defaultOptions, ...userOpts };
    const locale = cfg.locale ?? "en-US";
    const searchPlaceholder =
      opts.placeholder ?? i18n(locale).components.search.searchBarPlaceholder;
    const searchTitle = opts.title ?? i18n(locale).components.search.title;

    return (
      <div class={classNames(displayClass, "search")}>
        <button class="search-button" aria-label={searchTitle} aria-expanded="false">
          <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.7">
            <title>Search</title>
            <g class="search-path" fill="none">
              <path stroke-linecap="square" d="M18.5 18.3l-5.4-5.4" />
              <circle cx="8" cy="8" r="7" />
            </g>
          </svg>
          <p>{searchTitle}</p>
        </button>
        <div class="search-container">
          <div class="search-space">
            <input
              autocomplete="off"
              class="search-bar"
              name="search"
              type="text"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
            />
            <div
              class="search-layout"
              // Present only when the preview is on: the styles match the
              // attribute's presence, so "false" would still apply them.
              data-preview={opts.enablePreview ? "true" : undefined}
              data-field-priority={JSON.stringify(opts.fieldPriority)}
              data-result-limit={opts.resultLimit}
              data-path-root={opts.showPath ? (opts.pathRoot ?? "") : undefined}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  Search.afterDOMLoaded = script;
  Search.css = style;

  return Search;
}) satisfies QuartzComponentConstructor;
