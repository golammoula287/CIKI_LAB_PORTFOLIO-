export type SearchParams = Record<string, string | string[] | undefined>;
export function valueOf(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
export function pageNumber(value: string | string[] | undefined) {
  const n = Number(valueOf(value));
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1;
}
export const PAGE_SIZE = 20;
export function pageHref(path: string, params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (typeof value === "string" && value && key !== "page")
      query.set(key, value);
  query.set("page", String(page));
  return `${path}?${query}`;
}
