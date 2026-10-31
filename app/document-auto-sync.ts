export function startDocumentAutoSync(run: () => Promise<unknown>, notify: (state: "syncing" | "synced" | "retrying") => void, events: Pick<Window, "addEventListener" | "removeEventListener">, schedule = globalThis.setInterval, cancel = globalThis.clearInterval) {
  let stopped = false, busy = false;
  const sync = async () => {
    if (stopped || busy) return;
    busy = true;
    if (!stopped) notify("syncing");
    try { await run(); if (!stopped) notify("synced"); }
    catch { if (!stopped) notify("retrying"); }
    finally { busy = false; }
  };
  const retry = () => { void sync(); };
  events.addEventListener("online", retry);
  const timer = schedule(retry, 60000);
  retry();
  return () => { stopped = true; cancel(timer); events.removeEventListener("online", retry); };
}
