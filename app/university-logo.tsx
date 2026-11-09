"use client";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "./supabase-client";
import reviewedAssets from "./institution-logo-assets.json";
import { validateUniversityLogo } from "./admin/data/logo-policy";
let request: Promise<Map<string, string>> | null = null;
function publishedLogos() {
  if (!request) request = getSupabaseClient().then(async (client) => {
    const { data, error } = await client.from("universities").select("id,logo_url").eq("publication_status", "published");
    if (error) throw error;
    const logos = new Map<string, string>();
    for (const row of data ?? []) { try { if (row.logo_url) logos.set(row.id, validateUniversityLogo(row.logo_url)); } catch { /* Keep the reviewed local fallback. */ } }
    return logos;
  }).catch((error) => { request = null; throw error; });
  return request;
}
export default function PublicUniversityLogo({ universityId, fallback, name }: { universityId?: string; fallback: string; name: string }) {
  const [published, setPublished] = useState<string | null>(null), [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setPublished(null); setFailed(null);
    if (universityId) void publishedLogos().then((logos) => { if (active) setPublished(logos.get(universityId) ?? null); }).catch(() => { /* Existing logos remain available offline. */ });
    return () => { active = false; };
  }, [universityId]);
  const reviewed = universityId ? (reviewedAssets as Record<string, {src: string; background: string; srcSet?: string}>)[universityId] : undefined;
  const localFallback = reviewed?.src ?? fallback;
  const preferred = published && !published.startsWith("/institution-logos/") ? published : localFallback;
  const src = failed === preferred ? localFallback : preferred;
  if (!src || failed === src) return null;
  // Existing logo assets and administrator-selected public image URLs have fixed layout in their parent.
  // eslint-disable-next-line @next/next/no-img-element
  return <img key={src} src={src} srcSet={src === reviewed?.src ? reviewed.srcSet : undefined} sizes="84px" alt={`${name} logo`} loading="lazy" decoding="async" onError={() => setFailed(src)}/>;
}
