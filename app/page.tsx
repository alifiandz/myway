"use client";

import { useMemo, useState } from "react";
import {
  Bell, BookOpen, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleUserRound, FileText, Folder, GraduationCap, Languages,
  LayoutDashboard, Map, MapPin, Medal, Mic2, Search, SlidersHorizontal,
  Sparkles, Star, Trophy,
} from "lucide-react";

type View = "dashboard" | "explore" | "pathway" | "progress" | "profile";

const navItems = [
  { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
  { id: "explore" as View, label: "Explore", icon: Search },
  { id: "pathway" as View, label: "My Pathway", icon: Map },
  { id: "progress" as View, label: "Progress", icon: Trophy },
  { id: "profile" as View, label: "Profile", icon: CircleUserRound },
];

const universities = [
  { name: "University of Pécs", initials: "UP", place: "Pécs, Hungary", program: "BA History", detail: "English · 3 years · €2,400 / year", score: "Strong match", level: "strong", tags: ["history", "hungary", "europe"] },
  { name: "Vilnius University", initials: "VU", place: "Vilnius, Lithuania", program: "BA History", detail: "English · 4 years · Tuition varies", score: "Possible match", level: "possible", tags: ["history", "lithuania", "europe"] },
  { name: "University of Groningen", initials: "UG", place: "Groningen, Netherlands", program: "BA History", detail: "English · 3 years · €6,100 / year", score: "Ambitious", level: "ambitious", tags: ["history", "netherlands", "europe"] },
  { name: "University of Melbourne", initials: "UM", place: "Melbourne, Australia", program: "Bachelor of Arts", detail: "English · 3 years · A$48,000 / year", score: "Strong match", level: "strong", tags: ["history", "australia", "oceania"] },
  { name: "Aalto University", initials: "AU", place: "Espoo, Finland", program: "International Business", detail: "English · 3 years · Scholarships available", score: "Strong match", level: "strong", tags: ["business", "finland", "europe"] },
  { name: "ESCP Business School", initials: "ES", place: "Paris, France", program: "BSc in Management", detail: "English · 3 years · Multi-campus", score: "Possible match", level: "possible", tags: ["business", "management", "france", "europe"] },
];

function Brand() {
  return <div className="brand" aria-label="Pathway home"><div className="brand-mark"><Map size={21} strokeWidth={2.2} /></div><div><strong>Pathway</strong><span>Plan with clarity</span></div></div>;
}

function Navigation({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return <>
    <aside className="sidebar"><Brand /><nav className="nav-list" aria-label="Main navigation">
      {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "nav-item active" : "nav-item"} onClick={() => onChange(id)}><Icon size={19} /><span>{label}</span>{active === id && <span className="nav-dot" />}</button>)}
    </nav><div className="sidebar-card"><div className="mini-icon"><Sparkles size={17} /></div><strong>63% prepared</strong><span>You’re making steady progress toward your target.</span><div className="tiny-progress"><i style={{ width: "63%" }} /></div></div><button className="support-link"><BookOpen size={18} /> <span>Planning guide</span></button></aside>
    <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => onChange(id)}><Icon size={20} /><span>{label.replace("My ", "")}</span></button>)}</nav>
  </>;
}

function Header({ view, onProfile }: { view: View; onProfile: () => void }) {
  const titles: Record<View, string> = { dashboard: "Dashboard", explore: "Explore universities", pathway: "My pathway", progress: "Progress", profile: "Profile" };
  return <header className="topbar"><div><span className="eyebrow">Alif’s study planner</span><h1>{titles[view]}</h1></div><div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></button><button className="avatar" onClick={onProfile} aria-label="Open profile" title="Alif">A</button></div></header>;
}

function ProgressRing() { return <div className="progress-ring" aria-label="63 percent complete"><span>63<small>%</small></span></div>; }

const tasks = [
  { icon: Mic2, title: "IELTS speaking practice", meta: "20 min · IELTS target", points: "+10" },
  { icon: GraduationCap, title: "Research scholarship requirements", meta: "15 min · Scholarship", points: "+5" },
  { icon: Folder, title: "Complete portfolio introduction", meta: "30 min · Portfolio", points: "+10" },
];

function DashboardPage({ go }: { go: (view: View) => void }) {
  const [done, setDone] = useState<number[]>([]);
  return <div className="page-enter dashboard-page">
    <section className="welcome-row"><div><p className="date-label">Wednesday, 19 August</p><h2>Good afternoon, Alif</h2><p>Your pathway to University of Pécs — BA History</p></div><button className="secondary-button" onClick={() => go("explore")}><Search size={17} /> Change destination</button></section>
    <div className="dashboard-grid"><div className="main-column">
      <article className="card progress-hero"><div><span className="section-label">Preparation progress</span><strong className="big-percent">63%</strong><p>You’re making steady progress toward your preparation target.</p><button className="text-button" onClick={() => go("pathway")}>View your pathway <ChevronRight size={16} /></button></div><ProgressRing /></article>
      <section className="section-block"><div className="section-heading"><div><span className="section-label">Today’s focus</span><h3>Actions for you</h3></div><span className="count-badge">3 actions</span></div><div className="task-list card">
        {tasks.map((task, index) => { const Icon = task.icon; const completed = done.includes(index); return <button className={completed ? "task-row complete" : "task-row"} key={task.title} onClick={() => setDone(completed ? done.filter((item) => item !== index) : [...done, index])}><span className="check-circle">{completed && <Check size={15} />}</span><span className="task-icon"><Icon size={18} /></span><span className="task-copy"><strong>{task.title}</strong><small>{task.meta}</small></span><span className="points">{completed ? "Done" : task.points}<small>{completed ? "" : " points"}</small></span><ChevronRight size={17} className="chevron" /></button>; })}
      </div></section>
      <div className="stat-grid"><article className="card compact-stat"><span className="stat-icon"><Languages size={20} /></span><div><small>IELTS</small><strong>6.0 <span>→ 6.5</span></strong></div><em>66%</em><div className="bar"><i style={{ width: "66%" }} /></div></article><article className="card compact-stat"><span className="stat-icon"><Folder size={20} /></span><div><small>Portfolio</small><strong>2 of 4 projects</strong></div><em>50%</em><div className="bar"><i style={{ width: "50%" }} /></div></article><article className="card compact-stat"><span className="stat-icon"><FileText size={20} /></span><div><small>Documents</small><strong>2 of 6 complete</strong></div><em>33%</em><div className="bar"><i style={{ width: "33%" }} /></div></article></div>
    </div><aside className="right-column">
      <article className="card priority-card"><span className="section-label">Current priority</span><div className="priority-main"><span className="large-icon"><Mic2 /></span><div><strong>Improve IELTS speaking</strong><span>Current 6.0 · Target 6.5</span><small><i /> Needs attention</small></div></div><button className="outline-button" onClick={() => go("pathway")}>View pathway</button></article>
      <article className="card milestones"><div className="section-heading"><h3>Upcoming milestones</h3><CalendarDays size={18} /></div>{[["University research", "Aug 25, 2026"], ["Requirements identified", "Sep 15, 2026"], ["IELTS preparation", "Oct 10, 2026"]].map(([title, date], i) => <div className="milestone" key={title}><span className={i === 0 ? "active" : ""}>{i + 1}</span><div><strong>{title}</strong><small>{date}</small></div></div>)}</article>
      <article className="card achievement-card"><div><span className="mini-icon"><Star size={18} /></span><strong>Level 7</strong><small>1,240 / 1,500 points</small></div><div><span className="mini-icon"><Medal size={18} /></span><strong>8</strong><small>Achievements</small></div></article>
    </aside></div>
  </div>;
}

function UniversityCard({ university, onOpen }: { university: (typeof universities)[number]; onOpen: () => void }) {
  const [saved, setSaved] = useState(false);
  return <article className="university-row"><button className="university-main" onClick={onOpen}><span className={`crest ${university.level}`}>{university.initials}</span><span className="uni-copy"><strong>{university.name}</strong><small><MapPin size={13} /> {university.place}</small><span>{university.program}</span><small>{university.detail}</small></span></button><div className="match-block"><span className={`match ${university.level}`}>{university.score}</span><div className={`match-meter ${university.level}`}><i /><i /><i /><i /><i /></div></div><div className="uni-actions"><button className="outline-button">Compare</button><button className={saved ? "add-button saved" : "add-button"} onClick={() => setSaved(!saved)}>{saved ? <><Check size={15} /> Added</> : "+ Add"}</button></div></article>;
}

function ExplorePage() {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("All regions"); const [selected, setSelected] = useState<(typeof universities)[number] | null>(null);
  const filtered = useMemo(() => universities.filter((university) => { const searchText = `${university.name} ${university.place} ${university.program} ${university.tags.join(" ")}`.toLowerCase(); return searchText.includes(query.toLowerCase()) && (filter === "All regions" || university.tags.includes(filter.toLowerCase())); }), [query, filter]);
  if (selected) return <ProgramDetail university={selected} onBack={() => setSelected(null)} />;
  return <div className="page-enter explore-page"><section className="explore-intro"><div><span className="eyebrow">12,480 programs · 86 countries</span><h2>Find a program that fits you</h2><p>Explore verified programs matched to your goals, profile, and preferences.</p></div><button className="secondary-button"><SlidersHorizontal size={17} /> Edit preferences</button></section><div className="search-panel card"><label className="search-box"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search universities, programs, or countries…" /><kbd>⌘ K</kbd></label><div className="filter-row" role="group" aria-label="Program filters">{["All regions", "Europe", "Oceania", "Business"].map((item) => <button key={item} className={filter === item ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item)}>{item}{item === "All regions" && <ChevronDown size={14} />}</button>)}</div></div><div className="results-heading"><div><span className="section-label">Recommended for Alif</span><h3>{filtered.length} matching programs</h3></div><button className="sort-button">Sort: Recommended <ChevronDown size={15} /></button></div><section className="university-list card">{filtered.length ? filtered.map((university) => <UniversityCard key={university.name} university={university} onOpen={() => setSelected(university)} />) : <div className="empty-state"><Search size={30} /><h3>No programs found</h3><p>Try another university, subject, or country.</p><button className="text-button" onClick={() => { setQuery(""); setFilter("All regions"); }}>Clear filters</button></div>}</section></div>;
}

function ProgramDetail({ university, onBack }: { university: (typeof universities)[number]; onBack: () => void }) {
  return <div className="page-enter detail-placeholder"><button className="back-button" onClick={onBack}>← Back to explore</button><article className="card detail-hero"><span className={`crest ${university.level}`}>{university.initials}</span><div><span className={`match ${university.level}`}>{university.score}</span><h2>{university.name}</h2><p>{university.place} · {university.program}</p></div><button className="primary-button">Add to my pathway</button></article><div className="card placeholder-content"><GraduationCap size={30} /><h3>{university.program}</h3><p>Verified program details, requirements, tuition, and preparation guidance will appear here.</p></div></div>;
}

function PlaceholderPage({ view }: { view: Exclude<View, "dashboard" | "explore"> }) {
  const content = { pathway: [Map, "Your pathway is taking shape", "Follow the seven stages from exploration to enrolment."], progress: [Trophy, "Your progress, all in one place", "Track goals, points, achievements, and weekly momentum."], profile: [CircleUserRound, "Profile for Alif", "Keep your academic goals and preferences up to date."] } as const;
  const [Icon, title, description] = content[view]; return <div className="page-enter placeholder-page card"><span className="placeholder-icon"><Icon size={36} /></span><span className="eyebrow">Coming into focus</span><h2>{title}</h2><p>{description}</p><button className="primary-button">Continue planning</button></div>;
}

export default function HomePage() {
  const [view, setView] = useState<View>("dashboard");
  const changeView = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return <div className="app-shell"><Navigation active={view} onChange={changeView} /><main className="app-main"><Header view={view} onProfile={() => changeView("profile")} /><div className="content-wrap">{view === "dashboard" && <DashboardPage go={changeView} />}{view === "explore" && <ExplorePage />}{view !== "dashboard" && view !== "explore" && <PlaceholderPage view={view} />}</div></main></div>;
}
