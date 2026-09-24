import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FeedbackAdminPage() {
  redirect("https://admin.example.com");
}
