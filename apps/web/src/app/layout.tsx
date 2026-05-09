import type { Metadata } from "next";
import { Cairo } from "next/font/google";

import { APP_NAME_AR } from "@studyhouse/shared";

import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME_AR,
    template: `%s · ${APP_NAME_AR}`,
  },
  description:
    "منصة تعليمية عربية بتجربة نظيفة واحترافية — كورسات، تعلّم منظم، وتقدّم واضح.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} min-h-screen bg-background font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
