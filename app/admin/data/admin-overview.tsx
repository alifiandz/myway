import { ArrowUpRight, BookOpen, CheckCircle2, CircleAlert, Database, FileCheck2 } from "lucide-react";

type OverviewFact = { field_key: string; status: string };
type OverviewUniversity = { id: string; name: string; programmes: { programme_facts: OverviewFact[] }[] };
export function summarizeAdminData(items: OverviewUniversity[]) {
  const facts = items.flatMap((item) => item.programmes.flatMap((programme) => programme.programme_facts));
  const count = (status: string) => facts.filter((fact) => fact.status === status).length;
  const verified = count("verified"), unverified = count("not_yet_verified"), unpublished = count("not_published");
  const categories = [...new Set(facts.map((fact) => fact.field_key))].map((key) => {
    const group = facts.filter((fact) => fact.field_key === key);
    return { key, total: group.length, verified: group.filter((fact) => fact.status === "verified").length };
  });
  const queue = items.map((item) => ({ id: item.id, name: item.name, open: item.programmes.flatMap((programme) => programme.programme_facts).filter((fact) => fact.status !== "verified").length })).filter((item) => item.open > 0).sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
  return { total: facts.length, verified, unverified, unpublished, other: facts.length - verified - unverified - unpublished, categories, queue };
}

const labels: Record<string, [string, string]> = {
  duration: ["Duration", "Durasi"], credits: ["Credits", "Kredit"], teaching_language: ["Teaching language", "Bahasa pengantar"], tuition: ["Tuition", "Biaya kuliah"], application_deadline: ["Deadlines", "Tenggat"], entry_requirement: ["Entry requirements", "Persyaratan masuk"], ranking: ["Rankings", "Peringkat"],
};

export default function AdminOverview({ items, language, openEditor }: { items: OverviewUniversity[]; language: "en" | "id"; openEditor: (id?: string) => void }) {
  const summary = summarizeAdminData(items);
  const t = (en: string, id: string) => language === "id" ? id : en;
  const percent = summary.total ? Math.round(summary.verified / summary.total * 100) : 0;
  const segments = [
    { label: t("Verified", "Terverifikasi"), value: summary.verified, tone: "verified" },
    { label: t("Not yet verified", "Belum terverifikasi"), value: summary.unverified, tone: "unverified" },
    { label: t("Not published", "Belum dipublikasikan"), value: summary.unpublished, tone: "unpublished" },
    { label: t("Other review statuses", "Status tinjauan lainnya"), value: summary.other, tone: "other" },
  ];
  return <div className="admin-overview">
    <section className="admin-overview-banner"><div><span className="section-label">{t("DATABASE REVIEW", "TINJAUAN DATABASE")}</span><h2>{t("Review the editable database records.", "Tinjau catatan database yang dapat diedit.")}</h2><p>{t("See what is verified, find gaps, and open the records that need your attention.", "Lihat data terverifikasi, temukan kekurangan, dan buka catatan yang perlu ditinjau.")}</p></div><button onClick={() => openEditor()}>{t("Open university editor", "Buka editor universitas")}<ArrowUpRight size={17}/></button></section>
    <section className="admin-overview-metrics" aria-label={t("Catalogue summary", "Ringkasan katalog")}>{[
      { label: t("Database universities", "Universitas dalam database"), value: items.length, note: t("Loaded database records only", "Hanya catatan database yang dimuat"), icon: Database, tone: "blue" },
      { label: t("Tracked facts", "Fakta tercatat"), value: summary.total, note: t("Across all programme records", "Dari seluruh catatan program"), icon: BookOpen, tone: "blue" },
      { label: t("Verified facts", "Fakta terverifikasi"), value: summary.verified, note: t("Recorded as verified", "Berstatus terverifikasi"), icon: CheckCircle2, tone: "green" },
      { label: t("Facts to review", "Fakta perlu ditinjau"), value: summary.total - summary.verified, note: t("Includes unpublished and other statuses", "Termasuk belum dipublikasikan dan status lain"), icon: CircleAlert, tone: "amber" },
    ].map(({ label, value, note, icon: Icon, tone }) => <article key={label} className={`admin-metric ${tone}`}><span className="admin-metric-icon"><Icon size={20}/></span><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>
    <div className="admin-overview-charts"><section className="admin-overview-panel"><div className="section-head"><div><span className="section-label">{t("VERIFICATION COVERAGE", "CAKUPAN VERIFIKASI")}</span><h3>{t("Database fact coverage", "Cakupan fakta database")}</h3></div><FileCheck2 size={21}/></div><div className="admin-coverage"><div className="admin-coverage-ring"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="65" className="admin-ring-track"/><circle cx="80" cy="80" r="65" className="admin-ring-value" pathLength="100" strokeDasharray={`${summary.total ? summary.verified / summary.total * 100 : 0} 100`} transform="rotate(-90 80 80)"/></svg><div><strong>{percent}%</strong><span>{t("verified", "terverifikasi")}</span></div></div><div className="admin-chart-legend">{segments.map((segment) => <div key={segment.tone}><i className={segment.tone}/><span>{segment.label}</span><strong>{segment.value}</strong></div>)}</div></div><p className="admin-chart-note">{t("Verification status is not a publication or admissions-readiness score.", "Status verifikasi bukan skor publikasi atau kesiapan penerimaan.")}</p></section>
    <section className="admin-overview-panel"><div className="section-head"><div><span className="section-label">{t("BY INFORMATION TYPE", "MENURUT JENIS INFORMASI")}</span><h3>{t("Where the gaps are", "Letak kekurangan data")}</h3></div><span className="admin-chart-key"><i/>{t("Verified / total", "Terverifikasi / total")}</span></div><div className="admin-category-bars">{summary.categories.map((category) => <div key={category.key}><div><span>{labels[category.key]?.[language === "id" ? 1 : 0] ?? category.key}</span><strong>{category.verified}<small> / {category.total}</small></strong></div><div className="admin-category-track"><span style={{ width: `${category.total ? category.verified / category.total * 100 : 0}%` }}/></div></div>)}</div>{!summary.total && <p className="admin-chart-note">{t("No programme facts are available yet.", "Belum ada fakta program yang tersedia.")}</p>}</section></div>
    <section className="admin-overview-panel"><div className="section-head"><div><span className="section-label">{t("REVIEW QUEUE", "ANTREAN TINJAUAN")}</span><h3>{t("Start with these records", "Mulai dari catatan ini")}</h3><p className="admin-chart-note">{t("Universities with the most facts that are not verified. Review official evidence before saving.", "Universitas dengan fakta belum terverifikasi terbanyak. Tinjau bukti resmi sebelum menyimpan.")}</p></div><button className="text-link" onClick={() => openEditor()}>{t("View all", "Lihat semua")}<ArrowUpRight size={15}/></button></div><div className="admin-review-queue">{summary.queue.slice(0, 5).map((item, index) => <button key={item.id} onClick={() => openEditor(item.id)}><span className="admin-queue-position">{index + 1}</span><strong>{item.name}</strong><span className="admin-queue-count">{item.open} {t("to review", "perlu ditinjau")}</span><ArrowUpRight size={16}/></button>)}</div>{!summary.queue.length && <p className="admin-chart-note">{t("No unverified records in the loaded catalogue.", "Tidak ada catatan belum terverifikasi dalam katalog yang dimuat.")}</p>}</section>
  </div>;
}
