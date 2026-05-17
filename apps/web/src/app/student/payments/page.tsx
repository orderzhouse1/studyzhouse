import { redirect } from "next/navigation";

/** الطالب يُفعِّل الدفع من صفحة الكورس — لا صفحة مدفوعات منفصلة. */
export default function StudentPaymentsRedirectPage(): never {
  redirect("/student/explore");
}
