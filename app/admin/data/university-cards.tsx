import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Database } from "lucide-react";
export type UniversityCardRecord = { id: string; name: string; city: string | null; country: string | null; logo_url: string | null; programmes: { title: string; programme_facts: { status: string }[] }[] };
export function universityEditorPath(id: string, logos = false) { return `/admin/${logos ? "logos" : "universities"}/${encodeURIComponent(id)}`; }
export default function UniversityCards({ items, logos, language }: { items: UniversityCardRecord[]; logos: boolean; language: "en" | "id" }) {
  const id = language === "id";
  return <div className="admin-university-cards">{items.map((item) => {
    const facts = item.programmes.flatMap((programme) => programme.programme_facts), verified = facts.filter((fact) => fact.status === "verified").length;
    return <Link key={item.id} href={universityEditorPath(item.id, logos)} className="admin-university-card"><span className="admin-university-card-logo">{item.logo_url ? <Image src={item.logo_url} alt="" width={60} height={60} unoptimized/> : <Database size={26}/>}</span><div><h2>{item.name}</h2><p>{[item.city, item.country].filter(Boolean).join(", ")}</p></div>{logos ? <p className="admin-university-card-description">{id ? "Lihat pratinjau dan perbarui logo resmi universitas." : "Preview and update the university’s official logo."}</p> : <><p className="admin-university-card-description">{item.programmes[0]?.title ?? (id ? "Belum ada program" : "No programme")}</p><div className="admin-card-progress" aria-label={`${verified} / ${facts.length}`}><i style={{ width: `${facts.length ? verified / facts.length * 100 : 0}%` }}/></div><small>{verified} / {facts.length} {id ? "fakta terverifikasi" : "facts verified"}<span>{facts.length - verified} {id ? "perlu ditinjau" : "to review"}</span></small></>}<footer><strong>{logos ? "Edit logo" : (id ? "Buka universitas" : "Open university")}</strong><ArrowUpRight size={17}/></footer></Link>;
  })}</div>;
}
