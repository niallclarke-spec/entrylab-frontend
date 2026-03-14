/**
 * Add IDs to H2 headings only for Table of Contents navigation
 */
export function addHeadingIds(content: string): string {
  if (!content) return content;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const headingElements = doc.querySelectorAll("h2");
  
  headingElements.forEach((heading, index) => {
    heading.id = `section-${index}`;
  });
  
  return doc.body.innerHTML;
}

/**
 * Wrap tables in scrollable containers for mobile responsiveness
 */
export function wrapTablesForMobile(content: string): string {
  if (!content) return content;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const tables = doc.querySelectorAll("table");
  
  tables.forEach((table) => {
    const wrapper = doc.createElement("div");
    wrapper.className = "table-wrapper";
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
  
  return doc.body.innerHTML;
}

/**
 * Strip inline color and background-color styles from all elements.
 */
export function stripInlineColors(content: string): string {
  if (!content) return content;

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");

  doc.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") || "";
    const cleaned = style
      .split(";")
      .filter((decl) => {
        const prop = decl.split(":")[0].trim().toLowerCase();
        return prop !== "color" && prop !== "background-color" && prop !== "background";
      })
      .join(";");

    if (cleaned.trim()) {
      el.setAttribute("style", cleaned);
    } else {
      el.removeAttribute("style");
    }
  });

  return doc.body.innerHTML;
}

/**
 * Strip Gutenberg block editor class names from HTML elements.
 * Classes like wp-block-*, has-alpha-channel-opacity, is-layout-* are
 * injected by the Gutenberg editor and interfere with Tailwind Typography prose styling.
 */
export function stripGutenbergClasses(content: string): string {
  if (!content) return content;

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");

  doc.querySelectorAll("[class]").forEach((el) => {
    const classes = Array.from(el.classList);
    const cleaned = classes.filter((cls) => {
      return (
        !cls.startsWith("wp-block-") &&
        !cls.startsWith("wp-") &&
        !cls.startsWith("is-layout-") &&
        !cls.startsWith("has-") &&
        cls !== "is-layout-flow"
      );
    });

    if (cleaned.length === 0) {
      el.removeAttribute("class");
    } else if (cleaned.length !== classes.length) {
      el.setAttribute("class", cleaned.join(" "));
    }
  });

  return doc.body.innerHTML;
}

/**
 * Remove the first <h1> element when it duplicates the page title.
 * Broker and prop-firm review pages already display the name as a page
 * heading, so an <h1> at the top of the prose content creates a jarring
 * duplicate that also renders at an oversized 2.25em.
 */
export function stripLeadingH1(content: string): string {
  if (!content) return content;

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");

  const firstH1 = doc.body.querySelector("h1");
  if (firstH1 && firstH1 === doc.body.firstElementChild) {
    firstH1.remove();
  }

  return doc.body.innerHTML;
}

/**
 * Process article content for display.
 * Strips Gutenberg classes, adds heading IDs, wraps tables, strips inline colours.
 */
export function processArticleContent(content: string): string {
  if (!content) return content;
  let processed = stripGutenbergClasses(content);
  processed = addHeadingIds(processed);
  processed = wrapTablesForMobile(processed);
  processed = stripInlineColors(processed);
  return processed;
}

/**
 * Process broker / prop-firm review content for display.
 * Same as processArticleContent but also removes a leading <h1> title that
 * would duplicate the name already shown as the page heading.
 */
export function processBrokerContent(content: string): string {
  if (!content) return content;
  let processed = stripLeadingH1(content);
  processed = stripGutenbergClasses(processed);
  processed = addHeadingIds(processed);
  processed = wrapTablesForMobile(processed);
  processed = stripInlineColors(processed);
  return processed;
}
