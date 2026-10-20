"use client";

import FeedbackScreenshot from "./feedback-screenshot";
import AdminNavigation from "../admin-navigation";
import { publicMyWayUrl } from "../../myway-url";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Bug, Check, ChevronRight, CircleAlert, ExternalLink, Flag, Inbox, Lightbulb, LoaderCircle, LogOut, Mail, MessageSquareText, RefreshCw, Save, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { SiteLanguage } from "../../site-language";
import { getSupabaseClient } from "../../supabase-client";

function readLanguage(): "en" | "id" {
  return window.localStorage.getItem("myway-language") === "id" ? "id" : "en";
}
function subscribeLanguage(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("myway-language-updated", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("myway-language-updated", notify);
  };
}

type Status = "new" | "reviewing" | "resolved";
type Category = "bug" | "incorrect" | "suggestion";
type Submission = {
  id: string; category: Category; details: string; expected: string | null; pageFeature: string | null;
  informationCategory: string | null; reviewRequest: string | null; sourceUrl: string | null;
  name: string | null; email: string | null; mayContact: number; pageUrl: string;
  university: string | null; programme: string | null; locale: string | null; userAgent: string | null;
  viewport: string | null; screenshotKey: string | null; screenshotName: string | null;
  status: Status; internalNotes: string | null; updatedAt: string | null; createdAt: string;
};

const categoryInfo = {
  bug: { label: "Something is not working", icon: Bug },
  incorrect: { label: "Information looks incorrect", icon: Flag },
  suggestion: { label: "Suggestion or feedback", icon: Lightbulb },
};
const statusLabels: Record<Status, string> = { new: "New", reviewing: "Reviewing", resolved: "Resolved" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function FeedbackInbox() {
  const language = useSyncExternalStore(subscribeLanguage, readLanguage, () => "en" as const);
  const [items, setItems] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminName, setAdminName] = useState("MyWay administrator");
  const [accessToken, setAccessToken] = useState("");

  const load = useCallback(async () => {
    try {
      const supabase = await getSupabaseClient();
      setLoading(true); setError("");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Sign in to MyWay first, then reopen the admin workspace.");
      const { data: profile } = await supabase.from("profiles").select("role,display_name").eq("user_id", sessionData.session.user.id).maybeSingle();
      if (profile?.role !== "admin") throw new Error("This MyWay account does not have administrator access.");
      const token = sessionData.session.access_token;
      setAccessToken(token); setAdminName(profile.display_name || sessionData.session.user.email || "MyWay administrator");
      const params = new URLSearchParams({ category, status });
      if (query) params.set("search", query);
      const response = await fetch(`/api/admin/feedback?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error("load");
      const data = await response.json() as { submissions: Submission[] };
      setItems(data.submissions);
      setSelectedId((current) => current && data.submissions.some((item) => item.id === current) ? current : data.submissions[0]?.id ?? null);
    } catch { setError("The feedback inbox could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }, [category, status, query]);

  // load awaits client initialization before updating React state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);
  const newCount = items.filter((item) => item.status === "new").length;

  async function saveSubmission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true); setSaved(false); setError("");
    try {
      const response = await fetch(`/api/admin/feedback/${encodeURIComponent(selected.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status: form.get("status"), internalNotes: form.get("internalNotes") }),
      });
      if (!response.ok) throw new Error("save");
      const data = await response.json() as { updatedAt: string };
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: String(form.get("status")) as Status, internalNotes: String(form.get("internalNotes") ?? ""), updatedAt: data.updatedAt } : item));
      setSaved(true); window.setTimeout(() => setSaved(false), 2200);
    } catch { setError("Your changes could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  return <><SiteLanguage language={language} /><main className="feedback-admin-shell university-admin-shell">
    <aside className="feedback-admin-sidebar">
      <Link className="admin-brand" href="/"><Image src="/myway-mark.png" alt="" width={38} height={38} unoptimized /> MyWay</Link>
      <div className="admin-private-label"><ShieldCheck size={14} /> Private admin</div>
      <AdminNavigation active="feedback" language={language} feedbackCount={newCount}/>
      <div className="admin-account"><div><UserRound size={16} /><span><small>Signed in as</small>{adminName}</span></div><button type="button" className="admin-signout" title="Sign out" onClick={async () => { const supabase = await getSupabaseClient(); await supabase.auth.signOut(); window.location.href = "/"; }}><LogOut size={16} /></button></div>
    </aside>

    <section className="feedback-admin-main">
      <header className="feedback-admin-header">
        <div><Link href="/"><ArrowLeft size={14} /> MyWay</Link><h1>Feedback Inbox</h1><p>Review reports, suggestions, and factual corrections.</p></div>
        <button className="admin-icon-button" onClick={load} aria-label="Refresh feedback"><RefreshCw size={17} /></button>
      </header>

      <div className="feedback-admin-filters">
        <form onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feedback" aria-label="Search feedback" />{search && <button type="button" onClick={() => { setSearch(""); setQuery(""); }} aria-label="Clear search"><X size={14} /></button>}</form>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option><option value="bug">Not working</option><option value="incorrect">Incorrect information</option><option value="suggestion">Suggestions</option></select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select>
      </div>

      {error && <div className="admin-error" role="alert"><CircleAlert size={16} /> {error}</div>}
      <div className="feedback-admin-workspace">
        <div className="feedback-admin-list">
          {loading ? <div className="admin-empty"><LoaderCircle className="admin-spin" size={24} /><p>Loading feedback</p></div> : items.length === 0 ? <div className="admin-empty"><Inbox size={28} /><h2>No feedback found</h2><p>Try changing the filters or search.</p></div> : items.map((item) => {
            const info = categoryInfo[item.category]; const Icon = info.icon;
            return <button key={item.id} className={selectedId === item.id ? "selected" : ""} onClick={() => setSelectedId(item.id)}>
              <span className={`admin-category-icon ${item.category}`}><Icon size={16} /></span>
              <span className="admin-list-copy"><span><strong>{info.label}</strong><em className={`admin-status ${item.status}`}>{statusLabels[item.status]}</em></span><b>{item.programme || item.university || item.pageFeature || "General feedback"}</b><small>{item.details}</small><time>{formatDate(item.createdAt)}</time></span>
              <ChevronRight size={16} />
            </button>;
          })}
        </div>

        <div className="feedback-admin-detail">
          {!selected ? <div className="admin-empty"><MessageSquareText size={30} /><h2>Select feedback</h2><p>Choose a submission to review its full context.</p></div> : <SubmissionDetail key={selected.id} item={selected} saving={saving} saved={saved} onSubmit={saveSubmission} />}
        </div>
      </div>
    </section>
  </main></>;
}

function SubmissionDetail({ item, saving, saved, onSubmit }: { item: Submission; saving: boolean; saved: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const info = categoryInfo[item.category]; const Icon = info.icon;
  return <article>
    <header><div className={`admin-category-icon ${item.category}`}><Icon size={18} /></div><div><span>{info.label}</span><h2>{item.programme || item.university || item.pageFeature || "General feedback"}</h2><time>{formatDate(item.createdAt)}</time></div><em className={`admin-status ${item.status}`}>{statusLabels[item.status]}</em></header>
    <div className="admin-detail-body">
      <Detail label={item.category === "incorrect" ? "What information looks wrong?" : item.category === "suggestion" ? "What would you like to tell us?" : "What happened?"} value={item.details} />
      <Detail label="What did you expect to happen?" value={item.expected} />
      <Detail label="Page or feature" value={item.pageFeature} />
      <Detail label="Information category" value={item.informationCategory} />
      <Detail label="What should we review?" value={item.reviewRequest} />
      {item.sourceUrl && <div className="admin-detail-field"><span>Source or reference</span><a href={item.sourceUrl} target="_blank" rel="noreferrer">Open reference <ExternalLink size={13} /></a></div>}
      {item.screenshotKey && <FeedbackScreenshot key={item.id} id={item.id} />}

      <section className="admin-context-card"><h3>Attached context</h3><dl>
        <Context term="University" value={item.university} /><Context term="Programme" value={item.programme} /><Context term="Page" value={publicMyWayUrl(item.pageUrl)} link /><Context term="Language" value={item.locale} /><Context term="Viewport" value={item.viewport} /><Context term="Browser and device" value={item.userAgent} />
      </dl></section>

      <section className="admin-contact-card"><h3>Contact details</h3>{item.name || item.email ? <><p>{item.name || "Name not provided"}</p>{item.email && <a href={`mailto:${item.email}`}><Mail size={14} /> {item.email}</a>}<div className={item.mayContact ? "allowed" : "not-allowed"}>{item.mayContact ? <Check size={13} /> : <X size={13} />}{item.mayContact ? "Contact permitted" : "Contact not permitted"}</div></> : <p>No contact details provided.</p>}</section>

      <form className="admin-review-form" onSubmit={onSubmit}><h3>Review</h3><label><span>Status</span><select name="status" defaultValue={item.status}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select></label><label><span>Internal notes</span><textarea name="internalNotes" defaultValue={item.internalNotes ?? ""} rows={5} placeholder="Add private notes about the review or action taken" /></label><button disabled={saving}>{saved ? <Check size={15} /> : saving ? <LoaderCircle className="admin-spin" size={15} /> : <Save size={15} />}{saved ? "Saved" : saving ? "Saving" : "Save changes"}</button></form>
    </div>
  </article>;
}

function Detail({ label, value }: { label: string; value: string | null }) { return value ? <div className="admin-detail-field"><span>{label}</span><p>{value}</p></div> : null; }
function Context({ term, value, link = false }: { term: string; value: string | null; link?: boolean }) { return value ? <><dt>{term}</dt><dd>{link ? <a href={value} target="_blank" rel="noreferrer">{value} <ExternalLink size={11} /></a> : value}</dd></> : null; }
