"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ImageUpload";
import { VERTICALS, verticalOf } from "@/lib/verticals";
import { THEMES } from "@/lib/themes";
import { updateBusiness, type BusinessInput } from "@/app/reglaj/actions";
import { SECTOR_TEMPLATES } from "@/components/StorefrontPreviewModal";
import type { Business } from "@/lib/types";
import { TableQrGenerator } from "@/components/TableQrGenerator";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  parseBankAccounts,
  formatBankAccountsString,
  HAITI_BANKS,
  type BankAccountItem,
} from "@/lib/bank";

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
    slogan: business.slogan ?? "Boutik paw la",
    promo_text: business.promo_text ?? "🔥 *NOUVO PWODWI AK PROMOSYON NAN TI KÒK BOUTIK!* 🔥\n\nNou fèk resevwa nouvo pwodwi ak gwo rabi nan boutik la! 🎁\n\nVini vizite vitrin nou an kounye a sou lyen sa a:",
    usd_exchange_rate: business.usd_exchange_rate ?? 132.5,
    bank_accounts: business.bank_accounts ?? "",
    zelle_info: business.zelle_info ?? "",
    usdt_trc20_address: business.usdt_trc20_address ?? "",
    moncash_number: business.moncash_number ?? "",
    moncash_name: business.moncash_name ?? "",
    moncash_qr_url: business.moncash_qr_url ?? null,
    natcash_number: business.natcash_number ?? "",
    natcash_name: business.natcash_name ?? "",
    natcash_qr_url: business.natcash_qr_url ?? null,
    zelle_qr_url: business.zelle_qr_url ?? null,
    usdt_qr_url: business.usdt_qr_url ?? null,
    delivery_zones: business.delivery_zones?.length ? business.delivery_zones : [
      { name: "Delmas", fee_cents: 5000 },
      { name: "Petyonvil", fee_cents: 10000 },
      { name: "Tabarre", fee_cents: 7500 },
    ],
  });
  const [bankItems, setBankItems] = useState<BankAccountItem[]>(() =>
    parseBankAccounts(business.bank_accounts ?? ""),
  );
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneFee, setNewZoneFee] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editFee, setEditFee] = useState("");
  const set = (patch: Partial<BusinessInput>) => setF((s) => ({ ...s, ...patch }));

  function addBankAccount() {
    const updated = [
      ...bankItems,
      { bank: "Unibank", currency: "HTG" as const, accountName: f.name || "", accountNumber: "" },
    ];
    setBankItems(updated);
    set({ bank_accounts: formatBankAccountsString(updated) });
  }

  function updateBankAccount(idx: number, patch: Partial<BankAccountItem>) {
    const updated = bankItems.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    setBankItems(updated);
    set({ bank_accounts: formatBankAccountsString(updated) });
  }

  function removeBankAccount(idx: number) {
    const updated = bankItems.filter((_, i) => i !== idx);
    setBankItems(updated);
    set({ bank_accounts: formatBankAccountsString(updated) });
  }

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
    <div className="app-page min-h-[100dvh] bg-[#F7F8F9] pb-16">
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
          <Field label="Slogan biznis la (pou Sceau/Resi)"><input value={f.slogan ?? ""} onChange={(e) => set({ slogan: e.target.value })} className={cls} placeholder="Boutik paw la" /></Field>
          <Field label="Tèks Promosyon / Nouvo Pwodwi (avèk lyen vitrin ki ajoute otomatikman)">
            <textarea
              value={f.promo_text ?? ""}
              onChange={(e) => set({ promo_text: e.target.value })}
              className={`${cls} min-h-[90px] py-2`}
              placeholder="🔥 NOUVO PWODWI AK PROMOSYON..."
            />
          </Field>
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

          <div className="flex items-center justify-between pt-2.5 border-t border-line">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-ink uppercase">🌐 Langue de l'interface / Langaj Aplikasyon an</span>
              <span className="text-[11px] text-ink-muted">Basculer entre Français (🇫🇷), Kreyòl (🇭🇹), ou English (🇺🇸)</span>
            </div>
            <LanguageToggle variant="full" />
          </div>
        </section>

        {/* Paramètres Financiers & Modes de Paiement */}
        <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-[14px] font-extrabold text-ink">💳 Mwayen Peman & Taux du Jour</span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-900">
              1 USD = {f.usd_exchange_rate ?? 132.5} HTG
            </span>
          </div>

          <Field label="Taux du jour (1 USD nan Goud HTG)">
            <input
              type="number"
              step="0.1"
              value={f.usd_exchange_rate ?? 132.5}
              onChange={(e) => set({ usd_exchange_rate: e.target.value })}
              className={cls}
              placeholder="132.50"
            />
          </Field>

          {/* Formulaire Structuré des Comptes Banque Locale */}
          <div className="flex flex-col gap-2.5 pt-1 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink uppercase">
                🏦 Konte Banque Locale yo (Unibank, Sogebank, BUH, etc.)
              </span>
              <button
                type="button"
                onClick={addBankAccount}
                className="flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-950 border border-emerald-300 active:scale-95 cursor-pointer"
              >
                <span>+ Ajoute kont bank</span>
              </button>
            </div>

            {bankItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-ink-faint">
                Pa gen kont bank ki ajoute. Klike sou "+ Ajoute kont bank" pou chwazi bank ak monnen ou.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {bankItems.map((b, idx) => (
                  <div key={idx} className="flex flex-col gap-2 rounded-xl border border-line bg-[#F9FAFB] p-3 shadow-2xs">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Nom Banque">
                        <select
                          value={b.bank}
                          onChange={(e) => updateBankAccount(idx, { bank: e.target.value })}
                          className={cls}
                        >
                          {HAITI_BANKS.map((bankName) => (
                            <option key={bankName} value={bankName}>{bankName}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Monnaie / Devise">
                        <select
                          value={b.currency}
                          onChange={(e) => updateBankAccount(idx, { currency: e.target.value as "HTG" | "USD" })}
                          className={cls}
                        >
                          <option value="HTG">HTG (Gourdes)</option>
                          <option value="USD">USD (Dollars)</option>
                        </select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Nom Titulaire / Business">
                        <input
                          value={b.accountName}
                          onChange={(e) => updateBankAccount(idx, { accountName: e.target.value })}
                          className={cls}
                          placeholder="Ti Kòk Boutik S.A."
                        />
                      </Field>

                      <Field label="Numéro de compte">
                        <input
                          value={b.accountNumber}
                          onChange={(e) => updateBankAccount(idx, { accountNumber: e.target.value })}
                          className={cls}
                          placeholder="123-456-7890"
                        />
                      </Field>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBankAccount(idx)}
                      className="self-end text-xs font-bold text-red-600 hover:underline cursor-pointer pt-1"
                    >
                      Retire kont sa a
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gestion Structurée MonCash (Digicel) */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink uppercase">
                📱 MonCash (Digicel)
              </span>
              {f.moncash_number && f.moncash_number.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => set({ moncash_number: "", moncash_name: "", moncash_qr_url: null })}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Retire MonCash sa a
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => set({ moncash_number: f.phone_e164 || "+509 3712 4488", moncash_name: f.name || "Ti Kòk Boutik" })}
                  className="flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-950 border border-emerald-300 active:scale-95 cursor-pointer"
                >
                  <span>+ Ajoute MonCash</span>
                </button>
              )}
            </div>

            {f.moncash_number && f.moncash_number.trim().length > 0 ? (
              <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-[#F9FAFB] p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nimewo MonCash">
                    <input
                      value={f.moncash_number ?? ""}
                      onChange={(e) => set({ moncash_number: e.target.value })}
                      className={cls}
                      placeholder="+509 3712 4488"
                    />
                  </Field>
                  <Field label="Non sou Kont / Business">
                    <input
                      value={f.moncash_name ?? ""}
                      onChange={(e) => set({ moncash_name: e.target.value })}
                      className={cls}
                      placeholder="Ti Kòk Boutik"
                    />
                  </Field>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-xs font-bold text-ink-soft">Foto QR Code MonCash Ofisyèl (Digicel)</span>
                  <ImageUpload
                    value={f.moncash_qr_url ?? null}
                    folder="qrcodes"
                    shape="square"
                    label="Ajoute / Chanje foto QR Code MonCash"
                    onChange={(url) => set({ moncash_qr_url: url })}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-ink-faint">
                MonCash pa aktif. Klike sou "+ Ajoute MonCash" pou antre nimewo ak foto QR Code MonCash ou.
              </div>
            )}
          </div>

          {/* Gestion Structurée Natcash (Natcom) */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink uppercase">
                📱 Natcash (Natcom)
              </span>
              {f.natcash_number && f.natcash_number.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => set({ natcash_number: "", natcash_name: "", natcash_qr_url: null })}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Retire Natcash sa a
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => set({ natcash_number: f.phone_e164 || "+509 3151 4284", natcash_name: f.name || "Ti Kòk Boutik" })}
                  className="flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-950 border border-emerald-300 active:scale-95 cursor-pointer"
                >
                  <span>+ Ajoute Natcash</span>
                </button>
              )}
            </div>

            {f.natcash_number && f.natcash_number.trim().length > 0 ? (
              <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-[#F9FAFB] p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nimewo Natcash">
                    <input
                      value={f.natcash_number ?? ""}
                      onChange={(e) => set({ natcash_number: e.target.value })}
                      className={cls}
                      placeholder="+509 3151 4284"
                    />
                  </Field>
                  <Field label="Non sou Kont / Business">
                    <input
                      value={f.natcash_name ?? ""}
                      onChange={(e) => set({ natcash_name: e.target.value })}
                      className={cls}
                      placeholder="Ti Kòk Boutik"
                    />
                  </Field>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-xs font-bold text-ink-soft">Foto QR Code Natcash Ofisyèl (Natcom)</span>
                  <ImageUpload
                    value={f.natcash_qr_url ?? null}
                    folder="qrcodes"
                    shape="square"
                    label="Ajoute / Chanje foto QR Code Natcash"
                    onChange={(url) => set({ natcash_qr_url: url })}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-ink-faint">
                Natcash pa aktif. Klike sou "+ Ajoute Natcash" pou antre nimewo ak foto QR Code Natcash ou.
              </div>
            )}
          </div>

          {/* Gestion Structurée Zelle */}
          <div className="flex flex-col gap-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink uppercase">
                ⚡ Enfòmasyon Zelle (Email / Telefòn / Non Kont)
              </span>
              {f.zelle_info && f.zelle_info.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => set({ zelle_info: "", zelle_qr_url: null })}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Retire Zelle sa a
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => set({ zelle_info: "pay@tikokboutik.com / Ti Kòk Boutik LLC" })}
                  className="flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-950 border border-emerald-300 active:scale-95 cursor-pointer"
                >
                  <span>+ Ajoute Zelle</span>
                </button>
              )}
            </div>

            {f.zelle_info && f.zelle_info.trim().length > 0 ? (
              <div className="flex flex-col gap-2 rounded-xl border border-line bg-[#F9FAFB] p-3">
                <input
                  value={f.zelle_info}
                  onChange={(e) => set({ zelle_info: e.target.value })}
                  className={cls}
                  placeholder="pay@tikokboutik.com / Ti Kòk Boutik LLC"
                />
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-xs font-bold text-ink-soft">Foto QR Code Zelle (Opsyonèl)</span>
                  <ImageUpload
                    value={f.zelle_qr_url ?? null}
                    folder="qrcodes"
                    shape="square"
                    label="Ajoute foto QR Code Zelle"
                    onChange={(url) => set({ zelle_qr_url: url })}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-ink-faint">
                Zelle pa aktif. Klike sou "+ Ajoute Zelle" pou antre enfòmasyon Zelle ou.
              </div>
            )}
          </div>

          {/* Gestion Structurée USDT TRC-20 */}
          <div className="flex flex-col gap-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink uppercase">
                🪙 Cryptomonnaie USDT (Réseau TRC-20)
              </span>
              {f.usdt_trc20_address && f.usdt_trc20_address.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => set({ usdt_trc20_address: "", usdt_qr_url: null })}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Retire USDT sa a
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => set({ usdt_trc20_address: "T9yD14Nj9j7x2VbK4mL8pQnRtWz3v5XsYp" })}
                  className="flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-950 border border-emerald-300 active:scale-95 cursor-pointer"
                >
                  <span>+ Ajoute USDT TRC-20</span>
                </button>
              )}
            </div>

            {f.usdt_trc20_address && f.usdt_trc20_address.trim().length > 0 ? (
              <div className="flex flex-col gap-2 rounded-xl border border-line bg-[#F9FAFB] p-3">
                <input
                  value={f.usdt_trc20_address}
                  onChange={(e) => set({ usdt_trc20_address: e.target.value })}
                  className={cls}
                  placeholder="T9yD14Nj9j7x2VbK4mL8pQnRtWz3v5XsYp"
                />
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-xs font-bold text-ink-soft">Foto QR Code Portefeuille USDT (Opsyonèl)</span>
                  <ImageUpload
                    value={f.usdt_qr_url ?? null}
                    folder="qrcodes"
                    shape="square"
                    label="Ajoute foto QR Code USDT"
                    onChange={(url) => set({ usdt_qr_url: url })}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-ink-faint">
                USDT TRC-20 pa aktif. Klike sou "+ Ajoute USDT TRC-20" pou antre adrès Portefeuille ou.
              </div>
            )}
          </div>
        </section>

        {/* Zones et Frais de Livraison */}
        <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-extrabold text-ink">🚚 Zòn & Frè Livrezon</span>
            <span className="text-xs font-semibold text-brand">{f.delivery_zones.length} zòn</span>
          </div>

          <div className="flex flex-col divide-y divide-line rounded-xl border border-line overflow-hidden">
            {f.delivery_zones.map((z, idx) => {
              const isEditing = editingIdx === idx;
              return isEditing ? (
                <div key={idx} className="flex items-center gap-2 bg-[#F7F8F9] p-2 text-xs">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 flex-1 rounded-lg border border-line bg-white px-2 font-bold text-ink outline-none focus:border-brand"
                    placeholder="Non Zòn"
                  />
                  <input
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    className="h-9 w-24 rounded-lg border border-line bg-white px-2 font-extrabold text-brand outline-none focus:border-brand"
                    placeholder="Frè HTG"
                    inputMode="decimal"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!editName.trim()) return;
                      const fee_cents = Math.round((parseFloat(editFee) || 0) * 100);
                      const updated = [...f.delivery_zones];
                      updated[idx] = { name: editName.trim(), fee_cents };
                      set({ delivery_zones: updated });
                      setEditingIdx(null);
                    }}
                    className="flex h-9 px-3 items-center justify-center rounded-lg bg-brand-green text-xs font-bold text-white shadow active:scale-95 cursor-pointer"
                    title="Konfime chanjman"
                  >
                    ✓ Sove
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIdx(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-ink-muted active:scale-95 cursor-pointer"
                    title="Anile"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div key={idx} className="flex items-center justify-between bg-white px-3 py-2.5 text-xs">
                  <span className="font-bold text-ink">{z.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-brand">
                      {z.fee_cents === 0 ? "Gratis" : `${(z.fee_cents / 100).toLocaleString("fr-HT")} HTG`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIdx(idx);
                        setEditName(z.name);
                        setEditFee(String(z.fee_cents / 100));
                      }}
                      className="flex h-7 px-2.5 items-center justify-center gap-1 rounded-lg bg-[#E7F7F1] text-[11px] font-bold text-brand active:scale-95 cursor-pointer"
                      title="Modifye zòn sa"
                    >
                      ✏️ Modifye
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ delivery_zones: f.delivery_zones.filter((_, i) => i !== idx) })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCE4E4] text-[#C0392B] active:scale-95 cursor-pointer"
                      title="Efase zòn sa"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
            {f.delivery_zones.length === 0 && (
              <p className="p-3 text-center text-xs text-ink-faint">Pa gen zòn livrezon konfigire.</p>
            )}
          </div>

          {/* Formulaire d'ajout de zone */}
          <div className="flex flex-col gap-2 pt-1 border-t border-line">
            <span className="text-xs font-bold text-ink-soft">Ajoute yon nouvo zòn:</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Non Zòn (ex: Petion-Ville)"
                className={cls}
              />
              <input
                value={newZoneFee}
                onChange={(e) => setNewZoneFee(e.target.value)}
                placeholder="Frè an Gourdes (ex: 50)"
                inputMode="decimal"
                className={cls}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!newZoneName.trim()) return;
                const fee_cents = Math.round((parseFloat(newZoneFee) || 0) * 100);
                set({ delivery_zones: [...f.delivery_zones, { name: newZoneName.trim(), fee_cents }] });
                setNewZoneName("");
                setNewZoneFee("");
              }}
              className="mt-1 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#E7F7F1] text-xs font-extrabold text-brand active:scale-95"
            >
              <span>+ Ajoute Zòn Livrezon Sa a</span>
            </button>
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
          {(() => {
            const currentSectorConfig = verticalOf(f.business_type);
            const currentSectorTemplate = SECTOR_TEMPLATES.find((t) => t.key === currentSectorConfig.id) || SECTOR_TEMPLATES[0];
            const merchantPlan = (business.plan ?? "gratis").toLowerCase();

            function handleLayoutChange(newLayout: string) {
              if (newLayout === "design2" && merchantPlan === "gratis") {
                alert("🔒 Design 2 mande Plan Pro (750 HTG/mwa) oswa Premium. Tanpri fè yon Upgrade nan onglet Abònman an!");
                return;
              }
              if (newLayout === "design3" && merchantPlan !== "premium") {
                alert("👑 Design 3 eksklizif ak Plan Premium (2,500 HTG/mwa). Tanpri fè yon Upgrade nan onglet Abònman an!");
                return;
              }
              set({ layout: newLayout });
            }

            return (
              <Field label={`Dispozisyon Vitrin & Modèl Design (${currentSectorTemplate.name})`}>
                <select value={f.layout} onChange={(e) => handleLayoutChange(e.target.value)} className={cls}>
                  <option value="design1">🎨 Design 1: {currentSectorTemplate.design1Name} (Plan Gratis, Pro, Premium)</option>
                  <option value="design2" disabled={merchantPlan === "gratis"}>
                    {merchantPlan === "gratis" ? "🔒 (Sou Plan Pro/Premium) " : "✨ "}Design 2: {currentSectorTemplate.design2Name}
                  </option>
                  <option value="design3" disabled={merchantPlan !== "premium"}>
                    {merchantPlan !== "premium" ? "👑 🔒 (Eksklizif Plan Premium) " : "👑 "}Design 3: {currentSectorTemplate.design3Name}
                  </option>
                  <option value="auto">Otomatik (selon tèm biznis)</option>
                </select>
                <p className="mt-1 text-[11.5px] font-bold text-slate-500">
                  💡 <strong>Aksè Design pa Plan :</strong> Gratis = 1 Design par defò | Pro = 2 Designs | Premium = 3 Designs VIP eksklizif.
                </p>
              </Field>
            );
          })()}
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

        {/* Générateur de QR Code Restoran & Tables */}
        <TableQrGenerator business={business} />

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
