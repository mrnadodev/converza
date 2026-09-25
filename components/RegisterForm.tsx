"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INDUSTRY_SECTORS, type IndustrySectorKey } from "@/lib/verticals";
import { CvzMark } from "@/components/CvzMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";
import { registerMerchant, type RegisterInput } from "@/app/enskri/actions";
import { Select } from "@/components/ui/Select";

export function RegisterForm({
  finishing = false,
  defaultName = "",
}: {
  /** Compte déjà authentifié à qui il ne manque que la boutique. */
  finishing?: boolean;
  defaultName?: string;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const a = landingCopy(language).auth;

  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [selectedSectorKey, setSelectedSectorKey] = useState<IndustrySectorKey>("commerce_vente");
  const currentSector = INDUSTRY_SECTORS[selectedSectorKey];
  const [selectedSubType, setSelectedSubType] = useState<string>(currentSector.subTypes[0]);

  const [f, setF] = useState<RegisterInput>({
    businessName: "",
    businessType: currentSector.subTypes[0],
    employeesCount: "",
    phone: "",
    fullName: defaultName,
    email: "",
    password: "",
  });
  const set = (p: Partial<RegisterInput>) => setF((s) => ({ ...s, ...p }));

  function handleSectorChange(sectorKey: IndustrySectorKey) {
    setSelectedSectorKey(sectorKey);
    const sub = INDUSTRY_SECTORS[sectorKey].subTypes[0];
    setSelectedSubType(sub);
    set({ businessType: sub });
  }

  function handleSubTypeChange(sub: string) {
    setSelectedSubType(sub);
    set({ businessType: sub });
  }

  function submit() {
    setError(null);
    setInfo(null);
    start(async () => {
      const res = await registerMerchant(f);
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else if (res.needsConfirm) {
        setInfo(res.error ?? null);
      } else {
        setError(res.error ?? "Erreur");
      }
    });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[480px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      <div className="relative flex flex-col items-center gap-3 bg-brand px-6 pb-10 pt-14 text-center">
        <div className="absolute right-4 top-4">
          <LanguageToggle />
        </div>
        <CvzMark size={60} />
        <span className="text-xl font-extrabold tracking-tight text-white">
          {finishing ? a.finishTitle : a.registerTitle}
        </span>
        <span className="text-[13px] text-[#B9F5E4]">
          {finishing ? a.finishSubtitle : a.registerSubtitle}
        </span>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
        {error && <div className="mb-4 rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{error}</div>}
        {info && <div className="mb-4 rounded-xl bg-[#E7F1FB] px-4 py-3 text-[13px] font-medium text-[#1A6BB8]">{info}</div>}

        <div className="flex flex-col gap-4">
          <Field label={a.businessName}>
            <input value={f.businessName} onChange={(e) => set({ businessName: e.target.value })} className={cls} placeholder="Ti Kòk Boutik" />
          </Field>

          <Field label={a.sector}>
            <Select value={selectedSectorKey} onChange={(e) => handleSectorChange(e.target.value as IndustrySectorKey)} triggerClassName={cls}>
              {Object.values(INDUSTRY_SECTORS).map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.label}</option>
              ))}
            </Select>
          </Field>

          <Field label={a.specialty}>
            <Select value={selectedSubType} onChange={(e) => handleSubTypeChange(e.target.value)} triggerClassName={cls}>
              {currentSector.subTypes.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
            </Select>
          </Field>

          <Field label={a.employees}>
            <input value={f.employeesCount} onChange={(e) => set({ employeesCount: e.target.value })} inputMode="numeric" className={cls} placeholder="3" />
          </Field>

          <Field label={a.whatsapp}>
            <input value={f.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" className={cls} placeholder="+509 3712 4488" />
          </Field>

          <Field label={a.yourName}>
            <input value={f.fullName} onChange={(e) => set({ fullName: e.target.value })} className={cls} placeholder="Nadège Pierre" />
          </Field>

          {/* Identifiants uniquement pour une nouvelle inscription : un compte
              déjà connecté n'a pas à ressaisir son e-mail. */}
          {!finishing && (
            <>
              <div className="h-px bg-line" />
              <Field label={a.email}>
                <input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={cls} placeholder="vous@exemple.com" autoComplete="email" />
              </Field>
              <Field label={a.password}>
                <input type="password" value={f.password} onChange={(e) => set({ password: e.target.value })} className={cls} placeholder="••••••••" autoComplete="new-password" />
              </Field>
            </>
          )}

          <button
            onClick={submit}
            disabled={pending}
            className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? a.registerPending : finishing ? a.finishCta : a.registerCta}
          </button>

          {!finishing && (
            <p className="mt-2 text-center text-[13px] text-ink-muted">
              {a.haveAccount}{" "}
              <Link href="/login" className="font-bold text-brand">{a.signInLink}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const cls = "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-4 text-[15px] outline-none focus:border-brand focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
