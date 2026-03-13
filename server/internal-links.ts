import { db } from "./db";
import { brokersTable, propFirmsTable } from "@shared/schema";

interface LinkEntity {
  name: string;
  url: string;
  pattern: RegExp;
}

let entityCache: LinkEntity[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getEntities(): Promise<LinkEntity[]> {
  if (entityCache && Date.now() < cacheExpiry) return entityCache;

  const [brokers, propFirms] = await Promise.all([
    db.select({ name: brokersTable.name, slug: brokersTable.slug }).from(brokersTable),
    db.select({ name: propFirmsTable.name, slug: propFirmsTable.slug }).from(propFirmsTable),
  ]);

  const entities: LinkEntity[] = [];

  for (const b of brokers) {
    const name = b.name?.replace(/<[^>]+>/g, "").trim();
    if (!name || name.length < 3) continue;
    entities.push({
      name,
      url: `/broker/${b.slug}`,
      pattern: new RegExp(`(?<![\\w\\-])${escapeRegex(name)}(?![\\w\\-])`, "i"),
    });
  }

  for (const p of propFirms) {
    const name = p.name?.replace(/<[^>]+>/g, "").trim();
    if (!name || name.length < 3) continue;
    entities.push({
      name,
      url: `/prop-firm/${p.slug}`,
      pattern: new RegExp(`(?<![\\w\\-])${escapeRegex(name)}(?![\\w\\-])`, "i"),
    });
  }

  // Sort longest names first so "Moneta Markets" matches before "Moneta"
  entities.sort((a, b) => b.name.length - a.name.length);

  entityCache = entities;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return entities;
}

/**
 * Adds internal links to the first occurrence of each broker/prop firm name
 * in an article HTML string. Skips existing <a> tags and headings.
 */
export async function addInternalLinks(html: string, selfUrl?: string): Promise<string> {
  if (!html) return html;

  try {
    const entities = await getEntities();
    const linked = new Set<string>();

    // Split into alternating text nodes and HTML tags
    const parts = html.split(/(<[^>]+>)/);

    let insideAnchor = false;
    let insideHeading = false;
    let depth = 0;

    const result = parts.map((part) => {
      if (part.startsWith("<")) {
        const tagLower = part.toLowerCase();
        const tagName = part.match(/^<\/?([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase() || "";

        if (tagName === "a") {
          if (!part.startsWith("</")) { insideAnchor = true; depth++; }
          else { depth = Math.max(0, depth - 1); if (depth === 0) insideAnchor = false; }
        }
        if (/^h[1-4]$/.test(tagName)) {
          insideHeading = !part.startsWith("</");
        }
        return part;
      }

      if (insideAnchor || insideHeading || !part.trim()) return part;

      let text = part;
      for (const entity of entities) {
        // Skip linking back to the page we're currently on
        if (selfUrl && selfUrl.endsWith(entity.url)) continue;
        if (linked.has(entity.name.toLowerCase())) continue;

        const replaced = text.replace(entity.pattern, (match) => {
          linked.add(entity.name.toLowerCase());
          return `<a href="${entity.url}" class="article-internal-link">${match}</a>`;
        });
        if (replaced !== text) {
          text = replaced;
        }
      }
      return text;
    });

    return result.join("");
  } catch (err) {
    console.error("[internal-links] Error adding internal links:", err);
    return html;
  }
}

/** Invalidate the entity cache (call after broker/propfirm admin saves) */
export function invalidateInternalLinksCache() {
  entityCache = null;
  cacheExpiry = 0;
}
