import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import logoImage from "../../../public/logo.png";

export function SiteLogo({
  href = "/",
  className,
  imageClassName,
  priority = false,
}: {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-w-0 shrink-0 items-center no-underline",
        className,
      )}
    >
      <Image
        src={logoImage}
        alt="STUDYZ HOUSE"
        className={cn(
          "h-9 w-auto max-w-[11rem] object-contain object-center sm:h-10 sm:max-w-[12rem]",
          imageClassName,
        )}
        priority={priority}
      />
    </Link>
  );
}
