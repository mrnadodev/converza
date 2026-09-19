"use client";

import { useMemo, useState, useTransition } from "react";
import { useDict } from "@/components/LanguageContext";
import { updateLandingCopy } from "@/app/admin/actions";
import { ADMIN_COPY } from "@/lib/i18n/app/admin";
import { LANDING_COPY } from "@/lib/i18n/landing";
import type { Language } from "@/lib/i18n/translations";
import { MAX_FIELD_LENGTH, editableFields, editableSections, sanitizeOverrides, type LandingOverrides } from "@/lib/landing-overrides";

const LANGS: Language[] = ["fr", "ht", "en"];
const LANG_LABEL: Record<Language, string> = { fr: "Français", ht: "Kreyòl", en: "English" };

/**
 * Éditeur des textes de la page d'accueil.
 *
 * Les champs sont générés à partir des textes du code : un texte ajouté à la
 * page plus tard apparaît ici sans rien changer. Chaque champ montre le texte
 * d'origine, et seuls les écarts sont enregistrés.
 */
export function LandingEditor({ initial }: { initial: LandingOverrides }) {
  const a = useDict(ADMIN_COPY);
  const [lang, setLang] = useState<Language>("fr");
  const [saved, setSaved] = useState<LandingOverrides>(initial ?? {});
  // Brouillon par langue : on peut passer d'une langue à l'autre sans perdre ce
  // qu'on a tapé.
  const [drafts, setDrafts] = useState<LandingOverrides>(initial ?? {});
  const [open, setOpen] = useState<string | null>("hero");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const base = LANDING_COPY[lang];
  const fields = useMemo(() => editableFields(base), [base]);
  const sections = useMemo(() => editableSections(base), [base]);
  const draft = drafts[lang] ?? {};
  const stored = saved[lang] ?? {};

  const valueOf = (path: string, original: string) => draft[path] ?? original;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(stored);

  const setField = (path: string, value: string, original: string) => {
    setMessage(null);
    setDrafts((prev) => {
      const next = { ...(prev[lang] ?? {}) };
      if (value === original) delete next[path];
      else next[path] = value;
      return { ...prev, [lang]: next };
    });
  };

  const save = () =>
    startTransition(async () => {
      const res = await updateLandingCopy(lang, draft);
      if (res.ok) {
        // Le serveur a pu écarter des champs (vides, inchangés) : on aligne le
        // brouillon sur ce qu'il a réellement gardé.
        const kept = sanitizeOverrides(draft, base);
        setSaved((prev) => ({ ...prev, [lang]: kept }));
        setDrafts((prev) => ({ ...prev, [lang]: kept }));
        setMessage(a.landing.saved("count" in res && typeof res.count === "number" ? res.count : Object.keys(kept).length));
      } else {
        setMessage(("error" in res && res.error) || "Erreur");
      }
    });

  const inputCls =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 md:px-6">
      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <h2 className="text-[15px] font-extrabold text-ink">{a.landing.title}</h2>
            <p className="mt-0.5 max-w-2xl text-[12.5px] text-ink-muted">{a.landing.hint}</p>
            <p className="mt-1 text-[11.5px] text-ink-faint">{a.landing.pricesNote}</p>
          </div>
          <a
            href="/accueil"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] font-bold text-ink"
          >
            {a.landing.view}
          </a>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-ink-muted">{a.landing.language}</span>
          {LANGS.map((l) => {
            const count = Object.keys(drafts[l] ?? {}).length;
            return (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setMessage(null);
                }}
                className={`rounded-full px-3 py-1 text-[12px] font-extrabold ${lang === l ? "bg-brand text-white" : "bg-[#F3F6F4] text-ink-soft"}`}
              >
                {LANG_LABEL[l]}
                {count > 0 && <span className="ml-1.5 opacity-80">· {count}</span>}
              </button>
            );
          })}
        </div>
      </section>

      {sections.map((section) => {
        const sectionFields = fields.filter((f) => f.section === section);
        const edited = sectionFields.filter((f) => draft[f.path] !== undefined).length;
        const expanded = open === section;
        return (
          <section key={section} className="overflow-hidden rounded-2xl border border-line bg-white">
            <button
              onClick={() => setOpen(expanded ? null : section)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="text-[13.5px] font-extrabold text-ink">{a.landing.sections[section] ?? section}</span>
              <span className="flex items-center gap-2 text-[11.5px] text-ink-faint">
                {edited > 0 && (
                  <span className="rounded-full bg-owed-bg px-2 py-0.5 font-bold text-owed-text">
                    {a.landing.modified} · {edited}
                  </span>
                )}
                <span>{sectionFields.length}</span>
                <span aria-hidden>{expanded ? "▴" : "▾"}</span>
              </span>
            </button>

            {expanded && (
              <div className="flex flex-col divide-y divide-line border-t border-line">
                {sectionFields.map((f) => {
                  const value = valueOf(f.path, f.value);
                  const changed = draft[f.path] !== undefined;
                  const long = f.value.length > 70 || f.value.includes("\n");
                  return (
                    <div key={f.path} className="flex flex-col gap-1.5 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10.5px] text-ink-faint">{f.path.slice(section.length + 1)}</span>
                        {changed && (
                          <button onClick={() => setField(f.path, f.value, f.value)} className="text-[11.5px] font-bold text-brand">
                            {a.landing.reset}
                          </button>
                        )}
                      </div>
                      {long ? (
                        <textarea
                          value={value}
                          onChange={(e) => setField(f.path, e.target.value, f.value)}
                          rows={Math.min(8, Math.max(2, Math.ceil(value.length / 70)))}
                          maxLength={MAX_FIELD_LENGTH}
                          className={`${inputCls} ${changed ? "border-amber-300 bg-[#FFFBEB]" : ""}`}
                        />
                      ) : (
                        <input
                          value={value}
                          onChange={(e) => setField(f.path, e.target.value, f.value)}
                          maxLength={MAX_FIELD_LENGTH}
                          className={`${inputCls} ${changed ? "border-amber-300 bg-[#FFFBEB]" : ""}`}
                        />
                      )}
                      {changed && (
                        <span className="text-[11px] leading-snug text-ink-faint">
                          {a.landing.original} : {f.value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-2xl border border-line bg-white p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12.5px] text-ink-muted">{message ?? (isDirty ? a.landing.unsaved : "")}</span>
        <button
          onClick={save}
          disabled={pending || !isDirty}
          className="h-11 rounded-xl bg-brand px-5 text-[13.5px] font-extrabold text-white active:scale-[0.99] disabled:opacity-50"
        >
          {a.landing.save} ({LANG_LABEL[lang]})
        </button>
      </div>
    </div>
  );
}
