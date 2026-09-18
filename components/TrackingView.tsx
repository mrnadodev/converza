"use client";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict } from "@/components/LanguageContext";
import { TRACKING_COPY } from "@/lib/i18n/tracking";
import { waMeLink } from "@/lib/whatsapp";

export interface TrackingData {
  ref: string;
  status: string;
  firstName: string;
  courier: string | null;
  items: string[];
  shop: { name: string; slug: string; phone: string | null; logo: string | null };
}

// Étapes vues par le client, regroupant les étapes internes du pipeline.
const STEP_OF: Record<string, number> = {
  demand_acha: 0,
  pou_konfime: 0,
  kontak: 0,
  metod_peman: 0,
  konfime_peman: 1,
  peye: 1,
  sou_wout: 2,
  livre: 3,
  swivi: 3,
};

export function TrackingView({ data }: { data: TrackingData }) {
  const t = useDict(TRACKING_COPY);
  const cancelled = data.status === "anile";
  const current = STEP_OF[data.status] ?? 0;
  const steps = [t.steps.received, t.steps.confirmed, t.steps.onTheWay, t.steps.delivered];

  return (
    <main className="min-h-[100dvh] bg-[#F7F8F9] px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {data.shop.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.shop.logo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-extrabold text-white">
                {data.shop.name.slice(0, 1)}
              </span>
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-extrabold text-ink">{data.shop.name}</span>
              <span className="text-[12.5px] text-ink-muted">{t.title(data.ref)}</span>
            </div>
          </div>
          <LanguageToggle variant="compact" />
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
          {data.firstName && <p className="text-[15px] font-bold text-ink">{t.hello(data.firstName)}</p>}

          {cancelled ? (
            <p className="mt-3 rounded-xl bg-[#FCE4E4] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{t.cancelled}</p>
          ) : (
            <ol className="mt-4 flex flex-col">
              {steps.map((label, i) => {
                const done = i <= current;
                const now = i === current;
                return (
                  <li key={label} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < steps.length - 1 && (
                      <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${i < current ? "bg-brand" : "bg-line"}`} aria-hidden="true" />
                    )}
                    <span
                      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                        done ? "bg-brand text-white" : "bg-[#EEF2F3] text-ink-faint"
                      } ${now ? "ring-4 ring-brand/20" : ""}`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <div className="flex flex-col pt-0.5">
                      <span className={`text-[14px] ${done ? "font-extrabold text-ink" : "font-semibold text-ink-faint"}`}>{label}</span>
                      {now && i === 2 && data.courier && <span className="text-[12.5px] text-ink-muted">{t.courier(data.courier)}</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {!cancelled && current < 3 && <p className="rounded-xl bg-[#E7F7F1] px-3 py-2.5 text-[12.5px] font-semibold text-brand">🔐 {t.code}</p>}

        {data.items.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
            <h2 className="text-[13px] font-extrabold text-ink">{t.items}</h2>
            <ul className="mt-2 flex flex-col gap-1 text-[13px] text-ink-soft">
              {data.items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-2 gap-2">
          {data.shop.phone && (
            <a href={waMeLink(data.shop.phone, t.title(data.ref))} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl bg-brand-green text-[13px] font-extrabold text-white">
              {t.contact}
            </a>
          )}
          {data.shop.slug && (
            <a href={`/b/${data.shop.slug}`} className="flex h-11 items-center justify-center rounded-xl border border-line bg-white text-[13px] font-bold text-ink">
              {t.shop}
            </a>
          )}
        </div>
        <p className="text-center text-[11px] text-ink-faint">CONVERZA</p>
      </div>
    </main>
  );
}
