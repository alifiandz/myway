import Link from "next/link";
import { Database, ImageIcon, Inbox, LayoutDashboard } from "lucide-react";
export default function AdminNavigation({ active, language = "en", universityCount, feedbackCount }: { active: "overview" | "universities" | "logos" | "feedback"; language?: "en" | "id"; universityCount?: number; feedbackCount?: number }) {
  const id = language === "id";
  return <nav aria-label={id ? "Navigasi admin" : "Admin navigation"}>
    <Link className={active === "overview" ? "active" : ""} aria-current={active === "overview" ? "page" : undefined} href="/admin/data"><LayoutDashboard size={17}/>{id ? "Ringkasan" : "Overview"}</Link>
    <Link className={active === "universities" ? "active" : ""} aria-current={active === "universities" ? "page" : undefined} href="/admin/universities"><Database size={17}/>{id ? "Data universitas" : "University data"}{universityCount !== undefined && <strong>{universityCount}</strong>}</Link>
    <Link className={active === "logos" ? "active" : ""} aria-current={active === "logos" ? "page" : undefined} href="/admin/logos"><ImageIcon size={17}/>{id ? "Logo universitas" : "University logos"}</Link>
    <Link className={active === "feedback" ? "active" : ""} aria-current={active === "feedback" ? "page" : undefined} href="/admin/feedback"><Inbox size={17}/>{id ? "Kotak masukan" : "Feedback Inbox"}{feedbackCount !== undefined && <strong>{feedbackCount}</strong>}</Link>
  </nav>;
}
