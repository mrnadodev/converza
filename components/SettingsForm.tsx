"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ImageUpload";
import { LanguageToggle } from "@/components/LanguageToggle";
import { TableQrGenerator } from "@/components/TableQrGenerator";
import { useDict } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { SETTINGS_COPY } from "@/lib/i18n/app/settings";
import { STOREFRONT_COPY } from "@/lib/i18n/storefront";
import { VERTICALS, verticalOf } from "@/lib/verticals";
import { SECTOR_THEME, THEMES, THEME_KEYS, isThemeKey, themeOf } from "@/lib/themes";
import { updateBusiness, type BusinessInput } from "@/app/reglaj/actions";
import { parseBankAccounts, formatBankAccountsString, HAITI_BANKS, type BankAccountItem } from "@/lib/bank";
import type { Business } from "@/lib/types";
import type { DesignLayoutConfig } from "@/lib/platform-config";
import { STOREFRONT_LAYOUTS, layoutAllowed, layoutRule, resolveLayout } from "@/lib/storefront-layouts";
import { effectivePlan } from "@/lib/plans";
import { LayoutThumb } from "@/components/LayoutThumb";
import { designFor } from "@/lib/storefront-designs";
import { DESIGN_COPY, designName } from "@/lib/i18n/app/designs";

type Tab = "store" | "payments" | "delivery" | "look";

export function SettingsForm({ business, designs }: { business: Business; designs?: DesignLayoutConfig[] }) {
  const s = useDict(SETTINGS_COPY);
  // Les secteurs sont déjà traduits pour la vitrine : on réutilise ces libellés
  // au lieu de la liste française à émojis.
  const sectors = useDict(STOREFRONT_COPY).sectors;
  const c = useDict(COMMON_COPY);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Tab>("store");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aucune valeur de démonstration en repli : un champ vide invite à saisir ses
  // propres coordonnées, un champ pré-rempli avec le numéro d'une autre boutique
  // finit publié tel quel.
  const [f, setF] = useState<BusinessInput>({
    name: business.name,
    business_type: business.business_type ?? "commerce_vente",
    employees_count: business.employees_count == null ? "" : String(business.employees_count),
    theme: isThemeKey(business.theme) ? business.theme : SECTOR_THEME,
    // Une ancienne valeur (« auto ») ou une disposition que le plan ne couvre
    // plus s'affiche comme celle que la vitrine montre réellement.
    layout: resolveLayout(business.layout, effectivePlan(business.plan, business.plan_until), designs),
    phone_e164: business.phone_e164 ?? "",
    hours: business.hours ?? "",
    address: business.address ?? "",
    logo_url: business.logo_url,
    cover_url: business.cover_url,
    social_instagram: business.social_instagram ?? "",
    social_facebook: business.social_facebook ?? "",
    social_tiktok: business.social_tiktok ?? "",
    slogan: business.slogan ?? "",
    promo_text: business.promo_text ?? "",
    usd_exchange_rate: business.usd_exchange_rate ?? "",
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
    delivery_zones: business.delivery_zones ?? [],
    // Pas de colonne (migration 9 pas encore jouée) : la boutique n'a pas refusé.
    showcase_opt_out: business.showcase_opt_out === true,
  });
  const [bankItems, setBankItems] = useState<BankAccountItem[]>(() => parseBankAccounts(business.bank_accounts ?? ""));
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneFee, setNewZoneFee] = useState("");
  // Un moyen de paiement « ouvert » mais encore vide doit rester visible tant
  // que le marchand le remplit, sans pour autant écrire de valeur bidon.
  const [open, setOpen] = useState({
    moncash: Boolean(business.moncash_number),
    natcash: Boolean(business.natcash_number),
    zelle: Boolean(business.zelle_info),
    usdt: Boolean(business.usdt_trc20_address),
  });

  const set = (patch: Partial<BusinessInput>) => setF((prev) => ({ ...prev, ...patch }));
  const setBanks = (items: BankAccountItem[]) => {
    setBankItems(items);
    set({ bank_accounts: formatBankAccountsString(items) });
  };

  function submit() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateBusiness(f);
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? c.actions.retry);
      }
    });
  }

  const plan = effectivePlan(business.plan, business.plan_until);
  const phoneLocked = Boolean(business.phone_e164?.trim());
  const designCopy = useDict(DESIGN_COPY);
  const sectorId = verticalOf(f.business_type).id;
  const themeLabel = (k: string) => (k === SECTOR_THEME ? s.look.sectorColors : THEMES[k]?.label ?? k);

  return (
    <div className="app-page min-h-[100dvh] bg-[#F7F8F9] pb-28">
      <header className="flex items-center gap-3 bg-brand px-4 pb-4 pt-5">
        <Link href="/" aria-label={c.actions.back}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-[19px] font-extrabold text-white">{s.title}</h1>
          <span className="text-[11.5px] text-[#B9F5E4]">{s.subtitle}</span>
        </div>
      </header>

      {/* Onglets : l'écran réunissait tout dans une seule colonne interminable. */}
      <div className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b border-line bg-white px-4 py-2.5 [scrollbar-width:none]">
        {(["store", "payments", "delivery", "look"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "true" : undefined}
            className={`shrink-0 cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${tab === key ? "bg-brand text-white" : "bg-[#F3F6F4] text-ink-muted"}`}
          >
            {s.tabs[key]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5 px-4 pt-5 md:mx-auto md:max-w-[760px]">
        {tab === "store" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/abonman" className="flex items-center gap-2 rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
                <span className="text-[13.5px] font-bold">{s.shortcuts.subscription}</span>
              </Link>
              <Link href="/ekip" className="flex items-center gap-2 rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
                <span className="text-[13.5px] font-bold">{s.shortcuts.team}</span>
              </Link>
            </div>

            <Card title={s.store.identity}>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-ink-soft">{s.store.cover}</span>
                <ImageUpload value={f.cover_url} folder="covers" shape="wide" label={s.store.coverCta} onChange={(url) => set({ cover_url: url })} />
              </div>
              <div className="h-px bg-line" />
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-ink-soft">{s.store.logo}</span>
                <ImageUpload value={f.logo_url} folder="logos" shape="square" label={s.store.logoCta} onChange={(url) => set({ logo_url: url })} />
              </div>
            </Card>

            <Card>
              <Field label={s.store.name}>
                <input value={f.name} onChange={(e) => set({ name: e.target.value })} className={cls} />
              </Field>
              <Field label={s.store.slogan}>
                <input value={f.slogan ?? ""} onChange={(e) => set({ slogan: e.target.value })} className={cls} placeholder={s.store.sloganPlaceholder} />
              </Field>
              <Field label={s.store.type}>
                <select value={f.business_type} onChange={(e) => set({ business_type: e.target.value })} className={cls}>
                  {Object.keys(VERTICALS).map((key) => (
                    <option key={key} value={key}>
                      {sectors[key]?.label ?? key}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={s.store.phone}>
                  {/* Ce numéro reçoit les commandes et l'argent des clients : une
                      fois enregistré, il ne change qu'après vérification. */}
                  {phoneLocked ? (
                    <div className="flex flex-col gap-1.5">
                      <input value={f.phone_e164} readOnly aria-readonly className={`${cls} cursor-not-allowed opacity-80`} />
                      <Link href="/chanje-nimewo" className="text-[12.5px] font-bold text-brand">
                        🔒 {s.store.changePhone} →
                      </Link>
                    </div>
                  ) : (
                    <input value={f.phone_e164} onChange={(e) => set({ phone_e164: e.target.value })} className={cls} placeholder="+509 0000 0000" />
                  )}
                </Field>
                <Field label={s.store.employees}>
                  <input value={f.employees_count} onChange={(e) => set({ employees_count: e.target.value })} inputMode="numeric" className={cls} placeholder="3" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={s.store.hours}>
                  <input value={f.hours} onChange={(e) => set({ hours: e.target.value })} className={cls} placeholder={s.store.hoursPlaceholder} />
                </Field>
                <Field label={s.store.address}>
                  <input value={f.address} onChange={(e) => set({ address: e.target.value })} className={cls} placeholder={s.store.addressPlaceholder} />
                </Field>
              </div>
              <Field label={s.store.promo} hint={s.store.promoHint}>
                <textarea
                  value={f.promo_text ?? ""}
                  onChange={(e) => set({ promo_text: e.target.value })}
                  className={`${cls} min-h-[90px] py-2`}
                  placeholder={s.store.promoPlaceholder}
                />
              </Field>

              <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-ink-soft">{s.store.language}</span>
                  <span className="text-[11px] text-ink-muted">{s.store.languageHint}</span>
                </div>
                <LanguageToggle variant="full" />
              </div>
            </Card>

            <Card title={s.store.social}>
              <Field label="Instagram">
                <input value={f.social_instagram} onChange={(e) => set({ social_instagram: e.target.value })} className={cls} placeholder="https://instagram.com/…" />
              </Field>
              <Field label="Facebook">
                <input value={f.social_facebook} onChange={(e) => set({ social_facebook: e.target.value })} className={cls} placeholder="https://facebook.com/…" />
              </Field>
              <Field label="TikTok">
                <input value={f.social_tiktok} onChange={(e) => set({ social_tiktok: e.target.value })} className={cls} placeholder="https://tiktok.com/@…" />
              </Field>
            </Card>

            <Card title={s.store.showcase.title}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!f.showcase_opt_out}
                  onChange={(e) => set({ showcase_opt_out: !e.target.checked })}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#008069]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-bold text-ink">{s.store.showcase.label}</span>
                  <span className="text-[12px] leading-snug text-ink-muted">{s.store.showcase.hint}</span>
                </span>
              </label>
            </Card>
          </>
        )}

        {tab === "payments" && (
          <>
            <Card title={s.payments.title}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink-soft">{s.payments.rate}</span>
                {f.usd_exchange_rate ? (
                  <span className="rounded-md bg-[#E7F7F1] px-2 py-0.5 text-xs font-extrabold text-brand">{s.payments.rateBadge(String(f.usd_exchange_rate))}</span>
                ) : null}
              </div>
              <input
                type="number"
                step="0.1"
                value={f.usd_exchange_rate ?? ""}
                onChange={(e) => set({ usd_exchange_rate: e.target.value })}
                className={cls}
                placeholder={s.payments.ratePlaceholder}
              />
              <p className="text-[11.5px] text-ink-muted">{s.payments.rateHint}</p>
            </Card>

            <Card>
              <SectionHead title={s.payments.banks.title} action={{ label: s.payments.banks.add, onClick: () => setBanks([...bankItems, { bank: HAITI_BANKS[0], currency: "HTG", accountName: f.name, accountNumber: "" }]) }} />
              {bankItems.length === 0 ? (
                <Empty text={s.payments.banks.empty} />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {bankItems.map((b, idx) => (
                    <div key={idx} className="flex flex-col gap-2 rounded-xl border border-line bg-[#F9FAFB] p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label={s.payments.banks.bank}>
                          <select value={b.bank} onChange={(e) => setBanks(bankItems.map((x, i) => (i === idx ? { ...x, bank: e.target.value } : x)))} className={cls}>
                            {HAITI_BANKS.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label={s.payments.banks.currency}>
                          <select
                            value={b.currency}
                            onChange={(e) => setBanks(bankItems.map((x, i) => (i === idx ? { ...x, currency: e.target.value as "HTG" | "USD" } : x)))}
                            className={cls}
                          >
                            <option value="HTG">HTG</option>
                            <option value="USD">USD</option>
                          </select>
                        </Field>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label={s.payments.banks.holder}>
                          <input value={b.accountName} onChange={(e) => setBanks(bankItems.map((x, i) => (i === idx ? { ...x, accountName: e.target.value } : x)))} className={cls} />
                        </Field>
                        <Field label={s.payments.banks.number}>
                          <input value={b.accountNumber} onChange={(e) => setBanks(bankItems.map((x, i) => (i === idx ? { ...x, accountNumber: e.target.value } : x)))} className={cls} placeholder="000-000-0000" />
                        </Field>
                      </div>
                      <button type="button" onClick={() => setBanks(bankItems.filter((_, i) => i !== idx))} className="cursor-pointer self-end pt-1 text-xs font-bold text-[#C0392B] hover:underline">
                        {s.payments.banks.remove}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionHead
                title={s.payments.moncash.title}
                action={
                  open.moncash
                    ? { label: s.payments.moncash.remove, danger: true, onClick: () => { setOpen((o) => ({ ...o, moncash: false })); set({ moncash_number: "", moncash_name: "", moncash_qr_url: null }); } }
                    : { label: s.payments.moncash.add, onClick: () => { setOpen((o) => ({ ...o, moncash: true })); set({ moncash_name: f.moncash_name || f.name }); } }
                }
              />
              {open.moncash ? (
                <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-[#F9FAFB] p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label={s.payments.moncash.number}>
                      <input value={f.moncash_number ?? ""} onChange={(e) => set({ moncash_number: e.target.value })} className={cls} placeholder="+509 0000 0000" />
                    </Field>
                    <Field label={s.payments.moncash.holder}>
                      <input value={f.moncash_name ?? ""} onChange={(e) => set({ moncash_name: e.target.value })} className={cls} />
                    </Field>
                  </div>
                  <Field label={s.payments.moncash.qr}>
                    <ImageUpload value={f.moncash_qr_url ?? null} folder="qrcodes" shape="square" label={s.payments.moncash.qrCta} onChange={(url) => set({ moncash_qr_url: url })} />
                  </Field>
                </div>
              ) : (
                <Empty text={s.payments.moncash.empty} />
              )}
            </Card>

            <Card>
              <SectionHead
                title={s.payments.natcash.title}
                action={
                  open.natcash
                    ? { label: s.payments.natcash.remove, danger: true, onClick: () => { setOpen((o) => ({ ...o, natcash: false })); set({ natcash_number: "", natcash_name: "", natcash_qr_url: null }); } }
                    : { label: s.payments.natcash.add, onClick: () => { setOpen((o) => ({ ...o, natcash: true })); set({ natcash_name: f.natcash_name || f.name }); } }
                }
              />
              {open.natcash ? (
                <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-[#F9FAFB] p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label={s.payments.natcash.number}>
                      <input value={f.natcash_number ?? ""} onChange={(e) => set({ natcash_number: e.target.value })} className={cls} placeholder="+509 0000 0000" />
                    </Field>
                    <Field label={s.payments.natcash.holder}>
                      <input value={f.natcash_name ?? ""} onChange={(e) => set({ natcash_name: e.target.value })} className={cls} />
                    </Field>
                  </div>
                  <Field label={s.payments.natcash.qr}>
                    <ImageUpload value={f.natcash_qr_url ?? null} folder="qrcodes" shape="square" label={s.payments.natcash.qrCta} onChange={(url) => set({ natcash_qr_url: url })} />
                  </Field>
                </div>
              ) : (
                <Empty text={s.payments.natcash.empty} />
              )}
            </Card>

            <Card>
              <SectionHead
                title={s.payments.zelle.title}
                action={
                  open.zelle
                    ? { label: s.payments.zelle.remove, danger: true, onClick: () => { setOpen((o) => ({ ...o, zelle: false })); set({ zelle_info: "", zelle_qr_url: null }); } }
                    : { label: s.payments.zelle.add, onClick: () => setOpen((o) => ({ ...o, zelle: true })) }
                }
              />
              {open.zelle ? (
                <div className="flex flex-col gap-2 rounded-xl border border-line bg-[#F9FAFB] p-3">
                  <input value={f.zelle_info ?? ""} onChange={(e) => set({ zelle_info: e.target.value })} className={cls} placeholder={s.payments.zelle.placeholder} />
                  <Field label={s.payments.zelle.qr}>
                    <ImageUpload value={f.zelle_qr_url ?? null} folder="qrcodes" shape="square" label={s.payments.zelle.qrCta} onChange={(url) => set({ zelle_qr_url: url })} />
                  </Field>
                </div>
              ) : (
                <Empty text={s.payments.zelle.empty} />
              )}
            </Card>

            <Card>
              <SectionHead
                title={s.payments.usdt.title}
                action={
                  open.usdt
                    ? { label: s.payments.usdt.remove, danger: true, onClick: () => { setOpen((o) => ({ ...o, usdt: false })); set({ usdt_trc20_address: "", usdt_qr_url: null }); } }
                    : { label: s.payments.usdt.add, onClick: () => setOpen((o) => ({ ...o, usdt: true })) }
                }
              />
              {open.usdt ? (
                <div className="flex flex-col gap-2 rounded-xl border border-line bg-[#F9FAFB] p-3">
                  <input value={f.usdt_trc20_address ?? ""} onChange={(e) => set({ usdt_trc20_address: e.target.value })} className={cls} placeholder={s.payments.usdt.placeholder} />
                  <Field label={s.payments.usdt.qr}>
                    <ImageUpload value={f.usdt_qr_url ?? null} folder="qrcodes" shape="square" label={s.payments.usdt.qrCta} onChange={(url) => set({ usdt_qr_url: url })} />
                  </Field>
                </div>
              ) : (
                <Empty text={s.payments.usdt.empty} />
              )}
            </Card>
          </>
        )}

        {tab === "delivery" && (
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-extrabold text-ink">{s.delivery.title}</h2>
              <span className="text-xs font-semibold text-brand">{s.delivery.count(f.delivery_zones.length)}</span>
            </div>
            <p className="text-[11.5px] text-ink-muted">{s.delivery.hint}</p>

            {f.delivery_zones.length === 0 ? (
              <Empty text={s.delivery.empty} />
            ) : (
              <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
                {f.delivery_zones.map((z, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2.5 text-xs">
                    <input
                      value={z.name}
                      onChange={(e) => {
                        const zones = [...f.delivery_zones];
                        zones[idx] = { ...zones[idx], name: e.target.value };
                        set({ delivery_zones: zones });
                      }}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 font-bold text-ink outline-none focus:border-brand"
                      aria-label={s.delivery.zoneName}
                    />
                    <input
                      value={z.fee_cents === 0 ? "" : String(z.fee_cents / 100)}
                      onChange={(e) => {
                        const zones = [...f.delivery_zones];
                        zones[idx] = { ...zones[idx], fee_cents: Math.round((parseFloat(e.target.value) || 0) * 100) };
                        set({ delivery_zones: zones });
                      }}
                      inputMode="decimal"
                      placeholder={s.delivery.free}
                      className="h-9 w-24 rounded-lg border border-line bg-white px-2 font-extrabold text-brand outline-none focus:border-brand"
                      aria-label={s.delivery.zoneFee}
                    />
                    <button
                      type="button"
                      onClick={() => set({ delivery_zones: f.delivery_zones.filter((_, i) => i !== idx) })}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#FCE4E4] text-[#C0392B] active:scale-95"
                      aria-label={c.actions.delete}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder={s.delivery.zoneNamePlaceholder} aria-label={s.delivery.zoneName} className={cls} />
                <input value={newZoneFee} onChange={(e) => setNewZoneFee(e.target.value)} placeholder={s.delivery.zoneFeePlaceholder} aria-label={s.delivery.zoneFee} inputMode="decimal" className={cls} />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newZoneName.trim()) return;
                  set({ delivery_zones: [...f.delivery_zones, { name: newZoneName.trim(), fee_cents: Math.round((parseFloat(newZoneFee) || 0) * 100) }] });
                  setNewZoneName("");
                  setNewZoneFee("");
                }}
                className="flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#E7F7F1] text-xs font-extrabold text-brand active:scale-95"
              >
                {s.delivery.add}
              </button>
            </div>
          </Card>
        )}

        {tab === "look" && (
          <>
            <Card title={s.look.title}>
              <Field label={s.look.theme}>
                <select value={f.theme} onChange={(e) => set({ theme: e.target.value })} className={cls}>
                  {THEME_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {themeLabel(k)}
                    </option>
                  ))}
                </select>
              </Field>
              {/* La couleur choisie s'applique à la bannière, aux cartes et aux boutons. */}
              <div className="flex gap-2">
                {THEME_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set({ theme: k })}
                    className={`h-10 flex-1 cursor-pointer rounded-lg ${f.theme === k ? "ring-2 ring-ink ring-offset-2" : ""}`}
                    style={{ background: themeOf(k, sectorId).accent }}
                    aria-label={themeLabel(k)}
                    title={themeLabel(k)}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-ink-soft">{s.look.layout}</span>
                <span className="text-[12px] leading-snug text-ink-muted">{s.look.layoutHint}</span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {STOREFRONT_LAYOUTS.map((l, index) => {
                    // Seuls les 3 designs du secteur de la boutique sont proposés.
                    const spec = designFor(sectorId, l.key);
                    const names = designName(designCopy, sectorId, index as 0 | 1 | 2);
                    const rule = layoutRule(l.key, designs);
                    const allowed = layoutAllowed(l.key, plan, designs);
                    const selected = f.layout === l.key;
                    const lock = !rule.enabled
                      ? s.look.lockedOff
                      : rule.minPlan === "premium"
                        ? s.look.lockedPremium
                        : s.look.lockedPro;
                    return (
                      <div
                        key={l.key}
                        className={`flex flex-col gap-2 rounded-2xl border-2 p-2.5 ${selected ? "border-brand bg-[#F3F8F6]" : "border-line bg-white"} ${allowed ? "" : "opacity-60"}`}
                      >
                        <button
                          type="button"
                          disabled={!allowed}
                          onClick={() => set({ layout: l.key })}
                          aria-pressed={selected}
                          className="flex cursor-pointer flex-col gap-2 text-left disabled:cursor-not-allowed"
                        >
                          <LayoutThumb shape={spec.shape} color={themeOf(f.theme, sectorId).accent} active={selected} />
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[13.5px] font-extrabold text-ink">{names.name}</span>
                            {selected && <span className="rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-bold text-white">{s.look.selected}</span>}
                          </span>
                          <span className="text-[11.5px] leading-snug text-ink-muted">{names.desc}</span>
                          <span className="text-[11.5px] font-semibold text-ink-soft">{allowed ? s.look.images(spec.slots) : lock}</span>
                        </button>
                        <a
                          href={`/b/${business.slug}?apercu=${l.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 items-center justify-center rounded-lg bg-[#EEF2F3] text-[12px] font-bold text-ink-soft"
                        >
                          {s.look.preview}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <TableQrGenerator business={business} />
          </>
        )}
      </div>

      {/* Barre d'enregistrement : le bouton restait en bas d'une page très longue. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[760px] items-center gap-3">
          {error && <span className="flex-1 truncate text-[12.5px] font-semibold text-[#C0392B]">{error}</span>}
          {saved && !error && <span className="flex-1 text-[12.5px] font-semibold text-brand">{s.saved}</span>}
          <button
            onClick={submit}
            disabled={pending}
            className="ml-auto flex h-12 min-w-[160px] cursor-pointer items-center justify-center rounded-2xl bg-brand-green px-6 text-sm font-extrabold text-white active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? c.actions.saving : s.save}
          </button>
        </div>
      </div>
    </div>
  );
}

const cls = "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[15px] outline-none focus:border-brand focus:bg-white";

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
      {title && <h2 className="text-[14px] font-extrabold text-ink">{title}</h2>}
      {children}
    </section>
  );
}

function SectionHead({ title, action }: { title: string; action: { label: string; onClick: () => void; danger?: boolean } }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-[14px] font-extrabold text-ink">{title}</h2>
      <button
        type="button"
        onClick={action.onClick}
        className={`h-8 cursor-pointer rounded-lg px-2.5 text-xs font-extrabold active:scale-95 ${
          action.danger ? "text-[#C0392B] hover:underline" : "border border-brand/30 bg-[#E7F7F1] text-brand"
        }`}
      >
        {action.label}
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-ink-faint">{text}</p>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-ink-muted">{hint}</span>}
    </label>
  );
}
