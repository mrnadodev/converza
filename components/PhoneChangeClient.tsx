"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { PHONE_COPY } from "@/lib/i18n/app/phone";
import type { Language } from "@/lib/i18n/translations";
import { waMeLink } from "@/lib/whatsapp";
import {
  DEFAULT_NOTICE_DAYS,
  MAX_DOC_BYTES,
  MAX_PROOFS,
  NOTICE_DAY_OPTIONS,
  PHONE_CHANGE_REASONS,
  maskPhone,
  phoneNoticeState,
  type PhoneChangeReason,
  type PhoneChangeRequest,
} from "@/lib/phone-change";
import {
  cancelPhoneChange,
  createUploadSlot,
  hidePhoneNotice,
  submitPhoneChange,
  type PhoneChangeError,
} from "@/app/chanje-nimewo/actions";
import type { Business } from "@/lib/types";

type Uploaded = { path: string; name: string };
type CustomerLine = { id: string; name: string; phone: string };

function fmtDate(language: Language, iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(language === "en" ? "en-US" : "fr-HT", { day: "2-digit", month: "long", year: "numeric" });
}

export function PhoneChangeClient({
  business,
  requests,
  customers,
  storefrontUrl,
}: {
  business: Business;
  requests: PhoneChangeRequest[];
  customers: CustomerLine[];
  storefrontUrl: string;
}) {
  const p = useDict(PHONE_COPY);
  const c = useDict(COMMON_COPY);
  const { language } = useLanguage();

  const pending = requests.find((r) => r.status === "pending") ?? null;
  const lastDecided = requests.find((r) => r.status === "approved" || r.status === "rejected") ?? null;
  const notice = phoneNoticeState(business);
  const recentlyChanged = lastDecided?.status === "approved" && notice !== null;

  return (
    <div className="app-page min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="flex items-center gap-3 bg-brand px-4 pb-4 pt-5">
        <Link href="/reglaj" aria-label={c.actions.back}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-[19px] font-extrabold text-white">{p.title}</h1>
          <span className="text-[11.5px] text-[#B9F5E4]">{p.subtitle}</span>
        </div>
        <LanguageToggle variant="compact" />
      </header>

      <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 pt-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
          <p className="text-[13.5px] leading-relaxed text-ink-soft">{p.intro}</p>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F3F8F6] px-3 py-2.5">
            <span className="text-[12.5px] font-semibold text-ink-muted">{p.current}</span>
            <span className="text-[14px] font-extrabold text-ink">{business.phone_e164 || p.none}</span>
          </div>
        </section>

        {recentlyChanged && <ApprovedCard business={business} />}
        {recentlyChanged && (
          <NotifyCard requestId={lastDecided!.id} business={business} customers={customers} storefrontUrl={storefrontUrl} />
        )}

        {pending ? (
          <PendingCard request={pending} />
        ) : (
          <>
            {lastDecided?.status === "rejected" && (
              <section className="rounded-2xl bg-[#FCE4E4] p-4 text-[#8A2A20]">
                <h2 className="text-[14px] font-extrabold">{p.rejected.title}</h2>
                {lastDecided.admin_note && (
                  <p className="mt-1 text-[13px]">
                    <span className="font-bold">{p.rejected.reason} : </span>
                    {lastDecided.admin_note}
                  </p>
                )}
                <p className="mt-1 text-[12.5px]">{p.rejected.body}</p>
              </section>
            )}
            <RequestForm />
          </>
        )}

        {requests.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
            <h2 className="text-[14px] font-extrabold">{p.history.title}</h2>
            <ul className="mt-2 divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-[12.5px]">
                  <span className="text-ink-muted">{fmtDate(language, r.created_at)}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{r.new_phone_e164}</span>
                  <span className="font-bold text-ink-soft">{p.history.status[r.status]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Demande en cours ─────────────── */

function PendingCard({ request }: { request: PhoneChangeRequest }) {
  const p = useDict(PHONE_COPY);
  const { language } = useLanguage();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <h2 className="text-[15px] font-extrabold text-amber-950">{p.pending.title}</h2>
      <p className="mt-1 text-[13px] text-amber-900">{p.pending.body(fmtDate(language, request.created_at))}</p>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
        <span className="text-[12.5px] font-semibold text-ink-muted">{p.pending.to}</span>
        <span className="text-[14px] font-extrabold text-ink">{request.new_phone_e164}</span>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(p.pending.cancelConfirm)) return;
          start(async () => {
            await cancelPhoneChange(request.id);
            router.refresh();
          });
        }}
        className="mt-3 h-10 w-full cursor-pointer rounded-xl bg-white text-[13px] font-bold text-[#C0392B] ring-1 ring-[#F3C4C4] disabled:opacity-60"
      >
        {p.pending.cancel}
      </button>
    </section>
  );
}

/* ─────────────── Nouvelle demande ─────────────── */

function RequestForm() {
  const p = useDict(PHONE_COPY);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState<PhoneChangeReason>("piratage");
  const [note, setNote] = useState("");
  const [noticeDays, setNoticeDays] = useState<number>(DEFAULT_NOTICE_DAYS);
  const [proofs, setProofs] = useState<Uploaded[]>([]);
  const [idDoc, setIdDoc] = useState<Uploaded | null>(null);
  const [error, setError] = useState<PhoneChangeError | null>(null);

  function submit() {
    setError(null);
    start(async () => {
      const res = await submitPhoneChange({ newPhone: phone, reason, note, noticeDays, proofPaths: proofs.map((f) => f.path), idDocPath: idDoc?.path ?? null });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  const field = "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-4 text-[15px] outline-none focus:border-brand focus:bg-white";

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
      <h2 className="text-[15px] font-extrabold">{p.form.title}</h2>

      <ol className="flex flex-col gap-1.5">
        {p.steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] text-ink-soft">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E7F7F1] text-[11px] font-extrabold text-brand">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-ink-soft">{p.form.newPhone}</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+509 …" className={field} />
        <span className="text-[11.5px] text-ink-muted">{p.form.newPhoneHint}</span>
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">{p.form.reason}</legend>
        {PHONE_CHANGE_REASONS.map((r) => (
          <label key={r} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13.5px] ${reason === r ? "border-brand bg-[#F3F8F6] font-bold" : "border-line"}`}>
            <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[#008069]" />
            {p.form.reasons[r]}
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-ink-soft">{p.form.note}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder={p.form.notePlaceholder}
          className="rounded-xl border border-line bg-[#F7F8F9] px-4 py-3 text-[14px] outline-none focus:border-brand focus:bg-white" />
      </label>

      <FilePicker
        label={p.form.proofs}
        hint={p.form.proofsHint}
        files={proofs}
        max={MAX_PROOFS}
        onAdd={(f) => setProofs((cur) => [...cur, f])}
        onRemove={(path) => setProofs((cur) => cur.filter((f) => f.path !== path))}
        onError={setError}
      />
      <FilePicker
        label={p.form.idDoc}
        hint={p.form.idDocHint}
        files={idDoc ? [idDoc] : []}
        max={1}
        onAdd={setIdDoc}
        onRemove={() => setIdDoc(null)}
        onError={setError}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-ink-soft">{p.form.notice}</span>
        <div className="grid grid-cols-3 gap-2">
          {NOTICE_DAY_OPTIONS.map((d) => (
            <button key={d} type="button" onClick={() => setNoticeDays(d)}
              className={`h-10 cursor-pointer rounded-xl text-[13px] font-bold ${noticeDays === d ? "bg-brand text-white" : "bg-[#F3F6F4] text-ink-soft"}`}>
              {p.form.noticeDays(d)}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-ink-muted">{p.form.noticeHint}</span>
      </div>

      <p className="rounded-xl bg-[#F3F8F6] px-3 py-2.5 text-[12px] leading-snug text-ink-soft">🔒 {p.form.privacy}</p>

      {error && <p className="rounded-xl bg-[#FCE4E4] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{p.errors[error]}</p>}

      <button type="button" onClick={submit} disabled={pending}
        className="flex h-[52px] cursor-pointer items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white disabled:opacity-60">
        {pending ? p.form.submitting : p.form.submit}
      </button>
    </section>
  );
}

function FilePicker({
  label,
  hint,
  files,
  max,
  onAdd,
  onRemove,
  onError,
}: {
  label: string;
  hint: string;
  files: Uploaded[];
  max: number;
  onAdd: (f: Uploaded) => void;
  onRemove: (path: string) => void;
  onError: (e: PhoneChangeError) => void;
}) {
  const p = useDict(PHONE_COPY);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const okType = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!okType || file.size > MAX_DOC_BYTES) return onError("badFile");

    setBusy(true);
    try {
      const ext = file.type === "application/pdf" ? "pdf" : (file.name.split(".").pop() || "jpg");
      const slot = await createUploadSlot(ext);
      if (!slot.ok) return onError(slot.error);
      // Envoi direct vers le dossier privé, par un lien signé à usage unique.
      const { error } = await createClient().storage.from("verification").uploadToSignedUrl(slot.path, slot.token, file, { contentType: file.type });
      if (error) return onError("failed");
      onAdd({ path: slot.path, name: file.name });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      <span className="text-[11.5px] leading-snug text-ink-muted">{hint}</span>
      {files.map((f) => (
        <div key={f.path} className="flex items-center justify-between gap-2 rounded-xl bg-[#F3F8F6] px-3 py-2 text-[12.5px]">
          <span className="min-w-0 truncate font-semibold">📎 {f.name}</span>
          <button type="button" onClick={() => onRemove(f.path)} className="shrink-0 cursor-pointer font-bold text-[#C0392B]">
            {p.form.remove}
          </button>
        </div>
      ))}
      {files.length < max && (
        <>
          <input ref={input} type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" />
          <button type="button" disabled={busy} onClick={() => input.current?.click()}
            className="h-11 cursor-pointer rounded-xl border-2 border-dashed border-line text-[13px] font-bold text-brand disabled:opacity-60">
            {busy ? p.form.uploading : `+ ${p.form.addFile}`}
          </button>
        </>
      )}
    </div>
  );
}

/* ─────────────── Après validation ─────────────── */

function ApprovedCard({ business }: { business: Business }) {
  const p = useDict(PHONE_COPY);
  const { language } = useLanguage();
  const router = useRouter();
  const [pending, start] = useTransition();
  const banner = phoneNoticeState(business) === "banner";

  return (
    <section className="rounded-2xl border-2 border-emerald-300 bg-[#F3F8F6] p-4">
      <h2 className="text-[15px] font-extrabold text-brand">✓ {p.approved.title}</h2>
      <p className="mt-1 text-[13px] text-ink-soft">{p.approved.body(fmtDate(language, business.phone_changed_at))}</p>
      {business.previous_phone_e164 && (
        <p className="mt-1 text-[12.5px] text-ink-muted">
          {maskPhone(business.previous_phone_e164)} → <span className="font-bold text-ink">{business.phone_e164}</span>
        </p>
      )}
      <p className="mt-2 text-[12.5px] text-ink-soft">
        {banner ? p.approved.bannerUntil(fmtDate(language, business.phone_notice_until)) : p.approved.bannerOff}
      </p>
      {banner && (
        <button type="button" disabled={pending}
          onClick={() => start(async () => { await hidePhoneNotice(); router.refresh(); })}
          className="mt-2 h-10 w-full cursor-pointer rounded-xl bg-white text-[13px] font-bold text-ink-soft ring-1 ring-line disabled:opacity-60">
          {p.approved.hide}
        </button>
      )}
    </section>
  );
}

function NotifyCard({
  requestId,
  business,
  customers,
  storefrontUrl,
}: {
  requestId: string;
  business: Business;
  customers: CustomerLine[];
  storefrontUrl: string;
}) {
  const p = useDict(PHONE_COPY);
  const { language } = useLanguage();
  const [msgLang, setMsgLang] = useState<Language>(language);
  const [sent, setSent] = useState<string[]>([]);
  const storageKey = `cvz-notified-${requestId}`;

  // Suivi local de l'avancement : une commodité de cet appareil, pas une donnée
  // à partager. Sans stockage disponible, la liste repart simplement de zéro.
  useEffect(() => {
    try {
      setSent(JSON.parse(localStorage.getItem(storageKey) ?? "[]"));
    } catch {
      setSent([]);
    }
  }, [storageKey]);

  function markSent(id: string) {
    setSent((cur) => {
      const next = cur.includes(id) ? cur : [...cur, id];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // stockage indisponible : l'envoi a eu lieu quand même
      }
      return next;
    });
  }

  const template = PHONE_COPY[msgLang].notify.message;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-extrabold">{p.notify.title}</h2>
        {customers.length > 0 && <span className="text-[12px] font-bold text-brand">{p.notify.progress(sent.length, customers.length)}</span>}
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{p.notify.hint}</p>

      {customers.length === 0 ? (
        <p className="mt-3 text-[13px] text-ink-muted">{p.notify.empty}</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-ink-muted">{p.notify.language}</span>
            {(["fr", "ht", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setMsgLang(l)}
                className={`h-8 cursor-pointer rounded-lg px-3 text-[12px] font-bold ${msgLang === l ? "bg-brand text-white" : "bg-[#F3F6F4] text-ink-soft"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <ul className="mt-3 divide-y divide-line">
            {customers.map((cu) => {
              const done = sent.includes(cu.id);
              const text = template(cu.name.split(" ")[0] || cu.name, business.name, business.phone_e164 ?? "", storefrontUrl);
              return (
                <li key={cu.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold">{cu.name}</p>
                    <p className="text-[12px] text-ink-muted">{cu.phone}</p>
                  </div>
                  <a href={waMeLink(cu.phone, text)} target="_blank" rel="noopener noreferrer" onClick={() => markSent(cu.id)}
                    className={`flex h-9 shrink-0 items-center rounded-xl px-3.5 text-[12.5px] font-extrabold ${done ? "bg-[#E7F7F1] text-brand" : "bg-brand-green text-white"}`}>
                    {done ? `✓ ${p.notify.sent}` : p.notify.send}
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
