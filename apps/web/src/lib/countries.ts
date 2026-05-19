import countries from "i18n-iso-countries";
import ar from "i18n-iso-countries/langs/ar.json";

let registered = false;

function ensureArabicLocale(): void {
  if (registered) return;
  countries.registerLocale(ar);
  registered = true;
}

export type CountryOption = {
  code: string;
  nameAr: string;
};

/** كل الدول بأسماء عربية رسمية، مرتبة أبجديًا */
export function getCountryOptions(): CountryOption[] {
  ensureArabicLocale();
  const names = countries.getNames("ar", { select: "official" });
  return Object.entries(names)
    .map(([code, nameAr]) => ({ code, nameAr }))
    .sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
}

/**
 * يطابق القيمة المخزّنة (اسم عربي، أو رمز ISO، أو نص قديم) مع اسم العرض في القائمة.
 */
export function normalizeCountryForSelect(
  stored: string | null | undefined,
): string {
  if (!stored?.trim()) return "";
  const trimmed = stored.trim();
  ensureArabicLocale();
  const names = countries.getNames("ar", { select: "official" });

  if (Object.values(names).includes(trimmed)) {
    return trimmed;
  }

  const upper = trimmed.toUpperCase();
  if (names[upper]) {
    return names[upper];
  }

  const fromAlpha3 = countries.alpha3ToAlpha2(upper);
  if (fromAlpha3 && names[fromAlpha3]) {
    return names[fromAlpha3];
  }

  return trimmed;
}
