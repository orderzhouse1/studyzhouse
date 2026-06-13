import { redirect } from "next/navigation";

export default function AdminAnalyticsPreviewRedirect(): never {
  redirect("/admin/analytics");
}
