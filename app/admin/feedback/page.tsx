import { chatGPTSignOutPath, requireChatGPTUser } from "../../chatgpt-auth";
import FeedbackInbox from "./feedback-inbox";

export const dynamic = "force-dynamic";

const ADMIN_ACCOUNT_IDS = new Set(["11111111-1111-4111-8111-111111111111"]);

export default async function FeedbackAdminPage() {
  const user = await requireChatGPTUser("/admin/feedback");

  if (!ADMIN_ACCOUNT_IDS.has(user.id)) {
    return <main className="admin-access-page">
      <section>
        <div className="admin-brand"><span>M</span> MyWay</div>
        <p className="admin-kicker">Private workspace</p>
        <h1>Access not available</h1>
        <p>This account does not have permission to open the MyWay Feedback Inbox.</p>
        <a className="admin-secondary-button" href={chatGPTSignOutPath("/admin/feedback")} target="_top">Use another account</a>
        <a className="admin-text-link" href="/">Return to MyWay</a>
      </section>
    </main>;
  }

  return <FeedbackInbox adminName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}
