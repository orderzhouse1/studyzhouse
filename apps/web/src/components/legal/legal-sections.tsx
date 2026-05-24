import type { LegalSection } from "@/lib/legal-content";
import { cn } from "@/lib/utils";

export function LegalSections({
  sections,
  className,
}: {
  sections: LegalSection[];
  className?: string;
}): React.ReactElement {
  return (
    <div className={cn("space-y-4", className)}>
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-24 rounded-2xl border border-border/70 bg-card p-5 shadow-sm ring-1 ring-border/40 sm:p-6"
          aria-labelledby={`${section.id}-heading`}
        >
          <h2
            id={`${section.id}-heading`}
            className="text-base font-bold text-[hsl(222_47%_18%)] sm:text-lg"
          >
            {section.title}
          </h2>
          {section.paragraphs?.map((p) => (
            <p
              key={p.slice(0, 48)}
              className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground"
            >
              {p}
            </p>
          ))}
          {section.bullets && section.bullets.length > 0 ? (
            <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
              {section.bullets.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
