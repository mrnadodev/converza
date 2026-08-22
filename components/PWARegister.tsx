"use client";

import { useEffect } from "react";

// Enregistre le service worker (PWA installable + offline de base).
export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
