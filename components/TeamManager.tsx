"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { removeAgent, createInviteLinkAction, setAgentProfile } from "@/app/ekip/actions";
import { verticalOf } from "@/lib/verticals";

interface Member {
  id: string;
  full_name: string;
  role: string;
  specialty?: string;
  agent_profile?: string | null;
  salesCount: number;
  salesCents: number;
}

// Profils métier. Chacun ouvre des colonnes de pipeline et des écrans
// différents ; voir lib/rbac.ts.
const AGENT_PROFILE_OPTIONS = [
  { key: "jean", label: "💬 Commercial / Ventes" },
  { key: "marie", label: "💳 Caissière / Pèman" },
  { key: "pierre", label: "📦 Stockist / Livrezon" },
  { key: "florence", label: "📞 Sèvis Kliyan & Dèt" },
  { key: "steeve", label: "📢 Relans & Promo" },
  { key: "gerant", label: "🛡️ Gérant Général" },
];

const TONES = [
  "bg-[#DCF8C6] text-[#2A7D3F]",
  "bg-[#D7EBFF] text-[#1A6BB8]",
  "bg-[#EADCF8] text-[#7A3EAF]",
  "bg-[#FDECC8] text-[#B7791F]",
];
const initials = (n: string) =>
  n
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export function TeamManager({
  members: initialMembers,
  isOwner,
  businessId,
  businessType,
  businessPlan = "gratis",
}: {
  members: Member[];
  isOwner: boolean;
  businessId: string;
  businessType?: string;
  businessPlan?: string;
}) {
  const router = useRouter();
  const vertical = verticalOf(businessType);
  const authorizedRoles = vertical.authorizedRoles;
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [membersList, setMembersList] = useState<Member[]>(initialMembers);
  const [previewMember, setPreviewMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ title: string; message: string; targetPlan: string } | null>(null);

  // Formulaire d'ajout d'agent direct
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentPhone, setNewAgentPhone] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("Commercial / Ventes");

  function checkAgentLimitAndAction(action: () => void) {
    const currentPlan = businessPlan.toLowerCase();
    const count = membersList.length;

    if (currentPlan === "gratis" && count >= 1) {
      setUpgradeModal({
        title: "🔒 Limite Plan Gratis Atenn (1 Sèl Itilizatè)",
        message: "Plan Gratis la pèmèt sèlman Fondatè an (1 itilizatè). Pou w ka ajoute ajan, livrè oswa lòt moun nan ekip la, tanpri fè yon Upgrade sou Plan Pro (jiska 3 ajan) oswa Premium (ajan san limit).",
        targetPlan: "Pro",
      });
      return;
    }

    if (currentPlan === "pro" && count >= 3) {
      setUpgradeModal({
        title: "🔒 Limite Plan Pro Atenn (3 Ajan Maks)",
        message: "Plan Pro a limite ak 3 ajan nan ekip la. Pou w ka ajoute 4yèm ajan an oswa plis, tanpri fè yon Upgrade sou Plan Premium (Ajan san limit + AI Assistant).",
        targetPlan: "Premium",
      });
      return;
    }

    action();
  }

  function copyInvite() {
    checkAgentLimitAndAction(async () => {
      // Le lien est signé côté serveur : il ne peut pas être fabriqué ici.
      const res = await createInviteLinkAction();
      if (!res.ok || !res.url) {
        setInviteError(res.error ?? "Enposib pou kreye lyen an");
        return;
      }
      setInviteError(null);
      await navigator.clipboard.writeText(res.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCreateAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const newMember: Member = {
      id: `m-${Date.now()}`,
      full_name: newAgentName.trim(),
      role: "agent",
      specialty: newAgentRole,
      salesCount: 0,
      salesCents: 0,
    };

    setMembersList((prev) => [...prev, newMember]);
    setNewAgentName("");
    setNewAgentPhone("");
    setShowAddModal(false);
  }

  function remove(m: Member) {
    if (!confirm(`Retire ${m.full_name} nan ekip la?`)) return;
    setMembersList((prev) => prev.filter((item) => item.id !== m.id));
    start(async () => {
      await removeAgent(m.id);
      router.refresh();
    });
  }

  function changeProfile(m: Member, profile: string) {
    if (!profile) return;
    const previous = m.agent_profile ?? null;
    setMembersList((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, agent_profile: profile } : item)),
    );
    start(async () => {
      const res = await setAgentProfile(m.id, profile);
      if (!res.ok) {
        // On remet la valeur affichée à ce que la base contient réellement.
        setMembersList((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, agent_profile: previous } : item)),
        );
        setInviteError(res.error ?? "Enposib pou chanje wòl la");
        return;
      }
      setInviteError(null);
      router.refresh();
    });
  }

  return (
    <div className="app-page min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="flex items-center gap-3 bg-brand px-4 pb-4 pt-5">
        <Link href="/" aria-label="Retounen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <span className="text-[19px] font-extrabold text-white">Ekip mwen & Delegasyon Ajan</span>
      </header>

      {isOwner && (
        <div className="flex flex-col gap-2.5 px-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={copyInvite}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-brand/25 bg-[#E7F7F1] text-brand active:scale-[0.99] hover:bg-[#D6F5EC] transition-colors"
            >
              {copied ? (
                <>
                  <Check />
                  <span className="text-sm font-bold">Lyen kopye!</span>
                </>
              ) : (
                <>
                  <Plus />
                  <span className="text-sm font-bold">Envite yon ajan (Kopye lyen)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-white text-sm font-extrabold active:scale-[0.99] shadow-sm hover:bg-brand/90 transition-colors cursor-pointer"
            >
              <span>➕ Kreye yon Aksè Ajan Dirèkteman</span>
            </button>
          </div>
          {inviteError && (
            <div className="rounded-xl bg-[#FCE4E4] px-4 py-2.5 text-[12.5px] text-[#C0392B]">{inviteError}</div>
          )}
          <p className="px-1 text-[11.5px] text-ink-faint">
            Lyen envitasyon an valab 7 jou. Chak ajan jwenn aksè pèsonèl li ak yon tablo ki adapte ak wòl li an san li pa ka wè chif bank Fondatè an.
          </p>
        </div>
      )}

      {/* Lis Manm Ekip la */}
      <div className="mt-4 flex flex-col divide-y divide-[#F0F2F3] bg-white border-y border-line">
        {membersList.map((m, i) => (
          <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-gray-50/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${TONES[i % TONES.length]}`}>
                {initials(m.full_name)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="truncate text-[15px] font-extrabold text-ink">{m.full_name}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10.5px] font-black ${
                      m.role === "owner" ? "bg-owed-bg text-owed-text border border-amber-300" : "bg-[#E7F7F1] text-brand border border-emerald-300"
                    }`}
                  >
                    {m.role === "owner" ? "Fondateur / Admin" : m.specialty || "Ajan Vant"}
                  </span>
                </div>
                <span className="text-[12px] font-semibold text-ink-muted">
                  {m.salesCount} vant reyalize · {formatMoney(m.salesCents)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {isOwner && m.role !== "owner" && (
                <label className="flex flex-col gap-0.5">
                  <span className="sr-only">Wòl {m.full_name}</span>
                  <select
                    value={m.agent_profile ?? ""}
                    disabled={pending}
                    onChange={(e) => changeProfile(m, e.target.value)}
                    className="h-9 rounded-xl border border-line bg-white px-2 text-xs font-bold text-ink outline-none focus:border-brand disabled:opacity-50"
                    title="Wòl metye ajan an — li deside ki etap pipeline li ka manyen"
                  >
                    <option value="" disabled>Chwazi yon wòl…</option>
                    {AGENT_PROFILE_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                </label>
              )}

              {m.role !== "owner" && (
                <button
                  onClick={() => setPreviewMember(m)}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl border border-brand/30 bg-[#E7F7F1] px-3 text-xs font-extrabold text-brand active:scale-95 hover:bg-[#D6F5EC] transition-colors cursor-pointer"
                  title="Wè epi teste kijan ajan sa a ap wè tablo li an"
                >
                  <span>👁️ Teste Aksè Ajan</span>
                </button>
              )}

              {isOwner && m.role !== "owner" && (
                <button
                  onClick={() => remove(m)}
                  disabled={pending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FCE4E4] text-red-700 disabled:opacity-50 active:scale-95 hover:bg-red-200 transition-colors"
                  aria-label="Retire"
                  title="Retire nan ekip la"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Kreye yon Aksè Ajan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line bg-brand px-5 py-4 text-white">
              <span className="text-base font-extrabold">➕ Kreye yon nouvo Aksè Ajan</span>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:opacity-80">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAgent} className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-extrabold text-ink">Nom ak Siyen Ajan an :</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Ekz: Marie Joseph"
                  className="h-11 w-full rounded-xl border border-line px-3.5 text-sm font-medium text-ink outline-none focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-extrabold text-ink">Telefòn WhatsApp Ajan an :</label>
                <input
                  type="text"
                  value={newAgentPhone}
                  onChange={(e) => setNewAgentPhone(e.target.value)}
                  placeholder="Ekz: +509 3712 4488"
                  className="h-11 w-full rounded-xl border border-line px-3.5 text-sm font-medium text-ink outline-none focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-extrabold text-ink">Spesyalite & Wòl Ajan an :</label>
                <select
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line px-3 text-sm font-bold text-ink outline-none focus:border-brand bg-white"
                >
                  {authorizedRoles.map((r, idx) => (
                    <option key={idx} value={r.title}>
                      {r.title} — {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 flex-1 rounded-2xl border border-line text-xs font-bold text-ink-muted active:scale-95"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  className="h-11 flex-1 rounded-2xl bg-brand text-xs font-extrabold text-white active:scale-95 shadow-sm"
                >
                  Kreye Aksè Ajan an
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aperçu / Test Aksè Ajan */}
      {previewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line bg-brand px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <span className="text-base font-extrabold">Aperçu Tablo : {previewMember.full_name}</span>
              </div>
              <button onClick={() => setPreviewMember(null)} className="text-white hover:opacity-80">
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5 text-ink">
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  👤 Aksè Ajan Asepta: <strong>{previewMember.full_name}</strong> ({previewMember.specialty})
                </span>
                <p className="text-[11.5px] text-emerald-800">
                  Lè <strong>{previewMember.full_name}</strong> konekte sou kont li, li jwenn yon aksè pèsonalize ki konsantre sou travay pa l sèlman :
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-line p-4 bg-gray-50">
                <span className="text-xs font-extrabold text-ink uppercase tracking-wider">🔒 Dwa ak Proteksyon Kontabilite :</span>
                <ul className="text-xs text-ink-muted space-y-1.5 list-disc pl-4 font-medium">
                  <li>✅ Aksè sou Pipeline kòmand li dwe trete yo (`/komand`).</li>
                  <li>✅ Posiblite pou li voye fakti ak resi sou WhatsApp kliyan an.</li>
                  <li>✅ Wè Kòd Sekirite 🔑 pou livrezon oswa ranmase nan boutik.</li>
                  <li>❌ **Banniy/Masqué** : Li PA kapab wè chif bank Fondatè an (Andro Charles) ni kont MonCash/Natcash.</li>
                  <li>❌ **Banniy/Masqué** : Li PA kapab efase katalòg pwodwi yo oswa retire manm nan ekip la.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-brand/30 bg-[#E7F7F1] p-3 text-center">
                <span className="text-xs font-extrabold text-brand block">
                  📈 Vant ki reyalize pa ajan sa a : {previewMember.salesCount} vant ({formatMoney(previewMember.salesCents)})
                </span>
              </div>
            </div>

            <div className="border-t border-line p-3 bg-gray-50">
              <button
                onClick={() => setPreviewMember(null)}
                className="w-full h-11 rounded-2xl bg-brand text-xs font-extrabold text-white active:scale-95 shadow-sm"
              >
                Fèmen Teste Aksè a
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 p-5 text-white text-center flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 text-2xl shadow-md font-extrabold">
                👑
              </div>
              <h3 className="text-base font-black text-white">{upgradeModal.title}</h3>
            </div>
            <div className="p-5 flex flex-col gap-4 text-center">
              <p className="text-xs text-ink-muted leading-relaxed">
                {upgradeModal.message}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/abonman"
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand-green text-sm font-extrabold text-white shadow-lg active:scale-95 transition-transform"
                >
                  🚀 Upgrade sou Plan {upgradeModal.targetPlan} Kounye a
                </Link>
                <button
                  onClick={() => setUpgradeModal(null)}
                  className="h-10 w-full rounded-xl bg-gray-100 text-xs font-bold text-ink-muted hover:bg-gray-200 transition-colors"
                >
                  Pa kounye a, Fèmen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Plus() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function Check() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
}
