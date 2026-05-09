"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { logoutRequest } from "@/lib/auth-api";

export function LogoutButton(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout(): Promise<void> {
    setLoading(true);
    await logoutRequest();
    setLoading(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-xl"
      disabled={loading}
      onClick={() => void onLogout()}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden />
      )}
      تسجيل الخروج
    </Button>
  );
}
