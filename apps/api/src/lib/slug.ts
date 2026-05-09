import slugify from "slugify";

export function slugFromTitle(title: string): string {
  const raw = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    locale: "ar",
  });
  return raw.length > 0 ? raw : "item";
}
