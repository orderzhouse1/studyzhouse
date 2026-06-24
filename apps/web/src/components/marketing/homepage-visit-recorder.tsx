"use client";

import { useEffect } from "react";

import { requestHeroStatsRefresh } from "@/lib/homepage-hero-stats-client";

const SESSION_KEY = "sh_homepage_visit_recorded";

/**
 * يسجّل زيارة واحدة للصفحة الرئيسية لكل جلسة متصفّح (بدون بيانات شخصية).
 */
export function HomepageVisitRecorder(): null {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage غير متاح
    }

    void fetch("/api/v1/marketing/homepage-visit", {
      method: "POST",
      credentials: "omit",
    })
      .then((res) => {
        if (res.ok || res.status === 204) {
          requestHeroStatsRefresh();
        }
      })
      .catch(() => {
        // لا نكسر الصفحة
      });
  }, []);

  return null;
}
