"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import type { UserSession } from "@/lib/rbac";
import { markAllAuditsReadAction } from "@/app/audit/actions";

export interface DetailedAuditLog {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  action: string;
  time: string;
  badgeColor: string;
  isRead: boolean;
  details: string;
}

const INITIAL_AUDIT_LOGS: DetailedAuditLog[] = [
  {
    id: "aud-1",
    agentId: "marie",
    agentName: "Marie Joseph",
    role: "Caissière / Pèman",
    action: "Konfime Pèman MonCash (Fakti #1084)",
    time: "Gen 5 minit",
    badgeColor: "bg-emerald-500",
    isRead: false,
    details: "Marie verifye epi valide yon viman MonCash 4,850 HTG pou kòmand kliyan Wideline Désir.",
  },
  {
    id: "aud-2",
    agentId: "pierre",
    agentName: "Pierre-Louis K.",
    role: "Stockist / Livrezon",
    action: "Livrezon Konfime ak Kòd PIN 🔑 (Colis #592)",
    time: "Gen 18 minit",
    badgeColor: "bg-blue-500",
    isRead: false,
    details: "Pierre antre kòd sekirite OTP 🔑 an epi livre 2 sak Diri Tchako bay chofè a.",
  },
  {
    id: "aud-3",
    agentId: "steeve",
    agentName: "Steeve Alexis",
    role: "Ajan Relans & Promo",
    action: "Pataje Vitrin & Afich Pub 9:16 sou WhatsApp",
    time: "Gen 42 minit",
    badgeColor: "bg-purple-500",
    isRead: false,
    details: "Steeve difize afich pub -15% rabè a sou WhatsApp Status pou tout kliyan ki inaktif yo.",
  },
  {
    id: "aud-4",
    agentId: "jean",
    agentName: "Jean Baptiste",
    role: "Commercial / Ventes",
    action: "Kreyasyon Devis & Panier Kliyan (#1085)",
    time: "Gen 1 èdtan",
    badgeColor: "bg-amber-500",
    isRead: true,
    details: "Jean trete yon mesaj WhatsApp kliyan ak prepare devis 12,000 HTG pou chajman.",
  },
  {
    id: "aud-5",
    agentId: "florence",
    agentName: "Florence Désir",
    role: "Sèvis Kliyan & Dèt",
    action: "Relans Dèt & Escompte 5% Valide",
    time: "Gen 2 èdtan",
    badgeColor: "bg-rose-500",
    isRead: true,
    details: "Florence voye rapèl dèt sou WhatsApp ak aplike yon ti rabè pou kouvri solde nèt.",
  },
];

export function AuditManager({ userSession }: { userSession?: UserSession }) {
  const [logs, setLogs] = useState<DetailedAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  const unreadCount = logs.filter((l) => !l.isRead).length;

  const filteredLogs = logs.filter((l) => {
    if (agentFilter !== "all" && l.agentId !== agentFilter) return false;
    if (unreadOnly && l.isRead) return false;
    return true;
  });

  function markAllAsRead() {
    setLogs((prev) => prev.map((l) => ({ ...l, isRead: true })));
    markAllAuditsReadAction();
  }

  function toggleLogRead(id: string) {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, isRead: !l.isRead } : l)));
  }

  return (
    <div className="app-page with-topnav relative min-h-[100dvh] bg-[#F7F8F9] pb-[110px]">
      {/* En-tête Page Audit */}
      <header className="flex flex-col gap-2 bg-slate-900 px-5 pb-5 pt-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xl">
              🔍
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-extrabold tracking-tight text-white">Audit Aktivite Ajan yo</h1>
              <span className="text-xs text-slate-300">Suveye an tan reyèl (LIVE) tout aksyon ajan ekip ou a.</span>
            </div>
          </div>

          {unreadCount > 0 && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-2xs animate-pulse">
              🔴 {unreadCount} pa ankò li
            </span>
          )}
        </div>
      </header>

      {/* Barre de contrôle et filtres */}
      <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-2xs border border-line">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="h-9 rounded-xl border border-line bg-[#F8FAFC] px-3 text-xs font-bold text-ink outline-none cursor-pointer"
            >
              <option value="all">👥 Tout Ajan yo</option>
              <option value="caisse">💳 Caissière / Pèman</option>
              <option value="ventes">💬 Commercial / Ventes</option>
              <option value="stockist">📦 Stockist / Livrezon</option>
              <option value="service_client">🏷️ Sèvis Kliyan & Dèt</option>
              <option value="promo">📢 Relans & Promo</option>
            </select>

            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`h-9 px-3.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                unreadOnly ? "bg-red-600 text-white border-red-600" : "bg-white text-ink-muted border-line"
              }`}
            >
              🔴 Sèlman sa ki pako li ({unreadCount})
            </button>
          </div>

          <button
            onClick={markAllAsRead}
            className="flex h-9 items-center justify-center gap-1 rounded-xl bg-slate-800 px-3.5 text-xs font-black text-white shadow-2xs hover:bg-slate-900 active:scale-95 cursor-pointer"
          >
            <span>✓ Make tout kòm Li</span>
          </button>
        </div>

        {/* Lis Aktivite Audit yo */}
        <div className="flex flex-col gap-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => toggleLogRead(log.id)}
              className={`flex flex-col gap-2 rounded-2xl p-4 transition-all cursor-pointer border shadow-2xs ${
                log.isRead
                  ? "bg-white border-line opacity-85"
                  : "bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-ink">{log.agentName}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-extrabold border ${log.badgeColor}`}>
                    {log.role}
                  </span>
                  {!log.isRead && (
                    <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-[9.5px] font-black animate-pulse">
                      NOUVO
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-ink-muted">{log.time}</span>
              </div>

              <p className="text-xs font-bold text-ink">{log.action}</p>
              <span className="text-[11.5px] text-ink-muted bg-white/80 p-2 rounded-xl border border-line/60">
                📌 Details: {log.details}
              </span>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center text-ink-muted border border-line">
              <span className="text-3xl">🔍</span>
              <span className="mt-2 text-sm font-extrabold">Pa gen aksyon ki korresponn ak filtre sa.</span>
            </div>
          )}
        </div>
      </main>

      <BottomNav active="audit" userSession={userSession} unreadAuditCount={unreadCount} />
    </div>
  );
}
