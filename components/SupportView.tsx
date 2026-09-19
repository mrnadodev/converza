"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { ADMIN_COPY } from "@/lib/i18n/app/admin";
import { STOCK_COPY } from "@/lib/i18n/app/stock";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { formatMoney } from "@/lib/money";
import { changeOwnerEmail, ownerRecoveryLink, suspendMerchant, transferOwnership } from "@/app/admin/actions";
import type { Issue } from "@/lib/merchant-health";

export interface SupportData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  planUntil: string | null;
  createdAt: string;
  phone: string | null;
  address: string | null;
  sector: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
  ownerEmail: string | null;
  lastSignInAt: string | null;
  payMethods: string[];
  deliveryZones: number;
  counts: { products: number; orders: number; tracked: number; costs: number };
  members: { id: string; name: string; role: string; profile: string | null }[];
  products: { id: string; name: string; priceCents: number; currency: "HTG" | "USD"; stockQty: number | null; stockState: string; active: boolean; photo: string | null }[];
  orders: { id: string; ref: string; status: string; createdAt: string; customer: string; totalCents: number; owedCents: number }[];
  movements: { id: string; kind: string; delta: number; qtyAfter: number | null; createdAt: string; product: string }[];
  issues: Issue[];
}

const LEVEL_STYLE: Record<string, string> = {
  blocker: "bg-[#FCE4E4] text-[#C0392B]",
  warning: "bg-owed-bg text-owed-text",
  info: "bg-[#F3F6F4] text-ink-soft",
};

export function SupportView({ data }: { data: SupportData }) {
  const a = useDict(ADMIN_COPY);
  const s = useDict(STOCK_COPY);
  const c = useDict(COMMON_COPY);
  const { language } = useLanguage();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [reason, setReason] = useState(data.suspendedReason ?? "");
  const [email, setEmail] = useState(data.ownerEmail ?? "");

  const locale = language === "en" ? "en-US" : "fr-HT";
  const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" }) : "—");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setMessage(null);
      const res = await fn();
      setMessage(res.ok ? a.support.done : res.error === "migration" ? a.support.migration : res.error ?? a.support.migration);
      if (res.ok) router.refresh();
    });

  const field = "h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand";
  const card = "rounded-2xl border border-line bg-white p-3.5";

  return (
    <div className="app-page min-h-[100dvh] bg-[#F7F8F9] pb-16 text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1B17] px-4 pb-4 pt-6">
        <div className="min-w-0">
          <h1 className="truncate text-[19px] font-extrabold text-white">{data.name}</h1>
          <p className="text-[12px] text-white/60">
            {a.support.title} · /{data.slug} · {data.plan}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link href="/admin" className="rounded-lg bg-white/10 px-3 py-2 text-[12.5px] font-semibold text-white">
            {a.support.back}
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pt-4">
        <p className="rounded-xl bg-[#E7F1FB] px-3 py-2 text-[12px] font-semibold text-[#154E85]">🔒 {a.support.readOnly}</p>
        {message && <p className="rounded-xl bg-[#E7F7F1] px-3 py-2 text-[12.5px] font-bold text-brand">{message}</p>}

        {/* Diagnostic */}
        <section className={card}>
          <h2 className="text-xs font-extrabold uppercase text-ink">{a.health.title}</h2>
          {data.issues.length === 0 ? (
            <p className="mt-2 text-[13px] font-semibold text-brand">✓ {a.health.ok}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {data.issues.map((i) => (
                <li key={i.code} className="flex items-center gap-2 text-[13px]">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${LEVEL_STYLE[i.level]}`}>{a.health.levels[i.level]}</span>
                  <span>{a.health.codes[i.code] ?? i.code}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Identité */}
        <section className={card}>
          <h2 className="text-xs font-extrabold uppercase text-ink">{a.support.sections.identity}</h2>
          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
            <Row label={a.cockpit.structure.phone} value={data.phone ?? "—"} />
            <Row label={a.merchants.owner} value={data.ownerEmail ?? "—"} />
            <Row label={a.merchants.joined} value={date(data.createdAt)} />
            <Row label={a.merchants.lastOrder} value={data.orders[0] ? date(data.orders[0].createdAt) : a.merchants.never} />
            <Row label={a.support.lastSignIn("").replace(/\s*:\s*$/, "")} value={data.lastSignInAt ? date(data.lastSignInAt) : a.support.neverSignedIn} />
            <Row label={a.cockpit.structure.address} value={data.address ?? "—"} />
            <Row label={a.support.sections.payments} value={data.payMethods.length ? data.payMethods.join(", ") : "—"} />
            <Row label={a.merchants.stats.products} value={`${data.counts.products} · ${data.counts.tracked} ${s.quantity.toLowerCase()}`} />
          </dl>
        </section>

        {/* Équipe */}
        <section className={card}>
          <h2 className="text-xs font-extrabold uppercase text-ink">{a.support.sections.team}</h2>
          {data.members.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-faint">{a.support.empty}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {data.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-[13px]">
                  <span className="truncate font-bold">{m.name}</span>
                  <span className="shrink-0 text-ink-muted">
                    {m.role === "owner" ? c.profiles.owner : c.profiles[m.profile ?? "agent"] ?? c.profiles.agent}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Commandes */}
        <section className={card}>
          <h2 className="text-xs font-extrabold uppercase text-ink">{a.support.sections.orders}</h2>
          {data.orders.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-faint">{a.support.empty}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {data.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-2 text-[12.5px]">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-bold">
                      #{o.ref} · {o.customer}
                    </span>
                    <span className="text-ink-muted">
                      {c.statuses[o.status as keyof typeof c.statuses] ?? o.status} · {date(o.createdAt)}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="font-extrabold">{formatMoney(o.totalCents)}</span>
                    {o.owedCents > 0 && <span className="text-[11px] font-bold text-owed-text">{formatMoney(o.owedCents)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Produits */}
        <section className={card}>
          <h2 className="text-xs font-extrabold uppercase text-ink">{a.support.sections.products}</h2>
          {data.products.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-faint">{a.support.empty}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {data.products.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5 py-2 text-[12.5px]">
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="h-9 w-9 shrink-0 rounded-lg bg-[#F3F6F4]" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-bold">{p.name}</span>
                  <span className="shrink-0 text-ink-muted">{formatMoney(p.priceCents, p.currency)}</span>
                  <span className="w-16 shrink-0 text-right text-ink-soft">{p.stockQty === null ? s.untracked : p.stockQty}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Mouvements de stock */}
        <section className={card}>
          <h2 className="text-xs font-extrabold uppercase text-ink">{a.support.sections.stock}</h2>
          {data.movements.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-faint">{a.support.empty}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {data.movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-[12.5px]">
                  <span className="min-w-0 truncate">
                    {s.history.kinds[m.kind as keyof typeof s.history.kinds] ?? m.kind} · {m.product}
                  </span>
                  <span className={`shrink-0 font-extrabold ${m.delta > 0 ? "text-brand" : "text-[#C0392B]"}`}>
                    {m.delta > 0 ? "+" : ""}
                    {m.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actions de support */}
        <section className={`${card} flex flex-col gap-4`}>
          <h2 className="text-xs font-extrabold uppercase text-ink">{a.support.title}</h2>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink-muted">{a.support.recovery}</span>
            <span className="text-[11.5px] text-ink-muted">{a.support.recoveryHint}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await ownerRecoveryLink(data.id);
                  if (res.ok) setLink(res.link);
                  else setMessage(res.error);
                })
              }
              className="h-10 cursor-pointer rounded-xl bg-brand px-4 text-[13px] font-extrabold text-white disabled:opacity-60"
            >
              {a.support.recovery}
            </button>
            {link && (
              <div className="flex flex-col gap-1.5 rounded-xl bg-[#F7F8F9] p-2.5">
                <code className="break-all text-[11px] text-ink-soft">{link}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link).then(() => setMessage(a.support.copied))}
                  className="h-9 cursor-pointer rounded-lg bg-white text-[12px] font-bold text-brand ring-1 ring-line"
                >
                  {a.support.copyLink}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink-muted">{a.support.changeEmail}</span>
            <span className="text-[11.5px] text-ink-muted">{a.support.changeEmailHint}</span>
            <div className="flex gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={field} />
              <button
                type="button"
                disabled={pending || !email.trim() || email === data.ownerEmail}
                onClick={() => run(() => changeOwnerEmail(data.id, email))}
                className="h-10 shrink-0 cursor-pointer rounded-xl bg-ink px-4 text-[13px] font-bold text-white disabled:opacity-40"
              >
                OK
              </button>
            </div>
          </div>

          {data.members.filter((m) => m.role !== "owner").length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-ink-muted">{a.support.transfer}</span>
              <span className="text-[11.5px] text-ink-muted">{a.support.transferHint}</span>
              <div className="flex flex-wrap gap-2">
                {data.members
                  .filter((m) => m.role !== "owner")
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(a.support.transferConfirm(m.name))) return;
                        run(() => transferOwnership(data.id, m.id));
                      }}
                      className="h-9 cursor-pointer rounded-xl border border-line bg-white px-3 text-[12.5px] font-bold text-ink disabled:opacity-60"
                    >
                      {m.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 border-t border-line pt-3">
            {data.suspendedAt ? (
              <>
                <span className="text-[12.5px] font-bold text-[#C0392B]">{a.support.suspendedSince(date(data.suspendedAt))}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => suspendMerchant(data.id, "", false))}
                  className="h-10 cursor-pointer rounded-xl bg-brand px-4 text-[13px] font-extrabold text-white disabled:opacity-60"
                >
                  {a.support.unsuspend}
                </button>
              </>
            ) : (
              <>
                <span className="text-[12px] font-bold text-ink-muted">{a.support.suspendReason}</span>
                <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className={field} />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(a.support.suspendConfirm(data.name))) return;
                    run(() => suspendMerchant(data.id, reason, true));
                  }}
                  className="h-10 cursor-pointer rounded-xl bg-[#FCE4E4] px-4 text-[13px] font-extrabold text-[#C0392B] disabled:opacity-60"
                >
                  {a.support.suspend}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-line/60 py-1">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-semibold">{value}</dd>
    </div>
  );
}
