"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell, BookOpen, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleUserRound, Clock3, FileText, Flag, Folder, Globe2, GraduationCap, Languages,
  LayoutDashboard, Map, MapPin, Medal, Mic2, Search, SlidersHorizontal,
  Sparkles, Star, Target, Trophy,
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
  const [added, setAdded] = useState(false);
  return <div className="page-enter program-detail">
    <button className="back-button" onClick={onBack}>← Back to explore</button>
    <article className="card detail-hero"><span className={`crest ${university.level}`}>{university.initials}</span><div><span className={`match ${university.level}`}>{university.score}</span><h2>{university.name}</h2><p>{university.place} · {university.program} · English</p></div><div className="detail-actions"><button className="outline-button">Compare</button><button className={added ? "primary-button added" : "primary-button"} onClick={() => setAdded(!added)}>{added ? <><Check size={15}/> Added to pathway</> : "Add to my pathway"}</button></div></article>
    <div className="program-grid"><div className="program-main">
      <section className="card detail-section"><div className="detail-title"><div><span className="section-label">Program overview</span><h3>{university.program}</h3></div><span className="verified"><Check size={13}/> Verified</span></div><div className="info-list"><div><span className="info-icon"><GraduationCap size={18}/></span><div><strong>English-taught degree</strong><small>Bachelor’s · 3 years · 2027 intake</small></div><ChevronRight size={16}/></div><div><span className="info-icon"><Languages size={18}/></span><div><strong>English requirement</strong><small>IELTS 6.5 overall</small></div><ChevronRight size={16}/></div><div><span className="info-icon"><FileText size={18}/></span><div><strong>Academic requirement</strong><small>Requirements depend on your qualification</small></div><ChevronRight size={16}/></div></div></section>
      <section className="card detail-section"><div className="detail-title"><div><span className="section-label">Costs and application</span><h3>Key requirements</h3></div></div><div className="requirement-list"><div><span>Tuition</span><strong>{university.name === "University of Pécs" ? "€2,400 / year" : "See program details"}</strong></div><div><span>Application deadline</span><strong>15 May 2027</strong></div><div><span>Scholarships</span><strong>Available · Eligibility varies</strong></div><div><span>Required documents</span><strong>6 items</strong></div></div></section>
      <section className="card detail-section"><div className="detail-title"><div><span className="section-label">Official sources</span><h3>Verify before applying</h3></div></div><div className="source-list">{["Official university website","Official program page","Official admissions page"].map(item=><button key={item}>{item}<ChevronRight size={16}/></button>)}</div><p className="source-note">Requirements can change. Always confirm important details with the official university source.</p></section>
    </div><aside className="program-aside">
      <section className="card fit-card"><span className="section-label">Preparation match</span><div className="fit-score"><strong>Strong</strong><span>match for Alif</span></div><div className="fit-meter"><i/><i/><i/><i/><i/></div><p>Your academic profile aligns with available information. IELTS speaking is the clearest next step.</p></section>
      <section className="card detail-section prep-card"><div className="detail-title"><div><span className="section-label">Your preparation</span><h3>Readiness snapshot</h3></div></div><div className="prep-list"><div><span><Mic2 size={17}/> IELTS</span><strong className="attention">6.0 / 6.5</strong></div><div><span><GraduationCap size={17}/> Academic average</span><strong>87%</strong></div><div><span><Folder size={17}/> Documents</span><strong>2 / 6</strong></div><div><span><Target size={17}/> Preparation</span><strong className="good">63%</strong></div></div></section>
      <section className="card why-card"><span className="mini-icon"><Sparkles size={18}/></span><div><strong>Why this matches you</strong><p>English-taught, scholarship possibilities, and a curriculum aligned with your goals.</p></div></section>
    </aside></div>
  </div>;
}

function PathwayPage({ go }: { go: (view: View) => void }) {
  const [completedActions, setCompletedActions] = useState<number[]>([0]);
  const stages = [
    ["Explore", "Completed"], ["Requirements", "Completed"], ["Prepare", "In progress"], ["Build", "Not started"], ["Apply", "Not started"], ["Scholarship", "Not started"], ["Ready", "Not started"],
  ];
  const actions = ["IELTS baseline completed", "Speaking improvement", "Writing improvement"];
  return <div className="page-enter pathway-page">
    <section className="page-intro"><div><span className="eyebrow">University of Pécs · 2027 intake</span><h2>My pathway</h2><p>A clear route from research to a confident application.</p></div><button className="secondary-button" onClick={() => go("explore")}><Search size={17}/> Change destination</button></section>
    <article className="card pathway-summary"><div><span className="crest strong">UP</span><div><span className="section-label">Current destination</span><strong>University of Pécs</strong><small>BA History · Pécs, Hungary</small></div></div><div><span className="section-label">Preparation progress</span><strong>63%</strong><div className="long-progress"><i style={{width:"63%"}}/></div></div></article>
    <div className="pathway-grid"><section className="card stage-card"><div className="detail-title"><div><span className="section-label">Seven-stage roadmap</span><h3>Your application journey</h3></div><span className="count-badge">Stage 3 of 7</span></div><div className="stage-list">{stages.map(([name,status],index)=><button key={name} className={index<2?"stage-row complete":index===2?"stage-row current":"stage-row"}><span className="stage-number">{index<2?<Check size={15}/>:String(index+1).padStart(2,"0")}</span><span><strong>{String(index+1).padStart(2,"0")} · {name}</strong><small>{status}</small></span><ChevronRight size={17}/></button>)}</div></section>
      <aside className="pathway-side"><section className="card active-stage"><span className="eyebrow">Current stage · Prepare</span><h3>Build your readiness</h3><p>Strengthen English, complete documents, and close the most important gaps.</p><div className="action-checks">{actions.map((action,index)=>{const done=completedActions.includes(index);return <button key={action} onClick={()=>setCompletedActions(done?completedActions.filter(item=>item!==index):[...completedActions,index])}><span className={done?"check-circle checked":"check-circle"}>{done&&<Check size={14}/>}</span><span>{action}</span><small>{done?"Completed":index===1?"In progress":"Not started"}</small></button>})}</div><button className="primary-button full-button">Next action · IELTS speaking practice</button></section>
      <section className="card why-card"><span className="mini-icon"><Sparkles size={18}/></span><div><strong>Why this matters</strong><p>University of Pécs requires IELTS 6.5. Consistent speaking practice closes your clearest gap.</p></div></section></aside>
    </div>
    <section className="gap-section"><div className="section-heading"><div><span className="section-label">Preparation gaps</span><h3>What needs attention</h3></div><span className="count-badge">Updated today</span></div><div className="gap-grid">{[[Mic2,"IELTS","6.0","6.5","Needs attention"],[GraduationCap,"Academic","87%","80%","On track"],[Folder,"Portfolio","2 projects","4","Needs work"],[FileText,"Documents","2 / 6","6 / 6","Incomplete"]].map(([Icon,label,current,target,status])=><article className="card gap-card" key={String(label)}><span className="stat-icon"><Icon size={19}/></span><div><small>{label as string}</small><strong>{current as string} <span>→ {target as string}</span></strong></div><em className={status==="On track"?"good":"attention"}>{status as string}</em></article>)}</div></section>
  </div>;
}

function ProgressPage() {
  const days = [["Mon",58],["Tue",65],["Wed",42],["Thu",78],["Fri",55],["Sat",86],["Sun",70]];
  return <div className="page-enter progress-page"><section className="page-intro"><div><span className="eyebrow">My growth journey</span><h2>Progress that feels visible</h2><p>Small, consistent actions are moving your application forward.</p></div><button className="secondary-button"><CalendarDays size={17}/> This week</button></section>
    <div className="metric-grid"><article className="card metric-card"><span className="metric-icon"><Trophy size={20}/></span><div><small>Progress points</small><strong>1,240</strong><span>+85 this week</span></div></article><article className="card metric-card"><span className="metric-icon"><Target size={20}/></span><div><small>Preparation</small><strong>63%</strong><span>+7% this month</span></div></article><article className="card metric-card"><span className="metric-icon"><Check size={20}/></span><div><small>Actions done</small><strong>18</strong><span>4 this week</span></div></article><article className="card metric-card"><span className="metric-icon"><Medal size={20}/></span><div><small>Achievements</small><strong>8</strong><span>Level 7</span></div></article></div>
    <div className="progress-layout"><section className="card activity-chart"><div className="detail-title"><div><span className="section-label">Weekly activity</span><h3>Preparation rhythm</h3></div><span className="trend-up">+14%</span></div><div className="chart-area">{days.map(([day,value])=><div className="bar-column" key={day as string}><div><i style={{height:`${value}%`}}/></div><span>{day}</span></div>)}</div><div className="chart-caption"><span>0 min</span><p>Your strongest preparation day was Saturday.</p><span>90 min</span></div></section><aside className="card achievement-panel"><div className="detail-title"><div><span className="section-label">Recent achievements</span><h3>Milestones unlocked</h3></div></div>{[[Star,"Profile complete","All core preferences added"],[Languages,"English baseline","IELTS score recorded"],[GraduationCap,"Campus researcher","Compared 5 universities"],[Folder,"Portfolio starter","Two projects added"]].map(([Icon,title,meta])=><div className="achievement-row" key={title as string}><span className="metric-icon"><Icon size={18}/></span><div><strong>{title as string}</strong><small>{meta as string}</small></div><Check size={16}/></div>)}</aside></div>
    <section className="section-block"><div className="section-heading"><div><span className="section-label">Current targets</span><h3>Keep the momentum</h3></div></div><div className="target-table card">{[["IELTS","6.0 → 6.5",66],["Portfolio","2 / 4 projects",50],["Documents","2 / 6 complete",33],["Scholarship","Research stage",20]].map(([name,label,value])=><div className="target-row" key={name as string}><strong>{name as string}</strong><span>{label as string}</span><div className="long-progress"><i style={{width:`${value}%`}}/></div><em>{value as number}%</em></div>)}</div></section>
  </div>;
}

function ProfilePage() {
  const [editing,setEditing] = useState(false);
  return <div className="page-enter profile-page"><section className="profile-hero card"><div className="profile-avatar">A</div><div><span className="eyebrow">Student profile</span><h2>Alif</h2><p>Bachelor’s candidate · Business & History interests</p><div className="profile-tags"><span>2027 intake</span><span>International study</span><span>Scholarship seeker</span></div></div><button className="secondary-button" onClick={()=>setEditing(!editing)}>{editing?"Save profile":"Edit profile"}</button></section>
    <div className="profile-grid"><section className="card profile-section"><div className="detail-title"><div><span className="section-label">Academic profile</span><h3>Background</h3></div><GraduationCap size={19}/></div><div className="profile-fields"><label><span>Degree sought</span>{editing?<input defaultValue="Bachelor’s"/>:<strong>Bachelor’s</strong>}</label><label><span>Current qualification</span>{editing?<input defaultValue="Indonesian high school diploma"/>:<strong>Indonesian high school diploma</strong>}</label><label><span>Academic average</span>{editing?<input defaultValue="87%"/>:<strong>87%</strong>}</label><label><span>English score</span>{editing?<input defaultValue="IELTS 6.0"/>:<strong>IELTS 6.0</strong>}</label></div></section>
      <section className="card profile-section"><div className="detail-title"><div><span className="section-label">Study preferences</span><h3>Best-fit profile</h3></div><Target size={19}/></div><div className="preference-list"><div><span className="info-icon"><BriefcaseBusiness size={18}/></span><div><small>Primary focus</small><strong>Management</strong></div></div><div><span className="info-icon"><Star size={18}/></span><div><small>Secondary interests</small><strong>Entrepreneurship · Marketing</strong></div></div><div><span className="info-icon"><Globe2 size={18}/></span><div><small>Optional interest</small><strong>International Business</strong></div></div><div><span className="info-icon"><Target size={18}/></span><div><small>Math preference</small><strong>Low to moderate</strong></div></div></div></section>
      <section className="card profile-section span-two"><div className="detail-title"><div><span className="section-label">Planning preferences</span><h3>What matters to Alif</h3></div><Flag size={19}/></div><div className="priority-chips">{["International exchange","Internships","Strong career services","Scholarships","English-taught","Management focus","Low-math curriculum"].map((item,index)=><button className={index<5?"selected":""} key={item}>{index<5&&<Check size={14}/>} {item}</button>)}</div><div className="career-box"><span className="info-icon"><BriefcaseBusiness size={18}/></span><div><small>Career directions</small><strong>Business development · Strategy · Marketing · Consulting · Entrepreneurship</strong></div></div></section>
    </div>
  </div>;
}

export default function HomePage() {
  const [view, setView] = useState<View>("dashboard");
  useEffect(()=>{const sync=()=>{const route=window.location.hash.replace("#","") as View;if(navItems.some(item=>item.id===route))setView(route)};sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync)},[]);
  const changeView = (next: View) => { setView(next); window.history.pushState(null,"",`#${next}`); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return <div className="app-shell"><Navigation active={view} onChange={changeView} /><main className="app-main"><Header view={view} onProfile={() => changeView("profile")} /><div className="content-wrap">{view === "dashboard" && <DashboardPage go={changeView} />}{view === "explore" && <ExplorePage />}{view === "pathway" && <PathwayPage go={changeView}/>} {view === "progress" && <ProgressPage/>}{view === "profile" && <ProfilePage/>}</div></main></div>;
}
