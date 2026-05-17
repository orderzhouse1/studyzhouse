import Image from "next/image";

const UNSPLASH = "https://images.unsplash.com";

/** صور تعليمية — Unsplash (ترخيص Unsplash). */
const TILES = [
  {
    src: `${UNSPLASH}/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=82&w=720&h=480`,
    alt: "طلاب في جلسة تعليمية جماعية",
    className:
      "start-[2%] top-[6%] z-[1] h-[21%] w-[44%] max-lg:start-[4%] max-lg:top-[10%] max-lg:h-[19%] max-lg:w-[40%]",
    sizes: "(max-width: 1024px) 42vw, 320px",
    priority: true,
  },
  {
    src: `${UNSPLASH}/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=82&w=640&h=520`,
    alt: "طلاب يتعاونون على مشروع دراسي",
    className:
      "end-[-2%] top-[-4%] z-[2] h-[26%] w-[36%] max-lg:end-[0%] max-lg:top-[2%] max-lg:h-[22%] max-lg:w-[34%]",
    sizes: "(max-width: 1024px) 38vw, 300px",
    priority: true,
  },
  {
    src: `${UNSPLASH}/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=82&w=800&h=1100`,
    alt: "طفل يتعلّم أمام الحاسوب",
    className:
      "start-[18%] top-[14%] z-[5] h-[74%] w-[54%] max-lg:start-[20%] max-lg:top-[18%] max-lg:h-[68%] max-lg:w-[50%]",
    sizes: "(max-width: 1024px) 52vw, 420px",
    priority: true,
  },
  {
    src: `${UNSPLASH}/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=82&w=560&h=560`,
    alt: "حاسوب محمول على مكتب للتعلّم والبرمجة",
    className:
      "end-[2%] top-[34%] z-[4] h-[24%] w-[30%] max-lg:end-[4%] max-lg:top-[36%] max-lg:h-[22%] max-lg:w-[28%]",
    sizes: "(max-width: 1024px) 30vw, 260px",
    priority: false,
  },
  {
    src: `${UNSPLASH}/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=82&w=640&h=900`,
    alt: "قراءة كتاب في أجواء هادئة",
    className:
      "start-[0%] bottom-[2%] z-[3] h-[50%] w-[36%] max-lg:bottom-[4%] max-lg:h-[46%] max-lg:w-[34%]",
    sizes: "(max-width: 1024px) 36vw, 300px",
    priority: false,
  },
  {
    src: `${UNSPLASH}/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=82&w=640&h=520`,
    alt: "طالب يدوّن ملاحظات أثناء الدراسة",
    className:
      "end-[6%] bottom-[4%] z-[4] h-[30%] w-[38%] max-lg:end-[8%] max-lg:bottom-[6%] max-lg:h-[28%] max-lg:w-[36%]",
    sizes: "(max-width: 1024px) 38vw, 300px",
    priority: false,
  },
] as const;

/**
 * كولاج هيرو بأسلوب تحريري غير متماثل (مستوحى من لوحات Pinterest) مع صور تعليمية.
 */
export function HeroCourseCollage(): React.ReactElement {
  return (
    <div
      className="relative mx-auto min-h-[max(360px,min(50vh,460px))] w-full max-w-md overflow-visible sm:max-w-lg lg:mx-0 lg:max-w-none lg:min-h-[max(430px,min(54vh,540px))]"
      aria-label="صور تعبيرية عن التعلم والكورسات"
    >
      {TILES.map((tile) => (
        <div
          key={tile.src}
          className={`absolute ${tile.className} overflow-hidden rounded-[1.75rem] shadow-card ring-1 ring-black/[0.07] lg:rounded-[2rem]`}
        >
          <Image
            src={tile.src}
            alt={tile.alt}
            fill
            className="object-cover"
            sizes={tile.sizes}
            priority={tile.priority}
          />
        </div>
      ))}
    </div>
  );
}
