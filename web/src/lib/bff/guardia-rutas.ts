const PROTECTED_PAGE_PREFIXES = ["/admin", "/app", "/tenant", "/hub", "/captacion"];
const PROTECTED_API_PREFIXES = ["/api/admin", "/api/launcher", "/api/hub", "/api/captacion"];
const PUBLIC_PATHS = ["/login", "/", "/api/auth"];

/** Página o API que exige sesión. El nombre cubre los dos prefijos. */
export function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (pathname.startsWith("/api/auth")) return false;
  }
  if (PROTECTED_PAGE_PREFIXES.some((pre) => pathname === pre || pathname.startsWith(pre + "/"))) return true;
  if (PROTECTED_API_PREFIXES.some((pre) => pathname === pre || pathname.startsWith(pre + "/"))) return true;
  return false;
}
