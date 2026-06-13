/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />

self.addEventListener("push", (event) => {
  let payload = {
    title: "StudyHouse",
    body: "لديك إشعار جديد",
    url: "/student/notifications",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: parsed.title ?? payload.title,
        body: parsed.body ?? payload.body,
        url: parsed.url ?? parsed.actionUrl ?? payload.url,
        icon: parsed.icon ?? payload.icon,
        badge: parsed.badge ?? payload.badge,
      };
    }
  } catch {
    /* keep defaults */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: { url: payload.url },
      dir: "rtl",
      lang: "ar",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    "/student/notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
