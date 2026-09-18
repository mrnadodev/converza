"use client";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict } from "@/components/LanguageContext";
import { ADMIN_COPY } from "@/lib/i18n/app/admin";

/** Écran d'arrêt de la console super-admin, traduit comme le reste du panneau. */
export function AdminNotice({ kind }: { kind: "noSupabase" | "forbidden" | "noServiceKey" }) {
  const copy = useDict(ADMIN_COPY).notice[kind];

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-2 bg-[#F7F8F9] px-8 text-center">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <h1 className="text-lg font-extrabold text-ink">{copy.title}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-ink-muted">{copy.body}</p>
    </div>
  );
}
