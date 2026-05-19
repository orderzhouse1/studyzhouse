"use client";

import { useMemo } from "react";

import {
  getCountryOptions,
  normalizeCountryForSelect,
} from "@/lib/countries";
import { cn } from "@/lib/utils";

export function CountrySelect({
  id,
  value,
  onChange,
  disabled,
  className,
  placeholder = "— اختر الدولة —",
}: {
  id?: string;
  value: string;
  onChange: (countryNameAr: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}): React.ReactElement {
  const options = useMemo(() => getCountryOptions(), []);

  const normalizedValue = useMemo(
    () => normalizeCountryForSelect(value),
    [value],
  );

  const showLegacyOption =
    normalizedValue.length > 0 &&
    !options.some((o) => o.nameAr === normalizedValue);

  return (
    <select
      id={id}
      disabled={disabled}
      value={normalizedValue}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        !normalizedValue && "text-muted-foreground",
        className,
      )}
    >
      <option value="">{placeholder}</option>
      {showLegacyOption ? (
        <option value={normalizedValue}>{normalizedValue}</option>
      ) : null}
      {options.map((opt) => (
        <option key={opt.code} value={opt.nameAr}>
          {opt.nameAr}
        </option>
      ))}
    </select>
  );
}
