"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ImageUpload";
import { VERTICALS } from "@/lib/verticals";
import { THEMES } from "@/lib/themes";
import { updateBusiness, type BusinessInput } from "@/app/reglaj/actions";
import type { Business } from "@/lib/types";

export function SettingsForm({ business }: { business: Business }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<BusinessInput>({
    name: business.name,
    business_type: business.business_type ?? "boutik",
    employees_count: business.employees_count == null ? "" : String(business.employees_count),
    theme: business.theme ?? "whatsapp",
    layout: business.layout ?? "auto",
    phone_e164: business.phone_e164 ?? "",
    hours: business.hours ?? "",
    address: business.address ?? "",
    logo_url: business.logo_url,
    cover_url: business.cover_url,
    social_instagram: business.social_instagram ?? "",
    social_facebook: business.social_facebook ?? "",
    social_tiktok: business.social_tiktok ?? "",
  });
  const set = (patch: Partial<BusinessInput>) => setF((s) => ({ ...s, ...patch }));

  function submit() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateBusiness(f);
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? "Erè");
      }
    });
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="flex items-center gap-3 bg-brand px-4 pb-4 pt-5">
        <Link href="/" aria-label="Retounen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <span className="text-[19px] font-extrabold text-white">Reglaj biznis</span>
      </header>

      <div className="flex flex-col gap-5 px-4 pt-5">
        {/* Raccourcis */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/abonman" className="flex items-center gap-2 rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            <span className="text-[13.5px] font-bold">Abònman</span>
          </Link>
          <Link href="/ekip" className="flex items-center gap-2 rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg>
            <span className="text-[13.5px] font-bold">Ekip</span>
          </Link>
        </div>

        {/* Bannière + logo */}
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          <span className="text-[13px] font-bold text-ink-soft">Kouvèti (banner)</span>
          <ImageUpload value={f.cover_url} folder="covers" shape="wide" label="Ajoute banner" onChange={(url) => set({ cover_url: url })} />
          <div className="h-px bg-line" />
          <span className="text-[13px] font-bold text-ink-soft">Logo</span>
          <ImageUpload value={f.logo_url} folder="logos" shape="square" label="Ajoute logo" onChange={(url) => set({ logo_url: url })} />
        </section>

        {/* Infos */}
        <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          <Field label="Non biznis"><input value={f.name} onChange={(e) => set({ name: e.target.value })} className={cls} /></Field>
          <Field label="Tip biznis">
            <select value={f.business_type} onChange={(e) => set({ business_type: e.target.value })} className={cls}>
              {Object.entries(VERTICALS).map(([key, v]) => (
                <option key={key} value={key}>{v.label}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nimewo WhatsApp"><input value={f.phone_e164} onChange={(e) => set({ phone_e164: e.target.value })} className={cls} placeholder="+509 3712 4488" /></Field>
            <Field label="Kantite anplwaye"><input value={f.employees_count} onChange={(e) => set({ employees_count: e.target.value })} inputMode="numeric" className={cls} placeholder="3" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lè louvri"><input value={f.hours} onChange={(e) => set({ hours: e.target.value })} className={cls} placeholder="7am–7pm" /></Field>
            <Field label="Adrès"><input value={f.address} onChange={(e) => set({ address: e.target.value })} className={cls} placeholder="Delmas 31" /></Field>
          </div>
        </section>

        {/* Apparence */}
        <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          <span className="text-[13px] font-bold text-ink-soft">Aparans vitrin lan</span>
          <Field label="Tèm koulè">
            <select value={f.theme} onChange={(e) => set({ theme: e.target.value })} className={cls}>
              {Object.entries(THEMES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Dispozisyon kat yo">
            <select value={f.layout} onChange={(e) => set({ layout: e.target.value })} className={cls}>
              <option value="auto">Otomatik (selon tip biznis)</option>
              <option value="grid">Grille (kat ak foto)</option>
              <option value="menu">Menu (lis tankou restoran)</option>
            </select>
          </Field>
          {/* Aperçu du thème */}
          <div className="flex gap-2">
            {Object.entries(THEMES).map(([k, t]) => (
              <button key={k} type="button" onClick={() => set({ theme: k })} className={`h-10 flex-1 rounded-lg ${f.theme === k ? "ring-2 ring-offset-2 ring-ink" : ""}`} style={{ background: t.accent }} aria-label={t.label} />
            ))}
          </div>
        </section>

        {/* Réseaux sociaux */}
        <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          <span className="text-[13px] font-bold text-ink-soft">Rezo sosyal</span>
          <Field label="Instagram"><input value={f.social_instagram} onChange={(e) => set({ social_instagram: e.target.value })} className={cls} placeholder="https://instagram.com/…" /></Field>
          <Field label="Facebook"><input value={f.social_facebook} onChange={(e) => set({ social_facebook: e.target.value })} className={cls} placeholder="https://facebook.com/…" /></Field>
          <Field label="TikTok"><input value={f.social_tiktok} onChange={(e) => set({ social_tiktok: e.target.value })} className={cls} placeholder="https://tiktok.com/@…" /></Field>
        </section>

        {error && <div className="rounded-xl bg-[#FCE4E4] px-3 py-2 text-[13px] text-[#C0392B]">{error}</div>}
        {saved && <div className="rounded-xl bg-[#E7F7F1] px-3 py-2 text-[13px] font-semibold text-brand">Sove ✓</div>}

        <button onClick={submit} disabled={pending} className="flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60">
          {pending ? "N ap sove…" : "Sove chanjman"}
        </button>
      </div>
    </div>
  );
}

const cls = "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[15px] outline-none focus:border-brand focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
