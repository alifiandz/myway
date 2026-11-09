export default function AccountSyncNotice({ status }: { status: string }) {
  if (!status || status === "Saved to account" || status === "Saving to account…") return null;
  return <div role="status" className="sync-status">{status}</div>;
}
