import Image from "next/image";
import Link from "next/link";

import { SiteLogo } from "@/components/layout/site-logo";
import { APP_NAME_AR } from "@studyhouse/shared";

const AUTH_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1400&h=1000";

type AuthSplitLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * تخطيط مصادقة split-screen — لوحة بصرية + لوحة نموذج (RTL).
 */
export function AuthSplitLayout({
  title,
  subtitle,
  children,
}: AuthSplitLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* النموذج — يظهر أولًا على الموبايل؛ في RTL العمود الأول يمين */}
        <div className="flex flex-col">
          <header className="flex items-center justify-between px-4 py-4 sm:px-6 md:px-8">
            <SiteLogo href="/" priority />
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              الرئيسية
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center px-4 pb-10 pt-2 sm:px-8 sm:pb-12 md:px-10 lg:px-12 xl:px-16">
            <div className="mx-auto w-full max-w-[22rem] space-y-6">
              <div className="space-y-2 text-start">
                <h1 className="text-balance text-2xl font-bold tracking-tight text-[hsl(222_47%_12%)] sm:text-[1.65rem]">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              {children}
            </div>
          </div>
        </div>

        {/* اللوحة البصرية — مخفية على الموبايل */}
        <aside
          className="relative hidden overflow-hidden bg-[hsl(222_47%_10%)] lg:block"
          aria-hidden
        >
          <Image
            src={AUTH_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-center opacity-90"
            sizes="50vw"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(165deg,hsl(222_47%_10%_/_0.88)_0%,hsl(222_47%_10%_/_0.72)_45%,hsl(222_47%_10%_/_0.55)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,hsl(24_95%_53%_/_0.18)_0%,transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex h-full flex-col justify-end p-10 xl:p-14">
            <blockquote className="max-w-md space-y-3 text-start">
              <p className="text-lg font-semibold leading-relaxed text-white">
                تعلّم بخطوات واضحة — مسارات منظمة وتجربة عربية مريحة.
              </p>
              <p className="text-sm leading-relaxed text-white/75">
                انضم إلى {APP_NAME_AR} وابدأ رحلتك نحو مهارات جديدة بثقة.
              </p>
            </blockquote>
          </div>
        </aside>
      </div>
    </div>
  );
}
