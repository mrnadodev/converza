"use client";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { SUSPENDED_COPY } from "@/lib/i18n/suspended";
import { signOut } from "@/app/login/actions";

export function SuspendedNotice({ name, reason, since }: { name: string; reason: string | null; since: string }) {
  const t = useDict(SUSPENDED_COPY);
  const { language } = useLanguage();
  const date = new Date(since).toLocaleDateString(language === "en" ? "en-US" : "fr-HT", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F7F8F9] px-6 py-10 text-center">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE4E4] text-2xl">⏸️</span>
      <h1 className="text-xl font-extrabold text-ink">{t.title}</h1>
      <p className="max-w-md text-[14px] leading-relaxed text-ink-soft">{t.body(name, date)}</p>
      {reason && (
        <p className="max-w-md rounded-xl bg-white px-4 py-3 text-[13.5px] font-semibold text-ink ring-1 ring-line">
          <span className="text-ink-muted">{t.reason} : </span>
          {reason}
        </p>
      )}
      <p className="max-w-md text-[13px] text-ink-muted">{t.dataSafe}</p>
      <form action={signOut}>
        <button type="submit" className="mt-2 h-11 cursor-pointer rounded-xl border border-line bg-white px-5 text-sm font-bold text-ink">
          {t.signOut}
        </button>
      </form>
    </main>
  );
}
