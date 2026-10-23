"use client";

import Link from "next/link";
import Image from "next/image";
import IndonesiaLiveCatalogue from "./indonesia-live-catalogue";
import { summarizePublishedIndonesia } from "../../indonesia-publication";
import AdminOverview from "./admin-overview";
import AdminNavigation from "../admin-navigation";
import UniversityCards, { universityEditorPath } from "./university-cards";
import UniversityLogoEditor from "./university-logo-editor";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Check, CircleAlert, ExternalLink, LoaderCircle, LogOut, RefreshCw, Save, Search, ShieldCheck, UserRound } from "lucide-react";
import { getSupabaseClient } from "../../supabase-client";
import { SiteLanguage } from "../../site-language";

type FactStatus = "verified" | "not_yet_verified" | "not_published" | "varies_by_intake" | "varies_by_applicant" | "official_confirmation_required" | "under_review" | "outdated" | "conflicting";
type Fact = { id: number; field_key: string; value: unknown; status: FactStatus; source_url: string | null; verified_on: string | null; academic_year: string | null; applicant_context: string | null; review_due_on: string | null; note: string | null };
type Programme = { id: string; title: string; duration: string | null; credits: string | null; teaching_language: string | null; official_source_url: string; verification_status: string; programme_facts: Fact[] };
type University = { id: string; name: string; city: string | null; country: string | null; website_domain: string | null; logo_url: string | null; publication_status: string; programmes: Programme[] };

const statusLabels: Record<FactStatus, string> = {
  verified: "Verified", not_yet_verified: "Not yet verified", not_published: "Not published",
  varies_by_intake: "Varies by intake", varies_by_applicant: "Varies by applicant",
  official_confirmation_required: "Official confirmation required", under_review: "Under review",
  outdated: "Outdated", conflicting: "Conflicting",
};
const statusOptions = Object.entries(statusLabels) as [FactStatus, string][];
const fieldLabels: Record<string, string> = { duration: "Duration", credits: "Credits", teaching_language: "Teaching language", tuition: "Tuition", application_deadline: "Application deadline", entry_requirement: "Entry requirement", ranking: "Ranking" };

function valueText(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function readAdminLanguage(): "en" | "id" { return window.localStorage.getItem("myway-language") === "id" ? "id" : "en"; }
function subscribeAdminLanguage(notify: () => void) {
 window.addEventListener("storage",notify);window.addEventListener("myway-language-updated",notify);
 return () => {window.removeEventListener("storage",notify);window.removeEventListener("myway-language-updated",notify);};
}
export default function UniversityDataReview({ initialView = "overview", universityId }: { initialView?: "overview" | "data" | "logos"; universityId?: string }) {
  const router = useRouter();
  const view = initialView;
  const language = useSyncExternalStore(subscribeAdminLanguage,readAdminLanguage,()=>"en" as const);
  const [items, setItems] = useState<University[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const supabase = await getSupabaseClient();
      setLoading(true); setError("");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Sign in to MyWay first, then reopen the admin workspace.");
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", sessionData.session.user.id).maybeSingle();
      if (profile?.role !== "admin") throw new Error("This MyWay account does not have database administrator access.");
      const { data, error: queryError } = await supabase.from("universities").select("id,name,city,country,website_domain,logo_url,publication_status,programmes(id,title,duration,credits,teaching_language,official_source_url,verification_status,programme_facts(id,field_key,value,status,source_url,verified_on,academic_year,applicant_context,review_due_on,programme_fact_review_notes(note)))").order("directory_order");
      if (queryError) throw queryError;
      const rows = (data ?? []).map((university) => ({ ...university, programmes: university.programmes.map((programme) => ({ ...programme, programme_facts: programme.programme_facts.map((fact) => ({ ...fact, note: (fact.programme_fact_review_notes as unknown as { note: string | null } | null)?.note ?? null })) })) })) as University[];
      setItems(rows);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "University data could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  // load awaits client initialization before updating React state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => items.filter((item) => {
    const facts = item.programmes.flatMap((programme) => programme.programme_facts);
    const matchesStatus = filter === "all" || facts.some((fact) => fact.status === filter);
    const term = search.trim().toLowerCase();
    return matchesStatus && (!term || `${item.name} ${item.city ?? ""} ${item.country ?? ""} ${item.programmes.map((programme) => programme.title).join(" ")}`.toLowerCase().includes(term));
  }), [items, search, filter]);
  const publishedSelected = universityId?.startsWith("indonesia-") ? summarizePublishedIndonesia().universities.find(u => `indonesia-${u.id}` === universityId) : undefined;
  const selected = items.find((item) => item.id === universityId) ?? null;
  const allFacts = items.flatMap((item) => item.programmes.flatMap((programme) => programme.programme_facts));
  const verified = allFacts.filter((fact) => fact.status === "verified").length;
  const underReview = allFacts.filter((fact) => fact.status === "under_review").length;
  const missing = allFacts.filter((fact) => fact.status === "not_yet_verified").length;

  async function saveFact(programmeId: string, fact: Fact, form: HTMLFormElement) {
    setSavingId(fact.id); setError("");
    try {
      const values = new FormData(form); const rawValue = String(values.get("value") ?? "").trim(); const status = String(values.get("status")) as FactStatus;
      const sourceUrl = String(values.get("sourceUrl") ?? "").trim(); const verifiedOn = String(values.get("verifiedOn") ?? "").trim(); const note = String(values.get("note") ?? "").trim();
      const academicYear = String(values.get("academicYear") ?? "").trim();
      const applicantContext = String(values.get("applicantContext") ?? "").trim();
      const reviewDueOn = String(values.get("reviewDueOn") ?? "").trim();
      if (reviewDueOn && verifiedOn && reviewDueOn < verifiedOn) throw new Error("Review due date cannot be before the checked date.");
      if (status === "verified" && (!rawValue || !sourceUrl || !verifiedOn)) throw new Error("A verified field requires a value, official source, and verification date.");
      const supabase = await getSupabaseClient();
      const { error: updateError } = await supabase.rpc("save_programme_fact_review_context", { p_fact_id: fact.id, p_programme_id: programmeId, p_value: rawValue || null, p_status: status, p_source_url: sourceUrl || null, p_verified_on: verifiedOn || null, p_note: note || null, p_academic_year: academicYear || null, p_applicant_context: applicantContext || null, p_review_due_on: reviewDueOn || null });
      if (updateError) throw updateError;
      setItems((current) => current.map((university) => ({ ...university, programmes: university.programmes.map((programme) => programme.id !== programmeId ? programme : { ...programme, programme_facts: programme.programme_facts.map((currentFact) => currentFact.id !== fact.id ? currentFact : { ...currentFact, value: rawValue || null, status, source_url: sourceUrl || null, verified_on: verifiedOn || null, note: note || null, academic_year: academicYear || null, applicant_context: applicantContext || null, review_due_on: reviewDueOn || null }) }) })));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The field could not be saved."); }
    finally { setSavingId(null); }
  }

  return <><SiteLanguage language={language} /><main className="feedback-admin-shell university-admin-shell">
    <aside className="feedback-admin-sidebar"><Link className="admin-brand" href="/"><Image src="/myway-mark.png" alt="" width={38} height={38} unoptimized /> MyWay</Link><div className="admin-private-label"><ShieldCheck size={14} /> Private admin</div><AdminNavigation active={view === "overview" ? "overview" : view === "logos" ? "logos" : "universities"} language={language}/><div className="admin-account"><div><UserRound size={16} /><span><small>Access controlled by</small>MyWay admin account</span></div><Link href="/" title="Return to MyWay"><LogOut size={16} /></Link></div></aside>
    <section className="feedback-admin-main"><header className="feedback-admin-header"><div><Link href="/"><ArrowLeft size={14} /> Back to MyWay</Link><h1>{view === "overview" ? (language === "id" ? "Ringkasan data" : "Data overview") : publishedSelected ? publishedSelected.name : universityId && selected ? selected.name : view === "logos" ? (language === "id" ? "Logo universitas" : "University logos") : "University data"}</h1><p>{view === "overview" ? (language === "id" ? "Katalog yang dipublikasikan dan catatan tinjauan database." : "Published catalogues and database review records.") : view === "logos" ? (language === "id" ? "Lihat logo Indonesia yang dipublikasikan atau edit logo database." : "View published Indonesian logos or edit database logos.") : (language === "id" ? "Lihat katalog Indonesia yang dipublikasikan atau edit informasi database." : "View published Indonesian records or edit database information.")}</p></div><button className="admin-icon-button" onClick={load} aria-label="Refresh university data"><RefreshCw size={17} /></button></header>
      {error && <div className="admin-error" role="alert"><CircleAlert size={16} /> {error}</div>}
      {view === "overview" ? (loading ? <div className="admin-empty"><LoaderCircle className="admin-spin" size={24}/><p>Loading university data</p></div> : !error && <><IndonesiaLiveCatalogue language={language}/><AdminOverview items={items} language={language} openEditor={(id) => router.push(id ? universityEditorPath(id) : "/admin/universities")} /></>) : <>
      {universityId ? <><Link className="admin-back-to-grid" href={view === "logos" ? "/admin/logos" : "/admin/universities"}><ArrowLeft size={16}/>{language === "id" ? "Kembali ke semua universitas" : "Back to all universities"}</Link>{loading ? <div className="admin-empty"><LoaderCircle className="admin-spin" size={24}/><p>Loading university data</p></div> : !error && publishedSelected ? <IndonesiaLiveCatalogue language={language} universityId={universityId} logoView={view === "logos"}/> : selected ? view === "logos" ? <UniversityLogoEditor key={selected.id} university={selected} language={language} onSaved={(url) => setItems((current) => current.map((item) => item.id === selected.id ? { ...item, logo_url: url } : item))}/> : <div className="admin-university-editor-page"><UniversityEditor university={selected} savingId={savingId} saveFact={saveFact}/></div> : !error && <div className="admin-empty"><h2>University not found</h2><p>Return to the university list and choose an available record.</p></div>}</> : <>
      {!loading && !error && <IndonesiaLiveCatalogue language={language} logoView={view === "logos"} query={search}/>}<h2 className="admin-database-heading">{language === "id" ? "Catatan database yang dapat diedit" : "Editable database records"}</h2><div className="university-admin-summary"><strong>{items.length} {language === "id" ? "universitas dalam database" : "database universities"}</strong>{view === "data" && <><span>{verified} verified</span><span>{underReview} under review</span><span>{missing} not yet verified</span></>}</div>
      <div className="feedback-admin-filters university-admin-filters"><form onSubmit={(event) => event.preventDefault()}><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search university or programme" aria-label="Search universities"/></form>{view === "data" && <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter universities by fact status"><option value="all">All statuses</option>{statusOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>}</div>
      {loading ? <div className="admin-empty"><LoaderCircle className="admin-spin" size={24}/><p>Loading university data</p></div> : !error && <><UniversityCards items={visible} logos={view === "logos"} language={language}/>{!visible.length && <div className="admin-empty"><Search size={28}/><h2>No universities match</h2><button className="text-link" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</button></div>}</>}
      </>}

      </>}
    </section>
  </main></>;
}

function UniversityEditor({ university, savingId, saveFact }: { university: University; savingId: number | null; saveFact: (programmeId: string, fact: Fact, form: HTMLFormElement) => Promise<void> }) {
  const programme=university.programmes[0];
  if(!programme) return <div className="admin-empty"><CircleAlert size={28}/><h2>No programme record</h2></div>;
  return <article><header className="university-editor-head"><div><span>Editing</span><h2>{university.name}</h2><p>{programme.title}</p></div><a href={programme.official_source_url} target="_blank" rel="noreferrer">Open official page <ExternalLink size={13}/></a></header><div className="university-editor-help"><strong>Edit one section at a time</strong><span>Only mark information as verified when the value, official source, and verification date are complete.</span></div><div className="university-fact-list">{[...programme.programme_facts].sort((a,b)=>a.field_key.localeCompare(b.field_key)).map((fact)=><form key={fact.id} className="university-fact-card" onSubmit={(event)=>{event.preventDefault(); void saveFact(programme.id,fact,event.currentTarget)}}><div className="university-fact-title"><div><strong>{fieldLabels[fact.field_key]??fact.field_key}</strong><span className={`fact-status ${fact.status}`}>{statusLabels[fact.status]}</span></div><button disabled={savingId===fact.id}>{savingId===fact.id?<LoaderCircle className="admin-spin" size={14}/>:<Save size={14}/>} Save this section</button></div><label className="university-value-field"><span>Information</span><textarea name="value" rows={2} defaultValue={valueText(fact.value)} placeholder="Enter the information shown on the official university page" /></label><div className="university-fact-grid"><label><span>Review status</span><select name="status" defaultValue={fact.status}>{statusOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label><span>Checked on</span><input name="verifiedOn" type="date" defaultValue={fact.verified_on??""}/></label></div><div className="university-fact-grid"><label><span>Intake / academic year</span><input name="academicYear" defaultValue={fact.academic_year??""} placeholder="e.g. 2027/2028" maxLength={300}/></label><label><span>Review due on</span><input name="reviewDueOn" type="date" defaultValue={fact.review_due_on??""}/></label></div><label><span>Applicant context</span><textarea name="applicantContext" rows={2} defaultValue={fact.applicant_context??""} placeholder="Qualification, nationality, route and scope" maxLength={4000}/></label><label><span>Official source link</span><input name="sourceUrl" type="url" defaultValue={fact.source_url??programme.official_source_url} /></label><details className="university-review-note"><summary>Add a private review note</summary><textarea name="note" rows={2} defaultValue={fact.note??""} placeholder="Add uncertainty, applicant context, or a reminder" /></details>{fact.status==="verified"&&<small className="fact-confirmed"><Check size={12}/> This section has dated source evidence.</small>}</form>)}</div></article>;
}
