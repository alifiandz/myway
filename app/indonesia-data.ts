import catalogue from "./indonesia-catalogue.json";
import universityLocations from "./indonesia-university-locations.json";
export type IndonesiaProgramme = typeof catalogue[number];
export const indonesiaProgrammes = catalogue;
export const indonesiaUniversities = [...new Map(catalogue.map((p) => [p.university_id, { id: p.university_id, name: p.university }])).values()];
export const INDONESIA_PLANS_KEY = "indonesia-programme-plans";
export type IndonesiaPlan = { id: string; role: "Dream" | "Target" | "Alternative" };
export function readIndonesiaPlans(value?: string): IndonesiaPlan[] {
  try { const rows: unknown = JSON.parse(value || "[]"); if (!Array.isArray(rows)) return []; const seen = new Set<string>(); return rows.filter((p): p is IndonesiaPlan => Boolean(p && typeof p === "object" && typeof p.id === "string" && catalogue.some((x) => x.id === p.id) && ["Dream", "Target", "Alternative"].includes(p.role))).filter((p) => !seen.has(p.id) && Boolean(seen.add(p.id))); } catch { return []; }
}
const normalise = (value: string) => value.normalize("NFKD").toLowerCase().replace(/\s+/g, " ").trim();
const aliases: Record<string, string> = { Manajemen: "management", Akuntansi: "accounting", Kedokteran: "medicine", Informatika: "informatics computer science", "Ilmu Ekonomi": "economics", Kewirausahaan: "entrepreneurship", Hukum: "law", Psikologi: "psychology" };
export const facultyAlias = (faculty: string) => /Ekonomi.*Bisnis Islam/.test(faculty) ? "FEBI" : /Ekonomi(ka)? dan Bisnis/.test(faculty) ? "FEB" : faculty.match(/\(([^)]+)\)$/)?.[1] ?? "";
export function filterIndonesia(query: string, university: string, faculty: string) {
  const q = normalise(query);
  return catalogue.filter((p) => (!university || p.university_id === university) && (!faculty || p.faculty === faculty) && normalise([p.title, p.university, p.university_id, p.faculty, facultyAlias(p.faculty), aliases[p.title] ?? "", (universityLocations as Record<string, {label:string}>)[p.university_id]?.label ?? ""].join(" ")).includes(q));
}
export function indonesiaHref(p: IndonesiaProgramme) {
  return `?region=indonesia&university=${encodeURIComponent(p.university_id)}&faculty=${encodeURIComponent(p.faculty)}&programme=${encodeURIComponent(p.id)}#explore`;
}
