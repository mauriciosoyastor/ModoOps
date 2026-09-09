/** Slug de tenant (B1) — validación única: a-z, 0-9 y _ (igual que SLUG_RE de Odoo). */
const SLUG_RE = /^[a-z0-9_]+$/;

export function isValidTenantSlug(slug: unknown): boolean {
  return typeof slug === "string" && slug.length > 0 && SLUG_RE.test(slug);
}
