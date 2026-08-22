"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { removeAgent } from "@/app/ekip/actions";

interface Member {
  id: string;
  full_name: string;
  role: string;
  salesCount: number;
  salesCents: number;
}

const TONES = ["bg-[#DCF8C6] text-[#2A7D3F]", "bg-[#D7EBFF] text-[#1A6BB8]", "bg-[#EADCF8] text-[#7A3EAF]", "bg-[#FDECC8] text-[#B7791F]"];
const initials = (n: string) => n.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

export function TeamManager({ members, isOwner, businessId }: { members: Member[]; isOwner: boolean; businessId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  function copyInvite() {
    const url = `${window.location.origin}/join?b=${businessId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  function remove(m: Member) {
    if (!confirm(`Retire ${m.full_name} nan ekip la?`)) return;
    start(async () => {
      await removeAgent(m.id);
      router.refresh();
    });
  }

  return (
    <div className="app-page min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="flex items-center gap-3 bg-brand px-4 pb-4 pt-5">
        <Link href="/" aria-label="Retounen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <span className="text-[19px] font-extrabold text-white">Ekip mwen</span>
      </header>

      {isOwner && (
        <div className="px-4 pt-4">
          <button onClick={copyInvite} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-brand/25 bg-[#E7F7F1] text-brand active:scale-[0.99]">
            {copied ? (
              <><Check /><span className="text-sm font-bold">Lyen kopye!</span></>
            ) : (
              <><Plus /><span className="text-sm font-bold">Envite yon ajan (kopye lyen)</span></>
            )}
          </button>
          <p className="mt-1.5 px-1 text-[11.5px] text-ink-faint">Voye lyen an bay ajan an sou WhatsApp — l ap kreye kont li epi rantre nan ekip la.</p>
        </div>
      )}

      <div className="mt-4 flex flex-col divide-y divide-[#F0F2F3]">
        {members.map((m, i) => (
          <div key={m.id} className="flex items-center gap-3 bg-white px-4 py-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${TONES[i % TONES.length]}`}>{initials(m.full_name)}</div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate text-[15px] font-semibold">{m.full_name}</span>
                <span className={`rounded-md px-1.5 py-px text-[10px] font-bold ${m.role === "owner" ? "bg-owed-bg text-owed-text" : "bg-[#E7F7F1] text-brand"}`}>
                  {m.role === "owner" ? "Owner" : "Ajan"}
                </span>
              </div>
              <span className="text-[12.5px] text-ink-faint">
                {m.salesCount} vant · {formatMoney(m.salesCents)}
              </span>
            </div>
            {isOwner && m.role !== "owner" && (
              <button onClick={() => remove(m)} disabled={pending} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCE4E4] disabled:opacity-50" aria-label="Retire">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Plus() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function Check() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
}
