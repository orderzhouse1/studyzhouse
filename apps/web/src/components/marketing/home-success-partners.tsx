import Image from "next/image";

import { cn } from "@/lib/utils";

type Partner = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  /** خلفية اللوحة حول الشعار */
  plateClassName: string;
  /** لوحة فاتحة — شريط الاسم داكن النص */
  lightPlate?: boolean;
  /** يجعل الأسود شفافًا على الشعارات الفاتحة فوق خلفية ملوّنة (مثل Bildazo) */
  blendScreen?: boolean;
  /** أقصى عرض للشعار داخل اللوحة (تجنّب تكبير ملفات منخفضة الدقة) */
  maxWidthClassName?: string;
};

const PARTNERS: Partner[] = [
  {
    id: "bildazo",
    name: "Bildazo",
    src: "/partners/Bildazo.png",
    width: 1075,
    height: 733,
    plateClassName: "bg-[#55133b]",
    blendScreen: true,
    maxWidthClassName: "max-w-[13.5rem]",
  },
  {
    id: "battech",
    name: "Batman Technology",
    src: "/partners/Battech.png",
    width: 665,
    height: 287,
    plateClassName: "bg-white",
    lightPlate: true,
    maxWidthClassName: "max-w-[15rem]",
  },
  {
    id: "gigz",
    name: "GIGZHOUSE",
    src: "/partners/GIGZ.png",
    width: 5453,
    height: 1455,
    plateClassName: "bg-white",
    lightPlate: true,
    maxWidthClassName: "max-w-[15.5rem]",
  },
  {
    id: "orderzhouse",
    name: "OrderzHouse",
    src: "/partners/orderzhouse.png",
    width: 2172,
    height: 724,
    plateClassName: "bg-white",
    lightPlate: true,
    maxWidthClassName: "max-w-[15.5rem]",
  },
];

/**
 * شركاء النجاح — قسم تسويقي فوق الأسئلة الشائعة.
 */
export function HomeSuccessPartnersSection({
  className,
}: {
  className?: string;
} = {}): React.ReactElement {
  return (
    <section
      id="success-partners"
      className={cn(
        "relative w-screen max-w-[100vw] scroll-mt-24 overflow-hidden [margin-inline:calc(50%-50vw)]",
        className,
      )}
      aria-labelledby="success-partners-heading"
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(165deg,#0c1220_0%,#151f35_42%,#1a1528_78%,#120e1a_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -start-24 top-[-20%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(212,160,74,0.16)_0%,transparent_68%)] blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-16 bottom-[-30%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(85,19,59,0.45)_0%,transparent_70%)] blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[rgba(212,160,74,0.55)] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[min(100%,88rem)] px-4 py-12 sm:px-6 sm:py-14 md:px-8 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span
              className="h-px w-10 bg-gradient-to-l from-[rgba(212,160,74,0.85)] to-transparent sm:w-14"
              aria-hidden
            />
            <span className="text-[0.6875rem] font-semibold tracking-[0.28em] text-[rgba(232,201,138,0.92)] sm:text-xs">
              PARTNERS
            </span>
            <span
              className="h-px w-10 bg-gradient-to-r from-[rgba(212,160,74,0.85)] to-transparent sm:w-14"
              aria-hidden
            />
          </div>

          <h2
            id="success-partners-heading"
            className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-[2.05rem]"
          >
            شركاء النجاح
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/65 sm:text-[0.9375rem]">
            نفخر بشراكات ترفع مستوى التجربة التعليمية وتفتح آفاقًا أوسع لطلابنا —
            أسماء موثوقة نختارها بعناية.
          </p>
        </div>

        <ul className="mt-10 grid list-none grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {PARTNERS.map((partner) => (
            <li key={partner.id}>
              <article
                className={cn(
                  "group relative h-full overflow-hidden rounded-[1.35rem] p-[1px]",
                  "bg-gradient-to-br from-[rgba(232,201,138,0.55)] via-white/15 to-white/5",
                  "shadow-[0_18px_50px_-24px_rgba(0,0,0,0.75)]",
                  "transition duration-500 ease-out",
                  "hover:-translate-y-1 hover:shadow-[0_28px_60px_-20px_rgba(212,160,74,0.28)]",
                )}
              >
                <div
                  className={cn(
                    "relative flex h-full min-h-[9.5rem] flex-col overflow-hidden rounded-[1.3rem] sm:min-h-[10.5rem]",
                    partner.plateClassName,
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-500 group-hover:opacity-100",
                      partner.lightPlate
                        ? "bg-[radial-gradient(120%_80%_at_50%_0%,rgba(15,23,42,0.04)_0%,transparent_55%)]"
                        : "bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.12)_0%,transparent_55%)]",
                    )}
                    aria-hidden
                  />

                  <div className="relative flex flex-1 items-center justify-center px-5 py-7 sm:px-6 sm:py-8">
                    <Image
                      src={partner.src}
                      alt={partner.name}
                      width={partner.width}
                      height={partner.height}
                      quality={100}
                      unoptimized
                      priority={false}
                      className={cn(
                        "h-auto w-full object-contain",
                        partner.blendScreen && "mix-blend-screen",
                        partner.maxWidthClassName ?? "max-w-[14rem]",
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      "relative px-4 py-2.5",
                      partner.lightPlate
                        ? "border-t border-slate-200/90 bg-slate-50/95"
                        : "border-t border-white/10 bg-black/25 backdrop-blur-[2px]",
                    )}
                  >
                    <p
                      className={cn(
                        "text-center text-[0.6875rem] font-medium tracking-wide sm:text-xs",
                        partner.lightPlate
                          ? "text-slate-700"
                          : "text-white/75",
                      )}
                    >
                      {partner.name}
                    </p>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {/* ملاحظة OrderzHouse — من التعلّم إلى العمل الحر */}
        <aside
          className="relative mx-auto mt-10 max-w-3xl sm:mt-12"
          aria-labelledby="orderzhouse-note-heading"
        >
          <div className="rounded-[1.35rem] p-[1px] bg-gradient-to-br from-[rgba(232,201,138,0.65)] via-[rgba(0,174,239,0.35)] to-white/10 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.7)]">
            <div className="relative overflow-hidden rounded-[1.3rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.08)_0%,rgba(12,18,32,0.92)_45%,rgba(8,14,28,0.96)_100%)] px-5 py-6 sm:px-8 sm:py-7">
              <div
                className="pointer-events-none absolute -end-10 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(0,174,239,0.22)_0%,transparent_70%)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -start-8 bottom-[-30%] h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(212,160,74,0.18)_0%,transparent_70%)]"
                aria-hidden
              />

              <div className="relative flex flex-col items-center gap-4 text-center sm:gap-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,201,138,0.35)] bg-[rgba(232,201,138,0.08)] px-3.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-[rgba(232,201,138,0.95)] sm:text-xs">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[rgba(232,201,138,0.95)]"
                    aria-hidden
                  />
                  من التعلّم إلى العمل الحر
                </span>

                <div className="max-w-2xl space-y-2.5">
                  <h3
                    id="orderzhouse-note-heading"
                    className="text-balance text-lg font-bold tracking-tight text-white sm:text-xl"
                  >
                    تعلّم هنا… واعمل كفريلانسر على{" "}
                    <span className="text-[rgba(125,211,252,0.98)]">
                      OrderzHouse
                    </span>
                  </h3>
                  <p className="text-pretty text-sm leading-relaxed text-white/70 sm:text-[0.9375rem] sm:leading-7">
                    عندما تشتري كورساتك وتتقن مهاراتك على المنصة، لا يتوقف الطريق عند
                    الشهادة — يمكنك الانطلاق كمقدّم خدمة مستقل على{" "}
                    <span className="font-medium text-white/90">OrderzHouse</span>
                    ، وتقديم خبرتك لعملاء يبحثون عن كفاءات جاهزة للعمل بثقة واحتراف.
                  </p>
                </div>

                <a
                  href="https://orderzhouse.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-[rgba(186,230,253,0.95)] transition-colors hover:border-[rgba(125,211,252,0.45)] hover:bg-white/10 hover:text-white sm:text-sm"
                >
                  تعرّف على OrderzHouse
                  <span aria-hidden className="text-[0.7em] opacity-80">
                    ↗
                  </span>
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
