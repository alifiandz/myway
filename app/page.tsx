"use client";

import { buildPlanningReminders, localCalendarDate, type PlanningReminder } from "./planning-reminders";

import { calculateProgramFit, selectRecommendations, type FitResult } from "./programme-fit";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import IndonesiaExplore from "./indonesia-explore";
import IndonesiaPathway from "./indonesia-pathway";
import PublicUniversityLogo from "./university-logo";
import reviewedLogoAssets from "./institution-logo-assets.json";
import { publicMyWayUrl } from "./myway-url";
import {
  BarChart3, Bell, BookOpen, Bookmark, BriefcaseBusiness, CalendarDays, Camera, CreditCard,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck,
  CircleHelp, CircleUserRound, ClipboardCheck, Clock3, Database, Download, ExternalLink, Eye, FileText,
  Flag, Flame, FolderOpen, GraduationCap, Languages, LayoutDashboard, Map, MapPin, MoreHorizontal, Plus,
  Scale, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target,
  Trash2, Trophy, Upload, X, HardDrive, LifeBuoy, LockKeyhole, Moon, Sun, MessageSquare, Bug, Lightbulb,
} from "lucide-react";
import { reviewedRankingContext } from "./ranking-context";
import { additionalSchoolStudyRows, schoolStudyRows, type SchoolStudySummary } from "./school-data";
import { ftDirectoryIdentities } from "./ft-directory-data";
import { clearVaultDocuments, importLegacyDocuments, legacyDocumentCount, deleteVaultDocument, getVaultDocument, listVaultDocuments, newVaultDocumentId, saveVaultDocument, type VaultDocument } from "./document-vault";
import { createPrototypeExport, importPrototypeExport, MYWAY_LOCAL_KEYS } from "./prototype-data";
import { startAccountSync, type SyncConflict } from "./account-sync";
import { SiteLanguage } from "./site-language";
import { useDialogFocus } from "./dialog-focus";
import { AuthModal } from "./auth-modal";
import { getSupabaseClient } from "./supabase-client";
import type { Session } from "@supabase/supabase-js";

type Language = "en" | "id";

type View = "dashboard" | "explore" | "pathway" | "tasks" | "progress" | "profile" | "settings";
type Role = "Dream" | "Target" | "Alternative";
type FeedbackCategory = "bug" | "incorrect" | "suggestion";
type FeedbackContext = { university?: string; programme?: string };
type PublicProgrammeFact = {
  field_key: string;
  value: unknown;
  status: string;
  source_url: string | null;
  academic_year: string | null;
  applicant_context: string | null;
  verified_on: string | null;
};

const publicFactLabels: Record<string, string> = {
  tuition: "Tuition",
  application_deadline: "Application deadline",
  entry_requirement: "Entry requirements",
};
function factValue(fact: PublicProgrammeFact | undefined): string {
  if (!fact) return "Not yet verified";
  if (fact.status === "not_published") return "Not published for this intake";
  if (fact.value == null || fact.value === "") return "No source details recorded yet";
  return typeof fact.value === "string" ? fact.value : String(fact.value);
}

type ProfileSnapshot = {
  name?: string;
  citizenship?: string;
  curriculum?: string;
  average?: string;
  score?: string;
  test?: string;
  components?: string;
  testDate?: string;
  degree?: string;
  fields?: string;
  avoidedFields?: string;
  countries?: string;
  language?: string;
  budget?: string;
  math?: string;
  intake?: string;
  activities?: string;
  leadership?: string;
  volunteering?: string;
  competitions?: string;
  work?: string;
  portfolio?: string;
};



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
    title: "Bachelor’s Programme in International Business",
    location: "Otaniemi, Finland",
    duration: "3 years · 180 ECTS",
    language: "English",
    entry: "Direct bachelor’s entry",
    management: "Strong",
    enterprise: "Available",
    marketing: "Strong",
    math: "Moderate",
    experience: "24 ECTS international minor · Project or internship option",
    tuition: "€12,000 / year for non-EU/EEA/Swiss students",
    verified: "21 Aug 2026",
    why: ["Broad international-business foundation", "International minor included in the degree", "Project or professional internship option"],
    caution: ["Data analytics, accounting, finance and statistics are compulsory", "The 2026–28 curriculum is still marked subject to change"],
    curriculum: ["Strategic Management", "People Management", "Marketing Management", "Data Analytics", "Accounting", "Economics", "Corporate Finance", "Statistics"],
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
    management: "Strong",
    enterprise: "Strong",
    marketing: "Strong",
    math: "Moderate",
    experience: "3 countries · Internships · Career services",
    tuition: "2027 total: €20,800 European / €26,800 non-European students",
    verified: "11 Sep 2026",
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
    management: "Strong",
    enterprise: "Strong",
    marketing: "Available",
    math: "Not yet verified",
    experience: "10–12 months professional · 6+ months international",
    tuition: "Not yet verified",
    verified: "21 Aug 2026",
    why: ["International BBA structure", "Substantial professional experience", "Entrepreneurship support and career services"],
    caution: ["Quantitative course load needs curriculum verification", "English readiness and intake are incomplete"],
    curriculum: ["Business fundamentals", "International experience", "Professional experience", "Entrepreneurship support"],
    sources: [{ label: "Official Global BBA international admissions", href: "https://essec.edu/en/program/global-bba-international/" }],
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
    management: "Strong",
    enterprise: "Available",
    marketing: "Available",
    math: "Not yet verified",
    experience: "15 months professional · 165 partner universities",
    tuition: "Not yet verified",
    verified: "21 Aug 2026",
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
    management: "Strong",
    enterprise: "Strong",
    marketing: "Strong",
    math: "Not yet verified",
    experience: "Up to 75% abroad · Minimum 3 internships",
    tuition: "2026–27: €15,100 / year",
    verified: "21 Aug 2026",
    why: ["Majors in entrepreneurship, branding and digital marketing", "Three internship minimum", "Extensive international mobility"],
    caution: ["Quantitative intensity needs curriculum verification", "2027 intake dates are not in profile"],
    curriculum: ["Corporate Entrepreneurship & Innovation", "Branding & Communication", "Digital Marketing", "International mobility"],
    sources: [{ label: "Official Global BBA page", href: "https://em-lyon.com/en/student/bachelor/global-bba" }],
  },
];

type BusinessSchool = {
  id: string;
  rank: string;
  name: string;
  location: string;
  domain: string;
  programId?: string;
  directorySource?: "FT" | "Official";
  order?: number;
  institutionType?: "university" | "business-school" | "higher-education-institution" | null;
  parentUniversity?: string | null;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  identitySource?: string;
  identityVerifiedOn?: string;
  logoUrl?: string;
  logoSource?: string;
  logoVerifiedOn?: string;
};

type SchoolRanking = {
  publisher: "FT" | "QS" | "THE" | "ShanghaiRanking" | "CUG" | "Times" | "Perspektywy";
  title: string;
  year: string;
  rank: string;
  scope: string;
  href: string;
  rankedEntity: string;
  verifiedOn: string | null;
  status: "verified" | "not-yet-verified";
};

// Institution list and order follow the FT European Business Schools 2025 table.
// Degree-level facts are attached only when the official university program page is checked.
const businessSchoolRows: [string, string, string, string?][] = [
  ["1", "INSEAD", "France / international"],
  ["2", "HEC Paris", "France"],
  ["3", "London Business School", "United Kingdom / UAE"],
  ["4", "ESCP Business School", "Multi-country Europe", "escp"],
  ["5", "IESE Business School", "Spain / international"],
  ["6", "SDA Bocconi School of Management", "Italy"],
  ["7", "ESSEC Business School", "France", "essec"],
  ["8", "University of St Gallen", "Switzerland"],
  ["9", "EDHEC Business School", "France", "edhec"],
  ["10", "emlyon business school", "France", "emlyon"],
  ["11", "Esade Business School", "Spain"],
  ["12", "ESMT Berlin", "Germany"],
  ["13", "IMD", "Switzerland"],
  ["14", "University of Oxford: Saïd", "United Kingdom"],
  ["15", "Mannheim Business School", "Germany"],
  ["16", "SKEMA Business School", "France"],
  ["17", "Nova School of Business and Economics", "Portugal"],
  ["18", "Warwick Business School", "United Kingdom"],
  ["19", "Stockholm School of Economics", "Sweden"],
  ["20", "WHU – Otto Beisheim School of Management", "Germany"],
  ["21", "IE Business School", "Spain"],
  ["22", "University of Cambridge: Judge", "United Kingdom"],
  ["23", "University College Dublin: Smurfit", "Ireland"],
  ["24", "Grenoble Ecole de Management", "France"],
  ["25", "Vlerick Business School", "Belgium"],
  ["26", "Católica Lisbon School of Business and Economics", "Portugal"],
  ["=26", "Audencia", "France"],
  ["28", "NEOMA Business School", "France"],
  ["29", "Cranfield School of Management", "United Kingdom"],
  ["30", "EADA Business School Barcelona", "Spain"],
  ["31", "Frankfurt School of Finance and Management", "Germany"],
  ["32", "KEDGE Business School", "France"],
  ["33", "Rotterdam School of Management, Erasmus University", "Netherlands"],
  ["34", "Bayes Business School", "United Kingdom"],
  ["35", "POLIMI School of Management", "Italy"],
  ["36", "Alliance Manchester Business School", "United Kingdom"],
  ["37", "Henley Business School", "United Kingdom"],
  ["38", "University of Porto – FEP | PBS", "Portugal"],
  ["39", "Imperial Business School", "United Kingdom"],
  ["40", "BI Norwegian Business School", "Norway"],
  ["41", "WU Vienna University of Economics and Business", "Austria"],
  ["42", "Kozminski University", "Poland"],
  ["43", "Trinity College Dublin, Trinity Business School", "Ireland"],
  ["44", "Iscte Business School", "Portugal"],
  ["45", "Copenhagen Business School", "Denmark"],
  ["46", "Aalto University", "Finland", "aalto"],
  ["47", "IÉSEG School of Management", "France"],
  ["48", "Prague University of Economics and Business", "Czechia"],
  ["49", "TIAS Business School, Tilburg University", "Netherlands"],
  ["50", "Luiss University / Luiss Business School", "Italy"],
  ["51", "NHH Norwegian School of Economics", "Norway"],
  ["52", "HEC Lausanne, University of Lausanne", "Switzerland"],
  ["53", "Sabancı Business School", "Türkiye"],
  ["54", "Solvay Brussels School of Economics and Management", "Belgium"],
  ["55", "Antwerp Management School", "Belgium"],
  ["56", "Excelia Business School", "France"],
  ["57", "Montpellier Business School", "France"],
  ["58", "Koç University Graduate School of Business", "Türkiye"],
  ["59", "EBS Business School", "Germany"],
  ["60", "Nyenrode Business Universiteit", "Netherlands"],
  ["61", "Rennes School of Business", "France"],
  ["62", "University of Cologne", "Germany"],
  ["63", "Bologna Business School", "Italy"],
  ["64", "ICN Business School", "France"],
  ["65", "University of Ljubljana, School of Economics and Business", "Slovenia"],
  ["66", "ESSCA School of Management", "France"],
  ["67", "ISEG – Lisbon School of Economics and Management", "Portugal"],
  ["=67", "University of Bath School of Management", "United Kingdom"],
  ["69", "Paris School of Business", "France"],
  ["70", "University of Edinburgh Business School", "United Kingdom"],
  ["71", "Durham University Business School", "United Kingdom"],
  ["72", "ZHAW School of Management and Law", "Switzerland"],
  ["73", "EM Strasbourg Business School", "France"],
  ["74", "HHL Leipzig Graduate School of Management", "Germany"],
  ["75", "Lund University School of Economics and Management", "Sweden"],
  ["76", "Burgundy School of Business", "France"],
  ["77", "Institut Mines-Télécom Business School", "France"],
  ["=77", "University of Zurich", "Switzerland"],
  ["79", "TUM School of Management", "Germany"],
  ["80", "Maastricht University, School of Business and Economics", "Netherlands"],
  ["81", "Católica Porto Business School", "Portugal"],
  ["82", "Hanken School of Economics", "Finland"],
  ["83", "University Carlos III de Madrid", "Spain"],
  ["84", "IAE Aix-Marseille Graduate School of Management", "France"],
  ["85", "Louvain School of Management, UCLouvain", "Belgium"],
  ["86", "Jönköping International Business School", "Sweden"],
  ["87", "University of Glasgow: Adam Smith", "United Kingdom"],
  ["88", "IQS – Universitat Ramon Llull", "Spain"],
  ["89", "Leeds University Business School", "United Kingdom"],
  ["90", "Aston Business School", "United Kingdom"],
  ["91", "University of Amsterdam – Amsterdam Business School", "Netherlands"],
  ["92", "Deusto Business School", "Spain"],
  ["93", "EM Normandie Business School", "France"],
  ["94", "TBS Education", "France"],
  ["95", "Lancaster University Management School", "United Kingdom"],
  ["=95", "ESDES Business School", "France"],
  ["97", "Clermont School of Business", "France"],
  ["98", "University of Strathclyde Business School", "United Kingdom"],
  ["99", "University of Antwerp Faculty of Business and Economics", "Belgium"],
  ["100", "SGH Warsaw School of Economics", "Poland"],
];

// Official institution domains, kept in the same order as the FT directory above.
// They power both the official-site link and the institution mark shown on each card.
const businessSchoolDomains = [
  "insead.edu",
  "hec.edu",
  "london.edu",
  "escp.eu",
  "iese.edu",
  "sdabocconi.it",
  "essec.edu",
  "unisg.ch",
  "edhec.edu",
  "em-lyon.com",
  "esade.edu",
  "esmt.berlin",
  "imd.org",
  "sbs.ox.ac.uk",
  "mannheim-business-school.com",
  "skema.edu",
  "novasbe.unl.pt",
  "wbs.ac.uk",
  "hhs.se",
  "whu.edu",
  "ie.edu",
  "jbs.cam.ac.uk",
  "smurfitschool.ie",
  "grenoble-em.com",
  "vlerick.com",
  "clsbe.lisboa.ucp.pt",
  "audencia.com",
  "neoma-bs.com",
  "cranfield.ac.uk",
  "eada.edu",
  "frankfurt-school.de",
  "kedge.edu",
  "rsm.nl",
  "bayes.citystgeorges.ac.uk",
  "gsom.polimi.it",
  "alliance-manchester.ac.uk",
  "henley.ac.uk",
  "fep.up.pt",
  "imperial.ac.uk",
  "bi.edu",
  "wu.ac.at",
  "kozminski.edu.pl",
  "tcd.ie",
  "iscte-iul.pt",
  "cbs.dk",
  "aalto.fi",
  "ieseg.fr",
  "vse.cz",
  "tias.edu",
  "luiss.it",
  "nhh.no",
  "unil.ch",
  "sabanciuniv.edu",
  "ulb.be",
  "antwerpmanagementschool.be",
  "excelia-group.com",
  "montpellier-bs.com",
  "ku.edu.tr",
  "ebs.edu",
  "nyenrode.nl",
  "rennes-sb.com",
  "uni-koeln.de",
  "unibo.it",
  "icn-artem.com",
  "uni-lj.si",
  "essca.fr",
  "iseg.ulisboa.pt",
  "bath.ac.uk",
  "psbedu.paris",
  "ed.ac.uk",
  "durham.ac.uk",
  "zhaw.ch",
  "em-strasbourg.com",
  "hhl.de",
  "lu.se",
  "bsb-education.com",
  "imt-bs.eu",
  "uzh.ch",
  "tum.de",
  "maastrichtuniversity.nl",
  "ucp.pt",
  "hanken.fi",
  "uc3m.es",
  "univ-amu.fr",
  "uclouvain.be",
  "ju.se",
  "gla.ac.uk",
  "iqs.edu",
  "leeds.ac.uk",
  "aston.ac.uk",
  "uva.nl",
  "deusto.es",
  "em-normandie.com",
  "tbs-education.com",
  "lancaster.ac.uk",
  "esdes.fr",
  "clermont-sb.fr",
  "strath.ac.uk",
  "uantwerpen.be",
  "sgh.waw.pl",
] as const;

const identityCorrections: Record<string, Partial<BusinessSchool>> = {
  "ft-school-6": { name: "Bocconi University", domain: "unibocconi.it", location: "Milan, Italy", city: "Milan", country: "Italy", region: "Europe", institutionType: "university", parentUniversity: null, identitySource: "https://www.unibocconi.it/en/programs/bachelor-science/management", identityVerifiedOn: "2026-09-17", logoSource: "https://www.topuniversities.com/universities/bocconi-university" },
  "ft-school-23": { name: "University College Dublin — Lochlann Quinn School of Business", domain: "ucd.ie", location: "Dublin, Ireland", city: "Dublin", country: "Ireland", region: "Europe", institutionType: "business-school", parentUniversity: "University College Dublin", identitySource: "https://www.ucd.ie/quinn/", identityVerifiedOn: "2026-09-17", logoSource: "https://www.topuniversities.com/universities/university-college-dublin" },
  "ft-school-36": { domain: "alliancembs.manchester.ac.uk", identitySource: "https://www.alliancembs.manchester.ac.uk/", identityVerifiedOn: "2026-09-17" },
  "ft-school-42": { logoSource: "https://www.topuniversities.com/universities/kozminski-university" },
  "ft-school-57": { name: "MBS School of Business", domain: "mbs-education.com", identitySource: "https://www.mbs-education.com/international/en/", identityVerifiedOn: "2026-09-17" },
  "ft-school-58": { name: "Koç University", domain: "ku.edu.tr", location: "Istanbul, Turkey", city: "Istanbul", country: "Turkey", region: "Europe / Asia", institutionType: "university", parentUniversity: null, identitySource: "https://case.ku.edu.tr/en/programs/business-administration/curriculum/", identityVerifiedOn: "2026-09-18", logoSource: "https://www.topuniversities.com/universities/koc-university" },
  "ft-school-63": { name: "University of Bologna", domain: "unibo.it", location: "Bologna, Italy · Programme: Forlì", city: "Bologna", country: "Italy", region: "Europe", institutionType: "university", parentUniversity: null, identitySource: "https://www.unibo.it/en/study/first-and-single-cycle-degree/programme/2026/6614", identityVerifiedOn: "2026-09-17", logoSource: "https://www.topuniversities.com/universities/university-bologna" },
  "ft-school-68": { logoSource: "https://www.topuniversities.com/universities/university-bath" },
  "ft-school-69": { logoUrl: "/institution-logos/ft-school-69.svg", logoSource: "https://www.psbedu.paris/themes/custom/psbedu_theme/logo.svg" },
  "ft-school-81": { name: "Católica Porto School of Business and Economics", domain: "cpsbe.porto.ucp.pt", identitySource: "https://cpsbe.porto.ucp.pt/", identityVerifiedOn: "2026-09-17" },
};
const businessSchools: BusinessSchool[] = businessSchoolRows.map(([rank, name, location, programId], index) => ({
  id: `ft-school-${index + 1}`,
  rank,
  name,
  location,
  domain: businessSchoolDomains[index],
  programId,
  directorySource: "FT",
  order: index + 1,
  city: ftDirectoryIdentities[`ft-school-${index + 1}`]?.city ?? null,
  country: ftDirectoryIdentities[`ft-school-${index + 1}`]?.country ?? null,
  region: "Europe",
  identitySource: ftDirectoryIdentities[`ft-school-${index + 1}`]?.source,
  identityVerifiedOn: "2026-09-18",
  logoUrl: `/institution-logos/ft-school-${index + 1}.png`,
  logoSource: ftDirectoryIdentities[`ft-school-${index + 1}`]?.source,
  logoVerifiedOn: "2026-09-18",
  ...identityCorrections[`ft-school-${index + 1}`],
}));

const additionalBusinessSchoolRows: [string, string, string, string][] = [
  ["verified-school-lse", "London School of Economics and Political Science", "London, United Kingdom", "lse.ac.uk"],
  ["verified-school-kings", "King’s College London", "London, United Kingdom", "kcl.ac.uk"],
  ["verified-school-birmingham", "University of Birmingham", "Birmingham, United Kingdom", "birmingham.ac.uk"],
  ["verified-school-sheffield", "University of Sheffield", "Sheffield, United Kingdom", "sheffield.ac.uk"],
  ["verified-school-liverpool", "University of Liverpool", "Liverpool, United Kingdom", "liverpool.ac.uk"],
  ["verified-school-groningen", "University of Groningen", "Groningen, Netherlands", "rug.nl"],
  ["verified-school-twente", "University of Twente", "Enschede, Netherlands", "utwente.nl"],
  ["verified-school-southampton", "University of Southampton", "Southampton, United Kingdom", "southampton.ac.uk"],
  ["verified-school-sussex", "University of Sussex", "Brighton, United Kingdom", "sussex.ac.uk"],
  ["verified-school-qmul", "Queen Mary University of London", "London, United Kingdom", "qmul.ac.uk"],
  ["verified-school-radboud", "Radboud University", "Nijmegen, Netherlands", "ru.nl"],
  ["verified-school-newcastle", "Newcastle University", "Newcastle upon Tyne, United Kingdom", "ncl.ac.uk"],
  ["verified-school-cardiff", "Cardiff University", "Cardiff, United Kingdom", "cardiff.ac.uk"],
  ["verified-school-nus", "National University of Singapore", "Singapore, Singapore", "nus.edu.sg"],
];
const additionalLogoSources: Record<string, string> = {
  "verified-school-lse": "https://www.topuniversities.com/universities/london-school-economics-political-science-lse",
  "verified-school-kings": "https://www.topuniversities.com/universities/kings-college-london",
  "verified-school-birmingham": "https://www.topuniversities.com/universities/university-birmingham",
  "verified-school-sheffield": "https://www.topuniversities.com/universities/university-sheffield",
  "verified-school-liverpool": "https://www.topuniversities.com/universities/university-liverpool",
  "verified-school-groningen": "https://www.topuniversities.com/universities/university-groningen",
  "verified-school-twente": "https://www.topuniversities.com/universities/university-twente",
  "verified-school-southampton": "https://www.topuniversities.com/universities/university-southampton",
  "verified-school-sussex": "https://www.topuniversities.com/universities/university-sussex",
  "verified-school-qmul": "https://www.topuniversities.com/universities/queen-mary-university-london",
  "verified-school-radboud": "https://www.topuniversities.com/universities/radboud-university",
  "verified-school-newcastle": "https://www.topuniversities.com/universities/newcastle-university",
  "verified-school-cardiff": "https://www.topuniversities.com/universities/cardiff-university",
  "verified-school-nus": "https://www.topuniversities.com/universities/national-university-singapore-nus",
};
const additionalBusinessSchools: BusinessSchool[] = additionalBusinessSchoolRows.map(([id, name, location, domain], index) => ({ id, rank: "", name, location, domain, directorySource: "Official", order: 101 + index, city: location.split(",")[0], country: location.split(",").slice(1).join(",").trim(), region: id === "verified-school-nus" ? "Asia" : "Europe", institutionType: "university", parentUniversity: null, identitySource: additionalSchoolStudyRows[id].source, identityVerifiedOn: additionalSchoolStudyRows[id].lastVerified ?? "2026-09-17", logoUrl: `/institution-logos/${id}.png`, logoSource: additionalLogoSources[id], logoVerifiedOn: "2026-09-18" }));
const allBusinessSchools = [...businessSchools, ...additionalBusinessSchools];
Object.assign(allBusinessSchools.find((school) => school.id === "verified-school-nus")!, { institutionType: "university", parentUniversity: null, city: "Singapore", country: "Singapore", region: "Asia", identitySource: "https://www.moe.gov.sg/post-secondary/overview/autonomous-universities", identityVerifiedOn: "2026-09-17" });

const schoolStudySummaries: Record<string, SchoolStudySummary> = Object.fromEntries(
  businessSchools.map((school, index) => [school.id, schoolStudyRows[index]])
);
Object.assign(schoolStudySummaries, additionalSchoolStudyRows);

function schoolStudy(school: BusinessSchool) {
  return schoolStudySummaries[school.id];
}

// MyWay is an undergraduate planning product. Postgraduate-only and restricted-entry
// institutions remain in the source dataset for auditability, but never enter discovery.
const undergraduateBusinessSchools = allBusinessSchools.filter((school) => schoolStudy(school).status === "bachelor");

function assertDirectoryIntegrity(schools: BusinessSchool[]) {
  const duplicateValues = (values: string[]) => values.filter((value, index) => values.indexOf(value) !== index);
  if (schools.length !== 100) throw new Error(`MyWay directory must expose exactly 100 institutions; found ${schools.length}.`);
  const duplicateIds = duplicateValues(schools.map((school) => school.id));
  const duplicateNames = duplicateValues(schools.map((school) => school.name.trim().toLowerCase()));
  const duplicateDomains = duplicateValues(schools.map((school) => school.domain.trim().toLowerCase()));
  if (duplicateIds.length || duplicateNames.length || duplicateDomains.length) throw new Error("MyWay directory contains a duplicate institution identity.");
  if (schools.some((school) => !school.logoUrl || !schoolStudy(school).source)) throw new Error("Every visible institution requires a local logo and an official programme source.");
}
assertDirectoryIntegrity(undergraduateBusinessSchools);

function schoolAsProgram(school: BusinessSchool): Program {
  const study = schoolStudy(school);
  return {
    id: `school:${school.id}`,
    university: school.name,
    initials: school.name.split(/\s+/).filter((word) => /^[A-ZÀ-Ž]/.test(word)).slice(0, 2).map((word) => word[0]).join("") || school.name.slice(0, 2).toUpperCase(),
    logo: school.logoUrl ?? "",
    title: study.title,
    location: school.location,
    duration: [study.duration, study.credits].filter(Boolean).join(" · ") || "Not applicable",
    language: study.language || "See official programme page",
    entry: study.status === "bachelor" ? "Bachelor’s programme available" : study.status === "restricted" ? "Restricted undergraduate route" : "No direct undergraduate degree",
    management: study.areas.some((area) => /management|business/i.test(area)) ? "Available" : "Not highlighted",
    enterprise: study.areas.some((area) => /entrepreneur/i.test(area)) ? "Available" : "Not highlighted",
    marketing: study.areas.some((area) => /marketing/i.test(area)) ? "Available" : "Not highlighted",
    math: "Not yet verified",
    experience: "Check the official programme page",
    tuition: "See the current official fee schedule",
    verified: study.lastVerified ? study.lastVerified : "official source linked",
    why: study.areas.slice(0, 3).map((area) => `${area} matches a selected business interest`),
    caution: ["Admissions requirements must be checked", "Tuition and scholarships depend on applicant status", "Quantitative course load needs verification"],
    curriculum: study.areas,
    sources: [{ label: study.sourceLabel, href: study.source }],
  };
}



const discoveryPrograms = undergraduateBusinessSchools.map((school) =>
  programs.find((program) => program.id === school.programId) ?? schoolAsProgram(school)
);

const rankingSource = "https://rankings.ft.com/rankings/3042/european-business-school-rankings-2025";
const qsBusinessSource = "https://www.topuniversities.com/university-subject-rankings/business-management-studies";

// Additional positions are added only when they are visible in the named publisher's current table.
// Bands and equal signs are preserved exactly as published.
const qsBusinessRanks: Record<string, string> = {
  "INSEAD": "#4",
  "London Business School": "#9",
  "University of Oxford: Saïd": "#5",
  "University of Cambridge: Judge": "#6",
  "Warwick Business School": "#35",
  "Alliance Manchester Business School": "#41",
  "Imperial Business School": "=22",
  "University of Bath School of Management": "=82",
  "University of Edinburgh Business School": "=109",
  "Durham University Business School": "#101",
  "Cranfield School of Management": "=139",
  "Leeds University Business School": "#77",
  "Aston Business School": "151–200",
  "Lancaster University Management School": "#96",
};

const theBusinessRanks: Record<string, string> = {
  "University of Oxford: Saïd": "#4",
  "University of Cambridge: Judge": "#6",
  "Warwick Business School": "#35",
  "Alliance Manchester Business School": "#41",
  "University of Edinburgh Business School": "#60",
};

const shanghaiBusinessRanks: Record<string, { rank: string; href: string }> = {
  "Audencia": { rank: "#10", href: "https://www.shanghairanking.com/universities/audencia" },
  "Copenhagen Business School": { rank: "#1", href: "https://www.shanghairanking.com/universities/copenhagen-business-school" },
  "WHU – Otto Beisheim School of Management": { rank: "151–200", href: "https://www.shanghairanking.com/universities/whu-otto-beisheim-school-of-management" },
  "IMD": { rank: "301–400", href: "https://www.shanghairanking.com/universities/international-institute-for-management-development-imd" },
  "Luiss University / Luiss Business School": { rank: "201–300", href: "https://www.shanghairanking.com/universities/luiss-guido-carli-university" },
};

const rankingCache = new globalThis.Map<string, SchoolRanking[]>();
function schoolRankings(school: BusinessSchool): SchoolRanking[] {
  const cached = rankingCache.get(school.id);
  if (cached) return cached;
  const verifiedOn = "2026-10-07";
  const directoryCheckedOn = "2026-09-17";
  const rankings: SchoolRanking[] = [];
  // Ranking entities remain those named by the publisher, even when a study card
  // represents the parent university's undergraduate route.
  if (school.directorySource === "FT") rankings.push({
    publisher: "FT", title: "European Business School Rankings", year: "2025",
    rank: ["26", "67", "77", "95"].includes(school.rank.replace("=", "")) ? "=" + school.rank.replace("=", "") : "#" + school.rank,
    scope: "Regional · business school · postgraduate and executive education",
    href: ftDirectoryIdentities[school.id]?.source ?? rankingSource, rankedEntity: businessSchoolRows[Number(school.id.replace("ft-school-", "")) - 1][1],
    verifiedOn: directoryCheckedOn, status: "verified",
  });
  const theEntities: Record<string, [string, string]> = {
    "University of Oxford: Saïd": ["University of Oxford", "university-oxford"],
    "Warwick Business School": ["University of Warwick", "university-warwick"],
    "Alliance Manchester Business School": ["University of Manchester", "university-manchester"],
    "University of Edinburgh Business School": ["University of Edinburgh", "university-edinburgh"],
  };
  const theEntity = theEntities[school.name];
  if (theEntity) rankings.unshift({ publisher: "THE", title: "World University Rankings by Subject: Business and Economics", year: "2026", rank: theBusinessRanks[school.name], scope: "Global · university subject · all study levels", href: "https://www.timeshighereducation.com/world-university-rankings/" + theEntity[1], rankedEntity: theEntity[0], verifiedOn, status: "verified" });
  const currentShanghai: Record<string, [string, string]> = {
    "Audencia": ["#29", "Audencia Business School"],
    "Copenhagen Business School": ["#2", "Copenhagen Business School"],
    "WHU – Otto Beisheim School of Management": ["201–300", "WHU - Otto Beisheim School of Management"],
    "Luiss University / Luiss Business School": ["201–300", "Luiss Guido Carli"],
  };
  const sr = currentShanghai[school.name];
  if (sr) rankings.unshift({ publisher: "ShanghaiRanking", title: "Global Ranking of Academic Subjects: Business Administration", year: "2026", rank: sr[0], scope: "Global · institution subject · research", href: shanghaiBusinessRanks[school.name].href, rankedEntity: sr[1], verifiedOn, status: "verified" });
  // Previous QS subject positions are not retained as confirmed without the exact edition.
  if (qsBusinessRanks[school.name]) rankings.push({ publisher: "QS", title: "World University Rankings by Subject: Business & Management Studies", year: "2026", rank: "Not yet verified", scope: "Global · subject · exact position and ranked entity awaiting confirmation", href: qsBusinessSource, rankedEntity: "Not yet verified", verifiedOn: null, status: "not-yet-verified" });
  if (school.id === "verified-school-nus") rankings.push(
    { publisher: "THE", title: "World University Rankings by Subject: Business and Economics", year: "2026", rank: "=10", scope: "Global · university subject · all study levels", href: "https://www.timeshighereducation.com/world-university-rankings/national-university-singapore", rankedEntity: school.name, verifiedOn, status: "verified" },
    { publisher: "QS", title: "QS World University Rankings", year: "2027", rank: "#10", scope: "Global · overall university", href: "https://www.topuniversities.com/universities/national-university-singapore-nus", rankedEntity: school.name, verifiedOn, status: "verified" },
    { publisher: "THE", title: "World University Rankings", year: "2027", rank: "#15", scope: "Global · overall university", href: "https://www.timeshighereducation.com/world-university-rankings/national-university-singapore", rankedEntity: school.name, verifiedOn, status: "verified" },
    { publisher: "ShanghaiRanking", title: "Academic Ranking of World Universities", year: "2026", rank: "#53", scope: "Global · overall university · research", href: "https://www.shanghairanking.com/universities/national-university-of-singapore", rankedEntity: school.name, verifiedOn, status: "verified" },
  );
  const reviewedContext = reviewedRankingContext[school.id as keyof typeof reviewedRankingContext];
  if (reviewedContext) rankings.push(...reviewedContext);
  rankingCache.set(school.id, rankings);
  return rankings;
}

const navItems = [
  { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
  { id: "explore" as View, label: "Explore", icon: Search },
  { id: "pathway" as View, label: "Pathway", icon: Map },
  { id: "tasks" as View, label: "Tasks & Habits", icon: ClipboardCheck },
  { id: "progress" as View, label: "Progress", icon: BarChart3 },
  { id: "profile" as View, label: "Profile", icon: CircleUserRound },
];

function fitResultClass(result: FitResult) {
  return result.mustHaveGaps.length ? "possible" : result.score === null ? "possible" : result.score >= 75 ? "good" : result.score >= 60 ? "possible" : "mismatch";
}

function UniversityLogo({ program, size = "" }: { program: Program; size?: "" | "large" | "small" }) {
  const school = undergraduateBusinessSchools.find((item) => item.programId === program.id || `school:${item.id}` === program.id || item.id === program.id);
  const logoAsset = school ? (reviewedLogoAssets as Record<string, {src: string; background: string}>)[school.id] : undefined;
  return <span className={`crest university-logo ${size}`.trim()} style={{ backgroundColor: logoAsset?.background ?? "#fff" }}>
    <span>{program.initials}</span>
    <PublicUniversityLogo universityId={school?.id} fallback={program.logo} name={program.university}/>
  </span>;
}

function SchoolLogo({ school, program, size = "small" }: { school: BusinessSchool; program?: Program; size?: "large" | "small" }) {
  if (program) return <UniversityLogo program={program} size={size} />;
  return <OfficialSchoolLogo school={school} size={size} />;
}

function OfficialSchoolLogo({ school, size }: { school: BusinessSchool; size: "large" | "small" }) {
  return <span className={`crest university-logo ${size} school-logo`} style={{ backgroundColor: (reviewedLogoAssets as Record<string, {src: string; background: string}>)[school.id]?.background ?? "#fff" }}>
    <PublicUniversityLogo universityId={school.id} fallback={school.logoUrl ?? ""} name={school.name}/>
  </span>;
}

function Brand() {
  return <div className="brand"><span className="brand-mark">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/myway-mark.png" alt="" />
  </span><span><strong><b>My</b><em>Way</em></strong><small>Explore · Plan · Go Further</small></span></div>;
}

function Navigation({ active, go, openGuide, progress, hasTarget, language }: { active: View; go: (v: View) => void; openGuide: () => void; progress: number; hasTarget: boolean; language: "en" | "id" }) {
  const labels: Record<View, string> = language === "id" ? { dashboard: "Beranda", explore: "Jelajahi", pathway: "Jalur Saya", tasks: "Tugas & Kebiasaan", progress: "Progres", profile: "Profil", settings: "Pengaturan" } : { dashboard: "Dashboard", explore: "Explore", pathway: "Pathway", tasks: "Tasks & Habits", progress: "Progress", profile: "Profile", settings: "Settings" };
  return <>
    <aside className="sidebar">
      <Brand />
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map(({ id, icon: Icon }) => <button key={id} data-tour={`nav-${id}`} className={"nav-item " + (active === id ? "active" : "")} onClick={() => go(id)}><Icon size={19} /><span>{labels[id]}</span></button>)}
      </nav>
      <article className="sidebar-progress"><span className="mini-icon"><Sparkles size={16} /></span><strong>{hasTarget ? progress + "% pathway ready" : "Choose a Dream"}</strong><small>{hasTarget ? "Across requirements, records, evidence and actions." : "Progress starts after a Dream university is added."}</small><div className="bar"><i style={{ width: progress + "%" }} /></div></article>
      <button className="guide-link" onClick={openGuide}><BookOpen size={17} /> {language === "id" ? "Panduan perencanaan" : "Planning guide"}</button>
    </aside>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navItems.map(({ id, icon: Icon }) => <button key={id} data-tour={`mobile-nav-${id}`} className={active === id ? "active" : ""} onClick={() => go(id)}><Icon size={20} /><small>{labels[id]}</small></button>)}
    </nav>
  </>;
}

function UserAvatar({ value, className = "avatar" }: { value: string; className?: string }) {
  if (value.startsWith("data:image/") || /^https:\/\//.test(value)) return <span className={className}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={value} alt="Your profile" />
  </span>;
  return <span className={className} aria-hidden="true">{value}</span>;
}

function Header({ reminders, remindersEnabled, onReminderAction, view, go, notices, setNotices, notice, onNoticeAction, avatar, language, session, openAccount }: { reminders: PlanningReminder[]; remindersEnabled: boolean; onReminderAction: (reminder: PlanningReminder) => void; view: View; go: (v: View) => void; notices: boolean; setNotices: (v: boolean) => void; notice: { body: string; action: string }; onNoticeAction: () => void; avatar: string; language: "en" | "id"; session: Session | null; openAccount: () => void }) {
  const titles: Record<"en" | "id", Record<View, string>> = {
    en: { dashboard: "Dashboard", explore: "Explore universities", pathway: "My Pathway", tasks: "Tasks & Habits", progress: "Progress", profile: "Profile", settings: "Settings" },
    id: { dashboard: "Beranda", explore: "Jelajahi universitas", pathway: "Jalur Saya", tasks: "Tugas & Kebiasaan", progress: "Progres", profile: "Profil", settings: "Pengaturan" },
  };
  return <header className="topbar" onKeyDown={(event) => { if (event.key === "Escape") setNotices(false); }}>
    <div data-no-translate><span className="eyebrow">{language === "id" ? "Perencana studi" : "Your study planner"}</span><h1>{titles[language][view]}</h1></div>
    <div className="top-actions">
      <button className="icon-button" onClick={() => setNotices(!notices)} aria-label={language === "id" ? "Pengingat" : "Reminders"} aria-expanded={notices} aria-controls="planning-reminders"><Bell size={19} />{remindersEnabled && <i />}</button>
      <button data-tour="settings-button" className={`icon-button ${view === "settings" ? "active" : ""}`} onClick={() => go("settings")} aria-label="Open settings"><Settings2 size={19} /></button>
      <button className={`avatar-button account-button ${session ? "signed-in" : ""}`} onClick={openAccount} aria-label={language === "id" ? "Buka akun" : "Open account"}><UserAvatar value={avatar} /><i /></button>
      {notices && <aside id="planning-reminders" className="notice-popover planning-reminders" aria-label={language === "id" ? "Pengingat perencanaan" : "Planning reminders"}>
        <strong>{language === "id" ? "Pengingat perencanaan" : "Planning reminders"}</strong>
        {!remindersEnabled ? <p>{language === "id" ? "Pengingat dijeda. Aktifkan kembali di Pengaturan." : "Reminders are paused. Enable them in Settings."}</p> : <>
          {reminders.map((reminder) => <button key={reminder.id} className="planning-reminder" onClick={() => { onReminderAction(reminder); setNotices(false); }}><strong>{reminder.university}</strong><span>{reminder.kind === "application" ? (language === "id" ? "Tenggat pendaftaran" : "Application deadline") : (language === "id" ? "Tenggat daftar ulang" : "Enrolment deadline")} · <time dateTime={reminder.date}>{reminder.date}</time></span><small>{reminder.daysRemaining < 0 ? (language === "id" ? `Lewat ${-reminder.daysRemaining} hari · periksa statusmu` : `${-reminder.daysRemaining} days overdue · check your status`) : reminder.daysRemaining === 0 ? (language === "id" ? "Hari ini" : "Due today") : (language === "id" ? `${reminder.daysRemaining} hari lagi` : `Due in ${reminder.daysRemaining} days`)}</small></button>)}
          {reminders.length === 0 && <p>{language === "id" ? "Tidak ada tenggat tercatat dalam 14 hari ke depan." : "No recorded deadlines within the next 14 days."}</p>}
          <div className="planning-next-action"><strong>Next best action</strong><p>{notice.body}</p><button onClick={() => { onNoticeAction(); setNotices(false); }}>{notice.action}</button></div>
          <small>{language === "id" ? "Catat tenggat sebagai YYYY-MM-DD di Jalur. Pengingat muncul saat MyWay terbuka; konfirmasi tanggal dan zona waktu di sumber resmi." : "Record deadlines as YYYY-MM-DD in Pathway. Reminders appear while MyWay is open; confirm dates and time zones with the official source."}</small>
        </>}
      </aside>}
    </div>
  </header>;
}

const onboardingSteps = ["About you", "Study goals", "Preferences", "Preparation"];

function Onboarding({ finish, saveLater }: { finish: () => void; saveLater: () => void }) {
  const [step, setStep] = useState(1);
  const [preferredName, setPreferredName] = useState("");
  const [fullName, setFullName] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [countries, setCountries] = useState("");
  const [budget, setBudget] = useState("");
  const [average, setAverage] = useState("");
  const [test, setTest] = useState("");
  const [score, setScore] = useState("");
  const [graduation, setGraduation] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [degreeRoute, setDegreeRoute] = useState("Bachelor’s");
  const [mainInterest, setMainInterest] = useState("");
  const [additionalInterests, setAdditionalInterests] = useState<string[]>([]);
  const [avoidedInterests, setAvoidedInterests] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<Record<string, "Must have" | "Prefer" | "No preference">>({ Exchange: "No preference", Internships: "No preference", "Career services": "No preference", Scholarships: "No preference" });
  const toggle = (item: string) => setSelected((current) => current.includes(item) ? current.filter((v) => v !== item) : [...current, item]);
  const cyclePriority = (item: string) => setPriorities((current) => ({ ...current, [item]: current[item] === "Must have" ? "Prefer" : current[item] === "Prefer" ? "No preference" : "Must have" }));
  const businessAreas = ["Business Administration", "Management", "International Business", "Entrepreneurship", "Marketing", "Finance", "Accounting", "Economics", "Business Analytics", "Supply Chain & Operations", "Human Resources", "Hospitality & Tourism", "Real Estate", "Sports Business", "Luxury Management", "Sustainability & Social Enterprise"];
  const toggleAdditional = (item: string) => { if (item === mainInterest || avoidedInterests.includes(item)) return; setAdditionalInterests((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]); };
  const toggleAvoided = (item: string) => { if (item === mainInterest || additionalInterests.includes(item)) return; setAvoidedInterests((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]); };
  const saveOnboardingProfile = () => { let existing: Record<string, unknown> = {}; try { existing = JSON.parse(window.localStorage.getItem("myway-profile") || "{}"); } catch {} window.localStorage.setItem("myway-profile", JSON.stringify({ ...existing, name: fullName.trim() || preferredName.trim(), preferredName: preferredName.trim(), citizenship, countries, budget, average, test, score, graduation: graduation.trim() || existing.graduation || "", curriculum, degree: degreeRoute, fields: [mainInterest, ...additionalInterests].filter(Boolean).join(", "), avoidedFields: avoidedInterests.join(", "), language: selected.includes("English-taught") ? "English" : "", math: selected.includes("Low-to-moderate math") ? "Low-to-moderate" : "" })); window.localStorage.setItem("myway-preference-priorities", JSON.stringify(priorities)); window.dispatchEvent(new Event("myway-profile-updated")); };
  const completeOnboarding = () => { saveOnboardingProfile(); finish(); };
  const finishLater = () => { saveOnboardingProfile(); saveLater(); };
  return <main className="onboarding-shell">
    <section className="onboarding-art">
      <Brand />
      <div><span className="eyebrow light">YOUR BUSINESS PATHWAY</span><h1>Find programs that fit how you want to learn.</h1><p>Program-level evidence, transparent trade-offs, and a plan you can act on.</p></div>
      <div className="art-proof"><CircleCheck size={20} /><span><strong>Source-aware matching</strong><small>No admission predictions. Unknowns stay visible.</small></span></div>
    </section>
    <section className="onboarding-panel page-enter">
      <div className="mobile-brand"><Brand /></div>
      <header><span>Step {step} of 4</span><span>{step === 4 ? "Final step" : Math.round((step - 1) / 4 * 100) + "% complete"}</span></header>
      <div className="onboard-progress"><i style={{ width: (step - 1) / 4 * 100 + "%" }} /></div>
      <div className="step-labels">{onboardingSteps.map((label, i) => <button key={label} aria-label={"Go to " + label} onClick={() => setStep(i + 1)} className={i + 1 === step ? "active" : i + 1 < step ? "done" : ""}>{i + 1 < step ? <Check size={12} /> : i + 1}<small>{label}</small></button>)}</div>
      <div className="onboard-content" key={step}>
        {step === 1 && <>
          <span className="eyebrow">Start with the basics</span><h2>{preferredName.trim() ? `Welcome, ${preferredName.trim()}.` : "Welcome."} Let’s build your profile.</h2><p>We only use the information you provide. You can leave anything incomplete.</p>
          <div className="form-grid"><label><span>Preferred name</span><input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="Your preferred name" /></label><label><span>Full name</span><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full legal name" /></label><label><span>Country / citizenship</span><input value={citizenship} onChange={(e) => setCitizenship(e.target.value)} placeholder="e.g. Indonesia" /></label><label><span>High school graduation year</span><input value={graduation} onChange={(e) => setGraduation(e.target.value)} placeholder="e.g. 2027" /></label></div>
        </>}
        {step === 2 && <>
          <span className="eyebrow">Study goals</span><h2>What do you want to study?</h2><p>Your answers shape program matches and stay editable in Profile.</p>
          <div className="study-goal-basics"><label><span>Degree route</span><select value={degreeRoute} onChange={(event) => setDegreeRoute(event.target.value)}><option>Bachelor’s</option><option>Foundation + Bachelor’s</option><option>Integrated Bachelor’s + Master’s</option><option>Not sure yet</option></select></label><div><span>Field</span><strong><BriefcaseBusiness size={15} /> Business</strong><small>MyWay currently focuses on business-related programmes.</small></div></div>
          <div className="study-interest-block"><div><strong>Main interest</strong><small>Choose one, or continue undecided.</small></div><select value={mainInterest} onChange={(event) => { const value = event.target.value; setMainInterest(value); setAdditionalInterests((current) => current.filter((item) => item !== value)); setAvoidedInterests((current) => current.filter((item) => item !== value)); }}><option value="">Not sure yet</option>{businessAreas.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="study-interest-block"><div><strong>Also interested in</strong><small>Select any additional business areas.</small></div><div className="study-area-chips">{businessAreas.map((item) => <button key={item} disabled={item === mainInterest || avoidedInterests.includes(item)} className={additionalInterests.includes(item) ? "selected" : ""} onClick={() => toggleAdditional(item)}>{additionalInterests.includes(item) && <Check size={11} />}{item}</button>)}</div></div>
          <div className="study-interest-block"><div><strong>Prefer to avoid</strong><small>Optional. Conflicting selections are disabled automatically.</small></div><div className="study-area-chips avoid">{businessAreas.map((item) => <button key={item} disabled={item === mainInterest || additionalInterests.includes(item)} className={avoidedInterests.includes(item) ? "selected" : ""} onClick={() => toggleAvoided(item)}>{avoidedInterests.includes(item) && <X size={11} />}{item}</button>)}</div></div>
        </>}
        {step === 3 && <>
          <span className="eyebrow">Preferences</span><h2>What matters in your programme?</h2><p>Choose learning preferences and priorities. These improve matching—not admission probability.</p>
          <div className="preference-cards compact">{[{ label: "Low-to-moderate math", note: "Prefer a lighter quantitative load", icon: BarChart3 }, { label: "Projects & cases", note: "Applied business learning", icon: BriefcaseBusiness }, { label: "Flexible electives", note: "Room to shape the degree", icon: Settings2 }, { label: "English-taught", note: "Study primarily in English", icon: Languages }].map(({ label, note, icon: Icon }) => <button key={label} className={selected.includes(label) ? "selected" : ""} onClick={() => toggle(label)}><Icon /><strong>{label}</strong><small>{note}</small></button>)}</div>
          <span className="form-subtitle">Opportunity priorities</span><div className="onboard-priority-list">{[["Exchange", "International study"], ["Internships", "Work experience"], ["Career services", "Employer and career support"], ["Scholarships", "Funding opportunities"]].map(([item, note]) => <button key={item} onClick={() => cyclePriority(item)}><span><strong>{item}</strong><small>{note}</small></span><em className={priorities[item].toLowerCase().replace(" ", "-")}>{priorities[item]}</em></button>)}</div>
          <div className="form-grid compact-fields"><label><span>Annual tuition budget</span><input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Amount and currency" /></label><label><span>Countries / regions</span><input value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="Optional" /></label></div>
        </>}
        {step === 4 && <>
          <span className="eyebrow">Preparation</span><h2>What information do you already have?</h2><p>Everything here is optional. Missing information creates a profile gap—not a negative judgement.</p>
          <div className="form-grid"><label><span>Current grades</span><input value={average} onChange={(e) => setAverage(e.target.value)} placeholder="Include the grading scale" /></label><label><span>English test</span><input value={test} onChange={(e) => setTest(e.target.value)} placeholder="IELTS, TOEFL, Duolingo..." /></label><label><span>English score</span><input value={score} onChange={(e) => setScore(e.target.value)} placeholder="Optional" /></label><label><span>Current qualification</span><input value={curriculum} onChange={(e) => setCurriculum(e.target.value)} placeholder="e.g. SMA, IB, A Levels" /></label></div>
          <div className="info-callout green"><CircleCheck /><div><strong>Ready to explore</strong><p>Complete detailed education, tests, experience and documents later in Profile.</p></div></div>
        </>}
      </div>
      <footer className="onboard-actions"><button className="text-link" onClick={finishLater}>Finish later</button><div>{step > 1 && <button className="secondary-button" onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> Back</button>}<button className="primary-button" onClick={() => step < 4 ? setStep(step + 1) : completeOnboarding()}>{step < 4 ? "Continue" : "Explore programmes"} <ChevronRight size={16} /></button></div></footer>
    </section>
  </main>;
}

function DashboardShortlists({ selected, openProgram }: { selected: { p: Program; role: Role }[]; openProgram: (p: Program) => void }) {
  const groups = [
    { role: "Target" as Role, label: "Target universities", note: "Your leading realistic options" },
    { role: "Alternative" as Role, label: "Alternative universities", note: "Strong backup options" },
  ];
  const visible = groups.filter((group) => selected.some((item) => item.role === group.role));
  if (!visible.length) return null;
  const total = visible.reduce((sum, group) => sum + selected.filter((item) => item.role === group.role).length, 0);
  return <section className="card dashboard-shortlist-panel">
    <header className="section-head"><div><span className="section-label">Other applications</span><h3>Targets and Alternatives</h3><p>Keep backup applications organised without replacing your Dream.</p></div><span className="badge blue">{total} {total === 1 ? "application" : "applications"}</span></header>
    <div className="dashboard-shortlist-columns">{visible.map((group) => { const items = selected.filter((item) => item.role === group.role); return <section className="dashboard-shortlist-group" key={group.role}><div className="shortlist-group-head"><span className={`role-symbol ${group.role.toLowerCase()}`}>{group.role === "Target" ? <Target size={15} /> : <ShieldCheck size={15} />}</span><span><strong>{group.label}</strong><small>{group.note}</small></span><em>{items.length}</em></div><div className="dashboard-shortlist-list">{items.map(({ p }) => <button key={p.id} onClick={() => openProgram(p)}><UniversityLogo program={p} size="small" /><span><strong>{p.university}</strong><small>{p.title}</small></span><span className="shortlist-open">View <ChevronRight size={13} /></span></button>)}</div></section>; })}</div>
  </section>;
}

type ReadinessStage = { label: string; value: number; requirements: number; records: number; evidence: number; actions: number; completedActions: number; totalActions: number };

function Dashboard({ candidates, go, completed, toggleTask, openProgram, target, selected, pathwayReadiness, readinessStages, programFits, profile }: { candidates: Program[]; go: (v: View) => void; completed: string[]; toggleTask: (v: string) => void; openProgram: (p: Program) => void; target?: Program; selected: { p: Program; role: Role }[]; pathwayReadiness: number; readinessStages: ReadinessStage[]; programFits: Record<string, FitResult>; profile: ProfileSnapshot }) {
  const [actionsHelpOpen, setActionsHelpOpen] = useState(false);
  const [currentHour, setCurrentHour] = useState(12);
  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours());
    updateHour();
    const timer = window.setInterval(updateHour, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const greeting = currentHour >= 5 && currentHour < 12 ? "Good morning" : currentHour >= 12 && currentHour < 17 ? "Good afternoon" : currentHour >= 17 && currentHour < 22 ? "Good evening" : "Good night";
  const completeStages = readinessStages.filter((stage) => stage.value === 100).length;
  const inProgressStages = readinessStages.filter((stage) => stage.value > 0 && stage.value < 100).length;
  const notStartedStages = readinessStages.filter((stage) => stage.value === 0).length;
  const nextStage = readinessStages.find((stage) => stage.value < 100) || readinessStages[readinessStages.length - 1];
  const targetFit = target ? programFits[target.id] : undefined;
  const englishTest = profile.test?.trim();
  const hasEnglishScore = Boolean(profile.score?.trim());
  const readingNeedsWork = /reading/i.test(profile.components || "");
  const englishAction = !englishTest
    ? { title: "Choose an English test and target score", meta: "20 min · Save your decision in Profile" }
    : !hasEnglishScore
      ? { title: `Complete one ${englishTest} diagnostic section`, meta: "45 min · Record your baseline score" }
      : readingNeedsWork
        ? { title: `Complete one timed ${englishTest} Reading passage`, meta: "45 min · Record your raw score" }
        : { title: `Complete one timed ${englishTest} practice section`, meta: "45 min · Record the result" };
  const academicAction = profile.average?.trim()
    ? { title: "Check one subject requirement for your Dream programme", meta: "20 min · Record the official source" }
    : { title: "Add your current grades and grading scale", meta: "15 min · Save them in Profile" };
  const applicationAction = nextStage
    ? { title: `Complete one ${nextStage.label.toLowerCase()} requirement`, meta: `20 min · Continue ${target?.university || "your pathway"}` }
    : { title: "Review your completed application pathway", meta: "20 min · Confirm every official source" };
  const actions = [
    { id: "english-review", ...englishAction, icon: Languages },
    { id: "academic-review", ...academicAction, icon: ClipboardCheck },
    { id: "application-review", ...applicationAction, icon: BriefcaseBusiness },
  ];
  const recommendations = selectRecommendations(candidates, programFits);
  const doneToday = actions.filter((action) => completed.includes(action.id)).length;

  if (!target) return <div className="page-enter" data-tour="dashboard-main">
    <section className="welcome-row"><div><span className="eyebrow">Your preparation workspace</span><h2>Choose a Dream university to start tracking</h2><p>Preparation progress is always connected to a specific university—not an admission prediction.</p></div></section>
    <article className="card no-target-gate"><span className="large-icon"><Target /></span><div><span className="section-label">Tracker ready</span><h3>Add one university as your Dream</h3><p>Your complete nine-stage Pathway Readiness will appear here after a Dream option is chosen. Target and Alternative options remain together on My Pathway.</p><button className="primary-button" onClick={() => go("explore")}><Search size={15} /> Explore programs</button></div></article>
    <DashboardShortlists selected={selected} openProgram={openProgram} />
    <section className="section-space dashboard-recommendations"><div className="section-head"><div><span className="section-label">Start here</span><h3>Current programme matches</h3></div></div><div className="recommend-grid">{recommendations.map((p) => { const match = programFits[p.id]; return <button className="card recommendation" key={p.id} onClick={() => openProgram(p)}><UniversityLogo program={p} /><span><strong>{p.university}</strong><small>{p.title}</small><em className={"fit " + fitResultClass(match)}>{match.score === null ? "Complete profile" : `${match.score}/100 · ${match.label}`}</em></span><ChevronRight /></button>; })}{recommendations.length === 0 && <article className="card no-target-gate"><div><h3>No confirmed matches yet</h3><p>Add your preferences or confirm missing must-have evidence. All 100 programmes remain available in Explore.</p><button className="text-link" onClick={() => go("explore")}>Explore all programmes <ChevronRight size={15} /></button></div></article>}</div></section>
  </div>;

  return <div className="page-enter" data-tour="dashboard-main">
    <section className="welcome-row"><div><span className="eyebrow">Your study pathway</span><h2>{greeting}</h2><p>{target.university} · {target.title}</p></div><button className="secondary-button" onClick={() => go("progress")}><BarChart3 size={16} /> View progress</button></section>
    <div className="dashboard-grid">
      <div className="main-column">
        <article className="card hero-progress"><div><span className="section-label">Pathway readiness</span><strong>{pathwayReadiness}%</strong><p>Requirements, records, evidence and actions across your complete Dream pathway. Not an admission prediction.</p><button className="text-link" onClick={() => go("pathway")}>Open full pathway <ChevronRight size={15} /></button></div><div className="hero-readiness-visual"><div className="ring" style={{ background: `conic-gradient(var(--blue) ${pathwayReadiness}%, #e9ebf2 0)` }}><span>{pathwayReadiness}<small>%</small></span></div><em className="hero-weekly-gain">{completeStages} of 9 stages ready</em></div></article>
        <section className="section-space"><div className="section-head compact-action-heading"><div><span className="section-label">This week</span><h3>Weekly actions</h3></div><span className="dashboard-action-meta"><span className="actions-help-wrap"><button className="info-button" onClick={() => setActionsHelpOpen((open) => !open)} aria-expanded={actionsHelpOpen} aria-describedby="weekly-actions-help" aria-label="How weekly actions work"><CircleHelp size={15} /></button>{actionsHelpOpen && <span className="actions-help-popover" id="weekly-actions-help" role="tooltip"><strong>Weekly actions</strong><small>Specific practice goals based on your profile and Dream pathway. They support preparation, but do not directly change Pathway Readiness.</small></span>}</span><span className="badge amber">{actions.length - doneToday} open</span></span></div><article className="card action-list">{actions.map(({ id, title, meta, icon: Icon }) => { const done = completed.includes(id); return <button key={id} className={"action-row " + (done ? "done" : "")} onClick={() => toggleTask(id)}><span className={"check " + (done ? "checked" : "")}>{done && <Check size={13} />}</span><span className="row-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{meta}</small></span><em>{done ? "Complete" : "Weekly goal"}</em><ChevronRight size={15} /></button>; })}</article></section>
        <article className="card readiness-overview compact-readiness"><div className="section-head"><div><span className="section-label">Complete journey</span><h3>Pathway stages</h3></div><button className="text-link" onClick={() => go("progress")}>View progress <ChevronRight size={15} /></button></div><p className="readiness-context">A compact overview of all nine preparation stages for {target.university}.</p><div className="readiness-status-summary"><div><strong>{completeStages}</strong><span>Ready</span></div><div><strong>{inProgressStages}</strong><span>In progress</span></div><div><strong>{notStartedStages}</strong><span>Not started</span></div></div><button className="outline-button" onClick={() => go("pathway")}>Open full pathway</button></article>
        <section className="section-space"><div className="section-head"><div><span className="section-label">Recommended for you</span><h3>Best current program matches</h3></div><button className="text-link" onClick={() => go("explore")}>View all <ChevronRight size={15} /></button></div><div className="recommend-grid" aria-label="Best current program matches">{recommendations.map((p) => { const match = programFits[p.id]; return <button className="card recommendation" key={p.id} onClick={() => openProgram(p)}><UniversityLogo program={p} /><span><strong>{p.university}</strong><small>{p.title}</small><em className={"fit " + fitResultClass(match)}>{match.score === null ? "Complete profile" : `${match.score}/100 · ${match.label}`}</em></span><ChevronRight /></button>; })}{recommendations.length === 0 && <article className="card no-target-gate"><div><h3>No confirmed matches yet</h3><p>Add your preferences or confirm missing must-have evidence. All 100 programmes remain available in Explore.</p><button className="text-link" onClick={() => go("explore")}>Explore all programmes <ChevronRight size={15} /></button></div></article>}</div></section>
      </div>
      <aside className="right-column">
        <article className="card chosen-university-card"><span className="section-label">Chosen university</span><div className="chosen-university-main"><UniversityLogo program={target} size="large" /><span><strong>{target.university}</strong><small><MapPin size={12} /> {target.location}</small><em>{target.title}</em></span></div><button className="text-link" onClick={() => openProgram(target)}>View university <ChevronRight size={14} /></button></article>
        <article className="card priority-card"><span className="section-label">Personal match</span><div className="priority-title"><span className="large-icon"><Target /></span><span><strong>{targetFit?.score == null ? "Complete your profile" : `${targetFit?.score ?? 0}/100 program fit`}</strong><small>{targetFit?.score == null ? "Add preferences to calculate a personal match" : `${targetFit?.label} · ${targetFit?.confidence ?? 0}% data confidence`}</small></span></div><div className="priority-measure"><div className="goal-bar blue"><i style={{ width: `${targetFit?.score ?? 0}%` }} /></div><span><small>Preferences</small><small>Programme evidence</small></span></div><button className="outline-button" onClick={() => targetFit?.score == null ? go("profile") : openProgram(target)}>View match details</button></article>
        {nextStage && <article className="card dashboard-milestone"><div className="milestone-symbol"><Flag size={20} /></div><span className="section-label">Next pathway stage</span><h3>{nextStage.label}</h3><p>Finish the missing requirements, records, evidence and actions in this stage.</p><div className="milestone-progress"><span><strong>{nextStage.value}%</strong><small>stage readiness</small></span><div className="goal-bar blue"><i style={{ width: nextStage.value + "%" }} /></div></div><ul><li className={nextStage.requirements >= 100 ? "done" : ""}><CircleCheck size={15} /><span>Requirements verified</span><em>{nextStage.requirements}%</em></li><li className={nextStage.records >= 100 ? "done" : ""}><CircleCheck size={15} /><span>Student records added</span><em>{nextStage.records}%</em></li><li className={nextStage.evidence >= 100 ? "done" : ""}><CircleCheck size={15} /><span>Evidence prepared</span><em>{nextStage.evidence}%</em></li><li className={nextStage.actions >= 100 ? "done" : ""}><CircleCheck size={15} /><span>Actions completed</span><em>{nextStage.actions}%</em></li></ul><button className="text-link" onClick={() => go("pathway")}>Open this stage <ChevronRight size={14} /></button></article>}
      </aside>
    </div>
    <DashboardShortlists selected={selected} openProgram={openProgram} />
  </div>;
}

function BusinessSchoolCard({ school, program, openSchool, saved, toggleSaved, compared, toggleCompare, inPathway, togglePathway }: { school: BusinessSchool; program?: Program; openSchool: () => void; saved: boolean; toggleSaved: () => void; compared: boolean; toggleCompare: () => void; inPathway: boolean; togglePathway: () => void }) {
  const [rankingsOpen, setRankingsOpen] = useState(false);
  const rankings = schoolRankings(school);
  const primaryRanking = rankings[0];
  const study = schoolStudy(school);
  const routeTone = study.status === "bachelor" ? "available" : study.status === "restricted" ? "restricted" : "graduate-only";
  return <article className={`card school-card ${routeTone}`}>
    <div className="school-card-top"><button type="button" className="school-identity" onClick={openSchool}><SchoolLogo school={school} program={program} /><span><strong>{school.name}</strong><small><MapPin size={11} />{school.location}</small></span></button><button type="button" className={"program-save " + (saved ? "selected" : "")} onClick={toggleSaved} aria-label={saved ? `Remove ${school.name} from saved schools` : `Save ${school.name}`}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button></div>
    <div className="school-meta-strip"><span className="rank-chip">{primaryRanking ? `${primaryRanking.publisher} ${primaryRanking.year} · ${primaryRanking.rank}` : "Rankings: Not yet verified"}</span><div className="ranking-menu"><button type="button" onClick={() => setRankingsOpen(!rankingsOpen)} aria-expanded={rankingsOpen}>{rankings.length > 1 ? `+${rankings.length - 1} rankings` : "Ranking details"}<ChevronDown size={11} /></button>{rankingsOpen && <div className="ranking-popover"><strong>Ranking sources</strong>{rankings.length === 0 && <p>Not yet verified. Programme evidence is listed separately below.</p>}{rankings.map((ranking) => <a key={`${ranking.publisher}-${ranking.title}-${ranking.year}`} href={ranking.href} target="_blank" rel="noreferrer"><span><b>{ranking.publisher} · {ranking.title}</b><small>{ranking.year} · {ranking.scope}</small><small>Ranked entity: {ranking.rankedEntity}</small><small>{ranking.verifiedOn ? `Checked ${ranking.verifiedOn}` : "Not yet verified"}</small></span><em>{ranking.rank}</em></a>)}<p>Different methodologies are shown separately and are never averaged.</p></div>}</div></div>
    <button type="button" className="school-program-copy" onClick={openSchool}><span className={`school-route-status ${routeTone}`}>{study.status === "bachelor" ? <CircleCheck size={11} /> : study.status === "restricted" ? <CircleAlert size={11} /> : <GraduationCap size={11} />}{study.status === "bachelor" ? "Undergraduate route" : study.status === "restricted" ? "Restricted undergraduate route" : "Postgraduate institution"}</span><strong>{study.title}</strong><span className="school-study-meta"><em><Clock3 size={12} />{study.duration ?? "Duration not yet verified"}</em><em>{study.credits ?? "Credits not yet verified"}</em><em><Languages size={12} />{study.language ?? "Language not yet verified"}</em></span></button>
    <div className="school-area-tags">{study.areas.slice(0, 3).map((area) => <span key={area}>{area}</span>)}{study.areas.length > 3 && <span>+{study.areas.length - 3}</span>}</div>
    <a className="school-source-line" href={study.source} target="_blank" rel="noreferrer"><CircleCheck size={12} />{study.sourceLabel}<ExternalLink size={11} /></a>
    <div className="school-actions"><button type="button" className={"compact-action " + (compared ? "selected" : "")} onClick={toggleCompare}><Scale size={14} />{compared ? "Compared" : "Compare"}</button><button type="button" disabled={study.status !== "bachelor"} className={"compact-action " + (inPathway ? "selected" : "")} onClick={togglePathway}>{inPathway ? <Check size={14} /> : study.status === "bachelor" ? <Plus size={14} /> : <CircleAlert size={14} />}{inPathway ? "Added" : study.status === "bachelor" ? "Pathway" : "No bachelor"}</button><button type="button" className="primary-button compact-view" onClick={openSchool}>View <ChevronRight size={14} /></button></div>
  </article>;
}

function Explore({ openSchool, saved, setSaved, compared, toggleCompare, schoolPathwayIds, toggleSchoolPathway, language, records, updateRecord, goPathway }: { records: Record<string, string>; updateRecord: (key: string, value: string) => void; goPathway: () => void; openSchool: (school: BusinessSchool) => void; saved: string[]; setSaved: (id: string) => void; compared: string[]; toggleCompare: (id: string) => void; schoolPathwayIds: string[]; toggleSchoolPathway: (school: BusinessSchool) => void; language: Language }) {
  const id = language === "id";
  const [searchRegion, setSearchRegion] = useState<"international" | "indonesia">("international");
  useEffect(() => { if (new URLSearchParams(window.location.search).get("region") === "indonesia") setSearchRegion("indonesia"); }, []);
  const [query, setQuery] = useState("");
  const [refineOpen, setRefineOpen] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState("Directory order");
  const filterGroups = [
    { label: "Location", note: "Where you want to study", options: ["Singapore", "Austria", "Belgium", "Czechia", "Denmark", "Finland", "France", "Germany", "Ireland", "Italy", "Netherlands", "Norway", "Poland", "Portugal", "Slovenia", "Spain", "Sweden", "Switzerland", "Türkiye", "United Kingdom", "Multi-country Europe"] },
    { label: "Business area", note: "What you want to study", options: ["Business Administration", "Management", "International Business", "Entrepreneurship", "Marketing", "Finance", "Accounting", "Economics", "Business Analytics", "Supply Chain & Operations", "Human Resources", "Hospitality & Tourism", "Real Estate", "Sports Business", "Luxury Management", "Sustainability & Social Enterprise"] },
    { label: "Study details", note: "From current official pages", options: ["English-taught", "3 years", "4 years", "Credits published"] },
  ];
  const toggleFilter = (item: string) => setFilters((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const locationFilters = filterGroups[0].options;
  const matchesStudyFilter = (study: SchoolStudySummary, item: string) => {
    const content = [study.title, ...study.areas].join(" ");
    if (item === "Business Administration") return /business administration|business management|bba|business studies|business$/i.test(content);
    if (item === "Management") return /management|organisational|leadership|strategy/i.test(content);
    if (item === "International Business") return /international|global business/i.test(content);
    if (item === "Entrepreneurship") return /entrepreneur/i.test(content);
    if (item === "Marketing") return /marketing|branding|communication/i.test(content);
    if (item === "Finance") return /finance/i.test(content);
    if (item === "Accounting") return /accounting|accountancy/i.test(content);
    if (item === "Economics") return /economics/i.test(content);
    if (item === "Business Analytics") return /analytics|data science|data$/i.test(content);
    if (item === "Supply Chain & Operations") return /supply chain|operations|logistics/i.test(content);
    if (item === "Human Resources") return /human resources|people|organisational behaviour/i.test(content);
    if (item === "Hospitality & Tourism") return /hospitality|tourism/i.test(content);
    if (item === "Real Estate") return /real estate|property/i.test(content);
    if (item === "Sports Business") return /sport/i.test(content);
    if (item === "Luxury Management") return /luxury/i.test(content);
    if (item === "Sustainability & Social Enterprise") return /sustainab|social enterprise|social impact/i.test(content);
    if (item === "English-taught") return /english/i.test(study.language || "");
    if (item === "3 years" || item === "4 years") return study.duration?.startsWith(item) || false;
    if (item === "Credits published") return Boolean(study.credits);
    return true;
  };
  const filtered = undergraduateBusinessSchools.filter((school) => {
    const program = school.programId ? programs.find((item) => item.id === school.programId) : undefined;
    const study = schoolStudy(school);
    const haystack = [school.name, school.location, study.title, study.areas.join(" "), program?.curriculum.join(" ")].filter(Boolean).join(" ").toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesSelected = filters.every((item) => {
      if (item === "Multi-country Europe") return /multi-country|international/i.test(school.location);
      if (locationFilters.includes(item)) return school.location.includes(item);
      return matchesStudyFilter(study, item);
    });
    return matchesQuery && matchesSelected && (!savedOnly || saved.includes(school.id));
  }).sort((a, b) => sort === "A–Z" ? a.name.localeCompare(b.name) : (a.order ?? 999) - (b.order ?? 999));
  const regionOptions = <div className="indonesia-region-options" role="group" aria-label={id ? "Wilayah pencarian" : "Search region"}><button type="button" aria-pressed={searchRegion === "international"} onClick={() => { setSearchRegion("international"); const url = new URL(window.location.href); for (const key of ["region", "university", "faculty", "programme"]) url.searchParams.delete(key); window.history.replaceState(null, "", url.pathname + url.search + url.hash); }}>{id ? "Internasional" : "International"}</button><button type="button" aria-pressed={searchRegion === "indonesia"} onClick={() => setSearchRegion("indonesia")}>Indonesia · S1</button></div>;
  if (searchRegion === "indonesia") return <div className="page-enter" data-tour="explore-main">{regionOptions}<IndonesiaExplore language={language} saved={saved} toggleSaved={setSaved} records={records} updateRecord={updateRecord} goPathway={goPathway} /></div>;
  return <div className="page-enter" data-tour="explore-main">{regionOptions}
    <section className="page-intro"><div><span className="eyebrow">Business study discovery</span><h2>Explore {undergraduateBusinessSchools.length} institutions</h2><p>Explore universities and business schools offering undergraduate routes. Preferences apply only when you choose filters.</p></div><a className="source-stamp" href={rankingSource} target="_blank" rel="noreferrer"><CircleCheck size={15} /> FT directory source <ExternalLink size={12} /></a></section>
    <section className="card search-card" data-tour="explore-search">
      <label className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search programs, universities, specializations, or countries…" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}</label>
      <div className="explore-control-row"><button type="button" className={"refine-toggle " + (refineOpen ? "open" : "")} onClick={() => setRefineOpen(!refineOpen)} aria-expanded={refineOpen}><span className="refine-toggle-icon"><SlidersHorizontal size={17} /></span><span className="refine-toggle-copy"><strong>Filters</strong><small>{filters.length ? (id ? `${filters.length} filter aktif` : `${filters.length} active filter${filters.length === 1 ? "" : "s"}`) : "Country, business area, language, duration, and credits"}</small></span>{filters.length > 0 && <em>{filters.length}</em>}<ChevronDown size={17} /></button><button type="button" className={"saved-filter " + (savedOnly ? "active" : "")} onClick={() => saved.length > 0 && setSavedOnly(!savedOnly)} aria-pressed={savedOnly} disabled={saved.length === 0} title={saved.length === 0 ? "Save a university first" : "Show saved universities only"}><Bookmark size={16} fill={savedOnly ? "currentColor" : "none"} /><span><strong>Saved</strong><small>{id ? `${saved.length} universitas` : `${saved.length} ${saved.length === 1 ? "university" : "universities"}`}</small></span></button></div>
      {refineOpen && <div className="refine-panel"><header><div><span className="section-label">Build your shortlist</span><h3>What matters to you?</h3><p>Nothing is preselected. Results update only from choices you make here.</p></div>{filters.length > 0 && <button type="button" onClick={() => setFilters([])}>Reset</button>}</header><div className="refine-groups">{filterGroups.map((group) => <fieldset key={group.label}><legend>{group.label}<small>{group.note}</small></legend><div>{group.options.map((item) => <label key={item} className={filters.includes(item) ? "selected" : ""}><input type="checkbox" checked={filters.includes(item)} onChange={() => toggleFilter(item)} /><span className="filter-check">{filters.includes(item) && <Check size={12} />}</span><span>{item}</span></label>)}</div></fieldset>)}</div><footer><span>{filters.length ? `${filters.length} filters selected` : "No filters selected"}</span><button type="button" className="primary-button" onClick={() => setRefineOpen(false)}>Show {filtered.length} school{filtered.length === 1 ? "" : "s"}</button></footer></div>}
      {filters.length > 0 && <div className="active-filters">{filters.map((item) => <button key={item} onClick={() => toggleFilter(item)}>{item}<X size={12} /></button>)}<button className="clear-all" onClick={() => setFilters([])}>Clear all</button></div>}
    </section>
    <div className="results-head"><div><strong>{id ? `${filtered.length} institusi` : `${filtered.length} ${filtered.length === 1 ? "institution" : "institutions"}`}</strong><span>{savedOnly ? "Showing your saved universities" : filters.length ? "Filtered from your selected criteria" : "No personal preferences applied"}</span></div><button className="sort-button" onClick={() => setSort(sort === "Directory order" ? "A–Z" : "Directory order")}>{id ? "Urutkan" : "Sort"}: {id && sort === "Directory order" ? "Urutan direktori" : sort} <ChevronDown size={14} /></button></div>
    <section className="program-list">{filtered.map((school) => { const program = school.programId ? programs.find((item) => item.id === school.programId) : undefined; return <BusinessSchoolCard key={school.id} school={school} program={program} openSchool={() => openSchool(school)} saved={saved.includes(school.id)} toggleSaved={() => { if (savedOnly && saved.length === 1) setSavedOnly(false); setSaved(school.id); }} compared={compared.includes(school.id)} toggleCompare={() => toggleCompare(school.id)} inPathway={schoolPathwayIds.includes(program?.id ?? `school:${school.id}`)} togglePathway={() => toggleSchoolPathway(school)} />; })}{filtered.length === 0 && <div className="card empty"><Search /><h3>{savedOnly ? "No saved universities match" : "No exact matches"}</h3><p>{savedOnly ? "Save universities or clear the current filters to see them here." : "Try a broader search or remove a preference."}</p><button className="outline-button" onClick={() => { setQuery(""); setFilters([]); setSavedOnly(false); }}>Reset search</button></div>}</section>
  </div>;
}

function SchoolDetail({ school, program, close, saved, toggleSaved, compared, toggleCompare, pathwayRole, addPath, removePath, fitResult, readinessScore, reportIncorrect }: { school: BusinessSchool; program?: Program; close: () => void; saved: boolean; toggleSaved: () => void; compared: boolean; toggleCompare: () => void; pathwayRole?: Role; addPath: (role: Role) => void; removePath: () => void; fitResult: FitResult; readinessScore?: number; reportIncorrect: () => void }) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "programmes" | "admissions" | "rankings">("overview");
  const [facts, setFacts] = useState<PublicProgrammeFact[] | null>(null);
  const [factsError, setFactsError] = useState(false);
  const [factsAttempt, setFactsAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    getSupabaseClient().then(async (supabase) => {
      const { data, error } = await supabase.from("programme_facts")
        .select("field_key,value,status,source_url,academic_year,applicant_context,verified_on")
        .eq("programme_id", `${school.id}-primary`)
        .in("field_key", ["tuition", "application_deadline", "entry_requirement", "ranking"]);
      if (current) { setFactsError(Boolean(error)); setFacts(error ? [] : (data ?? []) as PublicProgrammeFact[]); }
    }).catch(() => { if (current) { setFactsError(true); setFacts([]); } });
    return () => { current = false; };
  }, [school.id, factsAttempt]);
  const factFor = (key: string) => facts?.find((fact) => fact.field_key === key);
  const programmeRanking = factFor("ranking");
  const programmeRankingSource = programmeRanking?.source_url?.startsWith("https://") ? programmeRanking.source_url : null;
  const rankings = schoolRankings(school);
  const verifiedRankings = rankings.filter((ranking) => ranking.status === "verified");
  const study = schoolStudy(school);
  const isBachelor = study.status === "bachelor";
  const routeLabel = isBachelor ? "Bachelor’s programme available" : study.status === "restricted" ? "Restricted undergraduate route" : "No direct undergraduate degree";
  const areas = program?.curriculum ?? study.areas;
  const openQuestions = program?.caution ?? (isBachelor
    ? ["Admissions requirements must be checked on the official programme page", "Tuition and scholarships vary by applicant and intake", "Quantitative course load is not yet verified"]
    : [study.note || "This institution does not currently show a direct undergraduate business degree", "Check the official portfolio before planning an application"]);
  const checkedLabel = program?.verified ?? study.lastVerified ?? school.identityVerifiedOn;
  return <div className="page-enter detail-page university-profile-page">
    <button className="back-button" onClick={close}><ChevronLeft size={17} /> Back to Explore</button>
    <section className="card detail-hero university-profile-hero">
      <SchoolLogo school={school} program={program} size="large" /><div><span className="verified"><CircleAlert size={14} /> Official source linked · Verification required</span><h2>{school.name}</h2><p><MapPin size={12} /> {school.location}</p><div className="university-identity-meta"><span>{school.institutionType === "business-school" ? "Business school" : "University"}</span>{school.parentUniversity && <span>Part of {school.parentUniversity}</span>}<span>{isBachelor ? "Undergraduate route listed" : routeLabel}</span>{checkedLabel && <span>Source record {checkedLabel}</span>}</div></div>
      <div className="detail-hero-actions"><button className={"outline-button " + (saved ? "selected" : "")} onClick={toggleSaved}><Bookmark size={15} /> {saved ? "Saved" : "Save"}</button><button className={"outline-button " + (compared ? "selected" : "")} onClick={toggleCompare}><Scale size={15} /> Compare</button><div className="role-menu"><button className="primary-button" disabled={!isBachelor} onClick={() => isBachelor && setRoleOpen(!roleOpen)}>{pathwayRole ? <Check size={15} /> : isBachelor ? <Plus size={15} /> : <CircleAlert size={15} />} {pathwayRole ? pathwayRole : isBachelor ? "Add to pathway" : "No bachelor pathway"} {isBachelor && <ChevronDown size={14} />}</button>{roleOpen && <div>{(["Dream", "Target", "Alternative"] as Role[]).map((role) => <button key={role} onClick={() => { addPath(role); setRoleOpen(false); }}>{role}<small>{role === "Dream" ? "Track on your dashboard" : role === "Target" ? "Leading realistic option" : "Keep as a backup"}</small></button>)}{pathwayRole && <button className="remove-role" onClick={() => { removePath(); setRoleOpen(false); }}><X size={14} /> Remove from pathway<small>Remove this university from your shortlist</small></button>}</div>}</div></div>
    </section>
    <nav className="card university-profile-tabs" aria-label="University information sections">{([["overview", "Overview"], ["programmes", "Business programmes"], ["admissions", "Admissions & costs"], ["rankings", "Rankings & sources"]] as const).map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>
    <aside className="data-quality-action"><span className="data-quality-icon"><Flag size={15} /></span><span><strong>Help keep MyWay accurate</strong><small>Found outdated or incorrect information?</small></span><button onClick={reportIncorrect}>Report incorrect information</button></aside>
    <div className="detail-grid university-profile-grid">
      <main>
        {tab === "overview" && <>
          <article className="card detail-section"><div className="section-head"><div><span className="section-label">University overview</span><h3>Institution and study information</h3></div><span className="university-route-count">{isBachelor ? "1 programme route" : routeLabel}</span></div><div className="overview-grid university-overview-grid"><div><MapPin /><span><small>Location</small><strong>{school.location}</strong></span></div><div><BriefcaseBusiness /><span><small>Institution type</small><strong>{school.institutionType === "business-school" ? "Business school" : "University"}</strong></span></div><div><Languages /><span><small>Teaching language</small><strong>{study.language || program?.language || "Not yet verified"}</strong></span></div><div><ExternalLink /><span><small>Official domain</small><strong>{school.domain}</strong></span></div></div></article>
          <article className="card detail-section"><span className="section-label">Business study coverage</span><h3>Listed study areas</h3><p className="university-section-intro">These areas are recorded from the linked programme source. Confirm the current curriculum on the official page before making a decision.</p><div className="curriculum-tags university-area-tags">{areas.map((item) => <span key={item}>{item}</span>)}</div>{study.note && <p className="school-route-note">{study.note}</p>}</article>
          <article className="card detail-section university-next-step"><span><span className="section-label">Next decision</span><h3>Review the undergraduate route</h3><p>Check programme structure first, then confirm admissions, costs and deadlines before adding it to your application pathway.</p></span><button className="outline-button" onClick={() => setTab("programmes")}>View programme <ChevronRight size={14} /></button></article>
        </>}
        {tab === "programmes" && <>
          <article className="card detail-section"><div className="section-head"><div><span className="section-label">Business programmes</span><h3>Undergraduate route</h3></div><span className="verified"><CircleAlert size={13} /> Must verify before applying</span></div><article className="university-programme-card"><div><GraduationCap size={19} /><span><strong>{program?.title ?? study.title}</strong><small>{school.name}</small></span></div><div className="university-programme-facts"><span><small>Duration</small><strong>{study.duration || program?.duration.split(" · ")[0] || "Not yet verified"}</strong></span><span><small>Credits</small><strong>{study.credits || program?.duration.split(" · ")[1] || "Not yet verified"}</strong></span><span><small>Language</small><strong>{study.language || program?.language || "Not yet verified"}</strong></span><span><small>Entry</small><strong>{program?.entry ?? "Not yet verified for your application"}</strong></span></div><a className="text-link" href={program?.sources[0]?.href ?? study.source} target="_blank" rel="noreferrer">Official programme page <ExternalLink size={13} /></a></article></article>
          <article className="card detail-section"><span className="section-label">Programme evidence</span><h3>Information currently recorded</h3>{program ? <div className="evidence-table"><div><strong>Management</strong><span className="good-text">{program.management}</span></div><div><strong>Entrepreneurship</strong><span>{program.enterprise}</span></div><div><strong>Marketing</strong><span>{program.marketing}</span></div><div><strong>Quantitative course load</strong><span className={program.math.includes("high") ? "amber-text" : ""}>{program.math}</span></div><div><strong>Exchange, internships, career</strong><span>{program.experience}</span></div></div> : <div className="evidence-table"><div><strong>Study access</strong><span>{routeLabel}</span></div><div><strong>Business areas</strong><span>{study.areas.join(" · ")}</span></div><div><strong>Quantitative course load</strong><span>Not yet verified</span></div><div><strong>Exchange, internships, career</strong><span>Not yet verified</span></div></div>}</article>
        </>}
        {tab === "admissions" && <>
          <article className="card detail-section admissions-panel">
            <div className="admissions-panel-heading"><div><span className="section-label">Admissions & costs</span><h3>Fees and application details</h3></div><p>Figures and dates depend on the intake and your applicant category.</p></div>
            <>{factsError && <div className="admissions-load-error" role="alert"><p>Admissions data could not be loaded. This is a connection issue, not a verification result.</p><button className="outline-button" onClick={() => { setFacts(null); setFactsError(false); setFactsAttempt(value => value + 1); }}>Retry loading</button></div>}</><div className="admissions-fact-list">{(["tuition", "application_deadline", "entry_requirement"] as const).map((key) => {
              const fact = factFor(key);
              const href = fact?.source_url?.startsWith("https://") ? fact.source_url : null;
              const programmePage = href && [program?.sources[0]?.href, study.source].some((url) => url?.replace(/\/$/, "").toLowerCase() === href.replace(/\/$/, "").toLowerCase());
              const sourceLabel = programmePage ? "Programme page" : "Official source";
              const status = factsError ? "error" : facts === null ? "loading" : fact?.status === "verified" ? "verified" : fact?.status === "not_published" ? "unpublished" : "pending";
              const value = factsError ? "Source record unavailable" : facts === null ? "Loading source record…" : factValue(fact);
              const points = !factsError && facts !== null && fact?.status !== "not_published" ? value.split(/(?:;\s*|\n+|[•]\s*|(?<=[.!?])\s+(?=[A-Z]))/).map((point) => point.trim()).filter(Boolean) : [];
              const Icon = key === "tuition" ? CreditCard : key === "application_deadline" ? CalendarDays : ClipboardCheck;
              return <div key={key} className={`admissions-fact-card admissions-${key} admissions-${status}`}>
                <div className="admissions-fact-top"><div className="admissions-fact-label"><span className="admissions-fact-icon"><Icon size={15} strokeWidth={1.6} /></span><h4>{publicFactLabels[key]}</h4></div><span className={`admissions-fact-status ${status}`}>{status === "verified" ? <><CircleCheck size={13} /> Verified</> : status === "unpublished" ? "Not published" : status === "loading" ? "Loading" : status === "error" ? "Connection error" : "Incomplete verification"}</span></div>
                <div className="admissions-fact-copy">{status === "pending" && <p className="admissions-verification-note">Partial source findings. Confirm the unresolved conditions below before relying on this record.</p>}{points.length ? <ul className="admissions-fact-points">{points.map((point, index) => <li key={index}>{point}</li>)}</ul> : <p>{value}</p>}{fact && (fact.academic_year || fact.applicant_context) && <small>{[fact.academic_year, fact.applicant_context].filter(Boolean).join(" · ")}</small>}</div>
                {href && <a className="admissions-fact-source" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open official ${publicFactLabels[key].toLowerCase()} source for ${school.name}`}><span>{sourceLabel}</span><ExternalLink size={15}/></a>}
              </div>;
            })}</div>
            <p className="admissions-panel-note"><CircleHelp size={14} /> Confirm the latest details on the linked official page before applying.</p>
          </article>
          <article className="card detail-section caution-list admissions-open-questions"><span className="section-label">Planning notes</span><h3>Before you apply</h3>{openQuestions.map((item) => <div key={item}><CircleAlert size={16} /><span>{item}</span></div>)}{facts !== null && factFor("application_deadline")?.status !== "verified" && <div><CircleAlert size={16} /><span>Confirm the deadline for your intake and applicant category.</span></div>}</article>
          <article className="card detail-section university-next-step admissions-official-confirmation"><span><span className="section-label">Official confirmation</span><h3>Ready to check the full programme?</h3><p>The institution’s page has the final requirements and application instructions.</p></span><a className="outline-button" href={program?.sources[0]?.href ?? study.source} target="_blank" rel="noreferrer">Programme page <ExternalLink size={13} /></a></article>
        </>}
        {tab === "rankings" && <>
          <article className="card detail-section"><div className="section-head"><div><span className="section-label">Programme ranking evidence</span><h3>Positions, assessments and scope</h3></div><span className="university-route-count">{factsError ? "Connection error" : facts === null ? "Loading" : programmeRanking?.status === "verified" ? "Evidence checked" : programmeRanking?.applicant_context?.startsWith("Ranking review completed") ? "Reviewed · position unverified" : "Not yet verified"}</span></div>
            {factsError ? <div className="admissions-load-error" role="alert"><p>Ranking data could not be loaded. Please retry.</p><button className="outline-button" onClick={() => { setFacts(null); setFactsError(false); setFactsAttempt(value => value + 1); }}>Retry loading</button></div> : facts === null ? <p role="status">Loading source record…</p> : <><div className="programme-ranking-findings">{factValue(programmeRanking).split("\n").filter(Boolean).map((point, index) => <p key={index}>{point}</p>)}</div>{programmeRanking && <p className="university-section-intro">{[programmeRanking.academic_year, programmeRanking.applicant_context, programmeRanking.verified_on ? `Checked ${programmeRanking.verified_on}` : null].filter(Boolean).join(" · ")}</p>}{programmeRankingSource && <a className="text-link" href={programmeRankingSource} target="_blank" rel="noopener noreferrer">Ranking evidence source <ExternalLink size={13} /></a>}</>}
            <div className="source-warning"><CircleHelp size={16} /><p>Evidence can describe a position, an indicator assessment or an exclusion. An unverified position does not mean a programme is unranked.</p></div>
          </article>
          <article className="card detail-section"><div className="section-head"><div><span className="section-label">Institution rankings</span><h3>Separate sources and methodologies</h3><p>These rankings describe institutions or subject areas. They do not verify this bachelor programme’s ranking.</p></div><span className="university-route-count">{verifiedRankings.length} sourced results</span></div>{verifiedRankings.length ? <div className="ranking-profile-list">{verifiedRankings.map((ranking) => <a key={`${ranking.publisher}-${ranking.title}-${ranking.year}`} href={ranking.href} target="_blank" rel="noreferrer"><span className="ranking-publisher">{ranking.publisher}</span><span><strong>{ranking.title}</strong><small>{ranking.year} · {ranking.scope}</small><small>Ranked entity: {ranking.rankedEntity}{ranking.verifiedOn ? ` · Checked ${ranking.verifiedOn}` : ""}</small></span><em>{ranking.rank}</em><ExternalLink size={13} /></a>)}</div> : <div className="university-empty-state"><Trophy size={20} /><span><strong>No ranking position verified</strong><small>MyWay will not estimate or invent a position.</small></span></div>}<div className="source-warning"><CircleHelp size={16} /><p>Ranking systems measure different entities and outcomes. MyWay displays them separately and never averages them.</p></div></article>
          <article className="card detail-section"><span className="section-label">Official sources</span><h3>Institution and programme evidence</h3><div className="source-list">{(program?.sources ?? [{ label: study.sourceLabel, href: study.source }]).map((source) => <a key={source.href} href={source.href} target="_blank" rel="noreferrer"><ExternalLink size={15} /><span>{source.label}</span><ChevronRight size={15} /></a>)}{school.identitySource && <a href={school.identitySource} target="_blank" rel="noreferrer"><ExternalLink size={15} /><span>Official institution identity</span><ChevronRight size={15} /></a>}</div></article>
        </>}
      </main>
      <aside>
        <article className="fit-panel"><span className="section-label light">Your program fit</span><strong>{fitResult.score === null ? "—" : fitResult.score}<small>/100</small></strong><div className="fit-bar"><i style={{ width: (fitResult.score ?? 0) + "%" }} /></div><h3>{fitResult.label}</h3><p>{fitResult.score === null ? "Complete your study preferences to calculate a personal match." : `${fitResult.confidence}% of the matching model currently has usable evidence. This is not admission probability.`}</p></article>
        {fitResult.score === null ? <article className="card detail-section complete-profile-card"><span className="section-label">Personal matching</span><h3>Complete your preferences</h3><p>Add business interests, study locations, language and practical limits to calculate a transparent fit score.</p></article> : <><article className="card detail-section why-list"><span className="section-label">Why it matches</span>{fitResult.reasons.map((item) => <div key={item}><CircleCheck size={16} /><span>{item}</span></div>)}</article>{fitResult.breakdown.length > 0 && <article className="card detail-section fit-breakdown"><span className="section-label">Match breakdown</span>{fitResult.breakdown.map((item) => <div key={item.label}><span><strong>{item.label}</strong><small>{item.note}</small></span><em>{item.score}/100</em></div>)}</article>}</>}
        <article className="card readiness"><span className="section-label">Application readiness</span><strong>{pathwayRole ? `${readinessScore ?? 0}% prepared` : "Not in your pathway"}</strong><p>{pathwayRole ? "Based on this university’s own requirements, records, evidence and completed actions." : "Add this bachelor programme as Dream, Target or Alternative to begin its separate tracker."}</p></article>
      </aside>
    </div>
  </div>;
}

function ProgramDetail({ p, close, saved, toggleSaved, compared, toggleCompare, pathwayRole, addPath, removePath, fitResult, readinessScore, reportIncorrect }: { p: Program; close: () => void; saved: boolean; toggleSaved: () => void; compared: boolean; toggleCompare: () => void; pathwayRole?: Role; addPath: (role: Role) => void; removePath: () => void; fitResult: FitResult; readinessScore?: number; reportIncorrect: () => void }) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [duration, credits] = p.duration.split(" · ");
  return <div className="page-enter detail-page">
    <button className="back-button" onClick={close}><ChevronLeft size={17} /> Back to programs</button>
    <section className="card detail-hero">
      <UniversityLogo program={p} size="large" /><div><span className="verified"><CircleCheck size={14} /> Source checked {p.verified}</span><h2>{p.university}</h2><p>{p.title} · {p.location}</p></div>
      <div className="detail-hero-actions"><button className={"outline-button " + (saved ? "selected" : "")} onClick={toggleSaved}><Bookmark size={15} /> {saved ? "Saved" : "Save"}</button><button className={"outline-button " + (compared ? "selected" : "")} onClick={toggleCompare}><Scale size={15} /> Compare</button><div className="role-menu"><button className="primary-button" onClick={() => setRoleOpen(!roleOpen)}>{pathwayRole ? <Check size={15} /> : <Plus size={15} />} {pathwayRole ?? "Add to pathway"} <ChevronDown size={14} /></button>{roleOpen && <div>{(["Dream", "Target", "Alternative"] as Role[]).map((r) => <button key={r} onClick={() => { addPath(r); setRoleOpen(false); }}>{r}<small>{r === "Dream" ? "Track on your dashboard" : r === "Target" ? "Leading realistic option" : "Keep as a backup"}</small></button>)}{pathwayRole && <button className="remove-role" onClick={() => { removePath(); setRoleOpen(false); }}><X size={14} /> Remove from pathway<small>Remove this university from your shortlist</small></button>}</div>}</div></div>
    </section>
    <aside className="data-quality-action"><span className="data-quality-icon"><Flag size={15} /></span><span><strong>Help keep MyWay accurate</strong><small>Found outdated or incorrect information?</small></span><button onClick={reportIncorrect}>Report incorrect information</button></aside>
    <div className="detail-grid">
      <main>
        <article className="card detail-section"><div className="section-head"><div><span className="section-label">Program overview</span><h3>What the official sources say</h3></div><span className={"fit " + fitResultClass(fitResult)}>{fitResult.score === null ? "Complete profile" : `${fitResult.score}/100 fit`}</span></div><div className="overview-grid"><div><Clock3 /><span><small>Duration</small><strong>{duration}</strong></span></div><div><GraduationCap /><span><small>Credits</small><strong>{credits || "Not yet verified"}</strong></span></div><div><Languages /><span><small>Language</small><strong>{p.language}</strong></span></div><div><GraduationCap /><span><small>Entry structure</small><strong>{p.entry}</strong></span></div></div></article>
        <article className="card detail-section"><span className="section-label">Curriculum and fit</span><h3>Evidence by preference</h3><div className="evidence-table"><div><strong>Management</strong><span className="good-text">{p.management}</span></div><div><strong>Entrepreneurship</strong><span>{p.enterprise}</span></div><div><strong>Marketing</strong><span>{p.marketing}</span></div><div><strong>Quantitative course load</strong><span className={p.math.includes("high") ? "amber-text" : ""}>{p.math}</span></div><div><strong>Exchange, internships, career</strong><span>{p.experience}</span></div></div><div className="curriculum-tags">{p.curriculum.map((item) => <span key={item}>{item}</span>)}</div></article>
        <article className="card detail-section"><span className="section-label">Official sources</span><h3>Verify before applying</h3><div className="source-list">{p.sources.map((s) => <a key={s.href} href={s.href} target="_blank" rel="noreferrer"><ExternalLink size={15} /><span>{s.label}</span><ChevronRight size={15} /></a>)}</div><div className="source-warning"><CircleHelp size={16} /><p>Program information can change. Confirm requirements, dates and fees on the official page before applying.</p></div></article>
      </main>
      <aside>
        <article className="fit-panel"><span className="section-label light">Your program fit</span><strong>{fitResult.score === null ? "—" : fitResult.score}<small>/100</small></strong><div className="fit-bar"><i style={{ width: (fitResult.score ?? 0) + "%" }} /></div><h3>{fitResult.label}</h3><p>{fitResult.score === null ? "Complete your study preferences to calculate a personal match." : `${fitResult.confidence}% of the matching model currently has usable evidence. This is not admission probability.`}</p></article>
        <article className="card detail-section why-list"><span className="section-label">Why it matches</span>{fitResult.reasons.map((item) => <div key={item}><CircleCheck size={16} /><span>{item}</span></div>)}</article>
        {fitResult.breakdown.length > 0 && <article className="card detail-section fit-breakdown"><span className="section-label">Match breakdown</span>{fitResult.breakdown.map((item) => <div key={item.label}><span><strong>{item.label}</strong><small>{item.note}</small></span><em>{item.score}/100</em></div>)}</article>}
        <article className="card detail-section caution-list"><span className="section-label">Open questions</span>{p.caution.map((item) => <div key={item}><CircleAlert size={16} /><span>{item}</span></div>)}</article>
        <article className="card readiness"><span className="section-label">Application readiness</span><strong>{pathwayRole ? `${readinessScore ?? 0}% prepared` : "Not in your pathway"}</strong><p>{pathwayRole ? "Based on this university’s own requirements, records, evidence and completed actions." : "Add this programme as Dream, Target or Alternative to begin its separate tracker."}</p></article>
      </aside>
    </div>
  </div>;
}

const feedbackChoices: { id: FeedbackCategory; icon: typeof Bug; title: string; description: string }[] = [
  { id: "bug", icon: Bug, title: "Something is not working", description: "For bugs, broken buttons, loading problems, or unexpected behavior." },
  { id: "incorrect", icon: CircleAlert, title: "Information looks incorrect", description: "For incorrect university, programme, tuition, deadline, ranking, requirement, logo, or other factual information." },
  { id: "suggestion", icon: Lightbulb, title: "Suggestion or feedback", description: "For ideas, feature requests, or general comments." },
];

function FeedbackModal({ initialCategory, context, close }: { initialCategory?: FeedbackCategory; context: FeedbackContext; close: () => void }) {
  const [category, setCategory] = useState<FeedbackCategory | undefined>(initialCategory);
  const dialogRef = useDialogFocus(close);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category) return;
    setSending(true); setError("");
    const form = new FormData(event.currentTarget);
    form.set("category", category);
    form.set("pageUrl", publicMyWayUrl(window.location.origin + window.location.pathname));
    form.set("university", context.university ?? "");
    form.set("programme", context.programme ?? "");
    form.set("locale", document.documentElement.lang || navigator.language);
    form.set("userAgent", navigator.userAgent);
    form.set("viewport", `${window.innerWidth} by ${window.innerHeight}`);
    try {
      const response = await fetch("/api/feedback", { method: "POST", body: form, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error("submit");
      setSuccess(true);
    } catch {
      setError("Feedback could not be submitted. Please try again.");
    } finally { setSending(false); }
  };
  return <div ref={dialogRef as React.RefObject<HTMLDivElement>} tabIndex={-1} className="modal-backdrop feedback-backdrop" role="dialog" aria-modal="true" aria-labelledby="feedback-title" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <section className="feedback-modal page-enter">
      <header><div><h2 id="feedback-title">Send feedback</h2><p>Help us improve MyWay. Tell us if something is not working, unclear, or inaccurate.</p></div><button className="icon-button" onClick={close} aria-label="Close"><X size={18} /></button></header>
      {success ? <div className="feedback-success"><CircleCheck size={38} /><h3>Thanks. Your feedback was received. We will review it and use it to improve MyWay.</h3><button className="primary-button" onClick={close}>Close</button></div> : !category ? <div className="feedback-choices">{feedbackChoices.map(({ id, icon: Icon, title, description }) => <button key={id} type="button" onClick={() => setCategory(id)}><Icon size={18} /><span><strong>{title}</strong><small>{description}</small></span><ChevronRight size={16} /></button>)}</div> : <form onSubmit={submit}>
        <button type="button" className="feedback-back" onClick={() => setCategory(undefined)}><ChevronLeft size={14} /> Back to feedback types</button>
        <div className="feedback-selected"><strong>{feedbackChoices.find((item) => item.id === category)?.title}</strong></div>
        {category === "bug" && <div className="feedback-fields"><label><span>What happened?</span><textarea name="details" required rows={3} /></label><label><span>What did you expect to happen?</span><textarea name="expected" required rows={3} /></label><label><span>Page or feature</span><input name="pageFeature" required /></label></div>}
        {category === "incorrect" && <div className="feedback-fields"><label><span>What information looks wrong?</span><textarea name="details" required rows={3} /></label><label><span>Category</span><select name="informationCategory" required defaultValue=""><option value="" disabled>Select a category</option>{["Programme", "Tuition", "Deadline", "Entry requirement", "Ranking", "University details", "Logo", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>What should we review?</span><textarea name="reviewRequest" required rows={3} /></label><label><span>Optional source or reference link</span><input name="sourceUrl" type="url" inputMode="url" /></label></div>}
        {category === "suggestion" && <div className="feedback-fields"><label><span>What would you like to tell us?</span><textarea name="details" required rows={5} /></label></div>}
        <label className="feedback-upload"><Camera size={16} /><span><strong>Optional screenshot</strong><small>PNG, JPG, or WEBP up to 8 MB</small></span><input name="screenshot" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setScreenshotName(event.currentTarget.files?.[0]?.name ?? "")} /><em>{screenshotName || "Choose screenshot"}</em></label>
        <fieldset className="feedback-contact"><legend>Contact details</legend><div><label><span>Name</span><small>Optional</small><input name="name" autoComplete="name" /></label><label><span>Email</span><small>Optional, only if they want a reply</small><input name="email" type="email" autoComplete="email" /></label></div><label className="feedback-consent"><input name="mayContact" value="true" type="checkbox" /><span>You can contact me about this feedback</span></label></fieldset>
        {context.university && <p className="feedback-context"><CircleCheck size={13} /> Context attached for {context.programme || context.university}</p>}
        {error && <p className="feedback-error" role="alert">{error}</p>}
        <button className="primary-button feedback-submit" disabled={sending}>{sending ? "Submitting feedback" : "Submit feedback"}</button>
      </form>}
    </section>
  </div>;
}

function ComparePanel({ ids, close, remove, open }: { ids: string[]; close: () => void; remove: (id: string) => void; open: (school: BusinessSchool) => void }) {
  const items = undergraduateBusinessSchools.filter((school) => ids.includes(school.id));
  const dialogRef = useDialogFocus(close);
  const rows: [string, (school: BusinessSchool) => string][] = [
    ["Study access", () => "Undergraduate route"],
    ["Current route", (school) => schoolStudy(school).title],
    ["Length and credits", (school) => [schoolStudy(school).duration, schoolStudy(school).credits].filter(Boolean).join(" · ") || "Not applicable"],
    ["Language", (school) => schoolStudy(school).language || "Not applicable"],
    ["Business areas", (school) => schoolStudy(school).areas.join(" · ")],
    ["Rankings", (school) => schoolRankings(school).filter((r) => r.status === "verified").map((r) => `${r.publisher} ${r.year} · ${r.title} · ${r.rank}`).join("; ") || "Not yet verified"],
  ];
  return <div ref={dialogRef as React.RefObject<HTMLDivElement>} tabIndex={-1} className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="compare-title"><section className="compare-modal page-enter"><header><div><span className="eyebrow">Side-by-side evidence</span><h2 id="compare-title">Compare universities</h2><p>{items.length} of 4 selected</p></div><button className="icon-button" onClick={close} aria-label="Close comparison"><X /></button></header>{items.length ? <div className="compare-scroll"><div className="compare-grid" style={{ gridTemplateColumns: "170px repeat(" + items.length + ", minmax(210px, 1fr))" }}><strong className="compare-label">University</strong>{items.map((school) => { const program = school.programId ? programs.find((item) => item.id === school.programId) : undefined; return <article key={school.id}><button className="remove-x" onClick={() => remove(school.id)} aria-label={`Remove ${school.name} from comparison`}><X size={13} /></button><SchoolLogo school={school} program={program} /><strong>{school.name}</strong><small>{school.location}</small><button className="text-link" onClick={() => { open(school); close(); }}>View</button></article>; })}{rows.flatMap(([label, value]) => [<strong className="compare-label" key={label}>{label}</strong>, ...items.map((school) => <span className="compare-value" key={label + school.id}>{value(school)}</span>)])}</div></div> : <div className="empty"><Scale /><h3>Select universities to compare</h3></div>}<footer><p><CircleHelp size={14} /> Comparison uses official study pages and keeps ranking methodologies separate.</p><button className="primary-button" onClick={close}>Done</button></footer></section></div>;
}

type Routine = { id: string; title: string; focus: string; weeklyGoal: number; minutes: number };

type TaskGuide = { source: string; sourceDetail: string; outcome: string; steps: string[]; materials: string[]; doneWhen: string[] };

const initialRoutines: Routine[] = [
  { id: "english-plan", title: "English qualification practice", focus: "Finish one timed 20-minute session and record the result by Sunday", weeklyGoal: 3, minutes: 20 },
  { id: "programme-research", title: "Programme research", focus: "Verify one missing requirement for one Pathway university from its official source", weeklyGoal: 2, minutes: 20 },
  { id: "academic-preparation", title: "Academic preparation", focus: "Complete five questions from your largest verified academic gap", weeklyGoal: 2, minutes: 30 },
  { id: "pathway-review", title: "Weekly pathway review", focus: "Review Dream, Target and Alternative choices, then set one dated next action", weeklyGoal: 1, minutes: 25 },
];

const previousRoutineFocus: Record<string, string> = {
  "english-plan": "Practise the skill required by your chosen test",
  "programme-research": "Verify one requirement using an official source",
  "academic-preparation": "Strengthen one subject connected to your applications",
  "pathway-review": "Review university choices and next requirements",
};

function migrateStoredRoutines(stored: Routine[]) {
  return stored.map((routine) => {
    const currentDefault = initialRoutines.find((item) => item.id === routine.id);
    if (!currentDefault || routine.focus !== previousRoutineFocus[routine.id]) return routine;
    return { ...routine, focus: currentDefault.focus };
  });
}

const taskGuides: Record<string, TaskGuide> = {
  "english-plan": { source: "Profile · English qualification", sourceDetail: "Use the test and score recorded in your profile. If no test is chosen yet, compare accepted tests before practising.", outcome: "Complete one focused English session that supports your current qualification plan.", steps: ["Choose the skill required by your test plan", "Complete one timed practice activity", "Check the result against the official scoring method", "Record one improvement for the next session"], materials: ["Official test format", "Practice material", "Notebook or notes app"], doneWhen: ["One complete practice activity is finished", "The result is reviewed", "One next step is recorded"] },
  "programme-research": { source: "Pathway · Official requirements", sourceDetail: "Suggested to keep programme facts, requirements and deadlines tied to current official sources.", outcome: "Verify one application fact and record it in the correct university workspace.", steps: ["Open one application in Pathway", "Choose a missing requirement", "Check the official university source", "Record the fact and source date"], materials: ["My Pathway", "Official university page", "Application notes"], doneWhen: ["One fact is verified", "The value is recorded", "The next unresolved question is clear"] },
  "academic-preparation": { source: "Pathway · Academic gaps", sourceDetail: "Suggested from the subjects and quantitative requirements attached to your shortlisted programmes.", outcome: "Finish one focused academic session connected to a real programme requirement.", steps: ["Choose one relevant subject", "Review one worked example or concept", "Complete a short practice set", "Record any remaining gap"], materials: ["Course material", "Practice set", "Notes"], doneWhen: ["The planned practice is complete", "Mistakes are reviewed", "The next topic is identified"] },
  "pathway-review": { source: "My Pathway · Weekly planning", sourceDetail: "Suggested to keep your university choices, requirements, and next decisions current.", outcome: "Leave your pathway with one verified update and one clear next action.", steps: ["Open your current target university", "Check one requirement or deadline", "Update the pathway if anything changed", "Choose next week’s highest-value action"], materials: ["My Pathway", "Official university page", "Application notes"], doneWhen: ["One fact is verified", "Your next action is clear", "Any outdated note is corrected"] },
};

function TaskWorkspace({ routine, isDone, close, toggleTask }: { routine: Routine; isDone: boolean; close: () => void; toggleTask: (id: string) => void }) {
  const guide = taskGuides[routine.id] || { source: "Your routine · Personal target", sourceDetail: "Added from a target you chose for this week.", outcome: routine.focus, steps: ["Prepare what you need", "Complete one focused session", "Review what improved", "Save the next step"], materials: ["Your notes", "A quiet workspace", "Timer"], doneWhen: ["The planned session is complete", "The result is saved", "The next step is clear"] };
  const [secondsLeft, setSecondsLeft] = useState(routine.minutes * 60);
  const [running, setRunning] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
      if (secondsLeft <= 1) setRunning(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [running, secondsLeft]);
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return <div className="page-enter task-workspace"><button className="back-button" onClick={close}><ChevronLeft size={17} /> Back to weekly actions</button><section className="task-workspace-head"><div><span className="eyebrow">Focused task</span><h2>{routine.title}</h2><p>{routine.focus}</p><span className="task-source"><Sparkles size={14} /> {guide.source}</span></div><button className={isDone ? "outline-button selected" : "primary-button"} onClick={() => toggleTask(routine.id)}>{isDone ? <><CircleCheck size={16} /> Completed</> : <><Check size={16} /> Mark complete</>}</button></section><div className="task-workspace-grid"><main><article className="card task-guide-card"><span className="section-label">Your outcome</span><h3>{guide.outcome}</h3><p>{guide.sourceDetail}</p></article><article className="card task-guide-card"><div className="section-head"><div><span className="section-label">Do this now</span><h3>Step-by-step session</h3></div><span className="today-count">{checkedSteps.length} of {guide.steps.length}</span></div><div className="task-step-list">{guide.steps.map((step, index) => { const checked = checkedSteps.includes(index); return <button key={step} className={checked ? "checked" : ""} onClick={() => setCheckedSteps((current) => checked ? current.filter((item) => item !== index) : [...current, index])}><span>{checked ? <Check size={15} /> : index + 1}</span><strong>{step}</strong></button>; })}</div></article><div className="task-info-grid"><article className="card task-guide-card"><span className="section-label">What you need</span><ul>{guide.materials.map((item) => <li key={item}><CircleCheck size={15} /> {item}</li>)}</ul></article><article className="card task-guide-card"><span className="section-label">Done when</span><ul>{guide.doneWhen.map((item) => <li key={item}><Target size={15} /> {item}</li>)}</ul></article></div></main><aside className="card task-timer-card"><span className="section-label">Focus timer</span><div className="task-timer-ring"><strong>{minutes}:{seconds}</strong><small>{routine.minutes} minute session</small></div><button className="primary-button" onClick={() => setRunning((current) => !current)}>{running ? "Pause timer" : secondsLeft === 0 ? "Session finished" : "Start timer"}</button><button className="text-link" onClick={() => { setRunning(false); setSecondsLeft(routine.minutes * 60); }}>Reset</button><div className="task-related"><small>Connected to</small><strong>{guide.source}</strong><p>This link explains why the task appears in your week.</p></div></aside></div></div>;
}

const habitSeed: Record<string, number[]> = {};

function TasksHabits({ completed, toggleTask, toast }: { completed: string[]; toggleTask: (v: string) => void; toast: (s: string) => void }) {
  const [tab, setTab] = useState<"actions" | "habits">("actions");
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [habitChecks, setHabitChecks] = useState<Record<string, number[]>>(habitSeed);
  const [routineDataLoaded, setRoutineDataLoaded] = useState(false);
  const [periodMode, setPeriodMode] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTarget, setNewTarget] = useState({ title: "", focus: "", weeklyGoal: 2 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", focus: "", weeklyGoal: 1 });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const stored = JSON.parse(window.localStorage.getItem("myway-routines") || "null"); if (Array.isArray(stored) && stored.length) setRoutines(migrateStoredRoutines(stored)); } catch {}
      try { const stored = JSON.parse(window.localStorage.getItem("myway-habit-checks") || "null"); if (stored && typeof stored === "object") setHabitChecks(stored); } catch {}
      setRoutineDataLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (routineDataLoaded) window.localStorage.setItem("myway-routines", JSON.stringify(routines)); }, [routineDataLoaded, routines]);
  useEffect(() => { if (routineDataLoaded) window.localStorage.setItem("myway-habit-checks", JSON.stringify(habitChecks)); }, [routineDataLoaded, habitChecks]);
  const done = routines.filter((routine) => completed.includes(routine.id)).length;
  const today = new Date();
  const currentMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const shownMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const shownYear = shownMonth.getFullYear();
  const shownMonthIndex = shownMonth.getMonth();
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(shownMonth);
  const daysInMonth = new Date(shownYear, shownMonthIndex + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, index) => new Date(shownYear, shownMonthIndex, index + 1));
  const shownWeekStart = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + weekOffset * 7);
  const weekDates = Array.from({ length: 7 }, (_, index) => new Date(shownWeekStart.getFullYear(), shownWeekStart.getMonth(), shownWeekStart.getDate() + index));
  const shownWeekEnd = weekDates[6];
  const weekLabel = `${new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(shownWeekStart)} – ${new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(shownWeekEnd)}`;
  const periodDates = periodMode === "week" ? weekDates : monthDates;
  const periodLabel = periodMode === "week" ? weekLabel : monthLabel;

  const dateKey = (date: Date, habitId: string) => `${date.getFullYear()}-${date.getMonth()}-${habitId}`;
  const isChecked = (habitId: string, date: Date) => (habitChecks[dateKey(date, habitId)] || []).includes(date.getDate());
  const countChecks = (habitId: string, dates: Date[]) => dates.filter((date) => isChecked(habitId, date)).length;
  const currentWeekDates = Array.from({ length: 7 }, (_, index) => new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + index));
  const currentHabitSessions = routines.reduce((total, routine) => total + countChecks(routine.id, currentWeekDates), 0);
  const currentHabitGoal = routines.reduce((total, routine) => total + routine.weeklyGoal, 0);
  const executionTotal = routines.length + currentHabitGoal;
  const executionProgress = executionTotal ? Math.round(((done + Math.min(currentHabitSessions, currentHabitGoal)) / executionTotal) * 100) : 0;
  const activeDays = currentWeekDates.filter((date) => routines.some((routine) => isChecked(routine.id, date))).length;
  const needsAttention = [...routines].sort((a, b) => (countChecks(a.id, currentWeekDates) / a.weeklyGoal) - (countChecks(b.id, currentWeekDates) / b.weeklyGoal))[0];
  const actionStatus = executionProgress >= 100 ? "Ahead of plan" : executionProgress >= 55 ? "On track" : executionProgress > 0 ? "Building rhythm" : "Ready to begin";
  const periodCompletions = routines.reduce((total, routine) => total + countChecks(routine.id, periodDates), 0);

  const toggleHabit = (habitId: string, date: Date) => {
    const key = dateKey(date, habitId);
    const day = date.getDate();
    setHabitChecks((current) => {
      const checked = current[key] || [];
      return { ...current, [key]: checked.includes(day) ? checked.filter((item) => item !== day) : [...checked, day].sort((a, b) => a - b) };
    });
  };
  const movePeriod = (direction: number) => periodMode === "week" ? setWeekOffset((current) => current + direction) : setMonthOffset((current) => current + direction);
  const finishSwipe = (end: number) => {
    if (touchStart === null) return;
    const distance = end - touchStart;
    if (Math.abs(distance) > 55) movePeriod(distance < 0 ? 1 : -1);
    setTouchStart(null);
  };
  const addTarget = () => {
    const title = newTarget.title.trim();
    const focus = newTarget.focus.trim();
    if (!title || !focus) return;
    setRoutines((current) => [...current, { id: `routine-${Date.now()}`, title, focus, weeklyGoal: Math.max(1, newTarget.weeklyGoal), minutes: 20 }]);
    setNewTarget({ title: "", focus: "", weeklyGoal: 2 });
    setAdding(false);
    toast("New target added to your routine");
  };
  const startEditing = (routine: Routine) => {
    setEditingId(routine.id);
    setEditDraft({ title: routine.title, focus: routine.focus, weeklyGoal: routine.weeklyGoal });
  };
  const saveRoutine = () => {
    if (!editingId || !editDraft.title.trim() || !editDraft.focus.trim()) return;
    setRoutines((current) => current.map((routine) => routine.id === editingId ? { ...routine, title: editDraft.title.trim(), focus: editDraft.focus.trim(), weeklyGoal: Math.max(1, editDraft.weeklyGoal) } : routine));
    setEditingId(null);
    toast("Target updated");
  };
  const removeRoutine = (id: string) => {
    setRoutines((current) => current.filter((routine) => routine.id !== id));
    if (editingId === id) setEditingId(null);
    toast("Target removed");
  };

  const routineEditor = (routine: Routine) => editingId === routine.id ? <div className="routine-editor"><input value={editDraft.title} onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))} aria-label="Routine title" /><input value={editDraft.focus} onChange={(event) => setEditDraft((current) => ({ ...current, focus: event.target.value }))} aria-label="Routine description" /><label><span>Weekly target</span><input type="number" min="1" max="14" value={editDraft.weeklyGoal} onChange={(event) => setEditDraft((current) => ({ ...current, weeklyGoal: Number(event.target.value) || 1 }))} /></label><div><button className="primary-button compact" onClick={saveRoutine}>Save</button><button className="text-link" onClick={() => setEditingId(null)}>Cancel</button></div></div> : <><strong>{routine.title}</strong><small>{routine.focus}</small><em>{`${routine.minutes} min · ${routine.weeklyGoal}× weekly`}</em></>;

  const selectedTask = routines.find((routine) => routine.id === selectedTaskId);
  if (selectedTask) return <TaskWorkspace routine={selectedTask} isDone={completed.includes(selectedTask.id)} close={() => setSelectedTaskId(null)} toggleTask={toggleTask} />;

  return <div className="page-enter tasks-page" data-tour="tasks-main">
    <section className="page-intro tasks-intro"><div><span className="eyebrow">This week</span><h2>Tasks & Habits</h2><p>Set weekly targets, then build a routine around them.</p></div><button className="primary-button" onClick={() => setAdding(!adding)}><Plus size={15} /> Add target</button></section>
    {adding && <article className="card add-target-panel"><div><span className="section-label">New target</span><strong>Add a repeatable focus</strong></div><div className="target-fields"><input autoFocus value={newTarget.title} onChange={(event) => setNewTarget((current) => ({ ...current, title: event.target.value }))} placeholder="Target title" /><input value={newTarget.focus} onChange={(event) => setNewTarget((current) => ({ ...current, focus: event.target.value }))} onKeyDown={(event) => event.key === "Enter" && addTarget()} placeholder="What will you practise?" /><label><span>Times per week</span><input type="number" min="1" max="14" value={newTarget.weeklyGoal} onChange={(event) => setNewTarget((current) => ({ ...current, weeklyGoal: Number(event.target.value) || 1 }))} /></label></div><button className="primary-button" onClick={addTarget}>Add target</button><button className="text-link" onClick={() => setAdding(false)}>Cancel</button></article>}
    <div className="task-tabs" role="tablist" aria-label="Tasks and habits views"><button className={tab === "actions" ? "active" : ""} onClick={() => setTab("actions")}>Weekly actions</button><button className={tab === "habits" ? "active" : ""} onClick={() => setTab("habits")}>Habit tracker</button></div>
    {tab === "actions" ? <div className="tasks-layout">
      <article className="card weekly-actions-card"><div className="section-head"><div><span className="section-label">Your targets</span><h3>This week’s actions</h3></div><span className="today-count">{`${done} of ${routines.length} done`}</span></div><p className="tasks-helper">Each action has a clear target, source and completion check. Open it for the exact steps.</p><div className="weekly-action-list">{routines.map((routine) => { const isDone = completed.includes(routine.id); return <section key={routine.id} className={`weekly-action ${isDone ? "done" : ""}`}><button className="action-toggle" onClick={() => toggleTask(routine.id)} aria-label={`${isDone ? "Reopen" : "Complete"} ${routine.title}`}><span className={`task-check ${isDone ? "checked" : ""}`}>{isDone && <Check size={15} />}</span></button><div className="weekly-action-copy">{routineEditor(routine)}<span className="weekly-action-source">{taskGuides[routine.id]?.source || "Your routine · Personal target"}</span></div><span className="routine-row-actions"><button onClick={() => startEditing(routine)} aria-label={`Edit ${routine.title}`}><Settings2 size={14} /></button><button onClick={() => removeRoutine(routine.id)} aria-label={`Remove ${routine.title}`}><X size={14} /></button></span><button className="open-task-button" onClick={() => setSelectedTaskId(routine.id)}>{isDone ? "Review" : "Open"}<ChevronRight size={14} /></button></section>; })}</div></article>
      <aside className="card weekly-focus-card"><div className="focus-card-head"><span className="section-label">This week’s progress</span>{activeDays >= 3 && <span className="focus-fire"><Flame size={14} /> {`${activeDays} active days`}</span>}</div><div className="focus-readiness"><strong>{executionProgress}%</strong><span><b>{actionStatus}</b><small>{`${currentHabitSessions} routine check-ins`}</small></span></div><div className="focus-bar"><i style={{ width: `${executionProgress}%` }} /></div><div className="focus-detail"><small>Targets completed</small><strong>{`${done} of ${routines.length}`}</strong></div><div className="focus-detail"><small>Habit sessions</small><strong>{`${currentHabitSessions} of ${currentHabitGoal}`}</strong></div><div className="focus-detail"><small>Needs attention</small><strong>{needsAttention?.title || "Add a target"}</strong></div><p>{executionProgress >= 100 ? "You went beyond the plan. Keep the routine sustainable." : executionProgress >= 55 ? "You are moving at a healthy pace for this week." : "One small check-in today will move the week forward."}</p></aside>
    </div> : <article className="card habit-card" onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={(event) => finishSwipe(event.changedTouches[0].clientX)}><div className="habit-month-head"><div><span className="section-label">Repeatable routines</span><h3>Your rhythm</h3><p className="tasks-helper">Tap a date to check in. Use the arrows to move through weeks or months.</p></div><div className="habit-toolbar"><div className="period-toggle"><button className={periodMode === "week" ? "active" : ""} onClick={() => setPeriodMode("week")}>Week</button><button className={periodMode === "month" ? "active" : ""} onClick={() => setPeriodMode("month")}>Month</button></div><div className="month-controls"><button aria-label={`Previous ${periodMode}`} onClick={() => movePeriod(-1)}><ChevronLeft size={17} /></button><span>{periodLabel}</span><button aria-label={`Next ${periodMode}`} onClick={() => movePeriod(1)}><ChevronRight size={17} /></button></div></div></div><div className="habit-table-scroll"><div className={`habit-table ${periodMode}`}><div className="habit-table-row habit-table-header"><span>Routine and target</span><div className={`period-cells ${periodMode}`}>{periodDates.map((date) => <span key={date.toISOString()}>{periodMode === "week" ? <><b>{["M", "T", "W", "T", "F", "S", "S"][(date.getDay() + 6) % 7]}</b><small>{date.getDate()}</small></> : date.getDate()}</span>)}</div><span>Progress</span></div>{routines.map((routine) => { const checks = countChecks(routine.id, periodDates); const goal = periodMode === "week" ? routine.weeklyGoal : routine.weeklyGoal * 4; const isAhead = checks > goal; const isComplete = checks === goal; const onFire = checks >= Math.max(3, Math.ceil(goal * .65)); return <section className="habit-table-row" key={routine.id}><div className="monthly-habit-copy">{routineEditor(routine)}<span className="routine-row-actions"><button onClick={() => startEditing(routine)} aria-label={`Edit ${routine.title}`}><Settings2 size={14} /></button><button onClick={() => removeRoutine(routine.id)} aria-label={`Remove ${routine.title}`}><X size={14} /></button></span></div><div className={`period-cells ${periodMode}`} aria-label={`${routine.title} check-ins for ${periodLabel}`}>{periodDates.map((date) => { const checked = isChecked(routine.id, date); return <button key={date.toISOString()} className={checked ? "checked" : ""} aria-label={`${routine.title}, ${date.toLocaleDateString()}${checked ? ", complete" : ""}`} onClick={() => toggleHabit(routine.id, date)}>{checked ? <Check size={periodMode === "month" ? 10 : 15} /> : <span>{periodMode === "month" ? date.getDate() : ""}</span>}</button>; })}</div><div className="habit-progress"><strong>{checks}<span> / {goal}</span></strong>{isAhead ? <em className="ahead"><Sparkles size={12} /> Ahead</em> : isComplete ? <em className="complete"><CircleCheck size={12} /> Goal met</em> : onFire ? <em className="fire"><Flame size={12} /> On fire</em> : <em>{goal - checks} to goal</em>}</div></section>; })}</div></div><div className="habit-insight"><span className="mini-icon"><Sparkles size={16} /></span><span><strong>{periodCompletions ? `${periodCompletions} check-ins across this ${periodMode}` : `Start your ${periodMode} with one small session`}</strong><small>{periodCompletions ? "Your check-ins stay connected to the targets you chose above." : "A single check-in is enough to begin building the pattern."}</small></span></div></article>}
  </div>;
}

function PathwayChoice({ item, openProgram, changeRole, removePath }: { item: { p: Program; role: Role }; openProgram: (p: Program) => void; changeRole: (p: Program, role: Role) => void; removePath: (p: Program) => void }) {
  return <article className="pathway-choice">
    <button className="pathway-choice-main" onClick={() => openProgram(item.p)}><UniversityLogo program={item.p} size="small" /><span><strong>{item.p.university}</strong><small>{item.p.title}</small></span><ChevronRight size={14} /></button>
    <div className="pathway-choice-actions"><label><span className="sr-only">Pathway role for {item.p.university}</span><select value={item.role} onChange={(event) => changeRole(item.p, event.target.value as Role)}><option>Dream</option><option>Target</option><option>Alternative</option></select></label><button onClick={() => openProgram(item.p)}>View</button><button className="danger-action" onClick={() => removePath(item.p)}>Remove</button></div>
  </article>;
}

const formatFileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const formatStoredDate = (value: string) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const sharedRequirementProfileKeys: Record<string, string> = { "file-passport": "passport", "file-transcript": "transcript", "file-school-certificate": "certificate", "file-cv": "cv", "file-language-certificate": "english", "file-portfolio-evidence": "portfolio" };
const profileLinkKey = (key: string) => `profile:${key}`;

function DocumentRequirementRow({ label, help, filename, document, onUpload, onChoose, onView, onDownload, onUnlink }: { label: string; help: string; filename: string; document?: VaultDocument; onUpload: (file: File) => void; onChoose: () => void; onView: () => void; onDownload: () => void; onUnlink: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <article className={`document-requirement ${filename ? "has-file" : ""}`}>
    <span className="document-file-icon"><FileText size={15} /></span>
    <span className="document-requirement-copy"><strong>{label}</strong><small>{document ? `${document.name} · ${formatFileSize(document.size)} · Added ${formatStoredDate(document.uploadedAt)}` : filename ? `${filename} · Name saved only` : help}</small>{document && <em>Saved in My Documents · Version {document.version}</em>}</span>
    {document ? <div className="document-row-actions"><button onClick={onView}><Eye size={13} /> View</button><button onClick={onDownload}><Download size={13} /> Download</button><label><Upload size={13} /> Replace<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} /></label><span className="document-more"><button aria-label={`More actions for ${label}`} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={15} /></button>{menuOpen && <span><button onClick={() => { onChoose(); setMenuOpen(false); }}>Choose another saved file</button><button onClick={() => { onUnlink(); setMenuOpen(false); }}>Remove from this requirement</button></span>}</span></div> : <div className="document-empty-actions"><button onClick={onChoose}><FolderOpen size={13} /> My Documents</button><label><Upload size={13} /> {filename ? "Upload file" : "Upload new"}<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} /></label>{filename && <button className="icon-only" aria-label={`Remove ${label}`} onClick={onUnlink}><X size={14} /></button>}</div>}
  </article>;
}

function DocumentVaultModal({ documents, links, selecting, onClose, onSelect, onView, onDownload, onDelete, onUpload, onImported }: { documents: VaultDocument[]; links: Record<string, string>; selecting: { key: string; label: string } | null; onClose: () => void; onSelect: (document: VaultDocument) => void; onView: (document: VaultDocument) => void; onDownload: (document: VaultDocument) => void; onDelete: (document: VaultDocument) => void; onUpload: (file: File) => void; onImported: () => Promise<void> }) {
  const dialogRef = useDialogFocus(onClose);
  const [olderCount, setOlderCount] = useState(0);
  const [importing, setImporting] = useState(false);
  useEffect(() => { let active = true; legacyDocumentCount().then(count => { if (active) setOlderCount(count); }).catch(() => {}); return () => { active = false; }; }, []);
  const importOlder = async () => {
    if (!window.confirm("Import older files from this device into this account? Continue only if these files belong to you. Original files remain as a device backup.")) return;
    setImporting(true);
    try { await importLegacyDocuments(); await onImported(); setOlderCount(0); }
    catch (error) { window.alert(error instanceof Error ? error.message : "Files could not be imported. The originals are preserved."); }
    finally { setImporting(false); }
  };
  return <div className="modal-backdrop document-vault-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} tabIndex={-1} className="document-vault-modal" role="dialog" aria-modal="true" aria-labelledby="document-vault-title"><header><span><span className="section-label">Private document workspace</span><h2 id="document-vault-title">My Documents</h2><p>{selecting ? `Choose a saved file for ${selecting.label}.` : "View, download and reuse documents across university applications."}</p></span><button aria-label="Close My Documents" onClick={onClose}><X size={18} /></button></header><div className="vault-toolbar">{olderCount > 0 && <button className="outline-button compact" disabled={importing} onClick={importOlder}>{importing ? "Importing…" : `Import ${olderCount} older device files`}</button>}<span><FolderOpen size={16} /><strong>{documents.length} saved file{documents.length === 1 ? "" : "s"}</strong><small>Available on this device</small></span><label className="primary-button compact"><Upload size={14} /> Add file<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} /></label></div>{documents.length ? <div className="vault-document-list">{documents.map((document) => { const usageCount = Object.values(links).filter((id) => id === document.id).length; return <article key={document.id}><span className="document-file-icon"><FileText size={16} /></span><span><strong>{document.name}</strong><small>{document.category} · {formatFileSize(document.size)} · {formatStoredDate(document.uploadedAt)}</small><em>{usageCount ? `Used in ${usageCount} requirement${usageCount === 1 ? "" : "s"}` : document.previousVersionId ? `Previous version · v${document.version}` : "Not linked to a requirement"}</em></span><div>{selecting && <button className="vault-use-button" onClick={() => onSelect(document)}>Use file</button>}<button aria-label={`Preview ${document.name}`} onClick={() => onView(document)}><Eye size={14} /></button><button aria-label={`Download ${document.name}`} onClick={() => onDownload(document)}><Download size={14} /></button><button className="danger-action" aria-label={`Delete ${document.name}`} onClick={() => onDelete(document)}><Trash2 size={14} /></button></div></article>; })}</div> : <div className="vault-empty"><FolderOpen size={27} /><strong>No documents saved yet</strong><p>Upload a file here or from any Pathway requirement. It will then be available for reuse.</p></div>}<footer><CircleHelp size={14} /><span><strong>Document storage:</strong> file contents remain in this browser, separated by account. Download important files for backup; cloud file storage is not available.</span></footer></section></div>;
}

function DocumentPreviewModal({ document, url, onClose, onDownload }: { document: VaultDocument; url: string; onClose: () => void; onDownload: () => void }) {
  const dialogRef = useDialogFocus(onClose);
  return <div className="modal-backdrop document-preview-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} tabIndex={-1} className="document-preview-modal" role="dialog" aria-modal="true" aria-labelledby="document-preview-title"><header><span><span className="section-label">Document preview</span><h2 id="document-preview-title">{document.name}</h2><p>{formatFileSize(document.size)} · Version {document.version} · Added {formatStoredDate(document.uploadedAt)}</p></span><div><button className="secondary-button compact" onClick={onDownload}><Download size={14} /> Download</button><button aria-label="Close preview" onClick={onClose}><X size={18} /></button></div></header><div className="document-preview-content">{document.type.startsWith("image/") ? <img src={url} alt={`Preview of ${document.name}`} /> : document.type === "application/pdf" || document.name.toLowerCase().endsWith(".pdf") ? <iframe src={url} title={`Preview of ${document.name}`} /> : <div><FileText size={34} /><strong>Preview is not available for this file type</strong><p>Download the original file to open it in the appropriate application.</p><button className="primary-button" onClick={onDownload}><Download size={14} /> Download file</button></div>}</div></section></div>;
}

function Pathway({ selected, completed: allCompleted, toggleTask: toggleStoredTask, go, openProgram, changeRole, removePath, records: allRecords, updateRecord: updateStoredRecord, applicationReadiness, toast, initialStage = 0, initialApplicationId = "" }: { selected: { p: Program; role: Role }[]; completed: string[]; toggleTask: (v: string) => void; go: (v: View) => void; openProgram: (p: Program) => void; changeRole: (p: Program, role: Role) => void; removePath: (p: Program) => void; records: Record<string, string>; updateRecord: (key: string, value: string) => void; applicationReadiness: Record<string, { score: number; stages: ReadinessStage[] }>; toast: (message: string) => void; initialStage?: number; initialApplicationId?: string }) {
  const [expandedStage, setExpandedStage] = useState(initialStage);
  const [stageTab, setStageTab] = useState<"overview" | "requirements" | "evidence" | "actions">("overview");
  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);
  const [documentLinks, setDocumentLinks] = useState<Record<string, string>>({});
  const [sharedDocumentNames, setSharedDocumentNames] = useState<Record<string, string>>({});
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectingDocument, setSelectingDocument] = useState<{ key: string; label: string } | null>(null);
  const [previewDocument, setPreviewDocument] = useState<VaultDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const dream = selected.find((item) => item.role === "Dream");
  const [activeId, setActiveId] = useState(initialApplicationId || dream?.p.id || selected[0]?.p.id || "");
  const active = selected.find((item) => item.p.id === activeId) || dream || selected[0];
  const isEscp = active?.p.id === "escp";
  const readinessStages = active ? applicationReadiness[active.p.id]?.stages || [] : [];
  const pathwayReadiness = active ? applicationReadiness[active.p.id]?.score || 0 : 0;
  const completed = active ? [
    ...allCompleted.filter((id) => id.startsWith(`${active.p.id}:`)).map((id) => id.slice(active.p.id.length + 1)),
    ...(active.role === "Dream" ? allCompleted.filter((id) => !id.includes(":")) : []),
  ] : [];
  const toggleTask = (id: string) => { if (active) toggleStoredTask(`${active.p.id}:${id}`); };
  const records = new Proxy({} as Record<string, string>, { get: (_target, property) => { if (typeof property !== "string" || !active) return ""; const sharedKey = sharedRequirementProfileKeys[property]; return (sharedKey ? sharedDocumentNames[sharedKey] : "") || allRecords[`${active.p.id}:${property}`] || (active.role === "Dream" ? allRecords[property] : "") || ""; } });
  const updateRecord = (key: string, value: string) => { if (active) updateStoredRecord(`${active.p.id}:${key}`, value); };
  useEffect(() => { let current = true; const timer = window.setTimeout(() => { listVaultDocuments().then((documents) => current && setVaultDocuments(documents)).catch(() => toast("Document storage is unavailable in this browser")); try { setDocumentLinks(JSON.parse(window.localStorage.getItem("myway-document-links") || "{}")); } catch { setDocumentLinks({}); } try { setSharedDocumentNames(JSON.parse(window.localStorage.getItem("myway-profile-documents") || "{}")); } catch { setSharedDocumentNames({}); } }, 0); return () => { current = false; window.clearTimeout(timer); }; }, [toast]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const saveLinks = (next: Record<string, string>) => { setDocumentLinks(next); window.localStorage.setItem("myway-document-links", JSON.stringify(next)); };
  const activeLinkKey = (key: string) => sharedRequirementProfileKeys[key] ? profileLinkKey(sharedRequirementProfileKeys[key]) : active ? `${active.p.id}:${key}` : key;
  const updateSharedDocumentName = (key: string, value: string) => {
    const profileKey = sharedRequirementProfileKeys[key];
    if (!profileKey) return;
    let next: Record<string, string> = {};
    try { next = JSON.parse(window.localStorage.getItem("myway-profile-documents") || "{}"); } catch {}
    if (value) next[profileKey] = value; else delete next[profileKey];
    setSharedDocumentNames(next);
    window.localStorage.setItem("myway-profile-documents", JSON.stringify(next));
    window.dispatchEvent(new Event("myway-profile-updated"));
  };
  const reloadVault = async () => setVaultDocuments(await listVaultDocuments());
  const uploadDocument = async (key: string, label: string, file: File) => {
    if (!active) return;
    const linkKey = activeLinkKey(key);
    const previousId = documentLinks[linkKey];
    const previous = vaultDocuments.find((document) => document.id === previousId);
    const document: VaultDocument = { id: newVaultDocumentId(), name: file.name, type: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString(), category: label, version: previous ? previous.version + 1 : 1, previousVersionId: previous?.id };
    try { await saveVaultDocument(document, file); saveLinks({ ...documentLinks, [linkKey]: document.id }); updateRecord(key, file.name); updateSharedDocumentName(key, file.name); await reloadVault(); toast(previous ? `${label} replaced · previous version kept` : `${label} saved to My Documents`); } catch { toast("The file could not be saved on this device"); }
  };
  const addGeneralDocument = async (file: File) => {
    const document: VaultDocument = { id: newVaultDocumentId(), name: file.name, type: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString(), category: "General document", version: 1 };
    try { await saveVaultDocument(document, file); await reloadVault(); toast(`${file.name} saved to My Documents`); } catch { toast("The file could not be saved on this device"); }
  };
  const chooseDocument = (document: VaultDocument) => { if (!selectingDocument || !active) return; const next = { ...documentLinks, [activeLinkKey(selectingDocument.key)]: document.id }; saveLinks(next); updateRecord(selectingDocument.key, document.name); updateSharedDocumentName(selectingDocument.key, document.name); setSelectingDocument(null); setVaultOpen(false); toast(`${document.name} linked to ${active.p.university}`); };
  const unlinkDocument = (key: string) => { const linkKey = activeLinkKey(key); const next = { ...documentLinks }; delete next[linkKey]; saveLinks(next); updateRecord(key, ""); updateSharedDocumentName(key, ""); toast("File removed from this requirement · it remains in My Documents"); };
  const openVaultFor = (key: string, label: string) => { setSelectingDocument({ key, label }); setVaultOpen(true); };
  const viewDocument = async (document: VaultDocument) => { const stored = await getVaultDocument(document.id); if (!stored) return toast("This file is no longer available on this device"); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(URL.createObjectURL(stored.blob)); setPreviewDocument(document); };
  const downloadDocument = async (document: VaultDocument) => { const stored = await getVaultDocument(document.id); if (!stored) return toast("This file is no longer available on this device"); const url = URL.createObjectURL(stored.blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = document.name; anchor.style.display = "none"; window.document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const permanentlyDeleteDocument = async (document: VaultDocument) => { if (!window.confirm(`Delete ${document.name} permanently from this device?`)) return; const affected = Object.entries(documentLinks).filter(([, id]) => id === document.id).map(([key]) => key); affected.forEach((key) => { if (key.startsWith("profile:")) updateSharedDocumentName(Object.entries(sharedRequirementProfileKeys).find(([, profileKey]) => profileLinkKey(profileKey) === key)?.[0] || "", ""); else updateStoredRecord(key, ""); }); const next = { ...documentLinks }; affected.forEach((key) => delete next[key]); saveLinks(next); await deleteVaultDocument(document.id); await reloadVault(); if (previewDocument?.id === document.id) { setPreviewDocument(null); setPreviewUrl(""); } toast(`${document.name} deleted`); };
  const targets = selected.filter((item) => item.role === "Target");
  const alternatives = selected.filter((item) => item.role === "Alternative");
  const stages = [
    { title: "Confirm programme and intake", note: "Lock the exact degree, route, campus and starting term before planning around it.", actions: [["programme", "Programme", "Official programme page", "15 min", "Before shortlisting", "Prevents planning for the wrong degree or award"], ["intake", "Intended intake", "Your application plan", "5 min", "Before checking deadlines", "Every deadline and fee must match the correct intake"], ["application-route", "Application route", "Official admissions page", "10 min", "Before preparing documents", "Different routes can use different forms and requirements"], ["first-campus", "Preferred first-year campus", "Your study plan", "10 min", "Before budgeting", "Campus choice affects housing, travel and visa planning"], ["study-location", "Study location", "Official programme page", "5 min", "Before visa research", "Confirms which country rules and living costs apply"]] },
    { title: "Verify entry requirements", note: "Build a source-backed eligibility record for the exact programme, intake and route.", actions: [["entry-route", "Entry eligibility", "Official admissions page", "20 min", "Before document preparation", "Confirms whether this route accepts your qualification"], ["qualification", "Academic qualification", "Official admissions page", "20 min", "Before applying", "Avoids relying on a general country assumption"], ["deadline", "Application deadline", "Official admissions page", "10 min", "As soon as the route is chosen", "Sets the schedule for every later task"], ["translation", "Translation rules", "Official admissions page", "15 min", "Before ordering translations", "Prevents rejected or unusable document versions"], ["selection-step", "Selection process", "Official admissions page", "15 min", "Before submission", "Makes interviews, tests or extra reviews visible early"]] },
    { title: "Assess academic gaps", note: "Compare your grades and subjects with the programme evidence, then create a realistic improvement plan.", actions: [["academic-evidence", "Current academic evidence", "Your school records", "20 min", "Before readiness planning", "Creates the baseline for academic preparation"], ["academic-grades", "Current grades", "Your school records", "20 min", "Before finalising the shortlist", "Shows which subjects need attention"], ["subject-prerequisites", "Subject prerequisites", "Official admissions page", "20 min", "Before applying", "Confirms whether required subjects are present"], ["quant", "Quantitative course load", "Official programme curriculum", "25 min", "Before committing to the programme", "Helps students prepare for maths, statistics or accounting"], ["academic-gap-plan", "Academic gap plan", "Your preparation plan", "25 min", "Review monthly", "Turns identified gaps into specific study actions"]] },
    { title: "Prepare English qualification", note: "Track the accepted test, current result, validity, certificate and study plan separately.", actions: [["english-requirement", "English requirement", "Official admissions page", "15 min", "Before booking a test", "Confirms the accepted test, score and exemption rules"], ["english", "Current English result", "Your test record", "10 min", "Before setting a study target", "Measures the exact gap from the requirement"], ["english-date", "Test date / validity", "Official test result", "5 min", "Before submission", "An expired result may not be accepted"], ["english-certificate", "Language certificate", "Your evidence", "10 min", "Before document review", "Keeps the required proof ready for upload"], ["english-plan", "English preparation plan", "Your study plan", "25 min", "Review weekly", "Connects the score gap to repeatable practice"]] },
    { title: "Build experience and portfolio", note: "Record what you did, your contribution, the result and the evidence behind it.", actions: [["experience", "Relevant experience", "Your evidence", "20 min", "Before drafting the application", "Identifies the strongest experiences to present"], ["experience-impact", "Role and measurable impact", "Your evidence", "30 min", "Before writing the CV", "Turns participation into credible evidence of contribution"], ["portfolio-requirement", "Portfolio requirement", "Official admissions page", "15 min", "Before building a portfolio", "Avoids creating an unrequested submission"], ["portfolio-link", "Portfolio link", "Your evidence", "15 min", "Before final review", "Keeps approved work easy to access"], ["portfolio", "Supporting evidence", "Your evidence", "30 min", "Before final review", "Supports claims with certificates, outputs or records"]] },
    { title: "Prepare application documents", note: "Prepare each file separately and verify the exact list for the chosen application route.", actions: [["doc-transcript", "Academic transcripts", isEscp ? "Official ESCP direct-application requirement" : "Official admissions page", "45 min", "At least 4 weeks before submission", "Provides the academic record used in review"], ["doc-school-certificate", "Secondary-school certificate", isEscp ? "Official ESCP direct-application requirement" : "Official admissions page", "20 min", "Before submission", "Confirms the completed or expected school qualification"], ["doc-motivation", "Personal statement / motivation letter", isEscp ? "Official ESCP direct-application requirement" : "Official admissions page", "2–4 hr", "Draft 4 weeks before submission", "Explains motivation, fit and evidence in your own voice"], ["doc-cv", "CV / résumé", isEscp ? "Official ESCP direct-application requirement" : "Official admissions page", "1–2 hr", "Draft 3 weeks before submission", "Summarises education, activities and impact clearly"], ["doc-language", "Language certificate", isEscp ? "Official ESCP direct-application requirement" : "Official admissions page", "10 min", "Before document review", "Proves the accepted language result or exemption"], ["doc-reference", "Academic reference (optional)", isEscp ? "Official ESCP direct-application list" : "Official admissions page", "30 min", "Request 4–6 weeks early", "Gives a referee enough time when a reference is used"], ["doc-passport", "ID / passport copy", isEscp ? "Official ESCP direct-application requirement" : "Official admissions page", "10 min", "Before submission", "Confirms identity for the application record"]] },
    { title: "Plan tuition, living costs and funding", note: "Create one complete financial record instead of treating tuition as the total cost.", actions: [["tuition", "Tuition and required fees", "Official fee schedule", "20 min", "Before accepting an offer", "Establishes the confirmed university charges"], ["application-fee", "Application fee", "Official fee schedule", "10 min", "Before submission", "Prevents a payment surprise at the final step"], ["seat-deposit", "Seat deposit", "Official enrolment information", "10 min", "Before accepting an offer", "Clarifies the payment, deadline and refund rule"], ["budget", "Personal budget", "Your financial plan", "45 min", "Before committing to the programme", "Tests whether the full plan is affordable"], ["scholarship", "Scholarship plan", "Official funding pages", "45 min", "Before each funding deadline", "Records eligibility, value, documents and dates"], ["living-costs", "Living and travel costs", "Your financial plan", "45 min", "Before accepting an offer", "Adds housing, food, transport, visa and travel"]] },
    { title: "Submit and track applications", note: "Submit through one correct route and keep a complete audit trail after pressing send.", actions: [["application-portal", "Application portal / route", "Official admissions page", "10 min", "Before creating the application", "Prevents duplicate or conflicting applications"], ["final-review", "Final review", "Your application checklist", "45 min", "48 hours before submission", "Catches missing files, errors and inconsistent answers"], ["submit", "Submission date", "Your application record", "5 min", "Before the official deadline", "Records when the application was completed"], ["application-reference", "Application reference", "Your application record", "5 min", "Immediately after submission", "Makes future communication traceable"], ["confirmation", "Submission confirmation", "Your evidence", "10 min", "Immediately after submission", "Proves the application reached the portal"]] },
    { title: "Decide and prepare to enrol", note: "Track the offer, conditions, payments and transition steps without confusing them with admission probability.", actions: [["decision", "Offer status", "Official offer", "10 min", "When a decision arrives", "Keeps the pathway aligned with the real decision"], ["offer-conditions", "Offer conditions", "Official offer", "20 min", "Immediately after the offer", "Makes every remaining condition visible"], ["enrolment-deadline", "Response / enrolment deadline", "Official offer", "10 min", "Immediately after the offer", "Protects the place from an avoidable missed deadline"], ["deposit-status", "Deposit status", "Official enrolment information", "10 min", "Before the payment deadline", "Creates a clear payment record"], ["visa-plan", "Visa / residence plan", "Destination-government source", "45 min", "After admission", "Uses the correct government process for the destination"], ["enrolment", "Housing and arrival plan", "Your transition plan", "60 min", "Before travel", "Coordinates housing, insurance, travel and orientation"]] },
  ];
  const actionIds = stages.flatMap((stage) => stage.actions.map(([id]) => id));
  const doneCount = completed.filter((id) => actionIds.includes(id)).length;
  const readyStages = readinessStages.filter((stage) => stage.value === 100).length;
  const requirementData = [
    [["Programme", active?.p.title || "Choose an application"], ["Intended intake", records.intake || "Not recorded"], ["Application route", records.applicationRoute || "Not recorded"], ["Preferred first-year campus", records.firstCampus || "Not recorded"], ["Study location", active?.p.location || "Not recorded"]],
    [["Entry eligibility", active?.p.entry || "Check official programme page"], ["Academic qualification", records.qualification || "Not recorded"], ["Application deadline", records.deadline || "Not recorded"], ["Translation rules", records.translationPlan || "Check official admissions page"], ["Selection process", records.selectionNotes || "Check official admissions page"]],
    [["Current academic evidence", records["file-academic-evidence"] || "No file selected"], ["Current grades", records.currentGrades || "Not recorded"], ["Subject prerequisites", records.prerequisiteNotes || "Check official admissions page"], ["Quantitative course load", records.mathEvidence || "Not recorded"], ["Academic gap plan", records.academicGapPlan || "Not started"]],
    [["English requirement", records.englishRequirement || "Check official admissions page"], ["Current English result", records.englishScore || "Not recorded"], ["Test date / validity", records.englishTestDate || "Not recorded"], ["Language certificate", records["file-language-certificate"] || "No file selected"], ["English preparation plan", records.englishStudyPlan || "Not started"]],
    [["Relevant experience", records.experience || "Not recorded"], ["Role and measurable impact", records.experienceImpact || "Not recorded"], ["Portfolio requirement", records.portfolioRequirement || (isEscp ? "Not listed for ESCP direct application" : "Check official admissions page")], ["Portfolio link", records.portfolioLink || "Not recorded"], ["Supporting evidence", records["file-portfolio-evidence"] || records["file-3"] || "No file selected"]],
    [["Academic transcripts", records["file-transcript"] || "No file selected"], ["Secondary-school certificate", records["file-school-certificate"] || "No file selected"], ["Personal statement / motivation letter", records["file-motivation"] || records["file-4"] || "No file selected"], ["CV / résumé", records["file-cv"] || "No file selected"], ["Language certificate", records["file-language-certificate"] || "No file selected"], ["Academic reference (optional)", records["file-reference"] || "No file selected"], ["ID / passport copy", records["file-passport"] || "No file selected"]],
    [["Tuition and required fees", active?.p.tuition || "Check official fee schedule"], ["Application fee", records.applicationFee || "Check official fee schedule"], ["Seat deposit", records.seatDeposit || "Check official enrolment information"], ["Personal budget", records.budget || "Not recorded"], ["Scholarship plan", records.scholarshipNotes || "Not researched"], ["Living and travel costs", records.livingCostBudget || "Not recorded"]],
    [["Application portal / route", records.applicationRoute || (isEscp ? "Choose one official route only" : "Use the official university portal")], ["Final review", records.finalReviewStatus || "Not started"], ["Submission date", records.submissionDate || "Not submitted"], ["Application reference", records.applicationId || "Not recorded"], ["Submission confirmation", records["file-submission-confirmation"] || records["file-6"] || "No file selected"]],
    [["Offer status", records.offerStatus || "No decision recorded"], ["Offer conditions", records.offerConditions || "Not recorded"], ["Response / enrolment deadline", records.enrolmentDeadline || "Not recorded"], ["Deposit status", records.depositStatus || "Not recorded"], ["Visa / residence plan", records.visaPlan || (isEscp ? "Start after admission; confirm rules with the destination government" : "Not started")], ["Housing and arrival plan", records.transitionPlan || "Not started"]],
  ];
  const evidenceFields = [
    [["intake", "Intended intake", "e.g. September 2027"], ["applicationRoute", "Application route", "Direct / Parcoursup / UCAS / Common App"], ["firstCampus", "Preferred first-year campus", "Record the campus or track"], ["programmeNotes", "Programme decision notes", "Why this exact programme and route?"]],
    [["qualification", "Current qualification", "e.g. Indonesian SMA"], ["deadline", "Application deadline", "YYYY-MM-DD for your route and intake"], ["translationPlan", "Translation requirement", "Language, certification and documents affected"], ["selectionNotes", "Selection process", "Interview, test or additional review"], ["eligibilityNotes", "Unresolved eligibility questions", "Record the question and who must confirm it"]],
    [["currentGrades", "Current grades", "Record the grading scale and relevant subjects"], ["prerequisiteNotes", "Subject prerequisites", "Required subjects and your current status"], ["mathEvidence", "Quantitative course load", "Maths, statistics, economics or accounting modules"], ["academicGapPlan", "Academic gap plan", "Action, frequency and review date"]],
    [["englishRequirement", "Official English requirement", "Accepted test, score and exemption rule"], ["englishScore", "Current English result", "e.g. IELTS 6.0"], ["englishTestDate", "Test date / expiry", "Date taken and validity"], ["englishStudyPlan", "English preparation plan", "Target, practice routine and test date"]],
    [["experience", "Relevant experience", "e.g. Business competition"], ["experienceImpact", "Role and measurable impact", "What did you do and what changed?"], ["portfolioRequirement", "Official portfolio requirement", "Required / Optional / Not listed"], ["portfolioLink", "Portfolio link", "Public link or folder reference"], ["portfolioNotes", "Evidence notes", "What proves this experience?"]],
    [["cvStatus", "CV status", "Draft / Ready"], ["documentNotes", "Document notes", "Missing versions or translations"]],
    [["applicationFee", "Application fee", "Amount, currency and payment status"], ["seatDeposit", "Seat deposit", "Amount, deadline and refund rule"], ["budget", "Personal study budget", "Tuition plus living and travel costs"], ["scholarshipNotes", "Scholarship plan", "Name, eligibility, value and deadline"], ["livingCostBudget", "Living-cost estimate", "Housing, food, transport, visa and travel"]],
    [["applicationRoute", "Application portal / route", "Record the single route you will use"], ["finalReviewStatus", "Final review status", "Not started / In review / Ready"], ["submissionDate", "Submission date", "Date and local time"], ["applicationId", "Application reference", "Portal or confirmation number"]],
    [["offerStatus", "Offer status", "Pending / Conditional / Unconditional / Declined"], ["offerConditions", "Offer conditions", "Grades, documents or payments still required"], ["enrolmentDeadline", "Response / enrolment deadline", "YYYY-MM-DD · confirm the official time zone"], ["depositStatus", "Deposit status", "Not paid / Paid / Not required"], ["visaPlan", "Visa / residence plan", "Country source, appointment and deadline"], ["transitionPlan", "Housing and arrival plan", "Housing, insurance, travel and orientation"]],
  ];
  const applicationDocuments = [
    ["file-transcript", "Academic transcripts", isEscp ? "Last three years, translated into English" : "Check years and translation rules"],
    ["file-school-certificate", "Secondary-school certificate", isEscp ? "Add when already obtained or upon receipt" : "Check which final certificate is accepted"],
    ["file-motivation", "Personal statement / motivation letter", isEscp ? "Personal statement in English" : "Check format, prompt and word limit"],
    ["file-cv", "CV / résumé", isEscp ? "Current CV / résumé" : "Check whether a CV is requested"],
    ["file-language-certificate", "Language certificate", isEscp ? "If required; it may be submitted later" : "Check accepted tests, scores and exemptions"],
    ["file-reference", "Academic reference", isEscp ? "Optional" : "Check whether references are required"],
    ["file-passport", "ID / passport copy", isEscp ? "Required identity document" : "Check identity-document rules"],
  ];
  const stageEvidenceFiles = [
    [["file-programme-notes", "Programme research notes", "Optional notes or saved comparison"]],
    [["file-requirements", "Requirements evidence", "Screenshot, PDF or adviser confirmation"]],
    [["file-academic-evidence", "Academic evidence", "Transcript or school report"], ["file-math-evidence", "Quantitative evidence", "Relevant grade, course or preparation record"]],
    [["file-language-certificate", "Language certificate", "Accepted result or exemption evidence"], ["file-english-plan", "English study plan", "Practice schedule or test-booking record"]],
    [["file-portfolio-evidence", "Portfolio or experience evidence", "Certificate, project output or supporting file"]],
    applicationDocuments,
    [["file-budget", "Budget worksheet", "Your complete cost calculation"], ["file-scholarship", "Scholarship evidence", "Eligibility notes or submitted documents"]],
    [["file-submitted-application", "Final application copy", "The version actually submitted"], ["file-submission-confirmation", "Submission confirmation", "Receipt, email or portal confirmation"]],
    [["file-offer", "Offer letter", "Conditional or unconditional offer"], ["file-enrolment", "Enrolment or deposit receipt", "Payment or enrolment confirmation"], ["file-visa", "Visa / residence evidence", "Only store non-sensitive prototype filenames"]],
  ];
  const evidencePanelTitles = ["Programme decision files", "Eligibility evidence", "Academic evidence", "English qualification evidence", "Experience and portfolio evidence", "Application document folder", "Funding evidence", "Submission record", "Offer and enrolment evidence"];
  const evidencePanelNotes = [
    "Keep the source or notes behind your programme decision",
    "Keep proof of the requirements you checked",
    "Keep your grades and subject evidence separate from self-entered notes",
    "Use the same language certificate again in the application-document stage",
    "Store evidence that supports the role and impact you recorded",
    isEscp ? "Verified against ESCP’s current direct-application list · checked 11 Sep 2026" : "Preparation list — confirm every item on the official admissions page",
    "Separate fee evidence, budget calculations and scholarship records",
    "Keep the exact submitted version and its confirmation",
    "Keep offer and enrolment records together; avoid sensitive data in prototype mode",
  ];
  return <div className="page-enter pathway-page" data-tour="pathway-main">
    <section className="page-intro"><div><span className="eyebrow">Your university plan</span><h2>My Pathway</h2><p>{selected.length ? `${selected.length} university option${selected.length === 1 ? "" : "s"} organised by role` : "Build a shortlist, then choose one Dream university to track."}</p></div><button className="secondary-button" onClick={() => go("explore")}><Plus size={15} /> Add university</button></section>
    {active ? <><section className="application-switcher pathway-application-switcher"><label><span>Application workspace</span><select value={active.p.id} onChange={(event) => { setActiveId(event.target.value); setExpandedStage(0); setStageTab("overview"); }}>{selected.map((item) => <option key={item.p.id} value={item.p.id}>{item.p.university} — {item.role}</option>)}</select></label><small>Each university keeps separate requirements, evidence, actions and readiness.</small></section><article className="card dream-pathway-card"><div className="dream-pathway-identity"><span className="dream-label"><Sparkles size={13} /> {active.role} application</span><div><UniversityLogo program={active.p} size="large" /><span><h3>{active.p.university}</h3><p>{active.p.title} · {active.p.location}</p><button className="text-link" onClick={() => openProgram(active.p)}>View university <ChevronRight size={14} /></button></span></div></div><div className="dream-progress"><span><strong>Application readiness</strong><em>{pathwayReadiness}%</em></span><div className="bar"><i style={{ width: pathwayReadiness + "%" }} /></div><small>{readyStages} of 9 stages ready · specific to this application · not an admission score</small></div><div className="dream-controls"><label><span>Change role</span><select value={active.role} onChange={(event) => changeRole(active.p, event.target.value as Role)}><option>Dream</option><option>Target</option><option>Alternative</option></select></label><button className="outline-button danger-action" onClick={() => removePath(active.p)}><X size={14} /> Remove</button></div></article></> : <article className="card pathway-empty-dream"><span className="large-icon"><Sparkles /></span><div><span className="section-label">Application tracker</span><h3>Add a university to begin</h3><p>Every Dream, Target and Alternative university receives its own preparation workspace.</p><button className="primary-button" onClick={() => go("explore")}><Search size={15} /> Explore universities</button></div></article>}
    <section className="card document-vault-summary"><span className="vault-summary-icon"><FolderOpen size={19} /></span><span><span className="section-label">Shared across every application</span><strong>My Documents</strong><small>{vaultDocuments.length ? `${vaultDocuments.length} real file${vaultDocuments.length === 1 ? "" : "s"} saved and available for reuse on this device` : "Upload once, then reuse the same file for multiple university requirements"}</small></span><button className="secondary-button" onClick={() => { setSelectingDocument(null); setVaultOpen(true); }}>Open My Documents <ChevronRight size={14} /></button></section>
    <section className={"card pathway-stages " + (!active ? "disabled" : "")}><div className="section-head"><div><span className="section-label">Application workspace</span><h3>Your preparation database</h3><p className="pathway-helper">Store requirements, personal evidence, documents, and next actions. Submit the final application through the university’s official portal.</p></div><span className="badge blue"><Database size={12} /> {doneCount} of {actionIds.length} actions</span></div><div className="pathway-stage-list">{stages.map((stage, index) => { const stageDone = stage.actions.every(([id]) => completed.includes(id)); const stageFiles = stageEvidenceFiles[index]; const hasStageFile = stageFiles.some(([key]) => Boolean(records[key] || (key === "file-motivation" && records["file-4"]))); const stageStarted = stage.actions.some(([id]) => completed.includes(id)) || evidenceFields[index].some(([key]) => Boolean(records[key])) || hasStageFile; const open = expandedStage === index; return <article className={"pathway-stage " + (stageDone ? "complete" : stageStarted ? "started" : "")} key={stage.title}><button className="pathway-stage-toggle" onClick={() => { if (!active) return; setExpandedStage(open ? -1 : index); setStageTab("overview"); }} disabled={!active} aria-expanded={open}><span>{stageDone ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span><span><strong>{stage.title}</strong><small>{stageDone ? "Ready" : stageStarted ? "Information added" : index === 0 && active ? "Start here" : "No information yet"}</small></span><em>{requirementData[index].filter(([, value]) => !/Not recorded|No file|Not submitted|No decision|Not started|Not researched|Check official/.test(value)).length} of {requirementData[index].length} details</em><ChevronDown size={15} /></button><div className={`pathway-stage-expander ${open && active ? "open" : ""}`} aria-hidden={!open}><div>{active && <div className="pathway-stage-workspace"><nav aria-label={stage.title + " sections"}>{(["overview", "requirements", "evidence", "actions"] as const).map((tab) => <button key={tab} className={stageTab === tab ? "active" : ""} onClick={() => setStageTab(tab)}>{tab === "evidence" ? "My evidence" : tab[0].toUpperCase() + tab.slice(1)}</button>)}</nav>
      {stageTab === "overview" && <div className="stage-overview"><div><span className="row-icon"><Database size={16} /></span><span><strong>{stage.title}</strong><p>{stage.note}</p></span></div><dl>{requirementData[index].slice(0, 3).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{active.p.sources[0] && <a href={active.p.sources[0].href} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Open official programme source</a>}</div>}
      {stageTab === "requirements" && <div className="stage-requirements"><p className="requirements-note">The checklist below is tied to this stage. “Recorded” means MyWay has a value or file; it does not replace the university’s decision.</p><header><span>Requirement</span><span>Your current record</span><span>Status</span></header>{requirementData[index].map(([label, value]) => { const missing = /Not recorded|No file|Not submitted|No decision|Not started|Check official|Not researched/.test(value); const optional = label.includes("(optional)"); return <div key={label}><strong>{label}</strong><span>{value}</span><em className={!missing ? "green" : optional ? "neutral" : "attention"}>{!missing ? "Recorded" : optional ? "Optional" : "Needs action"}</em></div>; })}</div>}
      {stageTab === "evidence" && <div className="stage-evidence stage-tab-transition"><div className="evidence-form">{evidenceFields[index].map(([key, label, placeholder]) => <label key={key}><span>{label}</span><input value={records[key] || ""} onChange={(event) => updateRecord(key, event.target.value)} placeholder={placeholder} /></label>)}</div><div className="application-document-panel"><div className="document-panel-head"><span><strong>{evidencePanelTitles[index]}</strong><small>{evidencePanelNotes[index]}</small></span><em>{stageFiles.filter(([key]) => Boolean(records[key] || (key === "file-motivation" && records["file-4"]))).length} of {stageFiles.length} files linked</em></div><div className="document-file-list">{stageFiles.map(([key, label, help]) => { const normalizedKey = key === "file-motivation" && !records[key] && records["file-4"] ? "file-4" : key; const filename = records[key] || (key === "file-motivation" ? records["file-4"] : ""); const linked = vaultDocuments.find((document) => document.id === documentLinks[activeLinkKey(normalizedKey)]); return <DocumentRequirementRow key={key} label={label} help={help} filename={filename} document={linked} onUpload={(file) => uploadDocument(normalizedKey, label, file)} onChoose={() => openVaultFor(normalizedKey, label)} onView={() => linked && viewDocument(linked)} onDownload={() => linked && downloadDocument(linked)} onUnlink={() => unlinkDocument(normalizedKey)} />; })}</div>{active.p.sources[0] && <a className="document-source-link" href={active.p.sources[0].href} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Verify this stage on the official programme page</a>}</div><p className="prototype-file-note"><CircleHelp size={13} /> File contents stay in this browser, separated by account. File names and links sync to your account; download important files for backup.</p></div>}
      {stageTab === "actions" && <div className="pathway-stage-body"><p>Each action is tied to the matching requirement. Estimates and target timing are planning guidance; university-specific facts must come from the named source.</p>{stage.actions.map(([id, , source, effort, timing, why], actionIndex) => { const done = completed.includes(id); const [requirement, value] = requirementData[index][actionIndex]; return <button key={id} className={done ? "done" : ""} onClick={() => toggleTask(id)}><span className={"check " + (done ? "checked" : "")}>{done && <Check size={13} />}</span><span className="action-record-copy"><strong>{requirement}</strong><small><b>Current record</b>{value}</small><span className="action-detail-grid"><small><b>Estimated effort</b>{effort}</small><small><b>Target timing</b>{timing}</small><small><b>Why it matters</b>{why}</small><small><b>Evidence source</b>{source}</small></span></span><em>{done ? "Completed" : "Mark complete"}</em></button>; })}</div>}
    </div>}</div></div></article>; })}</div></section>
    <section className="pathway-shortlists"><div className="section-head"><div><span className="section-label">Your shortlist</span><h3>Targets and alternatives</h3></div><button className="text-link" onClick={() => go("explore")}>Manage in Explore <ChevronRight size={14} /></button></div><div className="pathway-shortlist-grid"><article className="card pathway-role-card"><header><span className="role-symbol target"><Target size={16} /></span><span><h3>Target universities</h3><p>Your leading realistic options</p></span><em>{targets.length}</em></header>{targets.length ? targets.map((item) => <PathwayChoice key={item.p.id} item={item} openProgram={openProgram} changeRole={changeRole} removePath={removePath} />) : <div className="empty-compact"><Target size={17} /><span>No Target universities yet</span></div>}</article><article className="card pathway-role-card"><header><span className="role-symbol alternative"><ShieldCheck size={16} /></span><span><h3>Alternative universities</h3><p>Strong backup options</p></span><em>{alternatives.length}</em></header>{alternatives.length ? alternatives.map((item) => <PathwayChoice key={item.p.id} item={item} openProgram={openProgram} changeRole={changeRole} removePath={removePath} />) : <div className="empty-compact"><ShieldCheck size={17} /><span>No Alternative universities yet</span></div>}</article></div></section>
    <section className="gap-section"><div className="section-head"><div><span className="section-label">Questions to resolve</span><h3>Information still needed</h3></div></div><div className="gap-grid">{[["Intended intake", completed.includes("intake") ? "Added" : "Not provided", completed.includes("intake") ? "green" : "attention"], ["Entry requirements", ["entry-route", "qualification", "deadline", "translation", "selection-step"].every((id) => completed.includes(id)) ? "All checked" : "Needs review", ["entry-route", "qualification", "deadline", "translation", "selection-step"].every((id) => completed.includes(id)) ? "green" : "attention"], ["English evidence", completed.includes("english-certificate") ? "Certificate added" : completed.includes("english") ? "Score added" : "Not provided", completed.includes("english-certificate") ? "green" : "attention"], ["Funding plan", completed.includes("scholarship") && completed.includes("budget") ? "Budget and funding recorded" : "Incomplete", completed.includes("scholarship") && completed.includes("budget") ? "green" : "attention"]].map(([label, value, tone]) => <article className="card gap-card" key={label}><span className="row-icon">{tone === "green" ? <CircleCheck /> : <CircleAlert />}</span><span><small>{label}</small><strong>{value}</strong><em className={tone}>{tone === "green" ? "On track" : "Needs action"}</em></span></article>)}</div></section>
    {vaultOpen && <DocumentVaultModal onImported={reloadVault} documents={vaultDocuments} links={documentLinks} selecting={selectingDocument} onClose={() => { setVaultOpen(false); setSelectingDocument(null); }} onSelect={chooseDocument} onView={viewDocument} onDownload={downloadDocument} onDelete={permanentlyDeleteDocument} onUpload={selectingDocument ? (file) => uploadDocument(selectingDocument.key, selectingDocument.label, file).then(() => { setVaultOpen(false); setSelectingDocument(null); }) : addGeneralDocument} />}
    {previewDocument && previewUrl && <DocumentPreviewModal document={previewDocument} url={previewUrl} onClose={() => { setPreviewDocument(null); setPreviewUrl(""); }} onDownload={() => downloadDocument(previewDocument)} />}
  </div>;
}

function ProgressPage({ selected, applicationReadiness, openStage, openProgram, go }: { selected: { p: Program; role: Role }[]; applicationReadiness: Record<string, { score: number; stages: ReadinessStage[] }>; openStage: (index: number, programId: string) => void; openProgram: (p: Program) => void; go: (v: View) => void }) {
  const progressStageIcons = [Map, ShieldCheck, BarChart3, Languages, BriefcaseBusiness, FileText, Trophy, ClipboardCheck, Flag];
  const dream = selected.find((item) => item.role === "Dream");
  const [activeId, setActiveId] = useState(dream?.p.id || selected[0]?.p.id || "");
  const active = selected.find((item) => item.p.id === activeId) || dream || selected[0];
  const others = selected.filter((item) => item.p.id !== active?.p.id);
  const activeReadiness = active ? applicationReadiness[active.p.id] || { score: 0, stages: [] } : { score: 0, stages: [] };
  const pathwayReadiness = activeReadiness.score;
  const readinessStages = activeReadiness.stages;
  const readyCount = readinessStages.filter((stage) => stage.value === 100).length;
  const average = (key: "requirements" | "records" | "evidence" | "actions") => readinessStages.length ? Math.round(readinessStages.reduce((sum, stage) => sum + stage[key], 0) / readinessStages.length) : 0;
  const components = [["Requirements", 30, average("requirements")], ["Student records", 25, average("records")], ["Evidence & documents", 25, average("evidence")], ["Pathway actions", 20, average("actions")]] as const;
  const priorities = readinessStages.map((stage, index) => ({ stage, index, weakest: [["requirements", stage.requirements], ["student records", stage.records], ["evidence", stage.evidence], ["actions", stage.actions]].sort((a, b) => Number(a[1]) - Number(b[1]))[0][0] })).filter(({ stage }) => stage.value < 100).sort((a, b) => a.stage.value - b.stage.value || a.index - b.index).slice(0, 3);
  if (!active) return <div className="page-enter"><section className="page-intro"><div><span className="eyebrow">Progress</span><h2>Application progress</h2><p>Add a university to start preparing an application.</p></div></section><article className="card progress-empty"><Flag size={24} /><h3>Choose a university</h3><p>Add a Dream, Target, or Alternative to create its preparation workspace.</p><button className="primary-button" onClick={() => go("explore")}>Explore universities</button></article></div>;
  return <div className="page-enter progress-page"><section className="page-intro"><div><span className="eyebrow">Progress</span><h2>Application readiness</h2><p>Track preparation for every shortlisted programme—not admission probability.</p></div></section>
    <section className="application-switcher"><label><span>Application</span><select value={active.p.id} onChange={(event) => setActiveId(event.target.value)}>{selected.map((item) => <option key={item.p.id} value={item.p.id}>{item.p.university} — {item.role}</option>)}</select></label><small>Shared records and documents are reused. University-specific requirements remain separate.</small></section>
    <section className="card progress-hero"><div className="progress-hero-score"><strong>{pathwayReadiness}%</strong><span><b>{readyCount} of 9 stages ready</b><small>Preparation progress · not admission probability</small></span></div><div className="progress-hero-target"><UniversityLogo program={active.p} size="small" /><span><small>{active.role} application</small><strong>{active.p.university}</strong><em>{active.p.title}</em></span><button className="text-link" onClick={() => openProgram(active.p)}>View <ChevronRight size={14} /></button></div></section>
    <div className="progress-layout"><section className="card progress-stages"><div className="section-head"><div><span className="section-label">Pathway stages</span><h3>Preparation by stage</h3></div><span className="badge blue">All 9 stages</span></div><div className="progress-stage-list">{readinessStages.map((stage, index) => { const Icon = progressStageIcons[index]; const status = stage.value === 100 ? "Ready" : stage.value ? "In progress" : "Not started"; return <button className="progress-stage" key={stage.label} onClick={() => openStage(index, active.p.id)}><span className="progress-stage-icon"><Icon size={17} /></span><span className="progress-stage-copy"><span><strong>{stage.label}</strong><em>{status}</em></span><small>{stage.completedActions} of {stage.totalActions} actions complete</small><span className="bar"><i style={{ width: stage.value + "%" }} /></span></span><b>{stage.value}%</b><ChevronRight size={15} /></button>; })}</div></section>
      <aside className="progress-side"><section className="card score-breakdown"><div className="section-head"><div><span className="section-label">Score breakdown</span><h3>How it is calculated</h3></div></div>{components.map(([label, weight, value]) => <div className="score-part" key={label}><span><strong>{label}</strong><small>{weight}% of total score</small></span><div className="bar"><i style={{ width: value + "%" }} /></div><em>{value}% ready</em></div>)}</section><section className="card priority-card"><div className="section-head"><div><span className="section-label">Next priorities</span><h3>What to complete next</h3></div></div>{priorities.length ? priorities.map(({ stage, index, weakest }, rank) => <button key={stage.label} onClick={() => openStage(index, active.p.id)}><span>{rank + 1}</span><span><strong>{stage.label}</strong><small>Strengthen {weakest} · {stage.value}% ready</small></span><ChevronRight size={14} /></button>) : <div className="all-ready"><CircleCheck size={20} /><span><strong>All stages are ready</strong><small>Review the Pathway before submission.</small></span></div>}</section></aside></div>
    <section className="card other-choices"><div className="section-head"><div><span className="section-label">Other applications</span><h3>Your shortlist</h3></div><button className="text-link" onClick={() => go("pathway")}>Manage choices <ChevronRight size={14} /></button></div>{others.length ? <div className="other-choice-grid">{others.map((item) => <button key={item.p.id} onClick={() => { setActiveId(item.p.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}><UniversityLogo program={item.p} size="small" /><span><small>{item.role}</small><strong>{item.p.university}</strong><em>{item.p.title} · {applicationReadiness[item.p.id]?.score ?? 0}% ready</em></span><ChevronRight size={15} /></button>)}</div> : <p className="empty-copy">No other applications added yet.</p>}</section>
  </div>;
}

function ProfilePage({ toast, avatar, setAvatar }: { toast: (s: string) => void; avatar: string; setAvatar: (value: string) => void }) {
  type ProfileTab = "education" | "tests" | "preferences" | "experience" | "documents";
  const [editing, setEditing] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("education");
  const [data, setData] = useState({ name: "", citizenship: "", school: "", curriculum: "", gradeYear: "", graduation: "", average: "", subjects: "", test: "IELTS", score: "", components: "", testDate: "", expiry: "", retake: "", degree: "Bachelor’s", fields: "", avoidedFields: "", countries: "", language: "", budget: "", math: "", intake: "", activities: "", leadership: "", volunteering: "", competitions: "", work: "", portfolio: "" });
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [preferencePriorities, setPreferencePriorities] = useState<Record<string, "Must have" | "Prefer" | "No preference">>({ Internships: "No preference", Exchange: "No preference", "Career services": "No preference", "Entrepreneurship support": "No preference", Scholarships: "No preference", "Industry projects": "No preference" });
  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);
  const [documentLinks, setDocumentLinks] = useState<Record<string, string>>({});
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectingDocument, setSelectingDocument] = useState<{ key: string; label: string } | null>(null);
  const [previewDocument, setPreviewDocument] = useState<VaultDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const chooseAvatar = (value: string) => { setAvatar(value); setAvatarOpen(false); toast("Profile picture updated"); };
  const uploadAvatar = (file?: File) => {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { if (file) toast("Choose a JPG, PNG, or WebP image"); return; }
    if (file.size > 1_000_000) { toast("Choose an image smaller than 1 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && chooseAvatar(reader.result);
    reader.readAsDataURL(file);
  };
  useEffect(() => { const timer = window.setTimeout(() => { try { const saved = JSON.parse(window.localStorage.getItem("myway-profile") || "null"); if (saved) setData((current) => ({ ...current, ...saved })); } catch {} try { setDocuments(JSON.parse(window.localStorage.getItem("myway-profile-documents") || "{}")); } catch {} try { setDocumentLinks(JSON.parse(window.localStorage.getItem("myway-document-links") || "{}")); } catch {} listVaultDocuments().then(setVaultDocuments).catch(() => toast("Document storage is unavailable in this browser")); try { const savedPriorities = JSON.parse(window.localStorage.getItem("myway-preference-priorities") || "null"); if (savedPriorities) setPreferencePriorities(savedPriorities); } catch {} }, 0); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const update = (key: keyof typeof data, value: string) => setData((current) => ({ ...current, [key]: value }));
  const save = () => { window.localStorage.setItem("myway-profile", JSON.stringify(data)); window.localStorage.setItem("myway-profile-documents", JSON.stringify(documents)); window.localStorage.setItem("myway-preference-priorities", JSON.stringify(preferencePriorities)); window.dispatchEvent(new Event("myway-profile-updated")); setEditing(false); toast("Profile saved · matches recalculated"); };
  const completedFields = [data.citizenship, data.school, data.curriculum, data.graduation, data.average, data.score, data.intake, data.budget, data.activities, documents.passport, documents.transcript, documents.cv, documents.english].filter(Boolean).length;
  const completion = Math.round(completedFields / 13 * 100);
  const field = (key: keyof typeof data, label: string, placeholder: string) => <label className="profile-field"><span>{label}</span>{editing ? <input value={data[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} /> : <strong className={!data[key] ? "missing" : ""}>{data[key] || "Not added"}</strong>}</label>;
  const saveDocumentState = (nextDocuments: Record<string, string>, nextLinks = documentLinks) => { setDocuments(nextDocuments); setDocumentLinks(nextLinks); window.localStorage.setItem("myway-profile-documents", JSON.stringify(nextDocuments)); window.localStorage.setItem("myway-document-links", JSON.stringify(nextLinks)); window.dispatchEvent(new Event("myway-profile-updated")); };
  const clearSharedPathwayRecord = (profileKey: string) => {
    const requirementKey = Object.entries(sharedRequirementProfileKeys).find(([, value]) => value === profileKey)?.[0];
    if (!requirementKey) return;
    let stored: Record<string, string> = {};
    try { stored = JSON.parse(window.localStorage.getItem("myway-pathway-records") || "{}"); } catch {}
    const next = Object.fromEntries(Object.entries(stored).filter(([key]) => key !== requirementKey && !key.endsWith(`:${requirementKey}`)));
    window.localStorage.setItem("myway-pathway-records", JSON.stringify(next));
  };
  const reloadVault = async () => setVaultDocuments(await listVaultDocuments());
  const uploadProfileDocument = async (key: string, label: string, file: File) => { const linkKey = profileLinkKey(key); const previous = vaultDocuments.find((document) => document.id === documentLinks[linkKey]); const document: VaultDocument = { id: newVaultDocumentId(), name: file.name, type: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString(), category: label, version: previous ? previous.version + 1 : 1, previousVersionId: previous?.id }; try { await saveVaultDocument(document, file); saveDocumentState({ ...documents, [key]: file.name }, { ...documentLinks, [linkKey]: document.id }); await reloadVault(); toast(previous ? `${label} replaced · previous version kept` : `${label} saved to My Documents`); } catch { toast("The file could not be saved on this device"); } };
  const chooseProfileDocument = (document: VaultDocument) => { if (!selectingDocument) return; saveDocumentState({ ...documents, [selectingDocument.key]: document.name }, { ...documentLinks, [profileLinkKey(selectingDocument.key)]: document.id }); setSelectingDocument(null); setVaultOpen(false); toast(`${document.name} linked to your profile`); };
  const unlinkProfileDocument = (key: string) => { const nextDocuments = { ...documents }; delete nextDocuments[key]; const nextLinks = { ...documentLinks }; delete nextLinks[profileLinkKey(key)]; clearSharedPathwayRecord(key); saveDocumentState(nextDocuments, nextLinks); toast("File unlinked from every application · it remains in My Documents"); };
  const viewProfileDocument = async (document: VaultDocument) => { const stored = await getVaultDocument(document.id); if (!stored) return toast("This file is no longer available on this device"); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(URL.createObjectURL(stored.blob)); setPreviewDocument(document); };
  const downloadProfileDocument = async (document: VaultDocument) => { const stored = await getVaultDocument(document.id); if (!stored) return toast("This file is no longer available on this device"); const url = URL.createObjectURL(stored.blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = document.name; anchor.style.display = "none"; window.document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const deleteProfileDocument = async (document: VaultDocument) => { if (!window.confirm(`Delete ${document.name} permanently from this device?`)) return; const affectedKeys = Object.entries(documentLinks).filter(([, id]) => id === document.id).map(([key]) => key); const affectedProfileKeys = affectedKeys.filter((key) => key.startsWith("profile:")).map((key) => key.slice("profile:".length)); const nextDocuments = { ...documents }; affectedProfileKeys.forEach((key) => { delete nextDocuments[key]; clearSharedPathwayRecord(key); }); const nextLinks = { ...documentLinks }; affectedKeys.forEach((key) => delete nextLinks[key]); saveDocumentState(nextDocuments, nextLinks); await deleteVaultDocument(document.id); await reloadVault(); if (previewDocument?.id === document.id) { setPreviewDocument(null); setPreviewUrl(""); } toast(`${document.name} deleted from this device`); };
  const addGeneralProfileDocument = async (file: File) => { const document: VaultDocument = { id: newVaultDocumentId(), name: file.name, type: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString(), category: "General document", version: 1 }; try { await saveVaultDocument(document, file); await reloadVault(); toast(`${file.name} saved to My Documents`); } catch { toast("The file could not be saved on this device"); } };
  const selectedFields = data.fields.split(",").map((item) => item.trim()).filter(Boolean);
  const avoidedFields = data.avoidedFields.split(",").map((item) => item.trim()).filter(Boolean);
  const toggleField = (item: string) => { if (!editing || avoidedFields.includes(item)) return; const next = selectedFields.includes(item) ? selectedFields.filter((value) => value !== item) : [...selectedFields, item]; update("fields", next.join(", ")); };
  const toggleAvoidedField = (item: string) => { if (!editing || selectedFields.includes(item)) return; const next = avoidedFields.includes(item) ? avoidedFields.filter((value) => value !== item) : [...avoidedFields, item]; update("avoidedFields", next.join(", ")); };
  const cyclePreference = (item: string) => { if (!editing) return; setPreferencePriorities((current) => ({ ...current, [item]: current[item] === "Must have" ? "Prefer" : current[item] === "Prefer" ? "No preference" : "Must have" })); };
  const gaps = [["Citizenship", data.citizenship, "education"], ["High school graduation year", data.graduation, "education"], ["English result", data.score, "tests"], ["Intended intake", data.intake, "preferences"], ["Passport", documents.passport, "documents"]] as const;
  return <div className="page-enter profile-page"><section className="card profile-hero profile-workspace-hero"><button className="profile-avatar-button" onClick={() => setAvatarOpen((open) => !open)} aria-label="Change profile picture"><UserAvatar value={avatar} className="profile-avatar" /><span><Camera size={14} /></span></button><div><span className="eyebrow">Student profile</span><h2>{data.name || "Your profile"}</h2><p>{data.school || "Add your school"} · {data.graduation || "Graduation year not added"}</p><div className="profile-chips"><span>Business</span><span>{data.degree}</span>{data.math && <span>{data.math} math</span>}</div></div><div className="profile-completion"><span><strong>{completion}%</strong><small>profile complete</small></span><div className="bar"><i style={{ width: completion + "%" }} /></div></div><button className="secondary-button" onClick={() => editing ? save() : setEditing(true)}>{editing ? <><Check size={15} /> Save</> : <><Settings2 size={15} /> Edit</>}</button>{avatarOpen && <div className="avatar-picker"><div><strong>Profile picture</strong><button onClick={() => setAvatarOpen(false)} aria-label="Close profile picture options"><X size={15} /></button></div><p>Choose an avatar or upload your own image.</p><div className="avatar-options">{[data.name.trim().slice(0, 2).toUpperCase() || "MW", "A", "MW", "✦"].map((item, index) => <button key={`${item}-${index}`} className={avatar === item ? "selected" : ""} onClick={() => chooseAvatar(item)}>{item}</button>)}</div><label className="avatar-upload"><Camera size={15} /> Upload JPG, PNG or WebP<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadAvatar(event.currentTarget.files?.[0])} /></label><button className="text-link" onClick={() => chooseAvatar(data.name.trim().slice(0, 2).toUpperCase() || "MW")}>Reset to initials</button></div>}</section>
    <div className="profile-workspace"><aside className="card profile-summary-panel"><div className="section-head"><div><span className="section-label">Profile gaps</span><h3>Complete next</h3></div><CircleAlert size={18} /></div><div className="profile-gap-list">{gaps.map(([label, value, targetTab]) => <button key={label} onClick={() => { setTab(targetTab); setEditing(true); }}><span className={value ? "complete" : ""}>{value ? <Check size={12} /> : <Plus size={12} />}</span><span><strong>{label}</strong><small>{value || "Not added"}</small></span><ChevronRight size={13} /></button>)}</div><div className="profile-boundary"><Database size={16} /><span><strong>Shared across applications</strong><small>Profile records can support every university. Programme-specific answers stay in Pathway.</small></span></div></aside>
      <main className="card profile-editor"><div className="profile-tabs" role="tablist" aria-label="Profile sections">{[["education", "Education"], ["tests", "Tests"], ["preferences", "Preferences"], ["experience", "Experience"], ["documents", "Documents"]].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id as ProfileTab)}>{label}</button>)}</div>
        {tab === "education" && <section className="profile-tab-panel"><div className="section-head"><div><span className="section-label">Education</span><h3>Academic background</h3><p>Reusable information about your current qualification.</p></div><GraduationCap size={19} /></div><div className="profile-form-grid">{field("name", "Full name", "Your full legal name")}{field("citizenship", "Country / citizenship", "e.g. Indonesia")}{field("school", "School", "Current school name")}{field("curriculum", "Curriculum / qualification", "e.g. Indonesian SMA, IB, A Levels")}{field("gradeYear", "Current grade / year", "e.g. Grade 11")}{field("graduation", "High school graduation year", "e.g. 2027")}{field("average", "Current average / GPA", "Include the grading scale")}{field("subjects", "Key subjects", "Business, mathematics, English...")}</div></section>}
        {tab === "tests" && <section className="profile-tab-panel"><div className="section-head"><div><span className="section-label">Language tests</span><h3>English qualification</h3><p>Record the result and validity separately from its certificate.</p></div><Languages size={19} /></div><div className="profile-form-grid">{field("test", "Test type", "IELTS, TOEFL, Duolingo...")}{field("score", "Overall score", "e.g. 6.5")}{field("components", "Component scores", "Reading, writing, listening, speaking")}{field("testDate", "Test date", "DD Month YYYY")}{field("expiry", "Valid until", "If applicable")}{field("retake", "Planned retake", "Date or not planned")}</div></section>}
        {tab === "preferences" && <section className="profile-tab-panel preferences-workspace"><div className="section-head"><div><span className="section-label">Study preferences</span><h3>What you are looking for</h3><p>Field: Business. Preferences shape matching—not readiness or admission probability.</p></div><Target size={19} /></div><div className="preference-section"><div><strong>Business interests</strong><small>Select every field you would genuinely consider.</small></div><div className="preference-chip-grid">{["Business Administration", "Management", "International Business", "Marketing", "Entrepreneurship", "Finance", "Accounting", "Economics", "Business Analytics", "Supply Chain & Operations", "Human Resources", "Hospitality & Tourism", "Real Estate", "Sports Business", "Luxury Management", "Sustainability & Social Enterprise"].map((item) => <button key={item} disabled={!editing || avoidedFields.includes(item)} className={selectedFields.includes(item) ? "selected" : ""} onClick={() => toggleField(item)}>{selectedFields.includes(item) && <Check size={12} />}{item}</button>)}</div></div><div className="preference-section"><div><strong>Prefer to avoid</strong><small>Optional. A field cannot be selected and avoided at the same time.</small></div><div className="preference-chip-grid avoid">{["Business Administration", "Management", "International Business", "Marketing", "Entrepreneurship", "Finance", "Accounting", "Economics", "Business Analytics", "Supply Chain & Operations", "Human Resources", "Hospitality & Tourism", "Real Estate", "Sports Business", "Luxury Management", "Sustainability & Social Enterprise"].map((item) => <button key={item} disabled={!editing || selectedFields.includes(item)} className={avoidedFields.includes(item) ? "selected" : ""} onClick={() => toggleAvoidedField(item)}>{avoidedFields.includes(item) && <X size={12} />}{item}</button>)}</div></div><div className="preference-section"><div><strong>Practical limits</strong><small>Leave a field blank when it should not restrict results.</small></div><div className="profile-form-grid">{field("degree", "Degree route", "Bachelor’s or foundation route")}{field("countries", "Countries / regions", "Countries you would consider")}{field("language", "Teaching language", "Preferred language")}{field("budget", "Maximum annual tuition", "Amount and currency")}{field("intake", "Preferred intake", "e.g. September 2027")}{field("math", "Math comfort", "Low, moderate or high")}</div></div><div className="preference-section"><div><strong>Opportunity priorities</strong><small>Click a priority while editing to cycle through its importance.</small></div><div className="profile-priority-grid">{Object.entries(preferencePriorities).map(([item, value]) => <button key={item} disabled={!editing} onClick={() => cyclePreference(item)}><span><strong>{item}</strong><small>{item === "Internships" ? "Work-integrated experience" : item === "Exchange" ? "International study" : item === "Career services" ? "Employer and career support" : item === "Entrepreneurship support" ? "Incubators and venture support" : item === "Scholarships" ? "Official funding opportunities" : "Real company projects"}</small></span><em className={value.toLowerCase().replace(" ", "-")}>{value}</em></button>)}</div></div><div className="preference-note"><CircleHelp size={14} /><span><strong>How MyWay uses this</strong><small>Must-have criteria are checked first. Preferred features improve ordering. No preference does not affect results.</small></span></div></section>}
        {tab === "experience" && <section className="profile-tab-panel"><div className="section-head"><div><span className="section-label">Experience</span><h3>Activities and evidence</h3><p>Record the experience first; attach supporting files in Documents.</p></div><BriefcaseBusiness size={19} /></div><div className="profile-form-grid">{field("activities", "Activities", "Clubs, projects and responsibilities")}{field("leadership", "Leadership", "Role, contribution and impact")}{field("volunteering", "Volunteering", "Organisation, work and result")}{field("competitions", "Competitions", "Event, level and achievement")}{field("work", "Work / internships", "Organisation, role and dates")}{field("portfolio", "Portfolio link", "Public portfolio URL")}</div></section>}
        {tab === "documents" && <section className="profile-tab-panel"><div className="section-head"><div><span className="section-label">Shared documents</span><h3>Reusable files</h3><p>Upload once and reuse the same file across Pathway requirements.</p></div><button className="outline-button compact" onClick={() => { setSelectingDocument(null); setVaultOpen(true); }}><FolderOpen size={14} /> My Documents</button></div><div className="profile-document-list">{[["passport", "Passport / identity document", "PDF or image"], ["transcript", "Academic transcript", "Latest official or school-issued record"], ["certificate", "School certificate", "Completed or expected qualification"], ["cv", "CV / résumé", "Current general version"], ["english", "English certificate", "Official result document"], ["portfolio", "Portfolio evidence", "Certificates, outputs or supporting work"]].map(([key, label, note]) => { const linked = vaultDocuments.find((document) => document.id === documentLinks[profileLinkKey(key)]); return <DocumentRequirementRow key={key} label={label} help={note} filename={documents[key] || ""} document={linked} onUpload={(file) => uploadProfileDocument(key, label, file)} onChoose={() => { setSelectingDocument({ key, label }); setVaultOpen(true); }} onView={() => linked && viewProfileDocument(linked)} onDownload={() => linked && downloadProfileDocument(linked)} onUnlink={() => unlinkProfileDocument(key)} />; })}</div><p className="prototype-file-note"><CircleHelp size={13} /> File contents stay in this browser, separated by account. File names and links sync to your account; download important files for backup.</p></section>}
      </main>
    </div>
    {vaultOpen && <DocumentVaultModal onImported={reloadVault} documents={vaultDocuments} links={documentLinks} selecting={selectingDocument} onClose={() => { setVaultOpen(false); setSelectingDocument(null); }} onSelect={chooseProfileDocument} onView={viewProfileDocument} onDownload={downloadProfileDocument} onDelete={deleteProfileDocument} onUpload={addGeneralProfileDocument} />}
    {previewDocument && previewUrl && <DocumentPreviewModal document={previewDocument} url={previewUrl} onClose={() => { setPreviewDocument(null); setPreviewUrl(""); }} onDownload={() => downloadProfileDocument(previewDocument)} />}
  </div>;
}

function SettingsPage({ notifications, onNotificationsChange, toast, savedCount, applicationCount, replayTutorial, go, language, setLanguage, theme, setTheme, adminVisible }: { notifications: boolean; onNotificationsChange: (value: boolean) => void; toast: (s: string) => void; savedCount: number; applicationCount: number; replayTutorial: () => void; go: (view: View) => void; language: "en" | "id"; setLanguage: (value: "en" | "id") => void; theme: "light" | "dark" | "system"; setTheme: (value: "light" | "dark" | "system") => void; adminVisible: boolean }) {
  const [documentCount, setDocumentCount] = useState(0);
  useEffect(() => { listVaultDocuments().then((items) => setDocumentCount(items.length)).catch(() => setDocumentCount(0)); }, []);
  const exportData = async () => { const payload = await createPrototypeExport(); const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `myway-planning-data-${new Date().toISOString().slice(0, 10)}.json`; anchor.style.display = "none"; window.document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); toast("MyWay planning data downloaded"); };
  const importData = async (file: File) => { try { if (file.size > 5 * 1024 * 1024) throw new Error("Backup too large"); importPrototypeExport(JSON.parse(await file.text())); toast(language === "id" ? "Data MyWay dipulihkan · memuat ulang" : "MyWay data restored · reloading"); window.setTimeout(() => window.location.reload(), 500); } catch (error) { const storageFailed = error instanceof Error && error.message === "Backup could not be restored to device storage"; toast(storageFailed ? (language === "id" ? "Penyimpanan perangkat tidak tersedia. Kosongkan ruang lalu coba lagi." : "Device storage is unavailable. Free some space and try again.") : (language === "id" ? "File ini bukan cadangan MyWay yang didukung." : "This is not a supported MyWay data file")); } };
  const resetData = async () => { if (!window.confirm(language === "id" ? "Hapus cache perangkat dan file dokumen lokal secara permanen? Data perencanaan akun akan dimuat kembali saat masuk." : "Clear this device cache and permanently delete its local document files? Account-synced planning data will reload when you sign in.")) return; try { const userId = window.localStorage.getItem("myway-active-user-id"); await clearVaultDocuments(); if (userId) window.localStorage.removeItem(`myway-sync-base:${userId}`); MYWAY_LOCAL_KEYS.forEach((key) => window.localStorage.removeItem(key)); window.localStorage.removeItem("myway-active-user-id"); window.location.reload(); } catch { toast(language === "id" ? "Data perangkat tidak dapat dihapus sepenuhnya. Coba lagi sebelum menutup browser." : "Device data could not be fully cleared. Try again before closing the browser."); } };
  const toggleNotifications = () => { const next = !notifications; onNotificationsChange(next); toast(next ? "In-app notifications enabled" : "In-app notifications paused"); };
  const id = language === "id";
  return <div className="page-enter settings-page" data-tour="settings-main">
    <section className="settings-heading"><div><span className="eyebrow">{id ? "Preferensi MyWay" : "MyWay preferences"}</span><h2>{id ? "Pengaturan" : "Settings"}</h2><p>{id ? "Atur tampilan, bahasa, pengingat, dan data perangkat. Informasi akademik tetap dikelola di Profil." : "Control appearance, language, reminders and device data. Your academic information stays in Profile."}</p></div><button className="outline-button" onClick={() => go("profile")}><CircleUserRound size={15} /> {id ? "Buka Profil" : "Open Profile"}</button></section>
    <div className="settings-layout">
      <nav className="settings-section-nav" aria-label="Settings sections"><a href="#general"><Settings2 size={15}/>{id ? "Umum" : "General"}</a><a href="#notifications"><Bell size={15}/>{id ? "Notifikasi" : "Notifications"}</a><a href="#data"><HardDrive size={15}/>{id ? "Data & Penyimpanan" : "Data & Storage"}</a><a href="#privacy"><LockKeyhole size={15}/>{id ? "Privasi & Keamanan" : "Privacy & Security"}</a>{adminVisible && <a href="#admin"><ShieldCheck size={15}/>{id ? "Admin" : "Admin"}</a>}<a href="#help"><LifeBuoy size={15}/>{id ? "Bantuan" : "Help"}</a></nav>
      <div className="settings-content">
        <section id="general" className="card settings-panel"><div className="settings-panel-head"><span><Settings2 size={18}/></span><div><h3>{id ? "Umum" : "General"}</h3><p>{id ? "Pilih bagaimana MyWay terlihat dan berkomunikasi denganmu." : "Choose how MyWay looks and communicates with you."}</p></div></div><div className="setting-row setting-row-stack"><div><strong>{id ? "Tampilan" : "Appearance"}</strong><small>{id ? "Mode terang tersedia sekarang. Mode gelap akan hadir nanti." : "Light mode is available now. Dark mode is upcoming."}</small></div><div className="theme-picker theme-picker-compact"><button className={theme === "light" ? "selected" : ""} onClick={()=>setTheme('light')}><Sun size={16}/><span>{id?'Terang':'Light'}</span><Check size={14}/></button><button className="coming-soon" disabled aria-disabled="true"><Moon size={16}/><span>{id?'Gelap':'Dark'}</span><small>{id?'Segera hadir':'Upcoming'}</small></button></div></div><div className="setting-row"><div><strong>{id ? "Bahasa" : "Language"}</strong><small>{id ? "Terapkan bahasa pilihanmu ke seluruh halaman MyWay." : "Apply your preferred language across every MyWay page."}</small></div><div className="segmented-control" role="group" aria-label="Language"><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>English</button><button className={language==='id'?'active':''} onClick={()=>setLanguage('id')}>Bahasa Indonesia</button></div></div></section>
        <section id="notifications" className="card settings-panel"><div className="settings-panel-head"><span><Bell size={18}/></span><div><h3>{id ? "Notifikasi" : "Notifications"}</h3><p>{id ? "Pilih apakah MyWay menampilkan pengingat perencanaan di aplikasi." : "Choose whether MyWay shows planning reminders inside the app."}</p></div></div><button className={`settings-toggle ${notifications ? "on" : ""}`} onClick={toggleNotifications} role="switch" aria-checked={notifications}><span><strong>{id ? "Pengingat dalam aplikasi" : "In-app reminders"}</strong><small>{notifications ? (id ? "Aktif" : "Enabled") : (id ? "Dijeda" : "Paused")}</small></span><i /></button><p className="settings-footnote">{id ? "Pengingat dalam aplikasi menggunakan tenggat tercatat dan tugas perencanaan saat MyWay terbuka. Notifikasi email dan push belum tersedia." : "In-app reminders use recorded deadlines and planning tasks while MyWay is open. Email and push notifications are not available."}</p></section>
        <section id="data" className="card settings-panel"><div className="settings-panel-head"><span><HardDrive size={18}/></span><div><h3>{id ? "Data & Penyimpanan" : "Data & Storage"}</h3><p>{id ? "Lihat data lokal, buat cadangan, atau pulihkan perencanaanmu." : "Review local data, create a backup, or restore your planning workspace."}</p></div></div><div className="settings-stats"><button onClick={() => go("profile")}><strong>{documentCount}</strong><small>{id ? "File tersimpan" : "Stored files"}</small></button><span><strong>{savedCount}</strong><small>{id ? "Universitas tersimpan" : "Saved universities"}</small></span><span><strong>{applicationCount}</strong><small>{id ? "Pilihan di Pathway" : "Pathway choices"}</small></span></div><div className="settings-actions"><button className="primary-button" onClick={exportData}><Download size={14}/>{id ? "Ekspor data" : "Export data"}</button><label className="outline-button"><Upload size={14}/>{id ? "Pulihkan data" : "Restore data"}<input type="file" accept="application/json,.json" onChange={(event)=>{const file=event.currentTarget.files?.[0];if(file)importData(file);event.currentTarget.value="";}}/></label><button className="outline-button" onClick={()=>go("profile")}><FolderOpen size={14}/>{id ? "Buka dokumen" : "Open documents"}</button></div><p className="settings-footnote">{id ? "Cadangan mencakup data perencanaan. File dokumen perlu diunduh terpisah dari Profil." : "Backups include planning data. Document files must be downloaded separately from Profile."}</p></section>
        <section id="privacy" className="card settings-panel"><a href="/privacy" className="privacy-notice-link">{id ? "Baca pemberitahuan privasi & bantuan" : "Read privacy & support notice"}</a><div className="settings-panel-head"><span><LockKeyhole size={18}/></span><div><h3>{id ? "Privasi & Keamanan" : "Privacy & Security"}</h3><p>{id ? "Data perencanaan tersinkron ke akun. File dokumen disimpan secara lokal." : "Planning data syncs securely to your account. Document files are stored locally."}</p></div></div><div className="privacy-note"><ShieldCheck size={18}/><span><strong>{id ? "Penyimpanan lokal" : "Local storage"}</strong><small>{id ? "Profil, pilihan universitas, tugas, dan progres pathway tersinkron ke akun. File dokumen tetap di perangkat ini." : "Your profile, university choices, tasks and pathway progress sync to your account. Uploaded document files remain on this device."}</small></span></div><div className="danger-row"><div><strong>{id ? "Hapus data perangkat" : "Clear device data"}</strong><small>{id ? "Menghapus cache browser dan file dokumen lokal. Data perencanaan akun tetap tersimpan." : "Clears this browser’s cache and permanently deletes local document files. Account planning data is retained."}</small></div><button className="outline-button danger-action" onClick={resetData}><Trash2 size={14}/>{id ? "Hapus data" : "Clear data"}</button></div></section>
        {adminVisible && <section id="admin" className="card settings-panel admin-settings-panel"><div className="settings-panel-head"><span><ShieldCheck size={18}/></span><div><h3>{id ? "Ruang Admin" : "Admin Workspace"}</h3><p>{id ? "Kelola tinjauan data dan masukan pengguna di ruang pribadi MyWay." : "Manage data review and user feedback in your private MyWay workspace."}</p></div></div><div className="help-row"><div><strong>{id ? "Buka panel admin" : "Open admin panel"}</strong><small>{id ? "Hanya akun pemilik MyWay yang dapat membuka halaman ini." : "Only the MyWay owner account can open this page."}</small></div><a className="primary-button" href="/admin/data" target="_blank" rel="noreferrer"><ShieldCheck size={14}/>{id ? "Buka Admin" : "Open Admin"}</a></div></section>}
        <section id="help" className="card settings-panel"><div className="settings-panel-head"><span><LifeBuoy size={18}/></span><div><h3>{id ? "Bantuan" : "Help"}</h3><p>{id ? "Pelajari kembali alur MyWay kapan pun kamu membutuhkannya." : "Revisit the MyWay workflow whenever you need a refresher."}</p></div></div><div className="help-row"><div><strong>{id ? "Tur terpandu MyWay" : "MyWay Guided Tour"}</strong><small>{id ? "Lihat cara Jelajahi, Bandingkan, Pathway, kesiapan, tugas, dan dokumen saling terhubung." : "See how Explore, Compare, Pathway, readiness, tasks and documents work together."}</small></div><button className="outline-button" onClick={replayTutorial}><BookOpen size={14}/>{id ? "Mulai ulang tur" : "Restart tour"}</button></div></section>
      </div>
    </div>
  </div>;
}

type TutorialStep = { view: View; target?: string; en: { title: string; body: string }; id: { title: string; body: string } };
const tutorialSteps: TutorialStep[] = [
  { view: "dashboard", en: { title: "Welcome to MyWay", body: "This short tour shows how every part of MyWay works together to support your university journey." }, id: { title: "Selamat datang di MyWay", body: "Tur singkat ini menunjukkan bagaimana setiap bagian MyWay saling terhubung untuk mendukung perjalanan universitasmu." } },
  { view: "dashboard", target: ".no-target-gate, .dashboard-grid", en: { title: "Start from your Dashboard", body: "See your current application readiness, planning overview, and the most useful action to take next." }, id: { title: "Mulai dari Dasbor", body: "Lihat kesiapan aplikasi, ringkasan perencanaan, dan tindakan paling berguna yang perlu kamu lakukan berikutnya." } },
  { view: "explore", target: ".search-card", en: { title: "Discover the right options", body: "Search and filter universities and undergraduate business programmes using the criteria that matter to you." }, id: { title: "Temukan pilihan yang tepat", body: "Cari dan saring universitas serta program sarjana bisnis berdasarkan kriteria yang penting bagimu." } },
  { view: "explore", target: ".program-list > article:first-child, .results-head", en: { title: "Save, compare, and review", body: "Each result lets you save an option, compare it with other universities, review verified details, or add it to your Pathway." }, id: { title: "Simpan, bandingkan, dan tinjau", body: "Setiap hasil dapat disimpan, dibandingkan dengan universitas lain, ditinjau detail terverifikasinya, atau ditambahkan ke Pathway." } },
  { view: "pathway", target: ".dream-pathway-card, .pathway-empty-dream, .pathway-application-switcher", en: { title: "Build your Pathway", body: "Organise Dream, Target, and Alternative choices. Each university keeps its own requirements, evidence, and progress." }, id: { title: "Susun Pathway milikmu", body: "Atur pilihan Dream, Target, dan Alternative. Setiap universitas memiliki persyaratan, bukti, dan progres tersendiri." } },
  { view: "pathway", target: ".pathway-stage:first-child > .pathway-stage-toggle", en: { title: "Follow the application journey", body: "Open each of the nine stages to review requirements, add your evidence, and complete the actions for that application." }, id: { title: "Ikuti perjalanan aplikasi", body: "Buka masing masing dari sembilan tahap untuk meninjau persyaratan, menambahkan bukti, dan menyelesaikan tindakan untuk aplikasi tersebut." } },
  { view: "tasks", target: ".tasks-page > article, .tasks-intro", en: { title: "Turn plans into weekly action", body: "Switch between Weekly actions and Habit tracker to complete focused tasks and build a repeatable routine." }, id: { title: "Ubah rencana menjadi tindakan mingguan", body: "Beralih antara Tindakan mingguan dan Pelacak kebiasaan untuk menyelesaikan tugas fokus dan membangun rutinitas berulang." } },
  { view: "progress", target: ".progress-hero, .progress-empty", en: { title: "Check your readiness", body: "Progress combines requirements, records, evidence, and actions for each application. It measures preparation, not admission probability." }, id: { title: "Periksa kesiapanmu", body: "Progres menggabungkan persyaratan, catatan, bukti, dan tindakan untuk setiap aplikasi. Ini mengukur persiapan, bukan peluang penerimaan." } },
  { view: "profile", target: ".profile-workspace-hero, .profile-workspace", en: { title: "Keep reusable details in Profile", body: "Store education, test results, preferences, experience, and documents once so they can support every application." }, id: { title: "Simpan detail yang dapat digunakan kembali di Profil", body: "Simpan pendidikan, hasil tes, preferensi, pengalaman, dan dokumen sekali agar dapat mendukung setiap aplikasi." } },
  { view: "profile", target: "[data-tour='settings-button']", en: { title: "Open Settings here", body: "Use the Settings button in the top right corner to change language, appearance, reminders, privacy, and device data." }, id: { title: "Buka Pengaturan di sini", body: "Gunakan tombol Pengaturan di pojok kanan atas untuk mengubah bahasa, tampilan, pengingat, privasi, dan data perangkat." } },
  { view: "settings", target: "#general", en: { title: "Make MyWay yours", body: "Choose your language and appearance here. Settings also manages reminders, local data, privacy, and access to this tour." }, id: { title: "Sesuaikan MyWay untukmu", body: "Pilih bahasa dan tampilan di sini. Pengaturan juga mengelola pengingat, data lokal, privasi, dan akses ke tur ini." } },
  { view: "settings", target: "[data-tour='feedback-button']", en: { title: "Tell us what could be better", body: "Open Feedback from any page to report a problem, flag incorrect information, or share a suggestion." }, id: { title: "Beri tahu kami apa yang dapat diperbaiki", body: "Buka Masukan dari halaman mana pun untuk melaporkan masalah, menandai informasi yang salah, atau membagikan saran." } },
];

function ProductTutorial({ close, go, language }: { close: () => void; go: (view: View) => void; language: "en" | "id" }) {
  const [step, setStep] = useState(0);
  const [measuredFocus, setMeasuredFocus] = useState<{ step: number; box: { top: number; left: number; width: number; height: number } } | null>(null);
  const focus = measuredFocus?.step === step ? measuredFocus.box : null;
  const targetRef = useRef<HTMLElement[]>([]);
  const current = tutorialSteps[step];
  const copy = current[language];
  const id = language === "id";
  const finish = () => { window.localStorage.setItem("myway-product-tour-v2", "complete"); go("dashboard"); close(); };
  const dialogRef = useDialogFocus(finish);

  useLayoutEffect(() => {
    go(current.view);
    targetRef.current = [];
    let frame = 0;
    let observer: ResizeObserver | null = null;
    const measure = () => {
      const targets = targetRef.current;
      if (!targets.length) { setMeasuredFocus(null); return; }
      const boxes = targets.map((target) => target.getBoundingClientRect()).filter((box) => box.width > 0 && box.height > 0);
      if (!boxes.length) { setMeasuredFocus(null); return; }
      const box = { top: Math.min(...boxes.map((item) => item.top)), left: Math.min(...boxes.map((item) => item.left)), right: Math.max(...boxes.map((item) => item.right)), bottom: Math.max(...boxes.map((item) => item.bottom)) };
      const padding = 7;
      const top = Math.max(7, box.top - padding);
      const left = Math.max(7, box.left - padding);
      const right = Math.min(window.innerWidth - 7, box.right + padding);
      const bottom = Math.min(window.innerHeight - 7, box.bottom + padding);
      if (right <= left || bottom <= top) { setMeasuredFocus(null); return; }
      setMeasuredFocus({ step, box: { top, left, width: right - left, height: bottom - top } });
    };
    const settle = () => {
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          const selectors = current.target?.split(",").map((selector) => selector.trim()).filter(Boolean) ?? [];
          const targets: HTMLElement[] = [];
          for (const selector of selectors) {
            const candidate = document.querySelector<HTMLElement>(selector);
            if (!candidate) continue;
            const box = candidate.getBoundingClientRect();
            if (box.width > 0 && box.height > 0) { targets.push(candidate); break; }
          }
          targetRef.current = targets;
          if (!targets.length) { setMeasuredFocus(null); return; }
          const fixedControl = targets[0].matches("[data-tour='settings-button'], [data-tour='feedback-button']");
          if (!fixedControl) targets[0].scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
          let trackingFrames = 0;
          const trackEntrance = () => {
            measure();
            trackingFrames += 1;
            if (trackingFrames < 45) frame = window.requestAnimationFrame(trackEntrance);
          };
          trackEntrance();
          observer = new ResizeObserver(measure);
          targets.forEach((target) => observer?.observe(target));
        });
      });
    };
    const openTimer = window.setTimeout(settle, 40);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { window.clearTimeout(openTimer); window.cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [step, current.target, current.view, go]);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight" && step < tutorialSteps.length - 1) setStep((value) => value + 1);
      if (event.key === "ArrowLeft" && step > 0) setStep((value) => value - 1);
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  });

  return <div ref={dialogRef as React.RefObject<HTMLDivElement>} tabIndex={-1} className="product-tour-layer" data-no-translate role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
    {!focus && <div className="tour-scrim" />}
    {focus && <div key={`spotlight-${step}`} className="tour-spotlight" style={{ top: focus.top, left: focus.left, width: focus.width, height: focus.height }} />}
    <section className={`tour-coachmark ${focus ? `positioned ${focus.top + focus.height / 2 > window.innerHeight / 2 ? "top" : "bottom"}` : "centered"}`} aria-live="polite">
      <header><span className="tour-step">{id ? "Langkah" : "Step"} {step + 1} {id ? "dari" : "of"} {tutorialSteps.length}</span><button className="text-link" onClick={finish}>{id ? "Lewati tur" : "Skip tour"}</button></header>
      <div className="tour-heading"><span><Sparkles size={18} /></span><div><h2 id="tutorial-title">{copy.title}</h2><p>{copy.body}</p></div></div>
      <div className="tour-progress" style={{ gridTemplateColumns: `repeat(${tutorialSteps.length}, 1fr)` }} aria-hidden="true">{tutorialSteps.map((item, index) => <i key={`${item.view}-${index}`} className={index <= step ? "active" : ""} />)}</div>
      <footer><button className="outline-button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>{id ? "Kembali" : "Back"}</button>{step < tutorialSteps.length - 1 ? <button className="primary-button" onClick={() => setStep((value) => value + 1)}>{id ? "Berikutnya" : "Next"} <ChevronRight size={14} /></button> : <button className="primary-button" onClick={finish}>{id ? "Selesai" : "Finish"} <Check size={14} /></button>}</footer>
    </section>
  </div>;
}

function PlanningGuide({ close, go }: { close: () => void; go: (view: View) => void }) {
  const dialogRef = useDialogFocus(close);
  const steps: { title: string; body: string; view: View; action: string }[] = [
    { title: "Build your student profile", body: "Record education, English results, business interests and reusable evidence.", view: "profile", action: "Open Profile" },
    { title: "Explore with evidence", body: "Search and compare undergraduate business routes. Rankings remain separate from programme facts.", view: "explore", action: "Explore universities" },
    { title: "Create your shortlist", body: "Choose one Dream and add Target or Alternative applications without losing their separate progress.", view: "pathway", action: "Open Pathway" },
    { title: "Prepare each application", body: "Complete the nine Pathway stages, store evidence, and submit through the university’s official portal.", view: "progress", action: "View Progress" },
  ];
  return <div className="modal-backdrop guide-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><section ref={dialogRef} tabIndex={-1} className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="planning-guide-title"><header><span><span className="eyebrow">MyWay guide</span><h2 id="planning-guide-title">From discovery to application</h2><p>MyWay organises preparation. Final applications are submitted through official university portals.</p></span><button className="icon-button" aria-label="Close planning guide" onClick={close}><X size={18} /></button></header><div>{steps.map((step, index) => <article key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.body}</p><button className="text-link" onClick={() => { go(step.view); close(); }}>{step.action} <ChevronRight size={13} /></button></div></article>)}</div><footer><CircleHelp size={14} /><span>Fit scores describe preference alignment. Readiness tracks preparation—not admission probability.</span></footer></section></div>;
}

function AccountGate({ language, ready, openAccount }: { language: "en" | "id"; ready: boolean; openAccount: () => void }) {
  const id = language === "id";
  return <main className="account-gate">
    <section className="account-gate-card">
      <div className="brand account-gate-brand"><span className="brand-mark"><img src="/myway-mark.png" alt="" /></span><span><strong><b>My</b><em>Way</em></strong><small>Explore · Plan · Go Further</small></span></div>
      {!ready ? <div className="account-gate-loading"><i /><span>{id ? "Menyiapkan MyWay" : "Preparing MyWay"}</span></div> : <>
        <span className="account-gate-icon"><ShieldCheck size={25} /></span>
        <span className="eyebrow">{id ? "RUANG PRIBADIMU" : "YOUR PRIVATE WORKSPACE"}</span>
        <h1>{id ? "Masuk sebelum mulai merencanakan." : "Sign in before you start planning."}</h1>
        <p>{id ? "Progres, profil, universitas tersimpan, dan jalur aplikasi hanya ditampilkan setelah kamu masuk ke akun MyWay." : "Your progress, profile, saved universities, and application pathway only appear after you sign in to MyWay."}</p>
        <button className="primary-button account-gate-action" onClick={openAccount}><CircleUserRound size={17} />{id ? "Masuk atau buat akun" : "Sign in or create account"}</button>
        <a href="/privacy" className="privacy-notice-link">{id ? "Privasi & bantuan" : "Privacy & support"}</a>
        <div className="account-gate-note"><LockKeyhole size={14} /><span>{id ? "Tidak ada progres pribadi yang ditampilkan kepada pengunjung." : "No personal progress is shown to visitors."}</span></div>
      </>}
    </section>
  </main>;
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [compared, setCompared] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [pathway, setPathway] = useState<{ p: Program; role: Role }[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [pathwayRecords, setPathwayRecords] = useState<Record<string, string>>({});
  const [profileSnapshot, setProfileSnapshot] = useState<ProfileSnapshot>({});
  const [profileDocuments, setProfileDocuments] = useState<Record<string, string>>({});
  const [preferencePriorities, setPreferencePriorities] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderDate, setReminderDate] = useState(() => localCalendarDate(new Date()));
  useEffect(() => {
    const refresh = () => setReminderDate(localCalendarDate(new Date()));
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const [guideOpen, setGuideOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>();
  const [feedbackContext, setFeedbackContext] = useState<FeedbackContext>({});
  const [toast, setToast] = useState("");
  const [pathwayStage, setPathwayStage] = useState(0);
  const [pathwayApplicationId, setPathwayApplicationId] = useState("");
  const [avatar, setAvatarState] = useState("MW");
  const [language, setLanguageState] = useState<"en" | "id">("en");
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system");
  const [adminVisible, setAdminVisible] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [completedAccountLoad, setCompletedAccountLoad] = useState<{ userId: string; attempt: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState("Loading account data…");
  const [pendingConflict, setPendingConflict] = useState<{ userId: string; attempt: number; value: SyncConflict } | null>(null);
  const [syncAttempt, setSyncAttempt] = useState<{ count: number; choice?: "local" | "remote" }>({ count: 0 });
  const [syncGeneration, setSyncGeneration] = useState(0);
  const accountUserId = session?.user.id;
  const accountCreatedAt = session?.user.created_at || "";
  const accountLastSignInAt = session?.user.last_sign_in_at || "";
  const accountPhoto = session?.user.user_metadata?.avatar_url || session?.user.user_metadata?.picture;
  const accountDisplayName = String(session?.user.user_metadata?.full_name || session?.user.user_metadata?.name || session?.user.email || "MW");
  const accountDataReady = authReady && !!accountUserId && completedAccountLoad?.userId === accountUserId && completedAccountLoad.attempt === syncAttempt.count;
  const syncConflict = pendingConflict?.userId === accountUserId && pendingConflict?.attempt === syncAttempt.count ? pendingConflict.value : null;
  const [hydratedAccount, setHydratedAccount] = useState<{ userId: string; attempt: number } | null>(null);
  const accountDisplayReady = accountDataReady && hydratedAccount?.userId === accountUserId && hydratedAccount.attempt === syncAttempt.count;
  const [authOpen, setAuthOpen] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!accountDataReady) return;
    const loadProfile = () => {
      try { setProfileSnapshot(JSON.parse(window.localStorage.getItem("myway-profile") || "{}")); } catch { setProfileSnapshot({}); }
      try { setProfileDocuments(JSON.parse(window.localStorage.getItem("myway-profile-documents") || "{}")); } catch { setProfileDocuments({}); }
      try { setPreferencePriorities(JSON.parse(window.localStorage.getItem("myway-preference-priorities") || "{}")); } catch { setPreferencePriorities({}); }
    };
    const hydrate = () => {
      setRemindersEnabled(window.localStorage.getItem("myway-notifications-enabled") !== "false");
      const complete = window.localStorage.getItem("myway-onboarding-v1") || window.localStorage.getItem("alif-pathway-business-v1");
      setOnboarded(complete === "complete");
      setTutorialOpen(complete === "complete" && !window.localStorage.getItem("myway-product-tour-v2"));
      const hash = window.location.hash.replace("#", "");
      if (hash === "account") { setView("settings"); window.history.replaceState(null, "", "#settings"); }
      else if (hash === "settings") setView("settings");
      else if (navItems.some((item) => item.id === hash)) setView(hash as View);
      try { setPathwayRecords(JSON.parse(window.localStorage.getItem("myway-pathway-records") || "{}")); } catch { setPathwayRecords({}); }
      try {
        const storedPathway = JSON.parse(window.localStorage.getItem("myway-pathway-selection") || "[]") as { id: string; role: Role }[];
        setPathway(storedPathway.flatMap(({ id, role }) => {
          const program = programs.find((item) => item.id === id);
          if (program) return [{ p: program, role }];
          if (id.startsWith("school:")) {
            const school = allBusinessSchools.find((item) => item.id === id.slice("school:".length));
            if (school && schoolStudy(school).status === "bachelor") return [{ p: schoolAsProgram(school), role }];
          }
          return [];
        }));
      } catch { setPathway([]); }
      try { setCompleted(JSON.parse(window.localStorage.getItem("myway-pathway-actions") || "[]")); } catch { setCompleted([]); }
      try { setSaved(JSON.parse(window.localStorage.getItem("myway-saved") || "[]")); } catch { setSaved([]); }
      try { setCompared(JSON.parse(window.localStorage.getItem("myway-compared") || "[]")); } catch { setCompared([]); }
      setAvatarState(window.localStorage.getItem("myway-profile-avatar") || "MW");
      const storedLanguage = window.localStorage.getItem("myway-language");
      if (storedLanguage === "en" || storedLanguage === "id") setLanguageState(storedLanguage);
      const storedTheme = window.localStorage.getItem("myway-theme");
      if (storedTheme === "light") setThemeState("light");
      else { setThemeState("light"); window.localStorage.setItem("myway-theme", "light"); }
      loadProfile();
      if (accountUserId) setHydratedAccount({ userId: accountUserId, attempt: syncAttempt.count });
    };
    const timer = window.setTimeout(hydrate, 0);
    const refresh = () => { hydrate(); setSyncGeneration(value => value + 1); };
    window.addEventListener("myway-account-updated", refresh);
    window.addEventListener("myway-profile-updated", loadProfile);
    return () => { window.clearTimeout(timer); window.removeEventListener("myway-account-updated", refresh); window.removeEventListener("myway-profile-updated", loadProfile); };
  }, [accountDataReady, accountUserId, syncAttempt.count]);
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    getSupabaseClient().then(async (supabase) => {
      const { data } = await supabase.auth.getSession();
      if (active) { setSession(data.session); setAuthReady(true); }
      const listener = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        if (!nextSession) { setCompletedAccountLoad(null); setPendingConflict(null); setHydratedAccount(null); }
        if (event === "PASSWORD_RECOVERY") { setPasswordRecovery(true); setAuthOpen(true); }
        if (event === "SIGNED_IN") setPasswordRecovery(false);
      });
      unsubscribe = () => listener.data.subscription.unsubscribe();
    }).catch(() => { if (active) setAuthReady(true); });
    return () => { active = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!authReady || !accountUserId) return;
    const accountKeys = [...MYWAY_LOCAL_KEYS, "myway-profile-avatar", "myway-product-tour-v2"] as const;
    const activeUserKey = "myway-active-user-id";
    const previousUserId = window.localStorage.getItem(activeUserKey);
    const currentUserId = accountUserId;
    if (previousUserId && previousUserId !== currentUserId) {
      const previousData: Record<string, string> = {};
      accountKeys.forEach((key) => { const value = window.localStorage.getItem(key); if (value !== null) previousData[key] = value; });
      window.localStorage.setItem(`myway-account-data:${previousUserId}`, JSON.stringify(previousData));
    }
    const createdAt = Date.parse(accountCreatedAt);
    const lastSignInAt = Date.parse(accountLastSignInAt);
    const isFirstSignIn = Number.isFinite(createdAt) && Number.isFinite(lastSignInAt) && Math.abs(lastSignInAt - createdAt) < 15 * 60 * 1000;
    if (previousUserId !== currentUserId && (previousUserId !== null || isFirstSignIn)) {
      accountKeys.forEach((key) => window.localStorage.removeItem(key));
      try {
        const saved = JSON.parse(window.localStorage.getItem(`myway-account-data:${currentUserId}`) || "null") as Record<string, string> | null;
        if (saved) Object.entries(saved).forEach(([key, value]) => { if (accountKeys.includes(key as typeof accountKeys[number]) && typeof value === "string") window.localStorage.setItem(key, value); });
      } catch {}
    }
    if (!window.localStorage.getItem("myway-profile-avatar")) {
      const providerPhoto = accountPhoto;
      const fallback = accountDisplayName.trim().split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() || "MW";
      window.localStorage.setItem("myway-profile-avatar", typeof providerPhoto === "string" && /^https:\/\//.test(providerPhoto) ? providerPhoto : fallback);
    }
    window.localStorage.setItem(activeUserKey, currentUserId);
    let active = true;
    let stop = () => {};
    getSupabaseClient().then(client => {
      if (!active) return () => {};
      setSyncStatus("Loading account data…");
      return startAccountSync(client, currentUserId, {
      ready: () => { if (active) { setPendingConflict(null); setCompletedAccountLoad({ userId: currentUserId, attempt: syncAttempt.count }); } },
      changed: () => { if (active) window.dispatchEvent(new Event("myway-account-updated")); },
      conflict: value => { if (active) { setPendingConflict({ userId: currentUserId, attempt: syncAttempt.count, value }); setCompletedAccountLoad(null); } },
      status: value => { if (active) setSyncStatus(value); },
    }, syncAttempt.choice, () => active);
    }).then(cleanup => { if (active) stop = cleanup; else cleanup(); })
      .catch(() => { if (active) setSyncStatus("Account sync could not load. Your device data is preserved. Please retry."); });
    return () => { active = false; stop(); };
  }, [authReady, accountUserId, accountCreatedAt, accountLastSignInAt, accountPhoto, accountDisplayName, syncAttempt]);
  useEffect(() => {
    let active = true;
    const refreshAdminAccess = async () => {
      const headerAccess = fetch("/api/admin-visibility", { cache: "no-store" })
        .then((response) => response.ok ? response.json() as Promise<{ authorized?: boolean }> : { authorized: false })
        .then((data: { authorized?: boolean }) => data.authorized === true)
        .catch(() => false);
      let accountAccess = false;
      if (session?.user.id) {
        try {
          const supabase = await getSupabaseClient();
          const { data } = await supabase.from("profiles").select("role").eq("user_id", session.user.id).maybeSingle();
          accountAccess = data?.role === "admin";
        } catch {}
      }
      const trustedHeaderAccess = await headerAccess;
      if (active) setAdminVisible(accountAccess || trustedHeaderAccess);
    };
    void refreshAdminAccess();
    return () => { active = false; };
  }, [session]);
  const setAvatar = (value: string) => { setAvatarState(value); window.localStorage.setItem("myway-profile-avatar", value); };
  const setLanguage = (value: "en" | "id") => {
    window.localStorage.setItem("myway-language", value);
    setLanguageState(value);
    window.location.reload();
  };
  const setTheme = (value: "light" | "dark" | "system") => { setThemeState(value); window.localStorage.setItem("myway-theme", value); };
  const openFeedback = (category?: FeedbackCategory, context: FeedbackContext = {}) => { setFeedbackCategory(category); setFeedbackContext(context); setFeedbackOpen(true); };
  useEffect(() => { document.documentElement.dataset.theme = "light"; }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const go = useCallback((next: View) => {
    setView(next); setSelectedProgramId(null); setSelectedSchoolId(null); setNotices(false);
    window.history.replaceState(null, "", "#" + next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const openPathwayStage = (index: number, programId: string) => { setPathwayStage(index); setPathwayApplicationId(programId); go("pathway"); };
  const openProgram = (program: Program) => {
    setView("explore");
    if (program.id.startsWith("school:")) {
      setSelectedSchoolId(program.id.slice("school:".length));
      setSelectedProgramId(null);
      window.history.replaceState(null, "", "#explore");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSelectedProgramId(program.id);
    setSelectedSchoolId(null);
    window.history.replaceState(null, "", "#explore");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openSchool = (school: BusinessSchool) => {
    setView("explore");
    setSelectedSchoolId(school.id);
    setSelectedProgramId(null);
    window.history.replaceState(null, "", "#explore");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const finish = () => {
    window.localStorage.setItem("myway-onboarding-v1", "complete");
    try { setProfileSnapshot(JSON.parse(window.localStorage.getItem("myway-profile") || "{}")); } catch {}
    try { setPreferencePriorities(JSON.parse(window.localStorage.getItem("myway-preference-priorities") || "{}")); } catch {}
    setOnboarded(true); setView("explore"); setTutorialOpen(true); setToast("Profile ready · start with the quick MyWay tour");
  };
  const saveLater = () => {
    window.localStorage.setItem("myway-onboarding-v1", "complete");
    setOnboarded(true); setView("dashboard"); setTutorialOpen(true); setToast("Progress saved · start with the quick MyWay tour");
  };
  const toggleSaved = (id: string) => {
    const next = saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id];
    setSaved(next);
    window.localStorage.setItem("myway-saved", JSON.stringify(next));
    setToast(saved.includes(id) ? "Removed from saved programs" : "Program saved");
  };
  const toggleCompare = (id: string) => {
    if (compared.includes(id)) { const next = compared.filter((v) => v !== id); setCompared(next); window.localStorage.setItem("myway-compared", JSON.stringify(next)); return; }
    if (compared.length >= 4) { setToast("You can compare up to 4 programs"); setCompareOpen(true); return; }
    const next = [...compared, id]; setCompared(next); window.localStorage.setItem("myway-compared", JSON.stringify(next)); setToast("Added to comparison");
  };
  const addPath = (p: Program, role: Role = "Target") => {
    if (/no direct undergraduate/i.test(p.entry)) { setToast(`${p.university} has no direct bachelor pathway`); return; }
    setPathway((current) => {
      const withoutCurrent = current.filter((v) => v.p.id !== p.id);
      const singleDream = role === "Dream" ? withoutCurrent.map((item) => item.role === "Dream" ? { ...item, role: "Target" as Role } : item) : withoutCurrent;
      const next = [...singleDream, { p, role }];
      window.localStorage.setItem("myway-pathway-selection", JSON.stringify(next.map((item) => ({ id: item.p.id, role: item.role }))));
      return next;
    });
    setToast(p.university + " added as " + role);
  };
  const removePath = (p: Program) => {
    setPathway((current) => { const next = current.filter((item) => item.p.id !== p.id); window.localStorage.setItem("myway-pathway-selection", JSON.stringify(next.map((item) => ({ id: item.p.id, role: item.role })))); return next; });
    setToast(p.university + " removed from pathway");
  };
  const toggleSchoolPathway = (school: BusinessSchool) => {
    if (schoolStudy(school).status !== "bachelor") { setToast(`${school.name} is not available as a direct bachelor application`); return; }
    const program = school.programId ? programs.find((item) => item.id === school.programId) : undefined;
    const choice = program ?? schoolAsProgram(school);
    const alreadyAdded = pathway.some((item) => item.p.id === choice.id);
    setPathway((current) => { const next = alreadyAdded ? current.filter((item) => item.p.id !== choice.id) : [...current, { p: choice, role: "Target" as Role }]; window.localStorage.setItem("myway-pathway-selection", JSON.stringify(next.map((item) => ({ id: item.p.id, role: item.role })))); return next; });
    setToast(alreadyAdded ? `${school.name} removed from pathway` : `${school.name} added as Target`);
  };
  const toggleTask = (id: string) => setCompleted((current) => { const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id]; window.localStorage.setItem("myway-pathway-actions", JSON.stringify(next)); return next; });
  const updatePathwayRecord = (key: string, value: string) => {
    setPathwayRecords((current) => {
      const next = { ...current, [key]: value };
      window.localStorage.setItem("myway-pathway-records", JSON.stringify(next));
      return next;
    });
  };
  const dashboardProgram = pathway.find((item) => item.role === "Dream")?.p;
  const sharedRecord = (key: string) => {
    const profileMap: Record<string, string | undefined> = {
      intake: profileSnapshot.intake,
      qualification: profileSnapshot.curriculum,
      currentGrades: profileSnapshot.average,
      englishScore: profileSnapshot.score,
      englishTestDate: profileSnapshot.testDate,
      experience: profileSnapshot.activities || profileSnapshot.work || profileSnapshot.volunteering,
      portfolioLink: profileSnapshot.portfolio,
      budget: profileSnapshot.budget,
    };
    const documentMap: Record<string, string | undefined> = {
      "file-transcript": profileDocuments.transcript,
      "file-school-certificate": profileDocuments.certificate,
      "file-cv": profileDocuments.cv,
      "file-language-certificate": profileDocuments.english,
      "file-passport": profileDocuments.passport,
      "file-portfolio-evidence": profileDocuments.portfolio,
    };
    return profileMap[key] || documentMap[key] || "";
  };
  const recordFilled = (key: string, programId?: string) => Boolean((programId && pathwayRecords[`${programId}:${key}`])?.trim() || (programId === dashboardProgram?.id ? pathwayRecords[key]?.trim() : "") || sharedRecord(key).trim());
  const percentage = (checks: boolean[]) => checks.length ? Math.round(checks.filter(Boolean).length / checks.length * 100) : 0;
  const readinessFor = (program?: Program) => {
    if (!program) return { score: 0, stages: [] as ReadinessStage[] };
    const filled = (key: string) => recordFilled(key, program.id);
    const readinessBlueprint = [
    { label: "Programme & intake", requirements: [filled("intake"), filled("applicationRoute"), filled("firstCampus"), filled("programmeNotes")], records: ["intake", "applicationRoute", "firstCampus", "programmeNotes"], evidence: [filled("file-programme-notes") || filled("programmeNotes")], actions: ["programme", "intake", "application-route", "first-campus", "study-location"] },
    { label: "Entry requirements", requirements: [filled("qualification"), filled("deadline"), filled("translationPlan"), filled("selectionNotes"), filled("eligibilityNotes")], records: ["qualification", "deadline", "translationPlan", "selectionNotes", "eligibilityNotes"], evidence: [filled("file-requirements") || filled("eligibilityNotes")], actions: ["entry-route", "qualification", "deadline", "translation", "selection-step"] },
    { label: "Academic gaps", requirements: [filled("file-academic-evidence"), filled("currentGrades"), filled("prerequisiteNotes"), filled("mathEvidence"), filled("academicGapPlan")], records: ["currentGrades", "prerequisiteNotes", "mathEvidence", "academicGapPlan"], evidence: [filled("file-academic-evidence"), filled("file-math-evidence")], actions: ["academic-evidence", "academic-grades", "subject-prerequisites", "quant", "academic-gap-plan"] },
    { label: "English qualification", requirements: [filled("englishRequirement"), filled("englishScore"), filled("englishTestDate"), filled("file-language-certificate"), filled("englishStudyPlan")], records: ["englishRequirement", "englishScore", "englishTestDate", "englishStudyPlan"], evidence: [filled("file-language-certificate"), filled("file-english-plan") || filled("englishStudyPlan")], actions: ["english-requirement", "english", "english-date", "english-certificate", "english-plan"] },
    { label: "Experience & portfolio", requirements: [filled("experience"), filled("experienceImpact"), filled("portfolioRequirement"), filled("portfolioLink"), filled("file-portfolio-evidence")], records: ["experience", "experienceImpact", "portfolioRequirement", "portfolioLink", "portfolioNotes"], evidence: [filled("file-portfolio-evidence")], actions: ["experience", "experience-impact", "portfolio-requirement", "portfolio-link", "portfolio"] },
    { label: "Application documents", requirements: ["file-transcript", "file-school-certificate", "file-motivation", "file-cv", "file-language-certificate", "file-reference", "file-passport"].map(filled), records: ["cvStatus", "documentNotes"], evidence: ["file-transcript", "file-school-certificate", "file-motivation", "file-cv", "file-language-certificate", "file-reference", "file-passport"].map((key) => filled(key) || (key === "file-motivation" && filled("file-4"))), actions: ["doc-transcript", "doc-school-certificate", "doc-motivation", "doc-cv", "doc-language", "doc-reference", "doc-passport"] },
    { label: "Costs & funding", requirements: [filled("applicationFee"), filled("seatDeposit"), filled("budget"), filled("scholarshipNotes"), filled("livingCostBudget")], records: ["applicationFee", "seatDeposit", "budget", "scholarshipNotes", "livingCostBudget"], evidence: [filled("file-budget"), filled("file-scholarship")], actions: ["tuition", "application-fee", "seat-deposit", "budget", "scholarship", "living-costs"] },
    { label: "Submission", requirements: [filled("applicationRoute"), filled("finalReviewStatus"), filled("submissionDate"), filled("applicationId"), filled("file-submission-confirmation")], records: ["applicationRoute", "finalReviewStatus", "submissionDate", "applicationId"], evidence: [filled("file-submitted-application"), filled("file-submission-confirmation") || filled("file-6")], actions: ["application-portal", "final-review", "submit", "application-reference", "confirmation"] },
    { label: "Offer & enrolment", requirements: [filled("offerStatus"), filled("offerConditions"), filled("enrolmentDeadline"), filled("depositStatus"), filled("visaPlan"), filled("transitionPlan")], records: ["offerStatus", "offerConditions", "enrolmentDeadline", "depositStatus", "visaPlan", "transitionPlan"], evidence: [filled("file-offer"), filled("file-enrolment"), filled("file-visa")], actions: ["decision", "offer-conditions", "enrolment-deadline", "deposit-status", "visa-plan", "enrolment"] },
  ];
  const stages: ReadinessStage[] = readinessBlueprint.map((stage) => {
    const requirements = percentage(stage.requirements);
    const records = percentage(stage.records.map(filled));
    const evidence = percentage(stage.evidence);
    const actionComplete = (id: string) => completed.includes(`${program.id}:${id}`) || (program.id === dashboardProgram?.id && completed.includes(id));
    const actions = percentage(stage.actions.map(actionComplete));
    return { label: stage.label, value: Math.round(requirements * .3 + records * .25 + evidence * .25 + actions * .2), requirements, records, evidence, actions, completedActions: stage.actions.filter(actionComplete).length, totalActions: stage.actions.length };
  });
  return { score: stages.length ? Math.round(stages.reduce((sum, stage) => sum + stage.value, 0) / stages.length) : 0, stages };
  };
  const applicationReadiness = Object.fromEntries(pathway.map((item) => [item.p.id, readinessFor(item.p)])) as Record<string, { score: number; stages: ReadinessStage[] }>;
  const programFits = Object.fromEntries([...discoveryPrograms, ...pathway.map(item => item.p)].map((program) => {
    const school = allBusinessSchools.find((item) => item.programId === program.id || `school:${item.id}` === program.id);
    return [program.id, calculateProgramFit(program, school ? schoolStudy(school) : undefined, profileSnapshot, preferencePriorities)];
  })) as Record<string, FitResult>;
  const fitFor = (program: Program, school?: BusinessSchool) => {
    const linkedSchool = school ?? allBusinessSchools.find((item) => item.programId === program.id);
    return calculateProgramFit(program, linkedSchool ? schoolStudy(linkedSchool) : undefined, profileSnapshot, preferencePriorities);
  };
  const dreamReadiness = readinessFor(dashboardProgram);
  const readinessStages = dreamReadiness.stages;
  const progress = dreamReadiness.score;
  const nextIncompleteStage = readinessStages.findIndex((stage) => stage.value < 100);
  const notice = !dashboardProgram
    ? { body: "Choose a Dream university to begin application readiness tracking.", action: "Explore universities" }
    : !profileSnapshot.intake
      ? { body: "Add your intended intake so each application can use the correct official requirements and deadlines.", action: "Update profile" }
      : nextIncompleteStage >= 0
        ? { body: `${readinessStages[nextIncompleteStage].label} is the next incomplete stage for your Dream application.`, action: "Continue pathway" }
        : { body: "Your Dream application stages are ready. Review every source before submitting through the official portal.", action: "Review progress" };
  const reminders = buildPlanningReminders(pathway, pathwayRecords, completed, reminderDate, remindersEnabled);
  const changeReminders = (enabled: boolean) => { window.localStorage.setItem("myway-notifications-enabled", String(enabled)); setRemindersEnabled(enabled); };
  const runNoticeAction = () => { if (!dashboardProgram) go("explore"); else if (!profileSnapshot.intake) go("profile"); else if (nextIncompleteStage >= 0) openPathwayStage(nextIncompleteStage, dashboardProgram.id); else go("progress"); };
  const selectedProgram = selectedProgramId ? programs.find((program) => program.id === selectedProgramId) ?? null : null;
  const selectedSchool = selectedSchoolId ? allBusinessSchools.find((school) => school.id === selectedSchoolId) ?? null : null;

  if (session && !accountDisplayReady && authReady) {
    const describe = (data: Record<string, string>) => {
      try {
        const items = JSON.parse(data["myway-pathway-selection"] || "[]") as { id: string; role: string }[];
        const dream = items.find(item => item.role === "Dream");
        const label = dream ? programs.find(p => p.id === dream.id)?.university || allBusinessSchools.find(school => `school:${school.id}` === dream.id)?.name || "Selected university" : "No Dream university";
        return `${label} · ${items.length} pathway choices`;
      } catch { return "Saved planning data"; }
    };
    const choose = (choice?: "local" | "remote") => { setPendingConflict(null); setSyncAttempt(value => ({ count: value.count + 1, choice })); };
    const downloadBackup = () => {
      const data = syncConflict?.local || {};
      const blob = new Blob([JSON.stringify({ product: "MyWay", formatVersion: 1, data }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "myway-device-backup.json"; a.click(); URL.revokeObjectURL(url);
    };
    return <main className="account-gate"><section className="account-gate-card">
      <h1>{syncConflict ? (language === "id" ? "Pilih data akun yang ingin dipakai" : "Choose which account data to use") : (language === "id" ? "Memuat data akun" : "Loading account data")}</h1>
      {syncConflict ? <>
        <p>{language === "id" ? "Data browser ini berbeda dari akun. Kedua versi disimpan sebagai cadangan sebelum pilihanmu diterapkan." : "This browser differs from your account. Both versions are preserved as device backups before applying your choice."}</p>
        <p><strong>Account:</strong> {describe(syncConflict.remote.data)}</p><p><strong>This browser:</strong> {describe(syncConflict.local)}</p>
        <button className="primary-button" onClick={() => choose("remote")}>{language === "id" ? "Gunakan data akun" : "Use account version"}</button>
        <button className="outline-button" onClick={() => choose("local")}>{language === "id" ? "Gunakan data browser ini" : "Use this browser’s version"}</button>
        <button className="text-link" onClick={downloadBackup}>{language === "id" ? "Unduh cadangan browser" : "Download browser backup"}</button>
      </> : <><p>{syncStatus}</p><button className="outline-button" onClick={() => choose()}>{language === "id" ? "Coba lagi" : "Retry account sync"}</button></>}
    </section></main>;
  }
  if (!authReady || !session || !accountDisplayReady) return <><SiteLanguage language={language} /><AccountGate language={language} ready={authReady && (!session || accountDisplayReady)} openAccount={() => setAuthOpen(true)} />{authOpen && <AuthModal key={passwordRecovery ? "recovery" : "account"} session={session} recovery={passwordRecovery} language={language} close={() => { setAuthOpen(false); setPasswordRecovery(false); }} openProfile={() => setView("profile")} />}</>;
  if (!onboarded) return <><SiteLanguage language={language} /><Onboarding finish={finish} saveLater={saveLater} /></>;

  let content;
  if (selectedProgram) { const school = allBusinessSchools.find((item) => item.programId === selectedProgram.id); const selectedRole = pathway.find((item) => item.p.id === selectedProgram.id)?.role; content = school ? <SchoolDetail key={school.id} school={school} program={selectedProgram} close={() => setSelectedProgramId(null)} saved={saved.includes(school.id)} toggleSaved={() => toggleSaved(school.id)} compared={compared.includes(school.id)} toggleCompare={() => toggleCompare(school.id)} pathwayRole={selectedRole} addPath={(role) => addPath(selectedProgram, role)} removePath={() => removePath(selectedProgram)} fitResult={fitFor(selectedProgram, school)} readinessScore={applicationReadiness[selectedProgram.id]?.score} reportIncorrect={() => openFeedback("incorrect", { university: school.name, programme: selectedProgram.title })} /> : <ProgramDetail p={selectedProgram} close={() => setSelectedProgramId(null)} saved={saved.includes(selectedProgram.id)} toggleSaved={() => toggleSaved(selectedProgram.id)} compared={false} toggleCompare={() => {}} pathwayRole={selectedRole} addPath={(role) => addPath(selectedProgram, role)} removePath={() => removePath(selectedProgram)} fitResult={fitFor(selectedProgram)} readinessScore={applicationReadiness[selectedProgram.id]?.score} reportIncorrect={() => openFeedback("incorrect", { university: selectedProgram.university, programme: selectedProgram.title })} />; }
  else if (selectedSchool) { const program = selectedSchool.programId ? programs.find((item) => item.id === selectedSchool.programId) : undefined; const choice = program ?? schoolAsProgram(selectedSchool); const selectedRole = pathway.find((item) => item.p.id === choice.id)?.role; content = <SchoolDetail key={selectedSchool.id} school={selectedSchool} program={program} close={() => setSelectedSchoolId(null)} saved={saved.includes(selectedSchool.id)} toggleSaved={() => toggleSaved(selectedSchool.id)} compared={compared.includes(selectedSchool.id)} toggleCompare={() => toggleCompare(selectedSchool.id)} pathwayRole={selectedRole} addPath={(role) => addPath(choice, role)} removePath={() => removePath(choice)} fitResult={fitFor(choice, selectedSchool)} readinessScore={applicationReadiness[choice.id]?.score} reportIncorrect={() => openFeedback("incorrect", { university: selectedSchool.name, programme: program?.title ?? schoolStudy(selectedSchool).title })} />; }
  else if (view === "dashboard") content = <Dashboard candidates={discoveryPrograms} go={go} completed={completed} toggleTask={toggleTask} openProgram={openProgram} target={dashboardProgram} selected={pathway} pathwayReadiness={progress} readinessStages={readinessStages} programFits={programFits} profile={profileSnapshot} />;
  else if (view === "explore") content = <Explore openSchool={openSchool} saved={saved} setSaved={toggleSaved} compared={compared} toggleCompare={toggleCompare} schoolPathwayIds={pathway.map((item) => item.p.id)} toggleSchoolPathway={toggleSchoolPathway} language={language} records={pathwayRecords} updateRecord={updatePathwayRecord} goPathway={() => go("pathway")} />;
  else if (view === "pathway") content = <><IndonesiaPathway records={pathwayRecords} updateRecord={updatePathwayRecord} language={language} /><Pathway selected={pathway} completed={completed} toggleTask={toggleTask} go={go} openProgram={openProgram} changeRole={addPath} removePath={removePath} records={pathwayRecords} updateRecord={updatePathwayRecord} applicationReadiness={applicationReadiness} toast={setToast} initialStage={pathwayStage} initialApplicationId={pathwayApplicationId} /></>;
  else if (view === "tasks") content = <TasksHabits completed={completed} toggleTask={toggleTask} toast={setToast} />;
  else if (view === "progress") content = <ProgressPage selected={pathway} applicationReadiness={applicationReadiness} openStage={openPathwayStage} openProgram={openProgram} go={go} />;
  else if (view === "profile") content = <ProfilePage toast={setToast} avatar={avatar} setAvatar={setAvatar} />;
  else content = <SettingsPage notifications={remindersEnabled} onNotificationsChange={changeReminders} toast={setToast} savedCount={saved.length} applicationCount={pathway.length} replayTutorial={() => setTutorialOpen(true)} go={go} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} adminVisible={adminVisible} />;

  return <div className="app-shell">
    <SiteLanguage language={language} />
    <Navigation active={view} go={go} openGuide={() => setGuideOpen(true)} progress={progress} hasTarget={Boolean(dashboardProgram)} language={language} />
    <main className="app-main"><Header reminders={reminders} remindersEnabled={remindersEnabled} onReminderAction={(reminder) => openPathwayStage(reminder.stage, reminder.programmeId)} view={view} go={go} notices={notices} setNotices={setNotices} notice={notice} onNoticeAction={runNoticeAction} avatar={avatar} language={language} session={session} openAccount={() => setAuthOpen(true)} /><div className="content-wrap" key={syncGeneration}><div role="status" className="sync-status">{syncStatus}</div>{content}</div></main>
    <button className="feedback-fab" data-tour="feedback-button" onClick={() => openFeedback()}><MessageSquare size={15} /><span>Feedback</span></button>
    {compared.length > 0 && !compareOpen && <button className="compare-fab" onClick={() => setCompareOpen(true)}><Scale size={17} /><span>Compare {compared.length}</span><small>of 4</small></button>}
    {compareOpen && <ComparePanel ids={compared} close={() => setCompareOpen(false)} remove={toggleCompare} open={openSchool} />}
    {guideOpen && <PlanningGuide close={() => setGuideOpen(false)} go={go} />}
    {tutorialOpen && <ProductTutorial close={() => setTutorialOpen(false)} go={go} language={language} />}
    {authOpen && <AuthModal key={passwordRecovery ? "recovery" : "account"} session={session} recovery={passwordRecovery} language={language} close={() => { setAuthOpen(false); setPasswordRecovery(false); }} openProfile={() => go("profile")} />}
    {feedbackOpen && <FeedbackModal initialCategory={feedbackCategory} context={feedbackContext} close={() => setFeedbackOpen(false)} />}
    {toast && <div className="toast" role="status" aria-live="polite"><CircleCheck size={17} />{toast}</div>}
  </div>;
}
