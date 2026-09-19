"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict } from "@/components/LanguageContext";
import { LEGAL_COPY } from "@/lib/i18n/legal";
import type { LegalInfo } from "@/lib/legal";
import { contactLines } from "@/lib/i18n/legal";
import { hasLegalContact } from "@/lib/legal";

// Page de conditions ou de confidentialité. Le texte suit la langue choisie ;
// les coordonnées viennent de la console (lib/legal.ts) et ne sont jamais
// inventées ici.
export function LegalView({ doc, info }: { doc: "terms" | "privacy"; info: LegalInfo }) {
  const t = useDict(LEGAL_COPY);
  const content = t[doc];
  const lines = contactLines(info);
  const other = doc === "terms" ? { href: "/konfidansyalite", label: t.privacy.title } : { href: "/kondisyon", label: t.terms.title };

  return (
    <main className="min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="border-b border-line bg-white">
        <div className="app-page flex items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="text-[15px] font-extrabold text-ink">
            CONVERZA
          </Link>
          <div className="flex items-center gap-3">
            <Link href={other.href} className="text-[12.5px] font-bold text-ink-muted underline-offset-2 hover:underline">
              {other.label}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <article className="app-page px-5 pt-8">
        <h1 className="text-[26px] font-extrabold leading-tight text-ink">{content.title}</h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-soft">{content.subtitle}</p>
        <p className="mt-2 text-[12.5px] text-ink-faint">{info.updatedOn ? t.updated(info.updatedOn) : t.noDate}</p>

        <div className="mt-8 flex flex-col gap-7">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-[16px] font-extrabold text-ink">{section.title}</h2>
              <div className="mt-2 flex flex-col gap-2">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="max-w-2xl text-[14px] leading-[1.7] text-ink-soft">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-[16px] font-extrabold text-ink">{t.contactTitle}</h2>
            {hasLegalContact(info) ? (
              <ul className="mt-2 flex flex-col gap-1">
                {lines.map((line) => (
                  <li key={line} className="text-[14px] font-semibold text-ink">
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 max-w-2xl text-[14px] leading-[1.7] text-ink-soft">{t.noContact}</p>
            )}
          </section>
        </div>

        <Link href="/" className="mt-10 inline-flex h-11 items-center rounded-xl border border-line bg-white px-5 text-sm font-bold text-ink">
          {t.back}
        </Link>
      </article>
    </main>
  );
}
