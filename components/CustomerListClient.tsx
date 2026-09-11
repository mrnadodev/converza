"use client";

import { useState } from "react";
import { waMeLink } from "@/lib/whatsapp";
import { formatMoney } from "@/lib/money";
import type { Customer, PipelineCard, Business } from "@/lib/types";
import { InvoiceModal } from "@/components/InvoiceModal";
import { getOrderSecurityCode } from "@/lib/order";

const TAG_LABEL: Record<string, string> = {
  kliyan_fidel: "Kliyan fidèl ⭐",
  nouvo_kliyan: "Nouvo Kliyan 🆕",
  vip: "VIP 👑",
};

const AVATAR_TONES = [
  "bg-[#DCF8C6] text-[#2A7D3F]",
  "bg-[#D7EBFF] text-[#1A6BB8]",
  "bg-[#FCE4E4] text-[#C0392B]",
  "bg-[#EADCF8] text-[#7A3EAF]",
  "bg-[#FDECC8] text-[#B7791F]",
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

interface CustomerListClientProps {
  customers: Customer[];
  pipelineCards: PipelineCard[];
  business: Business;
}

export function CustomerListClient({ customers, pipelineCards, business }: CustomerListClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedModalCard, setSelectedModalCard] = useState<PipelineCard | null>(null);

  // Filtrer les clients par nom ou téléphone
  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return c.full_name.toLowerCase().includes(q) || c.phone_e164.includes(q);
  });

  // Obtenir les commandes d'un client spécifique
  const getCustomerCards = (customer: Customer): PipelineCard[] => {
    return pipelineCards.filter((card) => {
      const matchName = card.customerName.toLowerCase().trim() === customer.full_name.toLowerCase().trim();
      const matchPhone = card.phone_e164 === customer.phone_e164;
      return matchName || matchPhone;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Barre de recherche */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-gray-50 px-3.5 py-2.5 text-sm text-ink focus-within:border-brand focus-within:bg-white transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667781" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chèche yon kliyan pa non oswa nimewo telefòn…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs font-bold text-ink-muted hover:text-ink">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Liste des clients */}
      <div className="divide-y divide-line/60">
        {filteredCustomers.map((c, i) => {
          const cards = getCustomerCards(c);
          const totalSpentCents = cards.reduce((acc, card) => acc + card.totalCents, 0);
          const ordersCount = cards.length > 0 ? cards.length : (c.orders_count ?? 1);

          return (
            <div
              key={c.id}
              onClick={() => setSelectedCustomer(c)}
              className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors cursor-pointer"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                {initials(c.full_name)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-extrabold text-ink truncate">{c.full_name}</span>
                  <span className="text-xs font-black text-brand shrink-0">
                    {totalSpentCents > 0 ? formatMoney(totalSpentCents) : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium text-ink-muted">{c.phone_e164}</span>
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10.5px] font-bold text-ink-soft shrink-0">
                    {ordersCount} kòmand
                  </span>
                  {c.tags?.filter((t) => TAG_LABEL[t]).map((t) => (
                    <span key={t} className="rounded-md bg-[#E7F7F1] px-1.5 py-0.5 text-[10px] font-extrabold text-brand truncate shrink-0">
                      {TAG_LABEL[t]}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={waMeLink(c.phone_e164)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F1] text-brand active:scale-95 hover:bg-[#D6F5EC] transition-colors"
                aria-label={`WhatsApp ${c.full_name}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" /></svg>
              </a>
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-ink-muted">
          <span className="text-4xl mb-2">👤</span>
          <span className="text-sm font-bold text-ink">Pa gen kliyan ki touve</span>
          <span className="text-xs text-ink-faint">Eseye chèche ak yon lòt non oswa nimewo telefòn.</span>
        </div>
      )}

      {/* Modal Fich Kliyan (Profil & Historique) */}
      {selectedCustomer && (
        <CustomerProfileModal
          customer={selectedCustomer}
          cards={getCustomerCards(selectedCustomer)}
          business={business}
          onClose={() => setSelectedCustomer(null)}
          onViewInvoice={(card) => setSelectedModalCard(card)}
        />
      )}

      {/* Modal Fakti spècifique s'il clique sur une commande dans l'historique */}
      {selectedModalCard && (
        <InvoiceModal
          card={selectedModalCard}
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
          onClose={() => setSelectedModalCard(null)}
        />
      )}
    </div>
  );
}

// Modal Fich Kliyan complet
function CustomerProfileModal({
  customer,
  cards,
  business,
  onClose,
  onViewInvoice,
}: {
  customer: Customer;
  cards: PipelineCard[];
  business: Business;
  onClose: () => void;
  onViewInvoice: (card: PipelineCard) => void;
}) {
  const [activeTags, setActiveTags] = useState<string[]>(customer.tags ?? ["kliyan_fidel"]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const totalSpentCents = cards.reduce((acc, c) => acc + c.totalCents, 0);
  const totalOwedCents = cards.reduce((acc, c) => acc + c.owedCents, 0);
  const ordersCount = cards.length > 0 ? cards.length : (customer.orders_count ?? 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header Fich Kliyan */}
        <div className="flex items-center justify-between border-b border-line bg-brand px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-base font-extrabold text-white border border-white/30">
              {initials(customer.full_name)}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight">{customer.full_name}</span>
              <span className="text-xs text-[#B9F5E4] font-medium">{customer.phone_e164}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white active:scale-95 hover:bg-white/25 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5 text-ink">
          {/* Actions Rapides */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={waMeLink(customer.phone_e164, `Bonjou ${customer.full_name} 👋 Se ${business.name} ki t ap kontakte w!`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-xs font-extrabold text-white shadow-sm active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" /></svg>
              <span>Voye WhatsApp</span>
            </a>
            <a
              href={`tel:${customer.phone_e164}`}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-gray-50 text-xs font-extrabold text-ink active:scale-95 hover:bg-gray-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              <span>Rele Kliyan an</span>
            </a>
          </div>

          {/* Attribution de Badges / Tags Kliyan */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-extrabold text-ink-muted uppercase tracking-wider">
              🏷️ Badges & Statut Kliyan :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(TAG_LABEL).map(([tagKey, tagLabel]) => {
                const isActive = activeTags.includes(tagKey);
                return (
                  <button
                    key={tagKey}
                    type="button"
                    onClick={() => toggleTag(tagKey)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-black transition-colors cursor-pointer border ${
                      isActive
                        ? "bg-brand text-white border-brand shadow-2xs"
                        : "bg-gray-50 text-ink-muted border-line hover:bg-gray-100"
                    }`}
                  >
                    {tagLabel} {isActive ? "✓" : "+"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Statistiques Kliyan (KPIs) */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3.5 border border-line text-center">
            <div className="flex flex-col">
              <span className="text-[10.5px] font-bold text-ink-faint uppercase">Kòmand</span>
              <span className="text-base font-black text-ink">{ordersCount}</span>
            </div>
            <div className="flex flex-col border-x border-line">
              <span className="text-[10.5px] font-bold text-ink-faint uppercase">Total Achte</span>
              <span className="text-base font-black text-brand truncate px-1">
                {totalSpentCents > 0 ? formatMoney(totalSpentCents).replace(" HTG", "") : "0"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10.5px] font-bold text-ink-faint uppercase">Dèt Reziyèl</span>
              <span className={`text-base font-black truncate px-1 ${totalOwedCents > 0 ? "text-red-600" : "text-emerald-700"}`}>
                {totalOwedCents > 0 ? formatMoney(totalOwedCents).replace(" HTG", "") : "0 HTG"}
              </span>
            </div>
          </div>

          {/* Adrès ak Badges */}
          {customer.address && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-200 text-xs font-bold text-emerald-950">
              <span>📍 Adrès livrezon abityèl :</span>
              <span className="font-semibold text-emerald-900 truncate">{customer.address}</span>
            </div>
          )}

          {/* Istorik Kòmand Kliyan an */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink uppercase tracking-wider">
                📜 Istorik Kòmand ak Fakti ({cards.length})
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {cards.map((card) => {
                const securityCode = getOrderSecurityCode(card.ref, card.securityCode);
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between rounded-2xl border border-line bg-white p-3 shadow-2xs hover:border-brand transition-colors"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-ink">N° #{card.ref}</span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-900 border border-emerald-300/60 font-mono">
                          🔑 {securityCode}
                        </span>
                      </div>
                      <span className="text-[11.5px] text-ink-muted truncate pt-0.5">{card.itemsSummary}</span>
                      <span className="text-xs font-black text-brand pt-0.5">{formatMoney(card.totalCents)}</span>
                    </div>

                    <button
                      onClick={() => onViewInvoice(card)}
                      className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-gray-50 px-3 text-xs font-extrabold text-ink active:scale-95 hover:bg-brand hover:text-white transition-colors cursor-pointer"
                    >
                      <span>📄 Fakti / Resi</span>
                    </button>
                  </div>
                );
              })}

              {cards.length === 0 && (
                <div className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-ink-faint">
                  Pa gen istorik kòmand ki anrejistre pou kliyan sa a nan sistèm nan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="border-t border-line p-3 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl bg-white border border-line text-xs font-bold text-ink-muted active:scale-95 cursor-pointer shadow-2xs"
          >
            Fèmen Fich Kliyan an
          </button>
        </div>
      </div>
    </div>
  );
}
