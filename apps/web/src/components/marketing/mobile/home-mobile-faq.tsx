import { ChevronDown } from "lucide-react";

import { APP_NAME_AR } from "@studyhouse/shared";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: `هل ${APP_NAME_AR} معتمدة؟`,
    a: "الاعتماد يختلف حسب الجهة المقدِّمة للمحتوى. نركّز على مسارات تعليمية واضحة وشهادات إتمام داخل المنصة.",
  },
  {
    q: "هل توجد كورسات مجانية؟",
    a: "نعم، يوجد في الكتالوج كورسات مجانية وأخرى مدفوعة. يمكنك تصفية الكتالوج لمعرفة نوع التسعير.",
  },
  {
    q: "كيف أبدأ التعلّم؟",
    a: "أنشئ حسابًا، تصفّح الكتالوج، ثم سجّل في الكورس المناسب. ستجد الدروس مرتبة داخل أقسام واضحة.",
  },
  {
    q: "ماذا أفعل عند مشكلة تقنية؟",
    a: "تواصل مع الدعم عبر قنوات المنصة المعتمدة. نعمل على الرد في أقرب وقت ممكن.",
  },
];

export function HomeMobileFaq(): React.ReactElement {
  return (
    <section aria-labelledby="home-faq-heading">
      <h2
        id="home-faq-heading"
        className="mb-3 text-base font-bold text-heading"
      >
        أسئلة شائعة
      </h2>

      <div className="flex flex-col gap-2">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          >
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3 px-4 py-3.5 text-start">
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-heading">
                  {item.q}
                </span>
              </div>
            </summary>
            <div className="border-t border-border/60 px-4 pb-3.5 pt-2">
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
