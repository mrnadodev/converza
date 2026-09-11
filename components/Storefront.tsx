"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { waMeLink } from "@/lib/whatsapp";
import { buildOrderMessage, type CartLine } from "@/lib/order";
import { verticalOf } from "@/lib/verticals";
import { themeOf } from "@/lib/themes";
import type { Business, Product } from "@/lib/types";
import { createStorefrontOrderAction } from "@/app/p/actions";

import { useTheme } from "@/components/ThemeProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/components/LanguageContext";

type View = "vitrine" | "full";

export function Storefront({
  business,
  products,
  view = "vitrine",
}: {
  business: Business;
  products: Product[];
  view?: View;
}) {
  const vertical = verticalOf(business.business_type);
  const theme = themeOf(business.theme);
  const { theme: globalTheme, toggleTheme } = useTheme();
  const darkMode = globalTheme === "dark";
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [promoSlideIdx, setPromoSlideIdx] = useState(0);

  // Filtres (vue catalogue complet)
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<"popile" | "pri_ba" | "pri_wo">("popile");

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

  const zones = [{ name: "Pran li nan boutik", fee_cents: 0 }, ...(business.delivery_zones ?? [])];
  const zone = zones[zoneIdx] ?? zones[0];

  // Attribution pub (UTM) & Détection Table QR Code Restoran
  const [source, setSource] = useState<string | null>(null);
  const [tableNum, setTableNum] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSource(p.get("utm_source") || p.get("utm") || p.get("source"));
    setTableNum(p.get("table") || p.get("tab") || p.get("t"));
  }, []);

  const deliveryOption = useMemo(() => {
    if (tableNum) {
      return { name: `📍 Table #${tableNum} (Sur place)`, feeCents: 0 };
    }
    return { name: zone.name, feeCents: zone.fee_cents };
  }, [tableNum, zone]);

  const grandTotalCents = totalCents + deliveryOption.feeCents;

  const [catalogViewMode, setCatalogViewMode] = useState<"grid" | "list">("grid");

  const baseMessage = count
    ? buildOrderMessage(business.name, lines, {
        currency: business.default_currency,
        delivery: deliveryOption,
      })
    : `Bonjou ${business.name}! Mwen enterese nan pwodwi ou yo.`;

  const tableSuffix = tableNum ? `\n📍 Emplacement: Table #${tableNum} (Sur place - Menu QR)` : "";
  const sourceSuffix = source ? `\n(Sòs: ${source})` : "";
  const message = `${baseMessage}${tableSuffix}${sourceSuffix}`;
  const orderHref = waMeLink(business.phone_e164 ?? "", message);

  const handleSendOrder = async () => {
    if (count > 0) {
      try {
        // On n'envoie que des identifiants et des quantités : le serveur relit
        // les prix et les frais de livraison en base.
        await createStorefrontOrderAction({
          businessId: business.id,
          items: Object.entries(cart).map(([productId, qty]) => ({ productId, qty })),
          tableNum,
          deliveryZoneName: zone.name,
          note: customerNote.trim() || null,
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          source,
        });
      } catch (err) {
        console.error("Order record error:", err);
      }
    }
  };

  // Best-sellers & Promotions (Les promotions d'abord, puis les best-sellers)
  const featured = useMemo(() => {
    const promoProds = products.filter((p) => p.category === "Pwomosyon" || p.id.startsWith("promo-"));
    const otherProds = products.filter((p) => p.category !== "Pwomosyon" && !p.id.startsWith("promo-")).sort((a, b) => b.sold_count - a.sold_count);
    return [...promoProds, ...otherProds].slice(0, 8);
  }, [products]);

  const activePromoProducts = useMemo(() => {
    return products.filter((p) => p.category === "Pwomosyon" || p.id.startsWith("promo-"));
  }, [products]);

  useEffect(() => {
    if (activePromoProducts.length <= 1) return;
    const timer = setInterval(() => {
      setPromoSlideIdx((prev) => (prev + 1) % activePromoProducts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activePromoProducts.length]);

  // Catalogue complet groupé par catégorie (vue "full")
  const grouped = useMemo(() => {
    let list = [...products];
    if (inStockOnly) list = list.filter((p) => p.stock_state !== "fini");
    if (sort === "pri_ba") list.sort((a, b) => a.price_cents - b.price_cents);
    else if (sort === "pri_wo") list.sort((a, b) => b.price_cents - a.price_cents);
    else list.sort((a, b) => b.sold_count - a.sold_count);

    const map = new Map<string, Product[]>();
    for (const p of list) {
      const cat = p.category || "Lòt";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    // Ordre : catégories du secteur d'abord, puis le reste
    const order = vertical.defaultCategories;
    return [...map.entries()].sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [products, inStockOnly, sort, vertical.defaultCategories]);

  const layout = business.layout && business.layout !== "auto" ? business.layout : vertical.layout;
  const isMenu = layout === "menu";

  return (
    <div className={`relative min-h-[100dvh] pb-16 md:mx-auto md:max-w-5xl lg:max-w-6xl md:my-6 md:rounded-3xl md:shadow-[0_4px_24px_rgba(0,0,0,0.08)] md:ring-1 overflow-hidden transition-colors duration-300 ${darkMode ? "bg-[#111827] text-white md:ring-gray-800" : "bg-white text-ink md:ring-line"}`}>
      {view === "vitrine" ? (
        <>
          {/* Cover avec étirement (stretch 100% 100%) pour remplir toute la zone sans zones blanches */}
          <div
            className="relative h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px] transition-all"
            style={{
              background: business.cover_url
                ? `100% 100% / cover no-repeat url(${business.cover_url})`
                : theme.cover,
            }}
          >
            {/* Boutons Toggle Langue 🇫🇷 🇭🇹 🇺🇸 et Mode Sombre ☀️ / 🌙 */}
            <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
              <LanguageToggle variant="compact" />
              <button
                onClick={toggleTheme}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm backdrop-blur shadow-md active:scale-90 transition-transform cursor-pointer"
                title={darkMode ? "Mode Lumière" : "Mode Sombre"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
          {/* Logo */}
          <div className="relative z-10 -mt-14 flex justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-white shadow-[0_8px_24px_rgba(17,27,33,0.18)]">
              <div className="flex h-[92px] w-[92px] items-center justify-center rounded-[26px]" style={{ background: theme.cover }}>
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
            <span className="text-[13.5px] font-medium text-ink-muted">
              {vertical.label}
              {business.address ? ` · ${business.address}` : ""}
            </span>
            {business.hours && (
              <div className="mt-1 flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: theme.accentSoft }}>
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                <span className="text-xs font-bold" style={{ color: theme.accentText }}>Louvri · {business.hours}</span>
              </div>
            )}
            {socialLinks(business, darkMode).length > 0 && (
              <div className="mt-3 flex gap-2.5">
                {socialLinks(business, darkMode).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className={`flex h-11 w-11 items-center justify-center rounded-[13px] border active:scale-95 transition-colors ${darkMode ? "border-gray-700 bg-gray-800 text-white" : "border-line bg-white text-ink"}`}>
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Visual Promo Banner with Interactive Slide Carousel */}
          {(business.promo_text || activePromoProducts.length > 0) && (
            <div className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl bg-amber-500/10 p-4 border border-amber-300 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <span>🔥 PWOMOSYON AKTIF NAN BOUTIK LA</span>
                  {activePromoProducts.length > 1 && (
                    <span className="rounded-full bg-amber-200 px-2 py-0.2 text-[10px] font-black text-amber-950">
                      {promoSlideIdx + 1} / {activePromoProducts.length}
                    </span>
                  )}
                </span>

                {/* Slider Navigation Arrows */}
                {activePromoProducts.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPromoSlideIdx((prev) => (prev - 1 + activePromoProducts.length) % activePromoProducts.length)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-amber-950 font-black text-sm border border-amber-300 shadow-2xs hover:bg-amber-100 cursor-pointer"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setPromoSlideIdx((prev) => (prev + 1) % activePromoProducts.length)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-amber-950 font-black text-sm border border-amber-300 shadow-2xs hover:bg-amber-100 cursor-pointer"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>

              {/* Promo Slide Card */}
              {activePromoProducts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {(() => {
                    const currentPromo = activePromoProducts[promoSlideIdx % activePromoProducts.length] || activePromoProducts[0];
                    return (
                      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl bg-white p-3.5 border border-amber-200 shadow-2xs transition-all duration-300">
                        <div className="relative h-32 w-full sm:w-32 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-slate-200">
                          {currentPromo.photo_url || (currentPromo.photos && currentPromo.photos[0]) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={currentPromo.photo_url || currentPromo.photos?.[0]}
                              alt={currentPromo.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400 font-bold text-xs">📷</div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-center gap-1.5 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-ink">{currentPromo.name}</span>
                            <span className="rounded bg-amber-100 text-amber-950 px-2 py-0.5 text-[10px] font-black">
                              🔥 Offre Promo
                            </span>
                          </div>
                          <span className="text-sm font-black text-brand">{formatMoney(currentPromo.price_cents, currentPromo.currency)}</span>
                          <button
                            onClick={() => add(currentPromo.id)}
                            className="mt-1 flex h-9 w-full sm:w-fit px-4 items-center justify-center gap-1.5 rounded-xl bg-brand-green text-xs font-black text-white shadow-2xs hover:bg-brand-dark cursor-pointer transition-all active:scale-95"
                          >
                            <span>🛒 Ajoute nan Panyen ({cart[currentPromo.id] ?? 0})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Slide Indicators Dots */}
                  {activePromoProducts.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      {activePromoProducts.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPromoSlideIdx(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === promoSlideIdx ? "w-6 bg-amber-600" : "w-2 bg-amber-300 hover:bg-amber-400"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-white p-3 border border-amber-200 shadow-2xs">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-amber-50 border border-amber-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80"
                      alt="Promo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-0.5">
                    <span className="font-extrabold text-xs text-ink">{business.promo_text}</span>
                    <span className="rounded bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[9.5px] font-bold w-fit">
                      🔥 Offre Spéciale
                    </span>
                  </div>
                  <a
                    href={orderHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 px-3 items-center justify-center gap-1 rounded-xl bg-brand-green text-[11px] font-black text-white shadow-2xs hover:bg-brand-dark cursor-pointer shrink-0"
                  >
                    <span>💬 Kòmande</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Best-sellers */}
          <div className="flex items-center justify-between px-4 pt-6">
            <h2 className="text-[15px] font-extrabold">Pi plis vann</h2>
            <span className="text-xs font-semibold text-ink-faint">{vertical.catalogWord}</span>
          </div>
          {business.layout === "design3" ? (
            /* DESIGN 3 VIP SHOWCASE DELUXE (Exclusif Premium) */
            <Design3VipShowcase featured={featured} cart={cart} add={add} sub={sub} darkMode={darkMode} />
          ) : vertical.id === "restauration" ? (
            /* RESTAURANT DESIGN (GRANDES CARTES GOURMANDES VISUELLES EN GRILLE 2X2+) */
            <div className="mt-3 grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <RestaurantLargeFoodGridCard
                  key={p.id}
                  p={p}
                  qty={cart[p.id] ?? 0}
                  add={add}
                  sub={sub}
                  darkMode={darkMode}
                  onZoom={(photos, idx) => setLightbox({ photos, index: idx })}
                />
              ))}
            </div>
          ) : vertical.id === "sante_bienetre" && business.layout === "design2" ? (
            /* SANTÉ DESIGN #2 (PDF): 2 Gélules/Capsules à gauche (haut & bas) + 2 Wide Rectangles à droite */
            <div className="mt-3 grid grid-cols-2 gap-3 px-4">
              <div className="flex flex-col gap-3">
                {featured[0] && (
                  <div className="relative flex flex-col justify-end overflow-hidden rounded-t-[50px] rounded-b-xl border border-blue-400 bg-blue-600 text-white shadow-md h-[150px] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featured[0].photo_url || (featured[0].photos && featured[0].photos[0]) || ""} alt={featured[0].name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 to-transparent" />
                    <span className="relative z-10 text-[10px] font-black text-blue-200">💊 Capsule Top</span>
                    <h4 className="relative z-10 text-xs font-black text-white line-clamp-1">{featured[0].name}</h4>
                    <span className="relative z-10 text-xs font-extrabold text-blue-100">{formatMoney(featured[0].price_cents, featured[0].currency)}</span>
                  </div>
                )}
                {featured[1] && (
                  <div className="relative flex flex-col justify-end overflow-hidden rounded-b-[50px] rounded-t-xl border border-blue-400 bg-blue-600 text-white shadow-md h-[150px] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featured[1].photo_url || (featured[1].photos && featured[1].photos[0]) || ""} alt={featured[1].name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 to-transparent" />
                    <span className="relative z-10 text-[10px] font-black text-blue-200">💊 Capsule Bottom</span>
                    <h4 className="relative z-10 text-xs font-black text-white line-clamp-1">{featured[1].name}</h4>
                    <span className="relative z-10 text-xs font-extrabold text-blue-100">{formatMoney(featured[1].price_cents, featured[1].currency)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {featured.slice(2, 4).map((p) => (
                  <div key={p.id} className="relative flex flex-col justify-end overflow-hidden rounded-3xl border border-blue-300 bg-slate-900 text-white shadow-md h-[150px] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photo_url || (p.photos && p.photos[0]) || ""} alt={p.name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
                    <h4 className="relative z-10 text-xs font-black text-white line-clamp-1">{p.name}</h4>
                    <div className="relative z-10 flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-blue-200">{formatMoney(p.price_cents, p.currency)}</span>
                      {qtyControl(cart[p.id] ?? 0, () => add(p.id), () => sub(p.id))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : vertical.id === "automobile" && business.layout === "design2" ? (
            /* AUTOMOBILE DESIGN #2 (PDF): Wide+Square top row, Square+Wide bottom row */
            <div className="mt-3 grid grid-cols-3 gap-3 px-4">
              {featured[0] && (
                <div className="col-span-2 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-300 bg-slate-900 text-white shadow-md h-[140px] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured[0].photo_url || (featured[0].photos && featured[0].photos[0]) || ""} alt={featured[0].name} className="absolute inset-0 h-full w-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <span className="relative z-10 text-[9.5px] font-black text-amber-400">🏎️ Rectangle Wide 1</span>
                  <h4 className="relative z-10 text-xs font-black text-white">{featured[0].name}</h4>
                  <span className="relative z-10 text-xs font-bold text-slate-200">{formatMoney(featured[0].price_cents, featured[0].currency)}</span>
                </div>
              )}
              {featured[1] && (
                <div className="col-span-1 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-300 bg-slate-900 text-white shadow-md h-[140px] p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured[1].photo_url || (featured[1].photos && featured[1].photos[0]) || ""} alt={featured[1].name} className="absolute inset-0 h-full w-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <span className="relative z-10 text-[9px] font-black text-amber-400">Square 1</span>
                  <h4 className="relative z-10 text-[11px] font-black text-white line-clamp-1">{featured[1].name}</h4>
                  <span className="relative z-10 text-[10.5px] font-bold text-slate-200">{formatMoney(featured[1].price_cents, featured[1].currency)}</span>
                </div>
              )}
              {featured[2] && (
                <div className="col-span-1 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-300 bg-slate-900 text-white shadow-md h-[140px] p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured[2].photo_url || (featured[2].photos && featured[2].photos[0]) || ""} alt={featured[2].name} className="absolute inset-0 h-full w-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <span className="relative z-10 text-[9px] font-black text-amber-400">Square 2</span>
                  <h4 className="relative z-10 text-[11px] font-black text-white line-clamp-1">{featured[2].name}</h4>
                  <span className="relative z-10 text-[10.5px] font-bold text-slate-200">{formatMoney(featured[2].price_cents, featured[2].currency)}</span>
                </div>
              )}
              {featured[3] && (
                <div className="col-span-2 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-300 bg-slate-900 text-white shadow-md h-[140px] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured[3].photo_url || (featured[3].photos && featured[3].photos[0]) || ""} alt={featured[3].name} className="absolute inset-0 h-full w-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <span className="relative z-10 text-[9.5px] font-black text-amber-400">🏎️ Rectangle Wide 2</span>
                  <h4 className="relative z-10 text-xs font-black text-white">{featured[3].name}</h4>
                  <span className="relative z-10 text-xs font-bold text-slate-200">{formatMoney(featured[3].price_cents, featured[3].currency)}</span>
                </div>
              )}
            </div>
          ) : vertical.id === "immobilier" && business.layout === "design2" ? (
            /* IMMOBILIER DESIGN #2 (PDF): 2 Square cards top + 1 FULL-WIDTH Wide card bottom */
            <div className="mt-3 grid grid-cols-2 gap-3 px-4">
              {featured.slice(0, 2).map((p, idx) => (
                <div key={p.id} className="col-span-1 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-300 bg-slate-900 text-white shadow-md h-[150px] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo_url || (p.photos && p.photos[0]) || ""} alt={p.name} className="absolute inset-0 h-full w-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <span className="relative z-10 text-[9.5px] font-black text-emerald-400">Propriété #{idx + 1}</span>
                  <h4 className="relative z-10 text-xs font-black text-white line-clamp-1">{p.name}</h4>
                  <span className="relative z-10 text-xs font-bold text-slate-200">{formatMoney(p.price_cents, p.currency)}</span>
                </div>
              ))}
              {featured[2] && (
                <div className="col-span-2 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-emerald-400 bg-slate-900 text-white shadow-md h-[160px] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured[2].photo_url || (featured[2].photos && featured[2].photos[0]) || ""} alt={featured[2].name} className="absolute inset-0 h-full w-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <span className="relative z-10 text-[10px] font-black text-emerald-300">🏢 PROPRIÉTÉ BANNER FULL-WIDTH</span>
                  <h4 className="relative z-10 text-sm font-black text-white">{featured[2].name}</h4>
                  <div className="relative z-10 flex items-center justify-between mt-1">
                    <span className="text-sm font-black text-emerald-200">{formatMoney(featured[2].price_cents, featured[2].currency)}</span>
                    <button className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-xs">📅 Planifier une Visite</button>
                  </div>
                </div>
              )}
            </div>
          ) : vertical.id === "commerce_vente" ? (
            business.layout === "design2" ? (
              /* COMMERCE DESIGN 2 : 4 Rectangles Égaux */
              <div className="mt-3 grid grid-cols-2 gap-4 px-4 sm:grid-cols-4">
                {featured.map((p) => (
                  <GridCard key={p.id} p={p} qty={cart[p.id] ?? 0} add={add} sub={sub} darkMode={darkMode} onZoom={(photos, idx) => setLightbox({ photos, index: idx })} />
                ))}
              </div>
            ) : (
              /* COMMERCE DESIGN 1 : 1 Gros Left + 2 Petits Right */
              <FashionHeroGrid featured={featured} cart={cart} add={add} sub={sub} darkMode={darkMode} onZoom={(photos, idx) => setLightbox({ photos, index: idx })} />
            )
          ) : (
            business.layout === "design2" ? (
              /* TOUS AUTRES SECTEURS DESIGN 2 */
              <div className="mt-3 grid grid-cols-1 gap-3 px-4 sm:grid-cols-2">
                {featured.map((p) => (
                  <DenseMarketplaceCard key={p.id} p={p} qty={cart[p.id] ?? 0} add={add} sub={sub} darkMode={darkMode} />
                ))}
              </div>
            ) : (
              /* TOUS AUTRES SECTEURS DESIGN 1 */
              <div className="mt-3 grid grid-cols-2 gap-4 px-4 sm:grid-cols-4">
                {featured.map((p) => (
                  <GridCard key={p.id} p={p} qty={cart[p.id] ?? 0} add={add} sub={sub} darkMode={darkMode} onZoom={(photos, idx) => setLightbox({ photos, index: idx })} />
                ))}
              </div>
            )
          )}

          {/* Voir tout le catalogue */}
          <div className="px-4 pt-5">
            <Link
              href={`/b/${business.slug}/katalog`}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl active:scale-[0.99]"
              style={{ background: theme.accentSoft, color: theme.accentText }}
            >
              <span className="text-sm font-bold">Wè tout {vertical.catalogWord.toLowerCase()} la ({products.length})</span>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={theme.accentText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Header compact (catalogue complet) */}
          <header className="sticky top-0 z-10 flex flex-col gap-3 px-4 pb-3 pt-5" style={{ background: theme.accent }}>
            <div className="flex items-center gap-3">
              <Link href={`/b/${business.slug}`} aria-label="Retounen">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </Link>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white">{vertical.catalogWord}</span>
                <span className="text-[11.5px] text-[#B9F5E4]">{business.name}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInStockOnly((v) => !v)}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${inStockOnly ? "bg-white text-brand" : "bg-white/15 text-[#EAFBF4]"}`}
                >
                  En stòk sèlman
                </button>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold text-white outline-none"
                >
                  <option value="popile" className="text-ink">Pi popilè</option>
                  <option value="pri_ba" className="text-ink">Pri: ba → wo</option>
                  <option value="pri_wo" className="text-ink">Pri: wo → ba</option>
                </select>
              </div>

              {/* Toggle Grille (450×750) vs Liste */}
              <div className="flex items-center gap-1 rounded-xl bg-black/25 p-1 border border-white/20">
                <button
                  onClick={() => setCatalogViewMode("grid")}
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    catalogViewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  📱 Grille (450×750)
                </button>
                <button
                  onClick={() => setCatalogViewMode("list")}
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    catalogViewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  📋 Liste
                </button>
              </div>
            </div>
          </header>

          {/* Groupes par catégorie */}
          <div className="flex flex-col gap-5 pt-4">
            {grouped.map(([cat, items]) => (
              <section key={cat}>
                <h2 className="px-4 pb-2 text-[15px] font-extrabold">{cat}</h2>
                {catalogViewMode === "list" ? (
                  <div>{items.map((p) => <MenuRow key={p.id} p={p} qty={cart[p.id] ?? 0} add={add} sub={sub} darkMode={darkMode} />)}</div>
                ) : vertical.id === "restauration" ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-4 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((p) => (
                      <RestaurantLargeFoodGridCard
                        key={p.id}
                        p={p}
                        qty={cart[p.id] ?? 0}
                        add={add}
                        sub={sub}
                        darkMode={darkMode}
                        onZoom={(photos, idx) => setLightbox({ photos, index: idx })}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-4 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((p) => (
                      <GridCard key={p.id} p={p} qty={cart[p.id] ?? 0} add={add} sub={sub} darkMode={darkMode} onZoom={(photos, idx) => setLightbox({ photos, index: idx })} />
                    ))}
                  </div>
                )}
              </section>
            ))}
            {grouped.length === 0 && (
              <p className="px-6 pt-16 text-center text-sm text-ink-faint">Pa gen pwodwi.</p>
            )}
          </div>
        </>
      )}

      {/* Bouton de Commande principal situé à la FIN de la page pour ne pas obstruer les cartes */}
      <div className="mx-auto max-w-xl md:max-w-2xl px-4 pt-10 pb-8">
        {count > 0 ? (
          <button onClick={() => setCheckoutOpen(true)} className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-green shadow-[0_6px_20px_rgba(37,211,102,0.4)] active:scale-[0.99] cursor-pointer">
            <WaIcon />
            <span className="text-[16.5px] font-extrabold text-white">Kòmande {count} atik · {formatMoney(totalCents)}</span>
          </button>
        ) : (
          <a href={orderHref} target="_blank" rel="noopener noreferrer" className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-green shadow-[0_6px_20px_rgba(37,211,102,0.4)] active:scale-[0.99]">
            <WaIcon />
            <span className="text-[16.5px] font-extrabold text-white">Kòmande sou WhatsApp</span>
          </a>
        )}
      </div>

      {/* Modal de Vérification et Confirmation de Commande */}
      {checkoutOpen && count > 0 && (
        <div className="fixed inset-0 z-40 mx-auto flex max-w-xl md:max-w-2xl flex-col justify-end backdrop-blur-xs">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCheckoutOpen(false)} />
          <div className={`relative rounded-t-[28px] px-5 pb-8 pt-4 shadow-2xl transition-colors ${darkMode ? "bg-[#1F2937] text-white border-t border-slate-700" : "bg-white text-ink border-t border-line"}`}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔎</span>
                <div>
                  <h2 className="text-base font-black">Verifye e Konfime Kòmand Ou</h2>
                  <p className="text-[11px] text-slate-400">Tcheke atik yo anvan ou voye kòmand la sou WhatsApp</p>
                </div>
              </div>
              <button onClick={() => setCheckoutOpen(false)} className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-xs font-bold text-slate-500 cursor-pointer">✕</button>
            </div>

            {/* Table Badge si sur place */}
            {tableNum && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs font-bold text-amber-500">
                <span>📍 Restoran Sur Place (Dine-In)</span>
                <span className="rounded-md bg-amber-500 text-slate-950 px-2 py-0.5 font-black uppercase text-[10px]">Table #{tableNum}</span>
              </div>
            )}

            {/* Liste des plats avec visuels */}
            <div className="mt-3 flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
              {lines.map((l, i) => {
                const prod = products.find((p) => p.name === l.name);
                const photo = prod ? getFoodPhotoFallback(prod) : null;
                return (
                  <div key={i} className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {photo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={photo} alt={l.name} className="h-10 w-10 rounded-lg object-cover border border-slate-300 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-extrabold block truncate">{l.qty}× {l.name}</span>
                        {l.unit && <span className="text-[10px] text-slate-400">{l.unit}</span>}
                      </div>
                    </div>
                    <span className="font-black text-emerald-500 shrink-0">{formatMoney(Math.round(l.unitPriceCents * l.qty))}</span>
                  </div>
                );
              })}
            </div>

            {/* Coordonnées facultatives : elles créent la fiche client chez le
                marchand, ce qui rend possibles la relance et le suivi de dette. */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-bold text-slate-400">Non ou (opsyonèl)</span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Wideline Pierre"
                  autoComplete="name"
                  className={`h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none focus:border-brand ${
                    darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-line bg-slate-50 text-ink"
                  }`}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-bold text-slate-400">WhatsApp ou (opsyonèl)</span>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="3712 4488"
                  inputMode="tel"
                  autoComplete="tel"
                  className={`h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none focus:border-brand ${
                    darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-line bg-slate-50 text-ink"
                  }`}
                />
              </label>
            </div>

            {/* Note / Remarques du client */}
            <div className="mt-3">
              <label className="text-[11.5px] font-bold text-slate-400 block mb-1">
                Remarques particulières (ex: sans piment, bien cuit, glaçons...) :
              </label>
              <input
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Ajoute yon nòt pou kizin lan..."
                className={`h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none focus:border-brand ${
                  darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-line bg-slate-50 text-ink"
                }`}
              />
            </div>

            {!tableNum && (
              <label className="mt-3 flex flex-col gap-1">
                <span className="text-[11.5px] font-bold text-slate-400">Kote pou livre?</span>
                <select value={zoneIdx} onChange={(e) => setZoneIdx(Number(e.target.value))} className={`h-10 rounded-xl border px-3 text-xs font-bold outline-none ${
                  darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-line bg-slate-50 text-ink"
                }`}>
                  {zones.map((z, i) => (
                    <option key={i} value={i}>{z.name}{z.fee_cents > 0 ? ` — ${formatMoney(z.fee_cents)}` : " — gratis"}</option>
                  ))}
                </select>
              </label>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
              <span className="text-xs font-bold text-slate-400">Total à payer</span>
              <span className="text-lg font-black text-emerald-500">{formatMoney(grandTotalCents)}</span>
            </div>

            <a
              href={orderHref + (customerNote ? encodeURIComponent(`\nNòt: ${customerNote}`) : "")}
              onClick={handleSendOrder}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-13 items-center justify-center gap-2 rounded-2xl bg-brand-green text-white shadow-lg active:scale-[0.99] cursor-pointer"
            >
              <WaIcon />
              <span className="text-sm font-black">✅ Konfime e Voye kòmand sou WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Modal Lightbox Zoom Plein Écran */}
      {lightbox && lightbox.photos.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold text-white/80">
              Foto {lightbox.index + 1} / {lightbox.photos.length}
            </span>
            <button
              onClick={() => setLightbox(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              ✕
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.photos[lightbox.index]}
              alt="Agrandissement"
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl transition-all"
            />
            {lightbox.photos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index - 1 + prev.photos.length) % prev.photos.length,
                          }
                        : null
                    )
                  }
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-xl text-white backdrop-blur"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setLightbox((prev) =>
                      prev
                        ? { ...prev, index: (prev.index + 1) % prev.photos.length }
                        : null
                    )
                  }
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-xl text-white backdrop-blur"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Rendu produit --- */
function priceLabel(p: Product) {
  return (
    <span className="text-base font-extrabold">
      {formatMoney(p.price_cents, p.currency).replace(` ${p.currency}`, "")}{" "}
      <span className="text-[11px] font-semibold text-ink-faint">{p.currency}</span>
    </span>
  );
}

function qtyControl(qty: number, onAdd: () => void, onSub: () => void) {
  if (qty === 0) {
    return (
      <button onClick={onAdd} className="flex h-9 items-center justify-center gap-1.5 rounded-[11px] bg-[#E7F7F1] px-3 text-brand active:scale-95">
        <PlusIcon /><span className="text-[12.5px] font-bold">Ajoute</span>
      </button>
    );
  }
  return (
    <div className="flex h-9 items-center gap-2 rounded-[11px] bg-[#E7F7F1] px-2">
      <button onClick={onSub} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand">−</button>
      <span className="min-w-4 text-center text-sm font-extrabold text-brand">{qty}</span>
      <button onClick={onAdd} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand">+</button>
    </div>
  );
}

function GridCard({
  p,
  qty,
  add,
  sub,
  darkMode,
  onZoom,
}: {
  p: Product;
  qty: number;
  add: (id: string) => void;
  sub: (id: string) => void;
  darkMode?: boolean;
  onZoom: (photos: string[], index: number) => void;
}) {
  const soldOut = p.stock_state === "fini";
  const allPhotos = p.photos && p.photos.length > 0 ? p.photos : p.photo_url ? [p.photo_url] : [];
  const [imgIdx, setImgIdx] = useState(0);

  // Enregistrement du glissement (souris & toucher)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  function handleStart(clientX: number) {
    setTouchStartX(clientX);
  }

  function handleEnd(clientX: number) {
    if (touchStartX === null) return;
    const deltaX = touchStartX - clientX;
    setTouchStartX(null);

    if (deltaX > 30 && allPhotos.length > 1) {
      // Glissement vers la gauche -> image suivante
      setImgIdx((prev) => (prev + 1) % allPhotos.length);
    } else if (deltaX < -30 && allPhotos.length > 1) {
      // Glissement vers la droite -> image précédente
      setImgIdx((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    } else if (Math.abs(deltaX) <= 5 && allPhotos.length > 0) {
      // Clic simple -> ouvrir le zoom plein écran
      onZoom(allPhotos, imgIdx);
    }
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(17,27,33,0.06)] ring-1 transition-colors ${darkMode ? "bg-[#1F2937] text-white ring-gray-700" : "bg-white text-ink ring-line"}`}>
      {/* Conteneur d'image à DIMENSION UNIFORME STRICTE 450x750 (ratio 3:5) */}
      <div
        className={`relative flex aspect-[3/5] max-h-[300px] w-full items-center justify-center select-none cursor-grab active:cursor-grabbing ${darkMode ? "bg-[#111827]" : "bg-[#F7F8F9]"}`}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseUp={(e) => handleEnd(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
      >
        {allPhotos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={allPhotos[imgIdx]}
            alt={p.name}
            draggable={false}
            className="h-full w-full object-cover transition-opacity duration-200 pointer-events-none"
          />
        ) : (
          <BagIcon />
        )}

        {/* Badges d'état */}
        {p.sold_count > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-brand shadow-sm">
            {p.sold_count} vann
          </span>
        )}
        {soldOut && (
          <span className="absolute right-2 top-2 rounded-full bg-[#FCE4E4] px-2 py-0.5 text-[10px] font-bold text-[#C0392B]">
            Fini
          </span>
        )}

        {/* Bouton Zoom Lightbox */}
        {allPhotos.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onZoom(allPhotos, imgIdx);
            }}
            aria-label="Agrandir"
            className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur active:scale-95 z-10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m15 15 6 6m-6-6a7 7 0 1 0-10-10 7 7 0 0 0 10 10z" />
            </svg>
          </button>
        )}

        {/* Flèches & Carrousel Slide Interne */}
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImgIdx((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
              }}
              className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-sm font-bold text-ink shadow active:scale-90 z-10"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImgIdx((prev) => (prev + 1) % allPhotos.length);
              }}
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-sm font-bold text-ink shadow active:scale-90 z-10"
            >
              ›
            </button>

            {/* Puces de pagination carrousel */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
              {allPhotos.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === imgIdx ? "w-4 bg-brand" : "w-1.5 bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3 flex-1 justify-between">
        <div>
          <span className="text-[13.5px] font-semibold line-clamp-1">{p.name}</span>
          <div className="mt-0.5">{priceLabel(p)}</div>
        </div>
        <div className="mt-2">
          {soldOut ? (
            <span className="text-[12px] text-ink-faint">Pa disponib</span>
          ) : (
            qtyControl(qty, () => add(p.id), () => sub(p.id))
          )}
        </div>
      </div>
    </div>
  );
}

function getFoodPhotoFallback(p: Product): string {
  if (p.photo_url) return p.photo_url;
  if (p.photos && p.photos.length > 0 && p.photos[0]) return p.photos[0];

  const name = p.name.toLowerCase();
  const cat = (p.category ?? "").toLowerCase();

  if (name.includes("biere") || name.includes("prestige") || name.includes("jus") || name.includes("boisson") || name.includes("cocktail") || cat.includes("boisson")) {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80";
  }
  if (name.includes("pizza") || cat.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80";
  }
  if (name.includes("burger") || name.includes("sandwich")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80";
  }
  if (name.includes("dessert") || name.includes("gâteau") || name.includes("glace") || cat.includes("dessert")) {
    return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80";
}

function MenuRow({
  p,
  qty,
  add,
  sub,
  darkMode,
}: {
  p: Product;
  qty: number;
  add: (id: string) => void;
  sub: (id: string) => void;
  darkMode?: boolean;
}) {
  const soldOut = p.stock_state === "fini";
  const photo = getFoodPhotoFallback(p);

  return (
    <div key={p.id} className={`flex items-center gap-3 border-b px-4 py-3 transition-colors ${darkMode ? "border-gray-800 bg-[#111827]" : "border-[#F2F4F5] bg-white"}`}>
      {/* High Quality Food Photo Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-line bg-amber-50 shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
        {p.category && (
          <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-black/65 px-1 text-[9px] font-extrabold text-white text-center backdrop-blur-xs">
            {p.category}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-black leading-snug line-clamp-1">{p.name}</span>
        <div className="flex items-center gap-2">
          {priceLabel(p)}
          {p.sold_count > 0 && <span className="text-[11px] text-ink-faint">· {p.sold_count} ordonnés</span>}
        </div>
      </div>
      {soldOut ? <span className="text-[12px] text-ink-faint font-bold">Fini</span> : qtyControl(qty, () => add(p.id), () => sub(p.id))}
    </div>
  );
}

function RestaurantLargeFoodGridCard({
  p,
  qty,
  add,
  sub,
  darkMode,
  onZoom,
}: {
  p: Product;
  qty: number;
  add: (id: string) => void;
  sub: (id: string) => void;
  darkMode?: boolean;
  onZoom: (photos: string[], index: number) => void;
}) {
  const photo = getFoodPhotoFallback(p);
  const soldOut = p.stock_state === "fini";

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border shadow-md transition-all hover:shadow-xl ${
      darkMode ? "bg-[#1E293B] text-white border-slate-700" : "bg-white text-ink border-slate-200"
    }`}>
      {/* Conteneur d'image au ratio strict 2L x 2.5H (aspect 4/5) pour voir TOUT le plat et TOUT le verre */}
      <div className={`relative aspect-[4/5] w-full overflow-hidden select-none flex items-center justify-center p-1.5 sm:p-2.5 ${
        darkMode ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" : "bg-gradient-to-b from-slate-100 via-amber-50/50 to-slate-100"
      }`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={p.name}
          className="h-full w-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Category & Status Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1 z-10">
          {p.category && (
            <span className="rounded-full bg-amber-500 text-slate-950 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase shadow-sm truncate max-w-[90px] sm:max-w-[120px]">
              {p.category}
            </span>
          )}
          {p.sold_count > 0 && (
            <span className="hidden sm:inline-block rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[9px] sm:text-[9.5px] font-black shadow-sm">
              🔥 Best-seller
            </span>
          )}
        </div>

        {/* Zoom Lightbox Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoom([photo], 0);
          }}
          className="absolute right-2 bottom-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition-all z-10 cursor-pointer text-xs"
          title="Agrandir l'image"
        >
          🔍
        </button>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3.5 justify-between gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-black leading-tight line-clamp-1">{p.name}</h3>
          {p.unit && <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-0.5 line-clamp-1">{p.unit}</span>}
          <div className="mt-1 text-xs sm:text-sm font-extrabold text-amber-500 dark:text-amber-400">
            {priceLabel(p)}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {soldOut ? (
            <span className="text-[11px] sm:text-xs font-bold text-rose-500 block text-center py-1">Stock Épuisé</span>
          ) : (
            qtyControl(qty, () => add(p.id), () => sub(p.id))
          )}
        </div>
      </div>
    </div>
  );
}

function socialLinks(b: Business, dark?: boolean) {
  return [
    { url: b.social_instagram, icon: <InstagramIcon dark={dark} /> },
    { url: b.social_facebook, icon: <FacebookIcon dark={dark} /> },
    { url: b.social_tiktok, icon: <TiktokIcon dark={dark} /> },
  ].filter((s): s is { url: string; icon: JSX.Element } => !!s.url);
}

/* --- Icônes --- */
function WaIcon() {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20z" /></svg>;
}
function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function BagIcon() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B7791F" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
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
function InstagramIcon({ dark }: { dark?: boolean }) {
  const color = dark ? "#FFFFFF" : "#111B21";
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill={color} stroke="none" /></svg>;
}

/* --- Rendu Spécifique aux Secteurs (Cercle pour Restaurant & Hero Grid pour Vêtements) --- */
function CircleGridCard({
  p,
  qty,
  add,
  sub,
  darkMode,
}: {
  p: Product;
  qty: number;
  add: (id: string) => void;
  sub: (id: string) => void;
  darkMode?: boolean;
}) {
  const photo = p.photo_url || (p.photos && p.photos[0]) || "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80";
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center border shadow-2xs transition-all ${darkMode ? "bg-[#1F2937] text-white border-gray-700" : "bg-amber-50/40 text-ink border-amber-200"}`}>
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-amber-400 shadow-md transition-transform hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={p.name} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col items-center gap-1 w-full">
        {p.category && <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">{p.category}</span>}
        <h4 className="text-xs font-black line-clamp-1">{p.name}</h4>
        <div className="text-xs font-black text-amber-900">{priceLabel(p)}</div>
        <div className="mt-1.5 w-full">
          {qtyControl(qty, () => add(p.id), () => sub(p.id))}
        </div>
      </div>
    </div>
  );
}

function FashionHeroGrid({
  featured,
  cart,
  add,
  sub,
  darkMode,
  onZoom,
}: {
  featured: Product[];
  cart: Record<string, number>;
  add: (id: string) => void;
  sub: (id: string) => void;
  darkMode?: boolean;
  onZoom: (photos: string[], index: number) => void;
}) {
  if (featured.length === 0) return null;
  const heroLeft = featured[0];
  const rightSmall = featured.slice(1, 3);

  return (
    <div className="flex flex-col gap-3.5 px-4 pt-3">
      {/* Sur mobile : 1 Rectangle en haut + 2 cartes verticales côte-à-côte en bas (Grid 2 cols) */}
      {/* Sur grand écran : 1 Gros rectangle à gauche (2 cols) + 2 cartes empilées à droite (1 col) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {heroLeft && (
          <div className="md:col-span-2 relative flex flex-col justify-end overflow-hidden rounded-2xl border border-emerald-300 bg-slate-900 shadow-md h-[210px] md:h-[330px] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroLeft.photo_url || (heroLeft.photos && heroLeft.photos[0]) || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80"}
              alt={heroLeft.name}
              className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <span className="absolute top-3 left-3 rounded-md bg-emerald-600 px-2.5 py-1 text-[10.5px] font-black text-white shadow-xs">
              ⭐ VÊTEMENTS HÉROS (GROS RECTANGLE GAUCHE)
            </span>
            <div className="relative p-3.5 md:p-4 text-white z-10">
              {heroLeft.category && <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">{heroLeft.category}</span>}
              <h4 className="text-sm md:text-base font-black text-white line-clamp-1">{heroLeft.name}</h4>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs md:text-sm font-black text-emerald-200">{formatMoney(heroLeft.price_cents, heroLeft.currency)}</span>
                {qtyControl(cart[heroLeft.id] ?? 0, () => add(heroLeft.id), () => sub(heroLeft.id))}
              </div>
            </div>
          </div>
        )}

        {/* En bas sur mobile: 2 cartes verticales côte-à-côte (grid-cols-2), empilées sur grand écran (md:grid-cols-1) */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3.5 md:col-span-1">
          {rightSmall.map((p, idx) => (
            <div key={p.id} className="relative flex flex-col justify-end overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-sm h-[210px] md:h-[158px] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.photo_url || (p.photos && p.photos[0]) || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"}
                alt={p.name}
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
              <span className="absolute top-2 left-2 rounded-md bg-emerald-100 px-2 py-0.5 text-[9.5px] font-black text-emerald-900 border border-emerald-300/60">
                Petit Rectangle {idx + 1}
              </span>
              <div className="relative p-3 text-slate-900 z-10">
                <h5 className="text-xs font-extrabold line-clamp-1">{p.name}</h5>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11.5px] font-black text-emerald-700">{formatMoney(p.price_cents, p.currency)}</span>
                  {qtyControl(cart[p.id] ?? 0, () => add(p.id), () => sub(p.id))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function RestaurantMenuCardRow({
  p,
  qty,
  add,
  sub,
  darkMode,
}: {
  p: Product;
  qty: number;
  add: (id: string) => void;
  sub: (id: string) => void;
  darkMode?: boolean;
}) {
  const photo = p.photo_url || (p.photos && p.photos[0]) || "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80";
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3 border shadow-2xs transition-all ${darkMode ? "bg-[#1F2937] text-white border-gray-700" : "bg-white text-ink border-amber-200"}`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-amber-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={p.name} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black">{p.name}</h4>
          {p.category && <span className="rounded bg-amber-100 px-2 py-0.5 text-[9.5px] font-black text-amber-900">{p.category}</span>}
        </div>
        <span className="text-[10px] text-slate-500">Prepare sou kòmand · Livrezon an gwo</span>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-black text-brand">{priceLabel(p)}</span>
          {qtyControl(qty, () => add(p.id), () => sub(p.id))}
        </div>
      </div>
    </div>
  );
}

function DenseMarketplaceCard({
  p,
  qty,
  add,
  sub,
  darkMode,
}: {
  p: Product;
  qty: number;
  add: (id: string) => void;
  sub: (id: string) => void;
  darkMode?: boolean;
}) {
  const photo = p.photo_url || (p.photos && p.photos[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80";
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3 border shadow-sm transition-all ${darkMode ? "bg-[#1F2937] text-white border-slate-700" : "bg-white text-slate-900 border-slate-200/90 shadow-xs hover:border-emerald-500/40"}`}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={p.name} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h4 className={`text-xs font-black line-clamp-1 ${darkMode ? "text-white" : "text-slate-900"}`}>{p.name}</h4>
        <span className={`text-xs font-black ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>{priceLabel(p)}</span>
        <div className="mt-0.5">
          {qtyControl(qty, () => add(p.id), () => sub(p.id))}
        </div>
      </div>
    </div>
  );
}

function FacebookIcon({ dark }: { dark?: boolean }) {
  const color = dark ? "#FFFFFF" : "#111B21";
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={color} stroke="none"><path d="M14 9h3V6h-3c-2.2 0-3.5 1.4-3.5 3.6V11H8v3h2.5v6H14v-6h2.4l.6-3H14V9.8c0-.6.3-.8.9-.8z" /></svg>;
}
function TiktokIcon({ dark }: { dark?: boolean }) {
  const color = dark ? "#FFFFFF" : "#111B21";
  return <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke="none"><path d="M16 3c.3 2 1.6 3.6 3.6 3.9v2.8c-1.3.1-2.6-.3-3.6-1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.9a2.7 2.7 0 1 0 1.9 2.6V3z" /></svg>;
}

function Design3VipShowcase({
  featured,
  cart,
  add,
  sub,
  darkMode,
}: {
  featured: Product[];
  cart: Record<string, number>;
  add: (id: string) => void;
  sub: (id: string) => void;
  darkMode?: boolean;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
      {featured.map((p, idx) => {
        const photo = p.photo_url || (p.photos && p.photos[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80";
        const qty = cart[p.id] ?? 0;
        return (
          <div
            key={p.id}
            className={`group relative flex flex-col overflow-hidden rounded-3xl border shadow-xl transition-all ${
              darkMode ? "bg-[#1E1B4B] text-white border-purple-800" : "bg-gradient-to-b from-slate-900 to-indigo-950 text-white border-purple-900"
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <span className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-[10.5px] font-black text-amber-950 shadow-md">
                👑 VIP #{idx + 1}
              </span>
              {p.category && (
                <span className="absolute top-3 right-3 rounded-full bg-purple-950/80 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-extrabold text-purple-200 border border-purple-400/40">
                  {p.category}
                </span>
              )}
            </div>
            <div className="p-4 flex flex-col gap-1.5 relative z-10">
              <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">{p.name}</h4>
              <p className="text-[11.5px] text-purple-200/80 font-medium line-clamp-1">✨ Garanti de Qualité Premium CONVERZA</p>
              <div className="mt-2 flex items-center justify-between pt-2 border-t border-purple-800/50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prix VIP</span>
                  <span className="text-base font-black text-amber-300">{priceLabel(p)}</span>
                </div>
                {qtyControl(qty, () => add(p.id), () => sub(p.id))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
