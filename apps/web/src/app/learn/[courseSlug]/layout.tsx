import { StudentShell } from "@/components/student/student-shell";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <StudentShell>{children}</StudentShell>;
}
