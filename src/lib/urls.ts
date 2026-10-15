/** Resolve local file and document links under the configured hosting base. */
export function siteHref(path: string): string {
  return path.startsWith("/") && !path.startsWith("//")
    ? `${import.meta.env.BASE_URL}${path.slice(1)}`
    : path;
}
