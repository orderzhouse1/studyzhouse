import { ChevronDown } from "lucide-react";

import { APP_NAME_AR } from "@studyhouse/shared";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: `هل ${APP_NAME_AR} معتمدة، وهل الشهادات معترف بها من أصحاب العمل؟`,
    a: "الاعتماد يختلف حسب الجهة المقدِّمة للمحتوى وسياساتها. نركّز على مسارات تعليمية واضحة وشهادات إتمام داخل المنصة؛ يُنصح بالتحقق من متطلبات جهة العمل أو الجهة الأكاديمية التي تستهدفها.",
  },
  {
    q: "هل تستحق الشهادة الوقت والجهد؟",
    a: "القيمة تعتمد على تطبيقك للمهارات في مشاريع حقيقية. صمّمنا الكورسات لتكون عملية قدر الإمكان مع تتبّع تقدّم واضح داخل المنصة.",
  },
  {
    q: "هل توجد كورسات مجانية؟",
    a: "نعم، يوجد في الكتالوج كورسات مجانية وأخرى مدفوعة حسب إعداد كل كورس. يمكنك تصفية الكتالوج أو قراءة بطاقة الكورس لمعرفة نوع التسعير.",
  },
  {
    q: "ما هي أكثر المجالات طلبًا على المنصة؟",
    a: "يتغيّر ذلك مع الوقت؛ ستجد في الصفحة الرئيسية وفي الكتالوج مجالات رئيسية ومختارات من المحتوى المنشور حديثًا.",
  },
  {
    q: "كيف تساعدني المنصة في تطوير مساري المهني؟",
    a: "من خلال مسارات منظمة، تمارين عملية، ومتابعة تقدّمك داخل الكورس. اختر مجالًا يناسب هدفك ثم التزم بخطة الدرس خطوة بخطوة.",
  },
  {
    q: "كيف أبدأ التعلّم خطوة بخطوة؟",
    a: "أنشئ حسابًا، تصفّح الكتالوج، ثم سجّل في الكورس المناسب. ستجد الدروس مرتبة داخل أقسام واضحة مع إمكانية معاينة جزء من المحتوى حيث يتوفر ذلك.",
  },
  {
    q: "ماذا أفعل إذا واجهت مشكلة تقنية أو في الدفع؟",
    a: "يمكنك التواصل مع الدعم عبر قنوات المنصة المعتمدة أو مراجعة قسم المدفوعات للطلاب إن كان الكورس مدفوعًا. نعمل على الرد في أقرب وقت ممكن.",
  },
];

/**
 * أسئلة شائعة — أكورديون خفيف بعنصر details الأصلي دون اعتماديات إضافية.
 */
export function HomeFaqSection(): React.ReactElement {
  return (
    <section
      className="w-full border-t border-border/70 pt-6 sm:pt-8"
      aria-labelledby="home-faq-heading"
    >
      <div className="ms-0 me-auto mb-4 max-w-3xl sm:mb-5">
        <h2
          id="home-faq-heading"
          className="text-start text-lg font-bold text-heading sm:text-xl"
        >
          الأسئلة الشائعة
        </h2>
      </div>

      <div className="w-full divide-y divide-border/80 border-b border-border/80">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group w-full">
            <summary className="w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="ms-0 me-auto flex w-full max-w-3xl items-center gap-3 py-4 text-start">
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-heading sm:text-[0.9375rem]">
                  {item.q}
                </span>
              </div>
            </summary>
            <div className="w-full pb-4">
              <div className="ms-0 me-auto max-w-3xl ps-7 text-start">
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                  {item.a}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
