"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function BrowsePagination({ total, pages, page, start, end, language, onPage }: { total: number; pages: number; page: number; start: number; end: number; language: "en" | "id"; onPage: (page: number) => void }) {
  const id = language === "id";
  if (!total) return null;
  return <nav className="browse-pagination" aria-label={id ? "Halaman hasil universitas" : "University result pages"}>
    <p role="status" aria-live="polite">{id ? `Menampilkan ${start}–${end} dari ${total}` : `Showing ${start}–${end} of ${total}`}</p>
    {pages > 1 && <div><button type="button" className="outline-button" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft size={18} />{id ? "Sebelumnya" : "Previous"}</button><span>{id ? `Halaman ${page} dari ${pages}` : `Page ${page} of ${pages}`}</span><button type="button" className="outline-button" disabled={page === pages} onClick={() => onPage(page + 1)}>{id ? "Berikutnya" : "Next"}<ChevronRight size={18} /></button></div>}
  </nav>;
}
