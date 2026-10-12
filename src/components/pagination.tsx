import Link from "next/link";
import { pageHref, PAGE_SIZE, type SearchParams } from "@/lib/pagination";
export function Pagination({
  path,
  params,
  page,
  total,
}: {
  path: string;
  params: SearchParams;
  page: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        {total} records · Page {page} of {pages}
      </span>
      <div>
        {page > 1 && (
          <Link href={pageHref(path, params, page - 1)}>← Previous</Link>
        )}
        {page < pages && (
          <Link href={pageHref(path, params, page + 1)}>Next →</Link>
        )}
      </div>
    </nav>
  );
}
