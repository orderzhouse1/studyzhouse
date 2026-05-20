import { SiteLogo } from "@/components/layout/site-logo";

export function HeaderBrand({
  href = "/",
}: {
  href?: string;
}): React.ReactElement {
  return (
    <SiteLogo
      href={href}
      priority
      imageClassName="object-right"
    />
  );
}

export const HEADER_INNER_CLASS =
  "mx-auto flex w-full max-w-[min(100%,100rem)] items-center gap-3 px-6 py-2.5 sm:gap-4 sm:px-8 md:px-10 lg:px-14 xl:px-20";

export const HEADER_ROOT_CLASS =
  "sticky top-0 z-50 border-b border-border/90 bg-card/90 shadow-[0_8px_24px_-18px_hsl(222_47%_10%_/_0.2)] backdrop-blur-md";

export const HEADER_MOBILE_SEARCH_CLASS =
  "border-t border-border/60 bg-muted/25 px-6 py-2 sm:px-8 md:hidden md:px-10 lg:px-14 xl:px-20";
