import { chatGPTSignOutPath, requireChatGPTUser } from "../../chatgpt-auth";
import UniversityDataReview from "./university-data-review";

export const dynamic = "force-dynamic";

const ADMIN_ACCOUNT_IDS = new Set(["11111111-1111-4111-8111-111111111111"]);

export default async function UniversityDataAdminPage() {
  const user = await requireChatGPTUser("/admin/data");
  if (!ADMIN_ACCOUNT_IDS.has(user.id)) return <main className="admin-access-page"><section><div className="admin-brand"><span>M</span> MyWay</div><p className="admin-kicker">Private workspace</p><h1>Access not available</h1><p>This account does not have permission to open the MyWay admin workspace.</p><a className="admin-secondary-button" href={chatGPTSignOutPath("/admin/data")} target="_top">Use another account</a><a className="admin-text-link" href="/">Return to MyWay</a></section></main>;
  return <UniversityDataReview adminName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}
