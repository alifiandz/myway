export const EXPLORE_PAGE_SIZE = 20;
export type ExploreBrowseState = { query: string; refineOpen: boolean; savedOnly: boolean; filters: string[]; sort: string; page: number };
export const initialExploreBrowseState: ExploreBrowseState = { query: "", refineOpen: false, savedOnly: false, filters: [], sort: "Directory order", page: 1 };
export function paginateResults<T>(items: readonly T[], requestedPage: number) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / EXPLORE_PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1));
  const offset = (page - 1) * EXPLORE_PAGE_SIZE;
  return { items: items.slice(offset, offset + EXPLORE_PAGE_SIZE), total, pages, page, start: total ? offset + 1 : 0, end: Math.min(offset + EXPLORE_PAGE_SIZE, total) };
}
