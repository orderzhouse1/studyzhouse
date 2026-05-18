import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "كود تفعيل جديد",
};

export default function AdminActivationCodeNewPage(): never {
  redirect("/admin/activation-codes?new=1");
}
