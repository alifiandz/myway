"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Bell, BookOpen, Bookmark, BriefcaseBusiness,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck,
  CircleHelp, CircleUserRound, ClipboardCheck, Clock3, ExternalLink,
  Flag, Flame, Globe2, GraduationCap, Languages, LayoutDashboard, Map, MapPin, Plus,
  RefreshCw, Scale, Search, Settings2, SlidersHorizontal, Sparkles, Star, Target,
  Trophy, WalletCards, X,
} from "lucide-react";

type View = "dashboard" | "explore" | "pathway" | "tasks" | "progress" | "profile";
type Fit = "Good Fit" | "Possible Fit" | "Entry Structure Mismatch";
type Role = "Dream" | "Target" | "Alternative";

type Program = {
  id: string;
  university: string;
  initials: string;
  logo: string;
  title: string;
  location: string;
  duration: string;
  language: string;
  entry: string;
  fit: Fit;
  fitScore: number;
  management: string;
  enterprise: string;
  marketing: string;
  math: string;
  experience: string;
  tuition: string;
  verified: string;
  why: string[];
  caution: string[];
  curriculum: string[];
  sources: { label: string; href: string }[];
};

const programs: Program[] = [
  {
    id: "aalto",
    university: "Aalto University",
    initials: "A",
    logo: "https://www.aalto.fi/themes/custom/aalto_base/images/aalto_logo.svg",
    title: "BSc in International Business",
    location: "Mikkeli, Finland",
    duration: "3 years · 180 ECTS",
    language: "English",
    entry: "Direct bachelor’s entry",
    fit: "Good Fit",
    fitScore: 88,
    management: "Strong",
    enterprise: "Available",
    marketing: "Strong",
    math: "Moderate",
    experience: "Required international semester · Career services",
    tuition: "Verify current fee",
    verified: "19 Aug 2026",
    why: ["Management and marketing align closely", "International minor and semester abroad", "Project-based business curriculum"],
    caution: ["Compulsory data analytics and accounting", "Grades, intake and eligibility not yet in profile"],
    curriculum: ["Strategic Management", "People Management", "Marketing", "Introduction to Data Analytics", "Principles of Accounting"],
    sources: [
      { label: "Official program page", href: "https://www.aalto.fi/en/study-options/international-business-bachelor-of-science-and-master-of-science-economics-and-business" },
      { label: "Official 2026–28 curriculum", href: "https://www.aalto.fi/en/programmes/bachelors-programme-in-international-business/curriculum-2026-2028" },
    ],
  },
  {
    id: "escp",
    university: "ESCP Business School",
    initials: "ES",
    logo: "https://escp.eu/sites/default/files/inline-images/ESCP-logo-white-misalign.svg",
    title: "Bachelor in Management (BSc)",
    location: "Multi-campus, Europe",
    duration: "3 years · 180 ECTS",
    language: "Mostly English",
    entry: "Direct bachelor’s entry",
    fit: "Good Fit",
    fitScore: 86,
    management: "Strong",
    enterprise: "Strong",
    marketing: "Strong",
    math: "Moderate",
    experience: "3 countries · Internships · Career services",
    tuition: "2027 total: €20,800 EU / €26,800 non-EU",
    verified: "19 Aug 2026",
    why: ["Management across three countries", "Entrepreneurship and digital marketing major option", "Internship and social-impact experience"],
    caution: ["Maths, accounting and statistics are included", "Fee depends on citizenship, which is incomplete"],
    curriculum: ["Management", "Economics and law", "Entrepreneurship & Digital Marketing", "Consulting & Digital Business Strategy", "Maths, accounting and statistics"],
    sources: [{ label: "Official Bachelor in Management page", href: "https://escp.eu/programmes/bachelor-in-management-BSc" }],
  },
  {
    id: "essec",
    university: "ESSEC Business School",
    initials: "E",
    logo: "https://images.ctfassets.net/vmb6iqn8sgcm/6yXnJQs5jk9NJ5r90536Vb/3696bdeb28508cf4255d3cefdc8313a9/Logo_essec_noir.svg",
    title: "Global BBA",
    location: "France · Singapore · Morocco",
    duration: "4 years",
    language: "English tracks available",
    entry: "Direct bachelor’s entry",
    fit: "Good Fit",
    fitScore: 83,
    management: "Strong",
    enterprise: "Strong",
    marketing: "Available",
    math: "Not yet verified",
    experience: "10–12 months professional · 6+ months international",
    tuition: "Verify by campus and status",
    verified: "19 Aug 2026",
    why: ["International BBA structure", "Substantial professional experience", "Entrepreneurship support and career services"],
    caution: ["Quantitative course load needs curriculum verification", "English readiness and intake are incomplete"],
    curriculum: ["Business fundamentals", "International experience", "Professional experience", "Entrepreneurship support"],
    sources: [
      { label: "Official Global BBA page", href: "https://www.essec.edu/en/pages/essec-global-bba//" },
      { label: "Official international admissions", href: "https://essec.edu/en/program/global-bba-international/" },
    ],
  },
  {
    id: "edhec",
    university: "EDHEC Business School",
    initials: "ED",
    logo: "https://www.edhec.edu/sites/default/files/logo.svg",
    title: "International BBA · Business Management",
    location: "Lille, France",
    duration: "4 years",
    language: "English / French",
    entry: "Direct bachelor’s entry",
    fit: "Good Fit",
    fitScore: 81,
    management: "Strong",
    enterprise: "Available",
    marketing: "Available",
    math: "Not yet verified",
    experience: "15 months professional · 165 partner universities",
    tuition: "Verify current fee",
    verified: "19 Aug 2026",
    why: ["Flexible business-management route", "Strong exchange network", "Long professional-experience component"],
    caution: ["Compulsory quantitative load is not yet verified", "Application readiness cannot be scored yet"],
    curriculum: ["Business Management track", "Global Business option", "Professional experience", "Study abroad"],
    sources: [
      { label: "Official EDHEC International BBA", href: "https://www.edhec.edu/en/programmes/bba" },
      { label: "Official Business Management track", href: "https://www.edhec.edu/en/programmes/bba/degrees/business-management-track" },
    ],
  },
  {
    id: "emlyon",
    university: "emlyon business school",
    initials: "em",
    logo: "https://em-lyon.com/themes/custom/emlyon/logo.svg",
    title: "Global BBA",
    location: "Lyon, France",
    duration: "4 years",
    language: "English / French",
    entry: "Direct bachelor’s entry",
    fit: "Good Fit",
    fitScore: 80,
    management: "Strong",
    enterprise: "Strong",
    marketing: "Strong",
    math: "Not yet verified",
    experience: "Up to 75% abroad · Minimum 3 internships",
    tuition: "2026–27: €15,100 / year",
    verified: "19 Aug 2026",
    why: ["Majors in entrepreneurship, branding and digital marketing", "Three internship minimum", "Extensive international mobility"],
    caution: ["Quantitative intensity needs curriculum verification", "2027 intake dates are not in profile"],
    curriculum: ["Corporate Entrepreneurship & Innovation", "Branding & Communication", "Digital Marketing", "International mobility"],
    sources: [{ label: "Official Global BBA page", href: "https://em-lyon.com/en/student/bachelor/global-bba" }],
  },
  {
    id: "ubc",
    university: "UBC Sauder School of Business",
    initials: "UBC",
    logo: "https://www.sauder.ubc.ca/themes/custom/sauder/images/ubc-sauder-logo.svg",
    title: "Bachelor of Commerce",
    location: "Vancouver, Canada",
    duration: "4 years",
    language: "English",
    entry: "Direct Year 1 entry",
    fit: "Possible Fit",
    fitScore: 70,
    management: "Strong",
    enterprise: "Available",
    marketing: "Strong",
    math: "Moderate–high",
    experience: "Career centre · 200 exchange partners",
    tuition: "2026 international: CAD 66,679",
    verified: "19 Aug 2026",
    why: ["Broad commerce degree with 10 specializations", "Strong career and exchange infrastructure", "Marketing and organizational options"],
    caution: ["Senior-level mathematics required", "Quantitative Decision Making is compulsory"],
    curriculum: ["Commerce core", "Marketing", "Organizational Behaviour", "Quantitative Decision Making", "Specialization electives"],
    sources: [
      { label: "Official Bachelor of Commerce", href: "https://org-www.sauder.ubc.ca/programs/bachelors-degrees/bachelor-commerce" },
      { label: "Official direct-entry information", href: "https://org-www.sauder.ubc.ca/programs/bachelors-degrees/bachelor-commerce/admissions-finance/direct-entry" },
    ],
  },
  {
    id: "ivey",
    university: "Ivey Business School",
    initials: "I",
    logo: "https://www.ivey.uwo.ca/images/template/ivey-main-logo.svg",
    title: "Honours Business Administration",
    location: "London, Canada",
    duration: "2+2 structure",
    language: "English",
    entry: "Prior university study required",
    fit: "Entry Structure Mismatch",
    fitScore: 48,
    management: "Strong",
    enterprise: "Strong",
    marketing: "Available",
    math: "Not yet verified",
    experience: "Case method · Career management",
    tuition: "Verify current fee",
    verified: "19 Aug 2026",
    why: ["Strong case-based management education", "Entrepreneurship and strategy alignment"],
    caution: ["HBA begins after two years of university study", "AEO is conditional pre-admission, not direct first-year HBA"],
    curriculum: ["Two years prior university study", "HBA years 3–4", "Case-method business core"],
    sources: [
      { label: "Official HBA program", href: "https://www.ivey.uwo.ca/hba/" },
      { label: "Official program road map", href: "https://www.ivey.uwo.ca/hba/program-details/program-road-map/" },
      { label: "Official secondary-school pathway", href: "https://www.ivey.uwo.ca/hba/admissions/secondary-school-students/" },
    ],
  },
  {
    id: "asu",
    university: "W. P. Carey School of Business",
    initials: "ASU",
    logo: "https://www.asu.edu/asuthemes/4.8/assets/full_logo.png",
    title: "BA in Entrepreneurial Leadership",
    location: "Arizona, USA",
    duration: "4 years",
    language: "English",
    entry: "Direct bachelor’s entry",
    fit: "Good Fit",
    fitScore: 84,
    management: "Strong",
    enterprise: "Strong",
    marketing: "Available",
    math: "Lower calculus exposure",
    experience: "Leadership projects · Career services",
    tuition: "Verify current fee",
    verified: "19 Aug 2026",
    why: ["Entrepreneurship-led curriculum", "Official page notes no calculus for this BA", "Leadership and management emphasis"],
    caution: ["Detailed compulsory curriculum needs verification", "Campus, intake and budget are incomplete"],
    curriculum: ["Entrepreneurial Leadership", "Management options", "Business projects"],
    sources: [{ label: "Official management degrees", href: "https://wpcarey.asu.edu/management-degrees/undergraduate" }],
  },
  {
    id: "kelley",
    university: "Kelley School of Business",
    initials: "K",
    logo: "https://assets.iu.edu/brand/3.x/trident-large.png",
    title: "Bachelor of Science in Business",
    location: "Bloomington, USA",
    duration: "4 years",
    language: "English",
    entry: "Direct admission route available",
    fit: "Possible Fit",
    fitScore: 72,
    management: "Strong",
    enterprise: "Available",
    marketing: "Strong",
    math: "Not yet verified",
    experience: "Career services · Study abroad",
    tuition: "Verify current fee",
    verified: "19 Aug 2026",
    why: ["Wide major and co-major choice", "Marketing and management pathways", "Career services and study abroad"],
    caution: ["Quantitative core has not yet been checked", "Direct-admission eligibility needs profile data"],
    curriculum: ["Business core", "20 majors and co-majors", "Marketing and management pathways"],
    sources: [{ label: "Official undergraduate program", href: "https://kelley.iu.edu/undergraduate/index.html" }],
  },
];

const navItems = [
  { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
  { id: "explore" as View, label: "Explore", icon: Search },
  { id: "pathway" as View, label: "Pathway", icon: Map },
  { id: "tasks" as View, label: "Tasks & Habits", icon: ClipboardCheck },
  { id: "progress" as View, label: "Progress", icon: BarChart3 },
  { id: "profile" as View, label: "Profile", icon: CircleUserRound },
];

function fitClass(fit: Fit) {
  return fit === "Good Fit" ? "good" : fit === "Possible Fit" ? "possible" : "mismatch";
}

function UniversityLogo({ program, size = "" }: { program: Program; size?: "" | "large" | "small" }) {
  return <span className={`crest university-logo ${size} ${program.id === "escp" ? "dark" : ""}`.trim()}>
    <span>{program.initials}</span>
    {/* Official university-hosted assets; initials remain as a resilient fallback. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={program.logo}
      alt={`${program.university} logo`}
      onError={(event) => { event.currentTarget.style.display = "none"; }}
    />
  </span>;
}

function Brand() {
  return <div className="brand"><span className="brand-mark"><Map size={20} /></span><span><strong>Pathway</strong><small>Plan with evidence</small></span></div>;
}

function Navigation({ active, go, openGuide, progress, hasTarget }: { active: View; go: (v: View) => void; openGuide: () => void; progress: number; hasTarget: boolean }) {
  return <>
    <aside className="sidebar">
      <Brand />
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={"nav-item " + (active === id ? "active" : "")} onClick={() => go(id)}><Icon size={19} /><span>{label}</span></button>)}
      </nav>
      <article className="sidebar-progress"><span className="mini-icon"><Sparkles size={16} /></span><strong>{hasTarget ? progress + "% prepared" : "Choose a target"}</strong><small>{hasTarget ? "Your plan updates as you complete actions." : "Your readiness tracker starts after a target is added."}</small><div className="bar"><i style={{ width: progress + "%" }} /></div></article>
      <button className="guide-link" onClick={openGuide}><BookOpen size={17} /> Planning guide</button>
    </aside>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => go(id)}><Icon size={20} /><small>{label}</small></button>)}
    </nav>
  </>;
}

function Header({ view, go, notices, setNotices }: { view: View; go: (v: View) => void; notices: boolean; setNotices: (v: boolean) => void }) {
  const title = { dashboard: "Dashboard", explore: "Explore programs", pathway: "My Pathway", tasks: "Tasks & Habits", progress: "Progress", profile: "Profile" }[view];
  return <header className="topbar">
    <div><span className="eyebrow">Alif’s study planner</span><h1>{title}</h1></div>
    <div className="top-actions">
      <button className="icon-button" onClick={() => setNotices(!notices)} aria-label="Notifications"><Bell size={19} /><i /></button>
      <button className="avatar" onClick={() => go("profile")} aria-label="Open Alif’s profile">A</button>
      {notices && <aside className="notice-popover"><strong>Next best action</strong><p>Add your intended intake so application deadlines can be checked.</p><button onClick={() => { go("profile"); setNotices(false); }}>Update profile <ChevronRight size={15} /></button></aside>}
    </div>
  </header>;
}

const onboardingSteps = ["About you", "Study goals", "Learning preferences", "Career interests", "Experience preferences", "Budget", "Preparation"];

function Onboarding({ finish, saveLater }: { finish: () => void; saveLater: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Alif");
  const [selected, setSelected] = useState<string[]>(["Management", "Entrepreneurship", "Marketing", "International Business", "Low-to-moderate math", "Projects & cases", "Flexible electives", "English-taught", "Business development", "Strategy", "Consulting", "Exchange", "Internships", "Career services", "Scholarships"]);
  const toggle = (item: string) => setSelected((current) => current.includes(item) ? current.filter((v) => v !== item) : [...current, item]);
  return <main className="onboarding-shell">
    <section className="onboarding-art">
      <Brand />
      <div><span className="eyebrow light">YOUR BUSINESS PATHWAY</span><h1>Find programs that fit how you want to learn.</h1><p>Program-level evidence, transparent trade-offs, and a plan you can act on.</p></div>
      <div className="art-proof"><CircleCheck size={20} /><span><strong>Source-aware matching</strong><small>No admission predictions. Unknowns stay visible.</small></span></div>
    </section>
    <section className="onboarding-panel page-enter">
      <div className="mobile-brand"><Brand /></div>
      <header><span>Step {step} of 7</span><span>{Math.round(step / 7 * 100)}% complete</span></header>
      <div className="onboard-progress"><i style={{ width: step / 7 * 100 + "%" }} /></div>
      <div className="step-labels">{onboardingSteps.map((label, i) => <button key={label} aria-label={"Go to " + label} onClick={() => setStep(i + 1)} className={i + 1 === step ? "active" : i + 1 < step ? "done" : ""}>{i + 1 < step ? <Check size={12} /> : i + 1}<small>{label}</small></button>)}</div>
      <div className="onboard-content" key={step}>
        {step === 1 && <>
          <span className="eyebrow">Start with the basics</span><h2>Welcome, Alif. Let’s build your profile.</h2><p>We only use the information you provide. You can leave anything incomplete.</p>
          <div className="form-grid"><label><span>Preferred name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label><label><span>Full name</span><input defaultValue="Alif Makarim" /></label><label><span>Country / citizenship</span><input placeholder="Not provided" /></label><label><span>Intended intake</span><input placeholder="Not provided" /></label></div>
        </>}
        {step === 2 && <>
          <span className="eyebrow">Study goals</span><h2>What do you want to study?</h2><p>Your answers shape program matches and stay editable in Profile.</p>
          <div className="choice-stack">
            <div className="choice-row selected"><GraduationCap /><span><small>Degree sought</small><strong>Bachelor’s</strong></span><ChevronDown /></div>
            <div className="choice-row selected"><BriefcaseBusiness /><span><small>Broad field</small><strong>Business</strong></span><ChevronDown /></div>
          </div>
          <div className="interest-list"><button onClick={() => toggle("Management")} className={selected.includes("Management") ? "selected" : ""}><Target /><span><small>Primary focus</small><strong>Management</strong></span><Check /></button><button onClick={() => { toggle("Entrepreneurship"); toggle("Marketing"); }} className={selected.includes("Entrepreneurship") && selected.includes("Marketing") ? "selected" : ""}><Star /><span><small>Secondary interests</small><strong>Entrepreneurship · Marketing</strong></span><Check /></button><button onClick={() => toggle("International Business")} className={selected.includes("International Business") ? "selected" : ""}><Globe2 /><span><small>Optional interest</small><strong>International Business</strong></span><Check /></button></div>
        </>}
        {step === 3 && <>
          <span className="eyebrow">Learning preferences</span><h2>How do you want to learn?</h2><p>These preferences affect fit, not admissions readiness.</p>
          <div className="preference-cards">{[{ label: "Low-to-moderate math", note: "Avoid quant-heavy routes", icon: BarChart3 }, { label: "Projects & cases", note: "Applied business learning", icon: BriefcaseBusiness }, { label: "Flexible electives", note: "Room to shape your degree", icon: Settings2 }, { label: "English-taught", note: "Preferred language", icon: Languages }].map(({ label, note, icon: Icon }) => <button key={label} className={selected.includes(label) ? "selected" : ""} onClick={() => toggle(label)}><Icon /><strong>{label}</strong><small>{note}</small></button>)}</div>
        </>}
        {step === 4 && <>
          <span className="eyebrow">Career interests</span><h2>What could you see yourself doing?</h2><p>Select as many as you like. These help explain program relevance.</p>
          <div className="chip-cloud">{["Business development", "Management", "Strategy", "Marketing", "Consulting", "Entrepreneurship"].map((item) => <button key={item} className={selected.includes(item) ? "selected" : ""} onClick={() => toggle(item)}>{selected.includes(item) && <Check size={14} />}{item}</button>)}</div>
        </>}
        {step === 5 && <>
          <span className="eyebrow">Experience preferences</span><h2>What should happen beyond the classroom?</h2><p>We’ll prioritize programs with these opportunities.</p>
          <div className="preference-cards">{[{ label: "Exchange", note: "International study experience", icon: Globe2 }, { label: "Internships", note: "Work-integrated learning", icon: BriefcaseBusiness }, { label: "Career services", note: "Coaching and employer links", icon: Target }, { label: "Scholarships", note: "Funding information", icon: Trophy }].map(({ label, note, icon: Icon }) => <button key={label} className={selected.includes(label) ? "selected" : ""} onClick={() => toggle(label)}><Icon /><strong>{label}</strong><small>{note}</small></button>)}</div>
        </>}
        {step === 6 && <>
          <span className="eyebrow">Budget</span><h2>Set guardrails when you’re ready.</h2><p>Leaving this blank means cost fit will remain “Not yet assessed.”</p>
          <div className="form-grid"><label><span>Annual tuition budget</span><input placeholder="Not provided" /></label><label><span>Currency</span><input placeholder="Not provided" /></label></div>
          <div className="info-callout amber"><CircleAlert /><div><strong>Scholarships matter</strong><p>We’ll surface official funding pages, but won’t assume nationality-based eligibility.</p></div></div>
        </>}
        {step === 7 && <>
          <span className="eyebrow">Preparation</span><h2>Tell us what’s ready—if you know.</h2><p>Missing facts create profile gaps, not a negative admissions judgement.</p>
          <div className="form-grid"><label><span>Current grades</span><input placeholder="Not provided" /></label><label><span>English test / score</span><input placeholder="Not provided" /></label><label><span>Graduation date</span><input placeholder="Not provided" /></label><label><span>Documents ready</span><input placeholder="Not provided" /></label></div>
          <div className="info-callout green"><CircleCheck /><div><strong>Your search profile is ready</strong><p>Business · Management first · Low-to-moderate math · International experiences preferred.</p></div></div>
        </>}
      </div>
      <footer className="onboard-actions"><button className="text-link" onClick={saveLater}>Save and finish later</button><div>{step > 1 && <button className="secondary-button" onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> Back</button>}<button className="primary-button" onClick={() => step < 7 ? setStep(step + 1) : finish()}>{step < 7 ? "Continue" : "Find matching programs"} <ChevronRight size={16} /></button></div></footer>
    </section>
  </main>;
}

function Dashboard({ go, completed, toggleTask, openProgram, target }: { go: (v: View) => void; completed: string[]; toggleTask: (v: string) => void; openProgram: (p: Program) => void; target?: Program }) {
  const actions = [
    { id: "ielts-practice", title: "Complete an IELTS speaking drill", meta: "20 min · IELTS 6.5 goal", points: "+20 pts", icon: Languages },
    { id: "documents", title: "Upload your semester grade report", meta: "10 min · Documents", points: "+15 pts", icon: ClipboardCheck },
    { id: "portfolio", title: "Outline portfolio project #3", meta: "30 min · Portfolio", points: "+25 pts", icon: BriefcaseBusiness },
  ];
  const readiness = [
    { label: "English", note: "IELTS goal 6.5", value: completed.includes("ielts-practice") ? 72 : 64, gain: completed.includes("ielts-practice") ? 8 : 4, status: "On track", icon: Languages, tone: "blue" },
    { label: "Portfolio", note: completed.includes("portfolio") ? "3 of 4 projects" : "2 of 4 projects", value: completed.includes("portfolio") ? 75 : 50, gain: completed.includes("portfolio") ? 25 : 5, status: completed.includes("portfolio") ? "Strong progress" : "Building momentum", icon: BriefcaseBusiness, tone: "purple" },
    { label: "Documents", note: completed.includes("documents") ? "4 of 6 ready" : "3 of 6 ready", value: completed.includes("documents") ? 67 : 50, gain: completed.includes("documents") ? 17 : 4, status: "Moving forward", icon: ClipboardCheck, tone: "green" },
    { label: "Scholarships", note: "2 of 6 researched", value: 35, gain: 2, status: "Next opportunity", icon: Trophy, tone: "amber" },
  ];
  const doneToday = actions.filter((action) => completed.includes(action.id)).length;
  const milestoneProgress = Math.round(readiness.slice(0, 3).reduce((sum, item) => sum + item.value, 0) / 3);
  const overallReadiness = Math.round(readiness.reduce((sum, item) => sum + item.value, 0) / readiness.length);
  const weeklyGain = 4 + doneToday * 4;

  if (!target) return <div className="page-enter">
    <section className="welcome-row"><div><span className="eyebrow">Your preparation workspace</span><h2>Choose a target to start tracking</h2><p>Readiness is always measured against a specific program—not a generic profile score.</p></div></section>
    <article className="card no-target-gate"><span className="large-icon"><Target /></span><div><span className="section-label">Tracker locked</span><h3>Add one program as your target university</h3><p>Until then, you can explore and compare programs. Your daily actions, readiness goals, and milestones will appear here after a target is chosen.</p><button className="primary-button" onClick={() => go("explore")}><Search size={15} /> Explore programs</button></div></article>
    <section className="section-space dashboard-recommendations"><div className="section-head"><div><span className="section-label">Start here</span><h3>Strong current matches</h3></div></div><div className="recommend-grid">{programs.slice(0, 3).map((p) => <button className="card recommendation" key={p.id} onClick={() => openProgram(p)}><UniversityLogo program={p} /><span><strong>{p.university}</strong><small>{p.title}</small><em className={"fit " + fitClass(p.fit)}>{p.fit}</em></span><ChevronRight /></button>)}</div></section>
  </div>;

  return <div className="page-enter">
    <section className="welcome-row"><div><span className="eyebrow">Wednesday, 19 August</span><h2>Good afternoon, Alif</h2><p>{target.university} · {target.title}</p></div><button className="secondary-button" onClick={() => go("progress")}><BarChart3 size={16} /> View progress</button></section>
    <div className="dashboard-grid">
      <div className="main-column">
        <article className="card hero-progress"><div><span className="section-label">Preparation progress</span><strong>{overallReadiness}%</strong><p>Based on your readiness categories and completed actions. Not an admission prediction.</p><button className="text-link" onClick={() => go("progress")}>Open full pathway <ChevronRight size={15} /></button></div><div className="hero-readiness-visual"><div className="ring" style={{ background: `conic-gradient(var(--blue) ${overallReadiness}%, #e9ebf2 0)` }}><span>{overallReadiness}<small>%</small></span></div><em className="hero-weekly-gain">+{weeklyGain}% this week</em></div></article>
        <section className="section-space"><div className="section-head"><div><span className="section-label">Today’s actions</span><h3>Close the most useful gaps</h3></div><span className="badge amber">{actions.length - doneToday} open</span></div><article className="card action-list">{actions.map(({ id, title, meta, points, icon: Icon }) => { const done = completed.includes(id); return <button key={id} className={"action-row " + (done ? "done" : "")} onClick={() => toggleTask(id)}><span className={"check " + (done ? "checked" : "")}>{done && <Check size={13} />}</span><span className="row-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{meta}</small></span><em>{done ? "Complete" : points}</em><ChevronRight size={15} /></button>; })}</article></section>
        <article className="card readiness-overview"><div className="section-head"><div><span className="section-label">Overall overview</span><h3>Target readiness</h3></div><button className="text-link" onClick={() => go("progress")}>View all <ChevronRight size={15} /></button></div><p className="readiness-context">Progress toward the evidence needed for {target.university}. This is not an admission prediction.</p><div className="readiness-grid">{readiness.map(({ label, note, value, gain, status, icon: Icon, tone }) => <div className="readiness-item" key={label}><span className={"readiness-icon " + tone}><Icon size={19} /></span><span><span><strong>{label}</strong><em>{value}%</em></span><small>{note}</small><div className={"goal-bar " + tone}><i style={{ width: value + "%" }} /></div><span className="readiness-momentum"><b>{status}</b><em>+{gain}% this week</em></span></span></div>)}</div></article>
        <section className="section-space"><div className="section-head"><div><span className="section-label">Recommended for you</span><h3>Best current program matches</h3></div><button className="text-link" onClick={() => go("explore")}>View all <ChevronRight size={15} /></button></div><div className="recommend-grid" aria-label="Best current program matches">{[...programs].sort((a, b) => b.fitScore - a.fitScore).slice(0, 3).map((p) => <button className="card recommendation" key={p.id} onClick={() => openProgram(p)}><UniversityLogo program={p} /><span><strong>{p.university}</strong><small>{p.title}</small><em className={"fit " + fitClass(p.fit)}>{p.fit}</em></span><ChevronRight /></button>)}</div></section>
      </div>
      <aside className="right-column">
        <article className="card chosen-university-card"><span className="section-label">Chosen university</span><div className="chosen-university-main"><UniversityLogo program={target} size="large" /><span><strong>{target.university}</strong><small><MapPin size={12} /> {target.location}</small><em>{target.title}</em></span></div><button className="text-link" onClick={() => openProgram(target)}>View university <ChevronRight size={14} /></button></article>
        <article className="card priority-card"><span className="section-label">Current priority</span><div className="priority-title"><span className="large-icon"><Languages /></span><span><strong>Reach IELTS 6.5</strong><small>Current estimate 5.5 · Target 6.5</small></span></div><div className="priority-measure"><div className="goal-bar blue"><i style={{ width: "64%" }} /></div><span><small>Current 5.5</small><small>Target 6.5</small></span></div><button className="outline-button" onClick={() => go("pathway")}>Open action plan</button></article>
        <article className="card dashboard-milestone"><div className="milestone-symbol"><Flag size={20} /></div><span className="section-label">Next milestone</span><h3>Application essentials ready</h3><p>Reach the three core evidence goals before reviewing your final application shortlist.</p><div className="milestone-progress"><span><strong>{milestoneProgress}%</strong><small>toward milestone</small></span><div className="goal-bar blue"><i style={{ width: milestoneProgress + "%" }} /></div></div><ul><li className={readiness[0].value >= 100 ? "done" : ""}><CircleCheck size={15} /><span>IELTS 6.5</span><em>{readiness[0].value}%</em></li><li className={readiness[1].value >= 100 ? "done" : ""}><CircleCheck size={15} /><span>4 portfolio projects</span><em>{readiness[1].value}%</em></li><li className={readiness[2].value >= 100 ? "done" : ""}><CircleCheck size={15} /><span>6 core documents</span><em>{readiness[2].value}%</em></li></ul><button className="text-link" onClick={() => go("pathway")}>See milestone plan <ChevronRight size={14} /></button></article>
      </aside>
    </div>
  </div>;
}

function ProgramCard({ p, open, saved, toggleSaved, compared, toggleCompare, addPath }: { p: Program; open: () => void; saved: boolean; toggleSaved: () => void; compared: boolean; toggleCompare: () => void; addPath: () => void }) {
  return <article className="card program-card">
    <button className="program-copy" onClick={open}><UniversityLogo program={p} /><span><span className="program-title"><strong>{p.university}</strong><em className={"fit " + fitClass(p.fit)}>{p.fit}</em></span><small><MapPin size={12} />{p.location}</small><b>{p.title}</b><small>{p.duration} · {p.language}</small></span></button>
    <div className="program-evidence"><span><strong>{p.math}</strong><small>Quantitative fit</small></span><span><strong>{p.management}</strong><small>Management</small></span><span><strong>{p.experience.split(" · ")[0]}</strong><small>Experience</small></span></div>
    <p><CircleCheck size={14} /> {p.why[0]}</p>
    <div className="program-actions"><button className={"icon-label " + (saved ? "selected" : "")} onClick={toggleSaved}><Bookmark size={15} />{saved ? "Saved" : "Save"}</button><button className={"outline-button " + (compared ? "selected" : "")} onClick={toggleCompare}><Scale size={15} />{compared ? "Compared" : "Compare"}</button><button className="outline-button" onClick={open}>View evidence</button><button className="primary-button" onClick={addPath}><Plus size={15} />Pathway</button></div>
  </article>;
}

function Explore({ open, saved, setSaved, compared, toggleCompare, addPath }: { open: (p: Program) => void; saved: string[]; setSaved: (id: string) => void; compared: string[]; toggleCompare: (id: string) => void; addPath: (p: Program) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [tab, setTab] = useState("Programs");
  const [sort, setSort] = useState("Best match");
  const filtered = useMemo(() => programs.filter((p) => {
    const haystack = [p.university, p.title, p.location, p.management, p.enterprise, p.marketing, p.math].join(" ").toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesFilter = filter === "All" || (filter === "Good fit" && p.fit === "Good Fit") || (filter === "Direct entry" && p.entry.toLowerCase().includes("direct")) || (filter === "Moderate math" && !p.math.toLowerCase().includes("high")) || (filter === "Exchange" && /(international|exchange|countries|abroad)/i.test(p.experience));
    return matchesQuery && matchesFilter;
  }).sort((a, b) => sort === "A–Z" ? a.university.localeCompare(b.university) : b.fitScore - a.fitScore), [query, filter, sort]);
  const display = tab === "Universities" ? Array.from(new Map(filtered.map((p) => [p.university, p])).values()) : filtered;
  return <div className="page-enter">
    <section className="page-intro"><div><span className="eyebrow">Evidence-backed discovery</span><h2>Business programs</h2><p>Best matches for Alif · Management first · Low-to-moderate math</p></div><span className="source-stamp"><CircleCheck size={15} /> Official sources checked 19 Aug 2026</span></section>
    <section className="card search-card">
      <label className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search programs, universities, specializations, or countries…" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}</label>
      <div className="tabs"><button className={tab === "Programs" ? "active" : ""} onClick={() => setTab("Programs")}>Programs</button><button className={tab === "Universities" ? "active" : ""} onClick={() => setTab("Universities")}>Universities</button></div>
      <div className="filter-row"><SlidersHorizontal size={16} />{["All", "Good fit", "Direct entry", "Moderate math", "Exchange"].map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
    </section>
    <div className="results-head"><div><strong>{display.length} {tab.toLowerCase()}</strong><span>Matched at program level</span></div><button className="sort-button" onClick={() => setSort(sort === "Best match" ? "A–Z" : "Best match")}>Sort: {sort} <ChevronDown size={14} /></button></div>
    <section className="program-list">{display.map((p) => <ProgramCard key={p.id} p={p} open={() => open(p)} saved={saved.includes(p.id)} toggleSaved={() => setSaved(p.id)} compared={compared.includes(p.id)} toggleCompare={() => toggleCompare(p.id)} addPath={() => addPath(p)} />)}{display.length === 0 && <div className="card empty"><Search /><h3>No exact matches</h3><p>Try a broader term or remove a filter.</p><button className="outline-button" onClick={() => { setQuery(""); setFilter("All"); }}>Reset filters</button></div>}</section>
  </div>;
}

function ProgramDetail({ p, close, saved, toggleSaved, compared, toggleCompare, addPath }: { p: Program; close: () => void; saved: boolean; toggleSaved: () => void; compared: boolean; toggleCompare: () => void; addPath: (role: Role) => void }) {
  const [roleOpen, setRoleOpen] = useState(false);
  return <div className="page-enter detail-page">
    <button className="back-button" onClick={close}><ChevronLeft size={17} /> Back to programs</button>
    <section className="card detail-hero">
      <UniversityLogo program={p} size="large" /><div><span className="verified"><CircleCheck size={14} /> Source checked {p.verified}</span><h2>{p.university}</h2><p>{p.title} · {p.location}</p></div>
      <div className="detail-hero-actions"><button className={"outline-button " + (saved ? "selected" : "")} onClick={toggleSaved}><Bookmark size={15} /> {saved ? "Saved" : "Save"}</button><button className={"outline-button " + (compared ? "selected" : "")} onClick={toggleCompare}><Scale size={15} /> Compare</button><div className="role-menu"><button className="primary-button" onClick={() => setRoleOpen(!roleOpen)}><Plus size={15} /> Add to pathway <ChevronDown size={14} /></button>{roleOpen && <div>{(["Dream", "Target", "Alternative"] as Role[]).map((r) => <button key={r} onClick={() => { addPath(r); setRoleOpen(false); }}>{r}<small>{r === "Dream" ? "Aspirational option" : r === "Target" ? "Leading realistic option" : "Keep as a backup"}</small></button>)}</div>}</div></div>
    </section>
    <div className="detail-grid">
      <main>
        <article className="card detail-section"><div className="section-head"><div><span className="section-label">Program overview</span><h3>What the official sources say</h3></div><span className={"fit " + fitClass(p.fit)}>{p.fit}</span></div><div className="overview-grid"><div><Clock3 /><span><small>Duration</small><strong>{p.duration}</strong></span></div><div><Languages /><span><small>Language</small><strong>{p.language}</strong></span></div><div><GraduationCap /><span><small>Entry structure</small><strong>{p.entry}</strong></span></div><div><WalletCards /><span><small>Tuition</small><strong>{p.tuition}</strong></span></div></div></article>
        <article className="card detail-section"><span className="section-label">Curriculum and fit</span><h3>Evidence by preference</h3><div className="evidence-table"><div><strong>Management</strong><span className="good-text">{p.management}</span></div><div><strong>Entrepreneurship</strong><span>{p.enterprise}</span></div><div><strong>Marketing</strong><span>{p.marketing}</span></div><div><strong>Quantitative course load</strong><span className={p.math.includes("high") ? "amber-text" : ""}>{p.math}</span></div><div><strong>Exchange, internships, career</strong><span>{p.experience}</span></div></div><div className="curriculum-tags">{p.curriculum.map((item) => <span key={item}>{item}</span>)}</div></article>
        <article className="card detail-section"><span className="section-label">Official sources</span><h3>Verify before applying</h3><div className="source-list">{p.sources.map((s) => <a key={s.href} href={s.href} target="_blank" rel="noreferrer"><ExternalLink size={15} /><span>{s.label}</span><ChevronRight size={15} /></a>)}</div><div className="source-warning"><CircleHelp size={16} /><p>Program information can change. Confirm requirements, dates and fees on the official page before applying.</p></div></article>
      </main>
      <aside>
        <article className="fit-panel"><span className="section-label light">Fit for Alif</span><strong>{p.fitScore}<small>/100</small></strong><div className="fit-bar"><i style={{ width: p.fitScore + "%" }} /></div><h3>{p.fit}</h3><p>This reflects learning preferences and program evidence—not admission probability.</p></article>
        <article className="card detail-section why-list"><span className="section-label">Why it matches</span>{p.why.map((item) => <div key={item}><CircleCheck size={16} /><span>{item}</span></div>)}</article>
        <article className="card detail-section caution-list"><span className="section-label">Open questions</span>{p.caution.map((item) => <div key={item}><CircleAlert size={16} /><span>{item}</span></div>)}</article>
        <article className="card readiness"><span className="section-label">Application readiness</span><strong>More information needed</strong><p>Add grades, English score, citizenship and intended intake to compare requirements.</p></article>
      </aside>
    </div>
  </div>;
}

function ComparePanel({ ids, close, remove, open }: { ids: string[]; close: () => void; remove: (id: string) => void; open: (p: Program) => void }) {
  const items = programs.filter((p) => ids.includes(p.id));
  const rows: [string, (p: Program) => string][] = [["Entry", (p) => p.entry], ["Management", (p) => p.management], ["Entrepreneurship", (p) => p.enterprise], ["Marketing", (p) => p.marketing], ["Quant load", (p) => p.math], ["Experience", (p) => p.experience], ["Tuition", (p) => p.tuition]];
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><section className="compare-modal page-enter"><header><div><span className="eyebrow">Side-by-side evidence</span><h2>Compare programs</h2><p>{items.length} of 4 selected</p></div><button className="icon-button" onClick={close}><X /></button></header>{items.length ? <div className="compare-scroll"><div className="compare-grid" style={{ gridTemplateColumns: "170px repeat(" + items.length + ", minmax(210px, 1fr))" }}><strong className="compare-label">Program</strong>{items.map((p) => <article key={p.id}><button className="remove-x" onClick={() => remove(p.id)}><X size={13} /></button><UniversityLogo program={p} /><strong>{p.university}</strong><small>{p.title}</small><button className="text-link" onClick={() => { open(p); close(); }}>View evidence</button></article>)}{rows.flatMap(([label, value]) => [<strong className="compare-label" key={label}>{label}</strong>, ...items.map((p) => <span className="compare-value" key={label + p.id}>{value(p)}</span>)])}</div></div> : <div className="empty"><Scale /><h3>Select programs to compare</h3></div>}<footer><p><CircleHelp size={14} /> Comparison uses verified program facts and keeps unknowns visible.</p><button className="primary-button" onClick={close}>Done</button></footer></section></div>;
}

const weeklyActions = [
  { id: "ielts-practice", title: "Complete an IELTS speaking mock test", meta: "30 min · English", tag: "English", points: "+20 pts" },
  { id: "program-shortlist", title: "Shortlist 3 Aalto business programs", meta: "25 min · University research", tag: "Research", points: "+20 pts" },
  { id: "portfolio", title: "Draft a portfolio project summary", meta: "30 min · Portfolio", tag: "Portfolio", points: "+25 pts" },
  { id: "documents", title: "Collect transcript requirements", meta: "15 min · Documents", tag: "Documents", points: "+15 pts" },
];

const habits = [
  { id: "speaking", title: "IELTS speaking practice", focus: "Part 2 responses and fluency", goal: 10 },
  { id: "reading", title: "IELTS reading practice", focus: "Skimming and True/False/Not Given", goal: 8 },
  { id: "math", title: "Mathematics review", focus: "Algebra, percentages, and basic functions", goal: 6 },
  { id: "pathway-review", title: "Weekly pathway review", focus: "Review university choices and next requirements", goal: 4 },
];

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

const habitSeed: Record<string, number[]> = {
  "2026-7-speaking": [1, 3, 5, 7, 10, 12, 14, 17, 19],
  "2026-7-reading": [2, 4, 6, 9, 11, 13, 16, 18],
  "2026-7-math": [3, 6, 10, 13, 17],
  "2026-7-pathway-review": [2, 9, 16],
};

function TasksHabits({ completed, toggleTask, target, toast }: { completed: string[]; toggleTask: (v: string) => void; target?: Program; toast: (s: string) => void }) {
  const [tab, setTab] = useState<"actions" | "habits">("actions");
  const [habitChecks, setHabitChecks] = useState<Record<string, number[]>>(habitSeed);
  const [monthOffset, setMonthOffset] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newAction, setNewAction] = useState("");
  const [customActions, setCustomActions] = useState<{ id: string; title: string }[]>([]);
  const actionList = [...weeklyActions, ...customActions.map((item) => ({ ...item, meta: "Added by you · This week", tag: "Personal", points: "+10 pts" }))];
  const done = actionList.filter((action) => completed.includes(action.id)).length;
  const actionStatus = done >= actionList.length ? "Ahead of plan" : done >= Math.ceil(actionList.length / 2) ? "On track" : "Needs attention";
  const shownMonth = new Date(2026, 7 + monthOffset, 1);
  const shownYear = shownMonth.getFullYear();
  const shownMonthIndex = shownMonth.getMonth();
  const monthKey = `${shownYear}-${shownMonthIndex}`;
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(shownMonth);
  const daysInMonth = new Date(shownYear, shownMonthIndex + 1, 0).getDate();
  const firstDayOffset = (shownMonth.getDay() + 6) % 7;
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const monthCompletions = habits.reduce((total, habit) => total + (habitChecks[`${monthKey}-${habit.id}`]?.length || 0), 0);
  const speakingCompletions = habitChecks[`${monthKey}-speaking`]?.length || 0;

  const toggleHabit = (habitId: string, day: number) => {
    const key = `${monthKey}-${habitId}`;
    setHabitChecks((current) => {
      const checked = current[key] || [];
      return { ...current, [key]: checked.includes(day) ? checked.filter((item) => item !== day) : [...checked, day].sort((a, b) => a - b) };
    });
  };
  const moveMonth = (direction: number) => setMonthOffset((current) => current + direction);
  const finishSwipe = (end: number) => {
    if (touchStart === null) return;
    const distance = end - touchStart;
    if (Math.abs(distance) > 55) moveMonth(distance < 0 ? 1 : -1);
    setTouchStart(null);
  };
  const addAction = () => {
    const title = newAction.trim();
    if (!title) return;
    setCustomActions((current) => [...current, { id: `custom-${Date.now()}`, title }]);
    setNewAction("");
    setAdding(false);
    toast("Action added to this week");
  };

  return <div className="page-enter tasks-page">
    <section className="page-intro tasks-intro"><div><span className="eyebrow">This week</span><h2>Tasks & Habits</h2><p>Finish important actions. Repeat routines that build readiness.</p></div><button className="primary-button" onClick={() => setAdding(!adding)}><Plus size={15} /> Add action</button></section>
    {adding && <article className="card add-action-panel"><div><span className="section-label">New one-time action</span><strong>What do you want to finish?</strong></div><input autoFocus value={newAction} onChange={(event) => setNewAction(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addAction()} placeholder="Example: Review Aalto application deadline" /><button className="primary-button" onClick={addAction}>Add to week</button><button className="text-link" onClick={() => setAdding(false)}>Cancel</button></article>}
    <div className="task-tabs" role="tablist" aria-label="Tasks and habits views"><button className={tab === "actions" ? "active" : ""} onClick={() => setTab("actions")}>Weekly actions</button><button className={tab === "habits" ? "active" : ""} onClick={() => setTab("habits")}>Habit tracker</button></div>
    {tab === "actions" ? <div className="tasks-layout">
      <article className="card weekly-actions-card"><div className="section-head"><div><span className="section-label">One-time tasks</span><h3>This week’s actions</h3></div><span className="today-count">{done} of {actionList.length} done</span></div><p className="tasks-helper">Complete each action once. Finished actions increase the related readiness category.</p><div className="weekly-action-list">{actionList.map((action) => { const isDone = completed.includes(action.id); return <button key={action.id} className={`weekly-action ${isDone ? "done" : ""}`} onClick={() => toggleTask(action.id)}><span className={`task-check ${isDone ? "checked" : ""}`}>{isDone && <Check size={15} />}</span><span className="weekly-action-copy"><strong>{action.title}</strong><small>{action.meta}</small></span><span className="action-tag">{action.tag}</span><em>{isDone ? "Done" : action.points}</em></button>; })}</div></article>
      <aside className="card weekly-focus-card"><div className="focus-card-head"><span className="section-label">This week’s focus</span>{done >= 2 && <span className="focus-fire"><Flame size={14} /> Building momentum</span>}</div><div className="focus-readiness"><strong>50%</strong><span><b>{actionStatus}</b><small>+4% this week</small></span></div><div className="focus-bar"><i style={{ width: "50%" }} /></div><div className="focus-detail"><small>Main gap</small><strong>IELTS 5.5 <span>→</span> 6.5</strong></div><div className="focus-detail"><small>Weekly actions</small><strong>{done} of {actionList.length} complete</strong></div><p>{actionStatus === "Needs attention" ? "Finish one priority action to get back on track." : actionStatus === "Ahead of plan" ? "You cleared every priority action this week." : "Your highest impact actions are moving forward."}</p></aside>
    </div> : <article className="card habit-card" onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={(event) => finishSwipe(event.changedTouches[0].clientX)}><div className="habit-month-head"><div><span className="section-label">Repeatable routines</span><h3>{monthLabel}</h3><p className="tasks-helper">Tap a date when you complete a session. Swipe to move between months.</p></div><div className="month-controls"><button aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={17} /></button><span>{monthCompletions} check-ins</span><button aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={17} /></button></div></div><div className="monthly-habit-list">{habits.map((habit) => { const checks = habitChecks[`${monthKey}-${habit.id}`] || []; const isAhead = checks.length > habit.goal; const isComplete = checks.length === habit.goal; const onFire = habit.id === "speaking" && checks.length >= 7; return <section className="monthly-habit-row" key={habit.id}><div className="monthly-habit-copy"><strong>{habit.title}</strong><small>{habit.focus}</small></div><div className="mini-month" aria-label={`${habit.title} calendar for ${monthLabel}`}><div className="mini-weekdays">{weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="mini-days">{Array.from({ length: firstDayOffset }, (_, index) => <i key={`blank-${index}`} />)}{days.map((day) => { const checked = checks.includes(day); return <button key={day} className={checked ? "checked" : ""} aria-label={`${habit.title}, ${monthLabel} ${day}${checked ? ", complete" : ""}`} onClick={() => toggleHabit(habit.id, day)}><span>{day}</span>{checked && <Check size={11} />}</button>; })}</div></div><div className="habit-progress"><strong>{checks.length}<span> / {habit.goal}</span></strong><small>sessions</small>{isAhead ? <em className="ahead"><Sparkles size={12} /> Ahead of plan</em> : isComplete ? <em className="complete"><CircleCheck size={12} /> Goal met</em> : onFire ? <em className="fire"><Flame size={12} /> On fire</em> : <em>{habit.goal - checks.length} to goal</em>}</div></section>; })}</div><div className="habit-insight"><span className="mini-icon"><Sparkles size={16} /></span><span><strong>{speakingCompletions ? "Speaking is your strongest routine this month" : "Start with one small speaking session"}</strong><small>{speakingCompletions ? `${Math.max(0, 10 - speakingCompletions)} session${10 - speakingCompletions === 1 ? "" : "s"} to reach your monthly speaking goal.` : "Checking in once makes the rest of the month easier to build."}</small></span></div></article>}
  </div>;
}

function Pathway({ selected, completed, toggleTask, go }: { selected: { p: Program; role: Role }[]; completed: string[]; toggleTask: (v: string) => void; go: (v: View) => void }) {
  const [stage, setStage] = useState(2);
  const stages = ["Confirm search profile", "Compare program requirements", "Build academic foundation", "Prepare English evidence", "Plan experience portfolio", "Research scholarships", "Prepare documents", "Submit applications", "Decide and transition"];
  const actions = ["intake", "english", "quant"];
  const actionNames: Record<string, string> = { intake: "Add intended intake", english: "Add current English score", quant: "Compare compulsory quantitative modules" };
  const progress = Math.round((completed.filter((v) => actions.includes(v)).length + 2) / 11 * 100);
  const target = selected.find((v) => v.role === "Target") || selected[0];
  return <div className="page-enter">
    <section className="page-intro"><div><span className="eyebrow">Your decision plan</span><h2>My Pathway</h2><p>{target ? target.p.university + " · " + target.role : "Business bachelor’s search · Management first"}</p></div><button className="secondary-button" onClick={() => go("explore")}><Plus size={15} /> Add program</button></section>
    <article className="card pathway-progress"><div><span className="large-icon"><Flag /></span><span><strong>{target ? target.p.title : "Business bachelor’s search"}</strong><small>{selected.length ? selected.length + " saved pathway option" + (selected.length > 1 ? "s" : "") : "Add programs when you’re ready"}</small></span></div><div><span><strong>Preparation progress</strong><em>{progress}%</em></span><div className="bar"><i style={{ width: progress + "%" }} /></div></div></article>
    <div className="pathway-layout">
      <section className="card stage-panel"><div className="section-head"><div><span className="section-label">Milestones</span><h3>From search to enrolment</h3></div><span className="badge green">2 foundations ready</span></div><div className="stage-list">{stages.map((name, i) => <button key={name} onClick={() => setStage(i)} className={i < 2 ? "complete" : i === stage ? "current" : ""}><span>{i < 2 ? <Check size={14} /> : String(i + 1).padStart(2, "0")}</span><strong>{name}</strong><small>{i < 2 ? "Complete" : i === stage ? "In progress" : "Not started"}</small><ChevronRight /></button>)}</div></section>
      <aside className="pathway-side">
        <article className="card active-milestone"><span className="section-label">Current milestone · {String(stage + 1).padStart(2, "0")}</span><h3>{stages[stage]}</h3><p>Complete the highest-value evidence gaps before narrowing your program list.</p><div className="milestone-actions">{actions.map((id) => { const done = completed.includes(id); return <button key={id} onClick={() => toggleTask(id)}><span className={"check " + (done ? "checked" : "")}>{done && <Check size={14} />}</span><span><strong>{actionNames[id]}</strong><small>{id === "quant" ? "25 min · Program fit" : "Profile gap"}</small></span></button>; })}</div></article>
        <article className="card path-options"><div className="section-head"><h3>Program roles</h3><button onClick={() => go("explore")}>Manage</button></div>{selected.length ? selected.map(({ p, role }) => <div key={p.id}><UniversityLogo program={p} size="small" /><span><strong>{p.university}</strong><small>{p.title}</small></span><em>{role}</em></div>) : <div className="empty-compact"><Bookmark size={18} /><span>No pathway programs yet</span></div>}</article>
      </aside>
    </div>
    <section className="gap-section"><div className="section-head"><div><span className="section-label">Preparation gaps</span><h3>What is known—and what is not</h3></div></div><div className="gap-grid">{[["Academic profile", "Not provided", "attention"], ["English readiness", "Not provided", "attention"], ["Program research", completed.includes("quant") ? "Core modules checked" : "In progress", "green"], ["Documents", "Not provided", "attention"]].map(([label, value, tone]) => <article className="card gap-card" key={label}><span className="row-icon">{tone === "green" ? <CircleCheck /> : <CircleAlert />}</span><span><small>{label}</small><strong>{value}</strong><em className={tone}>{tone === "green" ? "On track" : "Needs information"}</em></span></article>)}</div></section>
  </div>;
}

function ProgressPage({ completed, selected }: { completed: string[]; selected: { p: Program; role: Role }[] }) {
  const areas = [
    { label: "Profile completeness", value: 58, note: "4 key facts missing" },
    { label: "Program research", value: Math.min(100, 25 + selected.length * 18 + (completed.includes("quant") ? 25 : 0)), note: selected.length + " pathway options" },
    { label: "Academic readiness", value: 10, note: "Grades not provided" },
    { label: "English readiness", value: completed.includes("english") ? 35 : 5, note: completed.includes("english") ? "Evidence added" : "Score not provided" },
    { label: "Documents", value: 5, note: "Status not provided" },
    { label: "Scholarships", value: 18, note: "Research started" },
  ];
  return <div className="page-enter"><section className="page-intro"><div><span className="eyebrow">Planning, not prediction</span><h2>Your progress</h2><p>Track research and preparation across your business pathway.</p></div><span className="source-stamp"><RefreshCw size={14} /> Recalculates as you act</span></section>
    <div className="metric-grid"><article className="card metric"><span className="metric-icon"><ClipboardCheck /></span><span><small>Actions completed</small><strong>{completed.length}</strong><em>Across your pathway</em></span></article><article className="card metric"><span className="metric-icon"><Bookmark /></span><span><small>Pathway programs</small><strong>{selected.length}</strong><em>Up to 4 per comparison</em></span></article><article className="card metric"><span className="metric-icon"><ExternalLink /></span><span><small>Official sources</small><strong>13</strong><em>Linked for verification</em></span></article><article className="card metric"><span className="metric-icon"><Trophy /></span><span><small>Search profile</small><strong>Ready</strong><em>Preferences captured</em></span></article></div>
    <section className="card progress-board"><div className="section-head"><div><span className="section-label">Readiness areas</span><h3>Preparation overview</h3></div><span className="badge amber">Not an admission score</span></div>{areas.map((area) => <div className="progress-row" key={area.label}><span><strong>{area.label}</strong><small>{area.note}</small></span><div className="bar"><i style={{ width: area.value + "%" }} /></div><em>{area.value}%</em></div>)}</section>
  </div>;
}

function ProfilePage({ toast, restart }: { toast: (s: string) => void; restart: () => void }) {
  const [editing, setEditing] = useState(false);
  const [country, setCountry] = useState("");
  const [intake, setIntake] = useState("");
  const [english, setEnglish] = useState("");
  const [grades, setGrades] = useState("");
  const save = () => { setEditing(false); toast("Profile saved · recommendations recalculated"); };
  return <div className="page-enter"><section className="card profile-hero"><span className="profile-avatar">A</span><div><span className="eyebrow">Study profile</span><h2>Alif Makarim</h2><p>Bachelor’s · Business · Management first</p><div className="profile-chips"><span>Low–moderate math</span><span>Entrepreneurship</span><span>Marketing</span><span>International Business</span></div></div><button className="secondary-button" onClick={() => editing ? save() : setEditing(true)}>{editing ? <><Check size={15} /> Save changes</> : <><Settings2 size={15} /> Edit profile</>}</button></section>
    <div className="profile-grid">
      <article className="card profile-section"><div className="section-head"><div><span className="section-label">Search preferences</span><h3>What Alif wants</h3></div><GraduationCap /></div><dl className="profile-fields"><div><dt>Degree</dt><dd>Bachelor’s</dd></div><div><dt>Broad field</dt><dd>Business</dd></div><div><dt>Primary focus</dt><dd>Management</dd></div><div><dt>Secondary</dt><dd>Entrepreneurship · Marketing</dd></div><div><dt>Optional</dt><dd>International Business</dd></div><div><dt>Math preference</dt><dd>Low-to-moderate</dd></div></dl></article>
      <article className="card profile-section"><div className="section-head"><div><span className="section-label">Profile gaps</span><h3>Still needed</h3></div><CircleAlert /></div><div className="editable-fields"><label><span>Country / citizenship</span>{editing ? <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Add country" /> : <strong>{country || "Not provided"}</strong>}</label><label><span>Intended intake</span>{editing ? <input value={intake} onChange={(e) => setIntake(e.target.value)} placeholder="Add intake" /> : <strong>{intake || "Not provided"}</strong>}</label><label><span>English test / score</span>{editing ? <input value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="Add score" /> : <strong>{english || "Not provided"}</strong>}</label><label><span>Current grades</span>{editing ? <input value={grades} onChange={(e) => setGrades(e.target.value)} placeholder="Add grades" /> : <strong>{grades || "Not provided"}</strong>}</label></div></article>
      <article className="card profile-section span-two"><div className="section-head"><div><span className="section-label">Career and experience</span><h3>Preferences used in matching</h3></div><Target /></div><div className="preference-grid">{[["Careers", "Business development · Management · Strategy · Marketing · Consulting · Entrepreneurship"], ["Learning", "Projects, case studies and flexible electives"], ["Experiences", "Exchange · Internships · Career services"], ["Avoid", "Finance, accounting, analytics and economics-heavy routes"]].map(([label, text]) => <div key={label}><span className="row-icon">{label === "Careers" ? <BriefcaseBusiness /> : label === "Learning" ? <BookOpen /> : label === "Experiences" ? <Globe2 /> : <CircleAlert />}</span><span><small>{label}</small><strong>{text}</strong></span></div>)}</div></article>
      <article className="card privacy-card span-two"><CircleHelp /><div><strong>Matching is explainable and source-aware</strong><p>Fit reflects Alif’s stated preferences. Application readiness stays separate, and missing facts are never treated as a rejection.</p></div><button className="outline-button" onClick={restart}>Review onboarding</button></article>
    </div>
  </div>;
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [compared, setCompared] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [pathway, setPathway] = useState<{ p: Program; role: Role }[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [notices, setNotices] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const complete = window.localStorage.getItem("alif-pathway-business-v1");
      setOnboarded(complete === "complete");
      const hash = window.location.hash.replace("#", "") as View;
      if (navItems.some((item) => item.id === hash)) setView(hash);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const go = (next: View) => {
    setView(next); setSelectedProgram(null); setNotices(false);
    window.history.replaceState(null, "", "#" + next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openProgram = (program: Program) => {
    setSelectedProgram(program);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const finish = () => {
    window.localStorage.setItem("alif-pathway-business-v1", "complete");
    setOnboarded(true); setView("explore"); setToast("Profile ready · 9 programs matched");
  };
  const saveLater = () => {
    window.localStorage.setItem("alif-pathway-business-v1", "complete");
    setOnboarded(true); setView("dashboard"); setToast("Progress saved · complete your profile anytime");
  };
  const toggleSaved = (id: string) => {
    setSaved(saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id]);
    setToast(saved.includes(id) ? "Removed from saved programs" : "Program saved");
  };
  const toggleCompare = (id: string) => {
    if (compared.includes(id)) { setCompared(compared.filter((v) => v !== id)); return; }
    if (compared.length >= 4) { setToast("You can compare up to 4 programs"); setCompareOpen(true); return; }
    setCompared([...compared, id]); setToast("Added to comparison");
  };
  const addPath = (p: Program, role: Role = "Target") => {
    setPathway([...pathway.filter((v) => v.p.id !== p.id), { p, role }]);
    setToast(p.university + " added as " + role);
  };
  const toggleTask = (id: string) => setCompleted(completed.includes(id) ? completed.filter((v) => v !== id) : [...completed, id]);
  const targetProgram = pathway.find((item) => item.role === "Target")?.p;
  const progress = targetProgram ? Math.min(100, 28 + completed.length * 9) : 0;

  if (!onboarded) return <Onboarding finish={finish} saveLater={saveLater} />;

  let content;
  if (selectedProgram) content = <ProgramDetail p={selectedProgram} close={() => setSelectedProgram(null)} saved={saved.includes(selectedProgram.id)} toggleSaved={() => toggleSaved(selectedProgram.id)} compared={compared.includes(selectedProgram.id)} toggleCompare={() => toggleCompare(selectedProgram.id)} addPath={(role) => addPath(selectedProgram, role)} />;
  else if (view === "dashboard") content = <Dashboard go={go} completed={completed} toggleTask={toggleTask} openProgram={openProgram} target={targetProgram} />;
  else if (view === "explore") content = <Explore open={openProgram} saved={saved} setSaved={toggleSaved} compared={compared} toggleCompare={toggleCompare} addPath={(p) => addPath(p)} />;
  else if (view === "pathway") content = <Pathway selected={pathway} completed={completed} toggleTask={toggleTask} go={go} />;
  else if (view === "tasks") content = <TasksHabits completed={completed} toggleTask={toggleTask} target={targetProgram} toast={setToast} />;
  else if (view === "progress") content = <ProgressPage completed={completed} selected={pathway} />;
  else content = <ProfilePage toast={setToast} restart={() => setOnboarded(false)} />;

  return <div className="app-shell">
    <Navigation active={view} go={go} openGuide={() => setOnboarded(false)} progress={progress} hasTarget={Boolean(targetProgram)} />
    <main className="app-main"><Header view={view} go={go} notices={notices} setNotices={setNotices} /><div className="content-wrap">{content}</div></main>
    {compared.length > 0 && !compareOpen && <button className="compare-fab" onClick={() => setCompareOpen(true)}><Scale size={17} /><span>Compare {compared.length}</span><small>of 4</small></button>}
    {compareOpen && <ComparePanel ids={compared} close={() => setCompareOpen(false)} remove={toggleCompare} open={openProgram} />}
    {toast && <div className="toast"><CircleCheck size={17} />{toast}</div>}
  </div>;
}
