// Site-wide settings for metadata, robots.txt and the sitemap.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kindred-path-five.vercel.app").replace(/\/$/, "");

// Search engines stay out until launch: the content still needs attorney review.
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const SITE_NAME = "Kindred Path";
export const SITE_DESCRIPTION =
  "Talk with Wren, an AI guide, about what to do after someone dies or how to plan ahead. Plain-language steps, a checklist that remembers, and which kind of professional to ask. General information, not legal advice.";

export const PUBLIC_PATHS = ["/", "/guide?mode=navigate", "/guide?mode=prepare", "/find", "/benefits", "/privacy", "/terms"];
