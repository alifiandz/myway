"use client";

import { useState } from "react";
import catalogue from "./indonesia-catalogue.json";

const normalise = (value: string) => value.normalize("NFKD").toLowerCase().replace(/\s+/g, " ").trim();
const aliases: Record<string, string> = {
  Manajemen: "management", Akuntansi: "accounting", Kedokteran: "medicine", Informatika: "informatics computer science",
  "Ilmu Ekonomi": "economics", Kewirausahaan: "entrepreneurship", Hukum: "law", Psikologi: "psychology",
};
const facultyAlias = (faculty: string) => /Ekonomi.*Bisnis Islam/.test(faculty) ? "FEBI" : /Ekonomi(ka)? dan Bisnis/.test(faculty) ? "FEB" : "";
export function filterIndonesia(query: string, university: string, faculty: string) {
  const q = normalise(query);
  return catalogue.filter((p) => (!university || p.university_id === university) && (!faculty || p.faculty === faculty)
    && normalise([p.title, p.university, p.university_id, p.faculty, facultyAlias(p.faculty), aliases[p.title] ?? ""].join(" ")).includes(q));
}

export default function IndonesiaExplore({ language }: { language: "en" | "id" }) {
  const id = language === "id";
  const [query, setQuery] = useState("");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const institutions = [...new Map(catalogue.map((p) => [p.university_id, p.university])).entries()];
  const faculties = [...new Set(catalogue.filter((p) => !university || p.university_id === university).map((p) => p.faculty))].sort();
  const rows = filterIndonesia(query, university, faculty);
  return <>
    <section className="page-intro"><div><span className="eyebrow">Indonesia · S1</span><h2>{id ? "Temukan jurusan pilihanmu" : "Explore undergraduate study in Indonesia"}</h2><p>{id ? "Telusuri universitas, fakultas atau sekolah, lalu program studi S1." : "Browse universities, their faculties and schools, then S1 programmes."}</p></div></section>
    <section className="card indonesia-search-filters" aria-label={id ? "Filter program Indonesia" : "Indonesia programme filters"}>
      <label>{id ? "Cari program studi" : "Find a programme"}<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="FEB, Manajemen, Informatika…" /></label>
      <label>{id ? "Universitas" : "University"}<select value={university} onChange={(e) => { setUniversity(e.target.value); setFaculty(""); }}><option value="">{id ? "Semua universitas" : "All universities"}</option>{institutions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <label>{id ? "Fakultas / sekolah" : "Faculty / school"}<select value={faculty} onChange={(e) => setFaculty(e.target.value)}><option value="">{id ? "Semua fakultas / sekolah" : "All faculties / schools"}</option>{faculties.map((name) => <option key={name}>{name}</option>)}</select></label>
      <button type="button" className="outline-button" onClick={() => { setQuery(""); setUniversity(""); setFaculty(""); }}>{id ? "Hapus filter" : "Clear filters"}</button>
    </section>
    <div className="results-head" role="status" aria-live="polite"><strong>{rows.length} {id ? "program studi S1" : "S1 programmes"}</strong></div>
    {institutions.map(([key, name]) => {
      const programmes = rows.filter((p) => p.university_id === key);
      if (!programmes.length) return null;
      return <section className="indonesia-university" key={key}><h3>{name}</h3>{[...new Set(programmes.map((p) => p.faculty))].sort().map((name) => {
        const group = programmes.filter((p) => p.faculty === name);
        return <details className="card indonesia-faculty" key={name} open={Boolean(query || university || faculty)}><summary>{name}<span>{group.length} S1</span></summary><ul>{group.map((p) => <li key={p.id}><span>{p.title}<small>S1</small></span><a href={p.official_source_url} target="_blank" rel="noopener noreferrer">{id ? "Sumber resmi" : "Official listing"} ↗</a></li>)}</ul><a className="indonesia-faculty-source" href={group[0].faculty_source_url} target="_blank" rel="noopener noreferrer">{id ? "Sumber fakultas / sekolah" : "Faculty / school source"} ↗</a></details>;
      })}</section>;
    })}
    {!rows.length && <div className="card empty"><h3>{id ? "Tidak ada hasil" : "No matching programmes"}</h3><p>{id ? "Coba kata lain atau hapus filter." : "Try another name or clear your filters."}</p></div>}
    <p className="indonesia-catalogue-note">{id ? "Nama program dan fakultas diperiksa pada 21 Oktober 2026. Syarat masuk, biaya, dan jadwal masih dalam verifikasi. Daftar ini belum menunjukkan pendaftaran yang sedang dibuka. LIPIA belum disertakan karena jenjangnya masih diverifikasi." : "Programme and faculty names checked 21 October 2026. Admissions requirements, fees and dates are being verified. Listings do not confirm an open intake. LIPIA is awaiting degree-level verification."}</p>
  </>;
}
