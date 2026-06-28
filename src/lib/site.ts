/**
 * Canonical site origin. Prefers an explicit NEXT_PUBLIC_SITE_URL, then the
 * Vercel-provided production domain, then localhost for dev. All reads have a
 * fallback so the build never crashes when these are absent.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "Joey's Ultimate List";
