"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinBusiness, type JoinInput } from "@/app/join/actions";

export function JoinForm({ businessId, businessName }: { businessId: string; businessName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [f, setF] = useState<JoinInput>({ businessId, fullName: "", email: "", password: "" });
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
        setError(res.error ?? "Erè");
      }
    });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg">
      <div className="flex flex-col items-center gap-2 bg-brand px-6 pb-10 pt-16 text-center">
        <span className="text-[13px] text-[#B9F5E4]">Ou envite pou rantre nan</span>
        <span className="text-2xl font-extrabold tracking-tight text-white">{businessName}</span>
        <span className="text-[13px] text-[#B9F5E4]">kòm ajan sou CONVERZA</span>
      </div>
      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
        {!businessId && <div className="mb-4 rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] text-[#C0392B]">Lyen envitasyon an pa valab.</div>}
        {error && <div className="mb-4 rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] text-[#C0392B]">{error}</div>}
        {info && <div className="mb-4 rounded-xl bg-[#E7F1FB] px-4 py-3 text-[13px] text-[#1A6BB8]">{info}</div>}
        <div className="flex flex-col gap-4">
          <Field label="Non ou"><input value={f.fullName} onChange={(e) => set({ fullName: e.target.value })} className={cls} placeholder="Jean Baptiste" /></Field>
          <Field label="Imèl"><input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={cls} placeholder="ou@egzanp.com" autoComplete="email" /></Field>
          <Field label="Modpas"><input type="password" value={f.password} onChange={(e) => set({ password: e.target.value })} className={cls} placeholder="••••••••" autoComplete="new-password" /></Field>
          <button onClick={submit} disabled={pending || !businessId} className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60">
            {pending ? "N ap rantre…" : "Rantre nan ekip la"}
          </button>
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
