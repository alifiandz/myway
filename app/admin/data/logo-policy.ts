export function validateUniversityLogo(value: string): string {
  const input = value.trim();
  if (!input || input.length > 2048) throw new Error("Enter a public HTTPS image URL or an existing /institution-logos/ path.");
  if (/[\\\u0000-\u0020]/.test(input)) throw new Error("The logo URL contains invalid characters.");
  if (/^\/institution-logos\/[A-Za-z0-9_./-]+\.(png|jpg|jpeg|webp|svg)$/i.test(input) && !input.includes("..")) return input;
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("Use a complete HTTPS image URL."); }
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Use a public HTTPS image URL without a username or password.");
  return url.href;
}

export async function saveUniversityLogo(client: Pick<import("@supabase/supabase-js").SupabaseClient, "from">, universityId: string, value: string) {
  const url = validateUniversityLogo(value);
  const { data, error } = await client.from("universities").update({ logo_url: url }).eq("id", universityId).select("id,logo_url").single();
  if (error) throw new Error("The logo could not be saved. Check your administrator access.");
  if (!data || data.id !== universityId || data.logo_url !== url) throw new Error("The logo update was not confirmed.");
  return url;
}
