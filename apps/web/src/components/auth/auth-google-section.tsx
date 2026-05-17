"use client";

import { Suspense } from "react";

import { Button } from "@/components/ui/button";

import { GoogleAuthButton } from "./google-auth-button";

function GoogleAuthFallback(): React.ReactElement {
  return (
    <Button
      type="button"
      variant="outline"
      disabled
      className="h-10 w-full rounded-xl border-border/80 bg-muted/30 text-sm font-medium text-muted-foreground"
    >
      المتابعة عبر Google
    </Button>
  );
}

export function AuthGoogleSection(): React.ReactElement {
  return (
    <Suspense fallback={<GoogleAuthFallback />}>
      <GoogleAuthButton />
    </Suspense>
  );
}
