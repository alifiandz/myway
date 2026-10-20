import { useState } from "react";
import Image from "next/image";
import { CircleAlert, LoaderCircle, Save } from "lucide-react";
import { getSupabaseClient } from "../../supabase-client";
import { validateUniversityLogo, saveUniversityLogo } from "./logo-policy";
export default function UniversityLogoEditor({ university, onSaved, language }: { university: { id: string; name: string; logo_url: string | null }; onSaved: (url: string) => void; language: "en" | "id" }) {
  const id = language === "id";
  const [value, setValue] = useState(university.logo_url ?? ""), [loaded, setLoaded] = useState(""), [saving, setSaving] = useState(false), [error, setError] = useState(""), [saved, setSaved] = useState(false);
  let preview = ""; try { preview = validateUniversityLogo(value); } catch { /* Invalid draft has no external preview. */ }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSaved(false); setSaving(true);
    try {
      const url = validateUniversityLogo(value);
      if (loaded !== url) throw new Error(id ? "Tunggu hingga pratinjau gambar berhasil dimuat." : "Wait for a successful image preview before saving.");
      const client = await getSupabaseClient();
      await saveUniversityLogo(client, university.id, url);
      onSaved(url); setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The logo could not be saved."); }
    finally { setSaving(false); }
  }
  return <section className="admin-logo-editor"><div className="admin-logo-preview"><div className="admin-logo-preview-image">{preview ? <Image key={preview} src={preview} alt={`${university.name} logo preview`} width={220} height={160} unoptimized onLoad={() => setLoaded(preview)} onError={() => { setLoaded(""); setError(id ? "Gambar gagal dimuat. Periksa tautannya." : "The image could not load. Check its public URL."); }}/> : <CircleAlert size={36}/>}</div><span>{id ? "PRATINJAU LOGO" : "LOGO PREVIEW"}</span><h2>{university.name}</h2></div><form onSubmit={save}><span className="section-label">{id ? "LOGO RESMI" : "OFFICIAL UNIVERSITY LOGO"}</span><h2>{id ? "Perbarui logo universitas" : "Update the university logo"}</h2><p>{id ? "Gunakan gambar resmi yang tersedia publik. Logo tersimpan akan digunakan di MyWay setelah halaman dimuat ulang." : "Use an official, publicly accessible image. The saved logo appears across MyWay after reloading."}</p><label><span>{id ? "URL gambar logo" : "Logo image URL"}</span><input value={value} onChange={(event) => { setValue(event.target.value); setError(""); setSaved(false); }} placeholder="https://university.example/logo.png" maxLength={2048} required/></label><small>{id ? "Tempel URL HTTPS atau jalur /institution-logos/ yang sudah tersedia." : "Paste a public HTTPS image URL or an existing /institution-logos/ path."}</small><button className="primary-button" disabled={saving || !preview || loaded !== preview}>{saving ? <LoaderCircle className="admin-spin" size={16}/> : <Save size={16}/>} {id ? "Simpan logo" : "Save logo"}</button>{error && <p className="admin-error" role="alert">{error}</p>}{saved && <p className="admin-logo-saved" role="status">{id ? "Logo tersimpan dan terkonfirmasi." : "Logo saved and confirmed."}</p>}</form></section>;
}
