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
 * Process article content for display - add heading IDs and wrap tables
 */
export function processArticleContent(content: string): string {
  if (!content) return content;
  let processed = addHeadingIds(content);
  processed = wrapTablesForMobile(processed);
  processed = stripInlineColors(processed);
  return processed;
}
