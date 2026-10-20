/** Display archived MyWay links on the current domain without rewriting source records. */
export function publicMyWayUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return "";
    if (url.hostname === "alif-pathway.smalhi2025.chatgpt.site") { url.protocol = "https:"; url.host = "mywaypath.com"; }
    return url.href;
  } catch { return ""; }
}
