"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { TEAM_COPY } from "@/lib/i18n/app/team";
import { formatMoney } from "@/lib/money";
import { getRolePermissions } from "@/lib/rbac";
import { removeAgent, createInviteLinkAction, setAgentProfile } from "@/app/ekip/actions";

interface Member {
  id: string;
  full_name: string;
  role: string;
  specialty?: string;
  agent_profile?: string | null;
  salesCount: number;
  salesCents: number;
}

// Profils métier disponibles ; chacun ouvre des étapes de pipeline et des
// écrans différents (voir lib/rbac.ts).
const AGENT_PROFILES = ["jean", "marie", "pierre", "florence", "steeve", "gerant"];

const TONES = [
  "bg-[#DCF8C6] text-[#2A7D3F]",
  "bg-[#D7EBFF] text-[#1A6BB8]",
  "bg-[#EADCF8] text-[#7A3EAF]",
  "bg-[#FDECC8] text-[#B7791F]",
];

const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export function TeamManager({
  members: initialMembers,
  isOwner,
}: {
  members: Member[];
  isOwner: boolean;
  businessId?: string;
  businessType?: string;
  businessPlan?: string;
}) {
  const t = useDict(TEAM_COPY);
  const c = useDict(COMMON_COPY);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatsFull, setSeatsFull] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);

  async function copyInvite() {
    // Le lien est signé côté serveur, qui vérifie aussi la limite du plan.
    const res = await createInviteLinkAction();
    if (!res.ok || !res.url) {
      setSeatsFull(Boolean(res.seatsFull));
      setError(res.seatsFull ? t.invite.seatsFull : res.error ?? c.actions.retry);
      return;
    }
    setError(null);
    setSeatsFull(false);
    try {
      await navigator.clipboard.writeText(res.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(res.url);
    }
  }

  function remove(m: Member) {
    if (!confirm(t.removeConfirm(m.full_name))) return;
    const previous = members;
    setMembers((prev) => prev.filter((item) => item.id !== m.id));
    start(async () => {
      const res = await removeAgent(m.id);
      if (!res.ok) {
        setMembers(previous);
        setError(res.error ?? c.actions.retry);
        return;
      }
      router.refresh();
    });
  }

  function changeProfile(m: Member, profile: string) {
    if (!profile) return;
    const previous = m.agent_profile ?? null;
    setMembers((prev) => prev.map((item) => (item.id === m.id ? { ...item, agent_profile: profile } : item)));
    start(async () => {
      const res = await setAgentProfile(m.id, profile);
      if (!res.ok) {
        setMembers((prev) => prev.map((item) => (item.id === m.id ? { ...item, agent_profile: previous } : item)));
        setError(res.error ?? c.actions.retry);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="app-page min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="flex items-center gap-3 bg-brand px-4 pb-4 pt-5">
        <Link href="/" aria-label={c.actions.back}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-[19px] font-extrabold text-white">{t.title}</h1>
          <span className="text-[11.5px] text-[#B9F5E4]">{t.subtitle}</span>
        </div>
        <div className="ml-auto md:hidden">
          <LanguageToggle />
        </div>
      </header>

      {isOwner && (
        <div className="flex flex-col gap-2.5 px-4 pt-4">
          <button
            onClick={copyInvite}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-brand/25 bg-[#E7F7F1] text-brand transition-colors hover:bg-[#D6F5EC] active:scale-[0.99]"
          >
            {copied ? <Check /> : <Plus />}
            <span className="text-sm font-bold">{copied ? t.invite.copied : t.invite.cta}</span>
          </button>

          {error && (
            <div className="flex flex-col gap-2 rounded-xl bg-[#FCE4E4] px-4 py-2.5 text-[12.5px] text-[#C0392B]">
              <span className="break-all">{error}</span>
              {seatsFull && (
                <Link href="/abonman" className="font-bold text-brand underline">
                  {t.invite.upgrade}
                </Link>
              )}
            </div>
          )}

          <p className="px-1 text-[11.5px] text-ink-faint">{t.invite.hint}</p>
        </div>
      )}

      <div className="mt-4 flex flex-col divide-y divide-[#F0F2F3] border-y border-line bg-white">
        {members.map((m, i) => {
          const profile = m.agent_profile ?? undefined;
          const stages = profile
            ? getRolePermissions({ full_name: m.full_name, role: "agent", agentId: profile }).allowedPipelineColumns
            : [];

          return (
            <div key={m.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${TONES[i % TONES.length]}`}>
                  {initials(m.full_name)}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[15px] font-extrabold text-ink">{m.full_name}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold ${
                        m.role === "owner" ? "border border-amber-300 bg-owed-bg text-owed-text" : "border border-emerald-300 bg-[#E7F7F1] text-brand"
                      }`}
                    >
                      {m.role === "owner" ? t.owner : profile ? c.profiles[profile] ?? t.pendingRole : t.pendingRole}
                    </span>
                  </div>
                  <span className="text-[12px] font-semibold text-ink-muted">{t.sales(m.salesCount, formatMoney(m.salesCents))}</span>
                  {m.role !== "owner" &&
                    (stages.length > 0 ? (
                      <span className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[11px] font-semibold text-ink-faint">{t.stages} :</span>
                        {stages.map((s) => (
                          <span key={s} className="rounded bg-[#F3F6F4] px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-soft">
                            {c.statuses[s]}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#B25E09]">{t.noStages}</span>
                    ))}
                </div>
              </div>

              {isOwner && m.role !== "owner" && (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <label className="flex flex-col">
                    <span className="sr-only">{t.roleOf(m.full_name)}</span>
                    <select
                      value={profile ?? ""}
                      disabled={pending}
                      onChange={(e) => changeProfile(m, e.target.value)}
                      className="h-9 cursor-pointer rounded-xl border border-line bg-white px-2 text-xs font-bold text-ink outline-none focus:border-brand disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {t.chooseRole}
                      </option>
                      {AGENT_PROFILES.map((key) => (
                        <option key={key} value={key}>
                          {c.profiles[key]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    onClick={() => remove(m)}
                    disabled={pending}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#FCE4E4] transition-colors hover:bg-red-200 active:scale-95 disabled:opacity-50"
                    aria-label={t.remove}
                    title={t.remove}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {members.filter((m) => m.role !== "owner").length === 0 && (
          <p className="px-4 py-4 text-[13px] text-ink-muted">{t.empty}</p>
        )}
      </div>
    </div>
  );
}

function Plus() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function Check() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
