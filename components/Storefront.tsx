"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import { waMeLink } from "@/lib/whatsapp";
import { buildOrderMessage, type CartLine } from "@/lib/order";
import type { Business, Product } from "@/lib/types";

export function Storefront({ business, products }: { business: Business; products: Product[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const sub = (id: string) =>
    setCart((c) => {
      const q = (c[id] ?? 0) - 1;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });

  const lines: CartLine[] = useMemo(
    () =>
      products
        .filter((p) => cart[p.id])
        .map((p) => ({ name: p.name, unit: p.unit, qty: cart[p.id], unitPriceCents: p.price_cents })),
    [cart, products],
  );
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const totalCents = lines.reduce((a, l) => a + Math.round(l.unitPriceCents * l.qty), 0);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [zoneIdx, setZoneIdx] = useState(0);

  // Pickup gratuit + zones configurées par le marchand.
  const zones = [{ name: "Pran li nan boutik", fee_cents: 0 }, ...(business.delivery_zones ?? [])];
  const zone = zones[zoneIdx] ?? zones[0];
  const grandTotalCents = totalCents + zone.fee_cents;

  const message = count
    ? buildOrderMessage(business.name, lines, {
        currency: business.default_currency,
        delivery: { name: zone.name, feeCents: zone.fee_cents },
      })
    : `Bonjou ${business.name}! Mwen enterese nan pwodwi ou yo.`;
  const orderHref = waMeLink(business.phone_e164 ?? "", message);

  const socials = [
    { url: business.social_instagram, icon: <InstagramIcon /> },
    { url: business.social_facebook, icon: <FacebookIcon /> },
    { url: business.social_tiktok, icon: <TiktokIcon /> },
  ].filter((s) => s.url);

  return (
    <div className="relative min-h-[100dvh] bg-white pb-28">
      {/* Cover */}
      <div
        className="relative h-[210px]"
        style={{
          background: business.cover_url
            ? `center/cover url(${business.cover_url})`
            : "radial-gradient(120% 90% at 80% -10%, #12B886 0%, transparent 55%), radial-gradient(120% 100% at 0% 120%, #075E54 0%, transparent 60%), linear-gradient(135deg, #008069 0%, #0B6B57 100%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 -mt-14 flex justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-white shadow-[0_8px_24px_rgba(17,27,33,0.18)]">
          <div className="flex h-[92px] w-[92px] items-center justify-center rounded-[26px] bg-gradient-to-br from-brand-teal to-brand-dark">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo_url} alt={business.name} className="h-full w-full rounded-[26px] object-cover" />
            ) : (
              <RoosterLogo />
            )}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center gap-1.5 px-6 pt-3.5">
        <h1 className="text-2xl font-extrabold -tracking-[0.4px]">{business.name}</h1>
        {business.category && (
          <span className="text-[13.5px] font-medium text-ink-muted">
            {business.category}
            {business.address ? ` · ${business.address}` : ""}
          </span>
        )}
        {business.hours && (
          <div className="mt-1 flex items-center gap-1.5 rounded-full bg-[#E7F7F1] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-green" />
            <span className="text-xs font-bold text-[#0B6B57]">Louvri · {business.hours}</span>
          </div>
        )}

        {/* Réseaux sociaux */}
        {socials.length > 0 && (
          <div className="mt-3 flex gap-2.5">
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-line bg-white active:scale-95"
              >
                {s.icon}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Catalogue */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-6">
        {products.map((p) => {
          const qty = cart[p.id] ?? 0;
          return (
            <div key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(17,27,33,0.06)] ring-1 ring-line">
              <div
                className="flex h-24 items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FEF3E2,#FCE0B8)" }}
              >
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <BagIcon />
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                <span className="text-[13.5px] font-semibold">{p.name}</span>
                <span className="text-base font-extrabold">
                  {formatMoney(p.price_cents, p.currency).replace(` ${p.currency}`, "")}{" "}
                  <span className="text-[11px] font-semibold text-ink-faint">{p.currency}</span>
                </span>

                {qty === 0 ? (
                  <button
                    onClick={() => add(p.id)}
                    className="mt-1.5 flex h-9 items-center justify-center gap-1.5 rounded-[11px] bg-[#E7F7F1] text-brand active:scale-95"
                  >
                    <PlusIcon />
                    <span className="text-[12.5px] font-bold">Ajoute</span>
                  </button>
                ) : (
                  <div className="mt-1.5 flex h-9 items-center justify-between rounded-[11px] bg-[#E7F7F1] px-2">
                    <button onClick={() => sub(p.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand">−</button>
                    <span className="text-sm font-extrabold text-brand">{qty}</span>
                    <button onClick={() => add(p.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand">+</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Kòmande */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] border-t border-line bg-white/95 px-4 pb-6 pt-3 backdrop-blur">
        {count ? (
          <button
            onClick={() => setCheckoutOpen(true)}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-green shadow-[0_6px_18px_rgba(37,211,102,0.45)] active:scale-[0.99]"
          >
            <WaIcon />
            <span className="text-[16.5px] font-extrabold text-white">
              Kòmande {count} atik · {formatMoney(totalCents)}
            </span>
          </button>
        ) : (
          <a
            href={orderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-brand-green shadow-[0_6px_18px_rgba(37,211,102,0.45)] active:scale-[0.99]"
          >
            <WaIcon />
            <span className="text-[16.5px] font-extrabold text-white">Kòmande sou WhatsApp</span>
          </a>
        )}
      </div>

      {/* Feuille de commande (checkout) */}
      {checkoutOpen && count > 0 && (
        <div className="fixed inset-0 z-30 mx-auto flex max-w-[480px] flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCheckoutOpen(false)} />
          <div className="relative rounded-t-[24px] bg-white px-5 pb-8 pt-4">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Ou kòmand</h2>
              <button onClick={() => setCheckoutOpen(false)} className="text-sm font-semibold text-ink-muted">
                Fèmen
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-[13.5px]">
                  <span className="text-ink-soft">
                    {l.qty}× {l.name}
                  </span>
                  <span className="font-semibold">{formatMoney(Math.round(l.unitPriceCents * l.qty))}</span>
                </div>
              ))}
            </div>

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-ink-soft">Kote pou livre?</span>
              <select
                value={zoneIdx}
                onChange={(e) => setZoneIdx(Number(e.target.value))}
                className="h-12 rounded-xl border border-line bg-[#F7F8F9] px-3 text-[15px] outline-none focus:border-brand"
              >
                {zones.map((z, i) => (
                  <option key={i} value={i}>
                    {z.name}
                    {z.fee_cents > 0 ? ` — ${formatMoney(z.fee_cents)}` : " — gratis"}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[15px] font-extrabold">Total</span>
              <span className="text-xl font-extrabold">{formatMoney(grandTotalCents)}</span>
            </div>

            <a
              href={orderHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-brand-green shadow-[0_6px_18px_rgba(37,211,102,0.45)] active:scale-[0.99]"
            >
              <WaIcon />
              <span className="text-[16px] font-extrabold text-white">Voye kòmand sou WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Icônes --- */
function WaIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="#fff" stroke="none">
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B7791F" strokeWidth="1.5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function RoosterLogo() {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" /><circle cx="41" cy="11" r="4" fill="#FFD34E" /><circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#FFFFFF" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" /><path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" /><circle cx="45" cy="22" r="2.4" fill="#075E54" />
      <path d="M18 30c-6-3-11-2-14 3 4 0 5 3 4 7 4-3 8-3 12-1z" fill="#FFD34E" /><path d="M16 36c-6-1-10 1-12 6 4-1 6 2 6 6 3-4 7-5 11-4z" fill="#12B886" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111B21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="#111B21" stroke="none" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#111B21" stroke="none">
      <path d="M14 9h3V6h-3c-2.2 0-3.5 1.4-3.5 3.6V11H8v3h2.5v6H14v-6h2.4l.6-3H14V9.8c0-.6.3-.8.9-.8z" />
    </svg>
  );
}
function TiktokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#111B21" stroke="none">
      <path d="M16 3c.3 2 1.6 3.6 3.6 3.9v2.8c-1.3.1-2.6-.3-3.6-1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.9a2.7 2.7 0 1 0 1.9 2.6V3z" />
    </svg>
  );
}
