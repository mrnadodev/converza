"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VERTICALS } from "@/lib/verticals";
import { registerMerchant, type RegisterInput } from "@/app/enskri/actions";

export function RegisterForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [f, setF] = useState<RegisterInput>({
    businessName: "",
    businessType: "boutik",
    employeesCount: "",
    phone: "",
    fullName: "",
    email: "",
    password: "",
  });
  const set = (p: Partial<RegisterInput>) => setF((s) => ({ ...s, ...p }));

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
        setError(res.error ?? "Erè");
      }
    });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[440px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      <div className="flex flex-col items-center gap-3 bg-brand px-6 pb-10 pt-14">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white shadow-lg">
          <Rooster />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-white">Kreye biznis ou</span>
        <span className="text-[13px] text-[#B9F5E4]">Kòmanse vann sou WhatsApp ak CONVERZA</span>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
        {error && <div className="mb-4 rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{error}</div>}
        {info && <div className="mb-4 rounded-xl bg-[#E7F1FB] px-4 py-3 text-[13px] font-medium text-[#1A6BB8]">{info}</div>}

        <div className="flex flex-col gap-4">
          <Field label="Non biznis lan"><input value={f.businessName} onChange={(e) => set({ businessName: e.target.value })} className={cls} placeholder="Ti Kòk Boutik" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tip biznis">
              <select value={f.businessType} onChange={(e) => set({ businessType: e.target.value })} className={cls}>
                {Object.entries(VERTICALS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Kantite anplwaye">
              <input value={f.employeesCount} onChange={(e) => set({ employeesCount: e.target.value })} inputMode="numeric" className={cls} placeholder="3" />
            </Field>
          </div>
          <Field label="Nimewo WhatsApp"><input value={f.phone} onChange={(e) => set({ phone: e.target.value })} className={cls} placeholder="+509 3712 4488" /></Field>
          <Field label="Non ou"><input value={f.fullName} onChange={(e) => set({ fullName: e.target.value })} className={cls} placeholder="Nadège Pierre" /></Field>
          <div className="h-px bg-line" />
          <Field label="Imèl"><input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={cls} placeholder="ou@egzanp.com" autoComplete="email" /></Field>
          <Field label="Modpas"><input type="password" value={f.password} onChange={(e) => set({ password: e.target.value })} className={cls} placeholder="••••••••" autoComplete="new-password" /></Field>

          <button onClick={submit} disabled={pending} className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60">
            {pending ? "N ap kreye…" : "Kreye biznis mwen"}
          </button>

          <p className="mt-2 text-center text-[13px] text-ink-muted">
            Ou gen yon kont deja?{" "}
            <Link href="/login" className="font-bold text-brand">Konekte</Link>
          </p>
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

function Rooster() {
  return (
    <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" /><circle cx="41" cy="11" r="4" fill="#FFD34E" /><circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#075E54" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" /><path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" /><circle cx="45" cy="22" r="2.4" fill="#FFFFFF" />
    </svg>
  );
}
