"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { InvoiceModal } from "@/components/InvoiceModal";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { createCustomer, setCustomerTags } from "@/app/kliyan/actions";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { CUSTOMERS_COPY } from "@/lib/i18n/app/customers";
import { MESSAGE_COPY } from "@/lib/i18n/app/messages";
import { formatMoney } from "@/lib/money";
import { getOrderSecurityCode } from "@/lib/order";
import { waMeLink } from "@/lib/whatsapp";
import type { Customer, PipelineCard, Business } from "@/lib/types";

const TAG_KEYS = ["vip", "kliyan_fidel", "nouvo_kliyan"] as const;
type TagKey = (typeof TAG_KEYS)[number];

const AVATAR_TONES = [
  "bg-[#DCF8C6] text-[#2A7D3F]",
  "bg-[#D7EBFF] text-[#1A6BB8]",
  "bg-[#FCE4E4] text-[#C0392B]",
  "bg-[#EADCF8] text-[#7A3EAF]",
  "bg-[#FDECC8] text-[#B7791F]",
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function CustomerListClient({
  customers,
  pipelineCards,
  business,
  canEdit = true,
}: {
  customers: Customer[];
  pipelineCards: PipelineCard[];
  business: Business;
  canEdit?: boolean;
}) {
  const k = useDict(CUSTOMERS_COPY);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [invoiceCard, setInvoiceCard] = useState<PipelineCard | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return c.full_name.toLowerCase().includes(q) || c.phone_e164.includes(q);
  });

  const cardsOf = (customer: Customer): PipelineCard[] =>
    pipelineCards.filter(
      (card) =>
        card.phone_e164 === customer.phone_e164 ||
        card.customerName.toLowerCase().trim() === customer.full_name.toLowerCase().trim(),
    );

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <h1 className="text-[21px] font-extrabold tracking-tight text-white">{k.title}</h1>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">{k.count(customers.length)}</span>
        <div className="ml-auto md:hidden">
          <LanguageToggle />
        </div>
      </header>

      <div className="px-4 pt-1">
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-gray-50 px-3.5 py-2.5 text-sm text-ink transition-colors focus-within:border-brand focus-within:bg-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667781" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={k.search}
            aria-label={k.search}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label={k.clearSearch} className="cursor-pointer text-xs font-bold text-ink-muted hover:text-ink">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-line/60">
        {filtered.map((c, i) => {
          const cards = cardsOf(c);
          const spentCents = cards.reduce((acc, card) => acc + card.totalCents, 0);
          const ordersCount = cards.length > 0 ? cards.length : c.orders_count ?? 0;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c)}
              className="flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                {initials(c.full_name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-extrabold text-ink">{c.full_name}</span>
                  {spentCents > 0 && <span className="shrink-0 text-xs font-black text-brand">{formatMoney(spentCents)}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium text-ink-muted">{c.phone_e164}</span>
                  <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10.5px] font-bold text-ink-soft">{k.orders(ordersCount)}</span>
                  {(c.tags ?? [])
                    .filter((t): t is TagKey => (TAG_KEYS as readonly string[]).includes(t))
                    .map((t) => (
                      <span key={t} className="shrink-0 truncate rounded-md bg-[#E7F7F1] px-1.5 py-0.5 text-[10px] font-extrabold text-brand">
                        {k.tags[t]}
                      </span>
                    ))}
                </span>
              </span>
              <a
                href={waMeLink(c.phone_e164)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F1] text-brand transition-colors hover:bg-[#D6F5EC] active:scale-95"
                aria-label={`WhatsApp ${c.full_name}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" />
                </svg>
              </a>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          {customers.length === 0 ? (
            <>
              <h2 className="text-sm font-bold text-ink">{k.empty.title}</h2>
              <p className="max-w-sm text-xs leading-relaxed text-ink-muted">{k.empty.desc}</p>
            </>
          ) : (
            <p className="text-xs text-ink-muted">{k.empty.noMatch}</p>
          )}
        </div>
      )}

      {canEdit && (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="fixed bottom-[92px] right-4 z-20 flex h-14 cursor-pointer items-center gap-2 rounded-2xl bg-brand-green px-5 shadow-[0_6px_18px_rgba(37,211,102,0.45)] active:scale-95"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-[15px] font-bold text-white">{k.add.cta}</span>
        </button>
      )}

      {addOpen && <AddCustomerModal onClose={() => setAddOpen(false)} />}

      {selected && (
        <CustomerProfileModal
          customer={selected}
          cards={cardsOf(selected)}
          business={business}
          canEdit={canEdit}
          onClose={() => setSelected(null)}
          onViewInvoice={(card) => setInvoiceCard(card)}
        />
      )}

      {invoiceCard && (
        <InvoiceModal
          card={invoiceCard}
          type="devis"
          businessName={business.name}
          businessLogoUrl={business.logo_url}
          businessPhone={business.phone_e164 ?? undefined}
          businessSlogan={business.slogan}
          businessCurrency={business.default_currency}
          usdExchangeRate={business.usd_exchange_rate}
          bankAccounts={business.bank_accounts}
          zelleInfo={business.zelle_info}
          usdtAddress={business.usdt_trc20_address}
          moncashNumber={business.moncash_number}
          moncashName={business.moncash_name}
          moncashQrUrl={business.moncash_qr_url}
          natcashNumber={business.natcash_number}
          natcashName={business.natcash_name}
          natcashQrUrl={business.natcash_qr_url}
          zelleQrUrl={business.zelle_qr_url}
          usdtQrUrl={business.usdt_qr_url}
          onClose={() => setInvoiceCard(null)}
        />
      )}
    </div>
  );
}

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const k = useDict(CUSTOMERS_COPY);
  const c = useDict(COMMON_COPY);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!fullName.trim()) return setError(k.add.nameRequired);
    if (!phone.trim()) return setError(k.add.phoneRequired);
    setError(null);
    start(async () => {
      const res = await createCustomer({ fullName, phone, address });
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError(res.error ?? c.actions.retry);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-base font-extrabold text-ink">{k.add.title}</h2>
          <button onClick={onClose} aria-label={c.actions.close} className="cursor-pointer font-bold text-ink-muted hover:text-ink">
            ✕
          </button>
        </div>

        {error && <p className="rounded-xl bg-[#FCE4E4] px-3 py-2 text-[13px] text-[#C0392B]">{error}</p>}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">{k.add.name}</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={k.add.namePlaceholder} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">{k.add.phone}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder={k.add.phoneHint} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">{k.add.address}</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={k.add.addressPlaceholder} className={inputCls} />
        </label>

        <button
          onClick={submit}
          disabled={pending}
          className="flex h-12 cursor-pointer items-center justify-center rounded-2xl bg-brand-green text-sm font-extrabold text-white active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? c.actions.saving : k.add.submit}
        </button>
      </div>
    </div>
  );
}

function CustomerProfileModal({
  customer,
  cards,
  business,
  canEdit,
  onClose,
  onViewInvoice,
}: {
  customer: Customer;
  cards: PipelineCard[];
  business: Business;
  canEdit: boolean;
  onClose: () => void;
  onViewInvoice: (card: PipelineCard) => void;
}) {
  const { language } = useLanguage();
  const k = useDict(CUSTOMERS_COPY);
  const c = useDict(COMMON_COPY);
  const m = MESSAGE_COPY[language] ?? MESSAGE_COPY.fr;
  const [tags, setTags] = useState<string[]>(customer.tags ?? []);
  const [tagError, setTagError] = useState<string | null>(null);
  const [, start] = useTransition();

  function toggleTag(tag: TagKey) {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    const previous = tags;
    setTags(next);
    setTagError(null);
    start(async () => {
      const res = await setCustomerTags(customer.id, next);
      if (!res.ok) {
        setTags(previous);
        setTagError(k.profile.saveTagsError);
      }
    });
  }

  const spentCents = cards.reduce((acc, card) => acc + card.totalCents, 0);
  const owedCents = cards.reduce((acc, card) => acc + card.owedCents, 0);
  const ordersCount = cards.length > 0 ? cards.length : customer.orders_count ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-line bg-brand px-5 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 text-base font-extrabold">
              {initials(customer.full_name)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg font-extrabold tracking-tight">{customer.full_name}</span>
              <span className="text-xs font-medium text-[#B9F5E4]">{customer.phone_e164}</span>
            </div>
          </div>
          <button onClick={onClose} aria-label={c.actions.close} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 active:scale-95">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5 text-ink">
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={waMeLink(customer.phone_e164, m.hello(customer.full_name, business.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-xs font-extrabold text-white active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" />
              </svg>
              {k.profile.whatsapp}
            </a>
            <a
              href={`tel:${customer.phone_e164}`}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-gray-50 text-xs font-extrabold text-ink hover:bg-gray-100 active:scale-95"
            >
              {k.profile.call}
            </a>
          </div>

          {canEdit && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">{k.profile.badges}</span>
              <div className="flex flex-wrap gap-1.5">
                {TAG_KEYS.map((tagKey) => {
                  const active = tags.includes(tagKey);
                  return (
                    <button
                      key={tagKey}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(tagKey)}
                      className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${active ? "border-brand bg-brand text-white" : "border-line bg-gray-50 text-ink-muted hover:bg-gray-100"}`}
                    >
                      {k.tags[tagKey]}
                    </button>
                  );
                })}
              </div>
              {tagError && <span className="text-[11px] font-semibold text-[#C0392B]">{tagError}</span>}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-line bg-gray-50 p-3.5 text-center">
            <div className="flex flex-col">
              <span className="text-[10.5px] font-bold uppercase text-ink-faint">{k.profile.stats.orders}</span>
              <span className="text-base font-black text-ink">{ordersCount}</span>
            </div>
            <div className="flex flex-col border-x border-line">
              <span className="text-[10.5px] font-bold uppercase text-ink-faint">{k.profile.stats.spent}</span>
              <span className="truncate px-1 text-base font-black text-brand">{formatMoney(spentCents)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10.5px] font-bold uppercase text-ink-faint">{k.profile.stats.owed}</span>
              <span className={`truncate px-1 text-base font-black ${owedCents > 0 ? "text-owed-text" : "text-brand"}`}>{formatMoney(owedCents)}</span>
            </div>
          </div>

          {customer.address && (
            <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-gray-50 p-2.5">
              <span className="text-[11px] font-bold uppercase text-ink-faint">{k.profile.address}</span>
              <span className="text-xs font-semibold text-ink-soft">{customer.address}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink">{k.profile.history(cards.length)}</span>
            {cards.map((card) => (
              <div key={card.id} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-white p-3">
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-ink">#{card.ref}</span>
                    <span className="rounded bg-[#E7F7F1] px-1.5 py-0.5 font-mono text-[10px] font-black text-brand" title={k.profile.code}>
                      {getOrderSecurityCode(card.ref, card.securityCode)}
                    </span>
                  </div>
                  <span className="truncate pt-0.5 text-[11.5px] text-ink-muted">{card.itemsSummary}</span>
                  <span className="pt-0.5 text-xs font-black text-brand">{formatMoney(card.totalCents)}</span>
                </div>
                <button
                  onClick={() => onViewInvoice(card)}
                  className="flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-gray-50 px-3 text-xs font-extrabold text-ink transition-colors hover:bg-brand hover:text-white active:scale-95"
                >
                  {k.profile.invoice}
                </button>
              </div>
            ))}
            {cards.length === 0 && (
              <p className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-ink-faint">{k.profile.noHistory}</p>
            )}
          </div>
        </div>

        <div className="border-t border-line bg-gray-50 p-3">
          <button onClick={onClose} className="h-11 w-full cursor-pointer rounded-2xl border border-line bg-white text-xs font-bold text-ink-muted active:scale-95">
            {k.profile.close}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[15px] outline-none focus:border-brand focus:bg-white";
