"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinBusiness, type JoinInput } from "@/app/join/actions";
import { CvzMark } from "@/components/CvzMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { TEAM_COPY } from "@/lib/i18n/app/team";

export function JoinForm({
  businessId,
  token,
  businessName,
}: {
  businessId: string;
  token: string;
  businessName: string;
}) {
  const t = useDict(TEAM_COPY).join;
  const c = useDict(COMMON_COPY);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [f, setF] = useState<JoinInput>({ businessId, token, fullName: "", email: "", password: "" });
  const set = (p: Partial<JoinInput>) => setF((s) => ({ ...s, ...p }));

  function submit() {
    setError(null);
    setInfo(null);
    start(async () => {
      const res = await joinBusiness(f);
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else if (res.needsConfirm) {
        setInfo(res.error ?? null);
      } else {
        setError(res.error ?? c.actions.retry);
      }
    });
  }

  const valid = Boolean(businessId);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[440px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      <div className="relative flex flex-col items-center gap-2 bg-brand px-6 pb-10 pt-14 text-center">
        <div className="absolute right-4 top-4">
          <LanguageToggle />
        </div>
        <CvzMark size={52} />
        {valid ? (
          <>
            <span className="mt-1 text-[13px] text-[#B9F5E4]">{t.invitedTo}</span>
            <span className="text-2xl font-extrabold tracking-tight text-white">{businessName}</span>
            <span className="text-[13px] text-[#B9F5E4]">{t.asAgent}</span>
          </>
        ) : (
          <span className="mt-1 text-xl font-extrabold tracking-tight text-white">CONVERZA</span>
        )}
      </div>

      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
        {/* Un lien invalide n'affiche que l'explication : un formulaire qui ne
            peut pas aboutir ne ferait que faire perdre son temps à la personne. */}
        {!valid ? (
          <p className="rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] leading-relaxed text-[#C0392B]">{t.invalid}</p>
        ) : (
          <>
            {error && <p className="mb-4 rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] text-[#C0392B]">{error}</p>}
            {info && <p className="mb-4 rounded-xl bg-[#E7F1FB] px-4 py-3 text-[13px] text-[#1A6BB8]">{info}</p>}
            <div className="flex flex-col gap-4">
              <Field label={t.name}>
                <input value={f.fullName} onChange={(e) => set({ fullName: e.target.value })} className={cls} placeholder={t.namePlaceholder} />
              </Field>
              <Field label={t.email}>
                <input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={cls} placeholder="ou@egzanp.com" autoComplete="email" />
              </Field>
              <Field label={t.password}>
                <input type="password" value={f.password} onChange={(e) => set({ password: e.target.value })} className={cls} placeholder="••••••••" autoComplete="new-password" />
              </Field>
              <button
                onClick={submit}
                disabled={pending}
                className="mt-2 flex h-[52px] cursor-pointer items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60"
              >
                {pending ? t.submitting : t.submit}
              </button>
            </div>
          </>
        )}
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
