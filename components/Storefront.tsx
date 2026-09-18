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
import { storefrontCopy, type StorefrontCopy } from "@/lib/i18n/storefront";

import { useTheme } from "@/components/ThemeProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageContext";

type View = "vitrine" | "full";
type CartOps = { add: (id: string) => void; sub: (id: string) => void };

// Vitrine publique du marchand, vue par ses clients.
//
// Deux règles tiennent toute la page. Tout texte d'interface passe par le
// dictionnaire, pour que le sélecteur de langue fasse vraiment quelque chose.
// Et on n'affiche jamais une image qui n'est pas celle du marchand : un
// produit sans photo montre un emplacement neutre, pas une photo de banque
// d'images qui laisserait croire à un autre article.

function useCopy(): StorefrontCopy {
  const { language } = useLanguage();
  return storefrontCopy(language);
}

function photosOf(p: Product): string[] {
  if (p.photos && p.photos.length > 0) return p.photos.filter(Boolean);
  return p.photo_url ? [p.photo_url] : [];
}

export function Storefront({
  business,
  products,
  view = "vitrine",
}: {
  business: Business;
  products: Product[];
  view?: View;
}) {
  const c = useCopy();
  const vertical = verticalOf(business.business_type);
  const sector = c.sectors[vertical.id] ?? { label: vertical.label, catalog: vertical.catalogWord };
  const theme = themeOf(business.theme);
  const { theme: globalTheme, toggleTheme } = useTheme();
  const darkMode = globalTheme === "dark";
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [promoSlideIdx, setPromoSlideIdx] = useState(0);

  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<"popular" | "price_up" | "price_down">("popular");
  const [catalogViewMode, setCatalogViewMode] = useState<"grid" | "list">("grid");

  const add = (id: string) => setCart((cur) => ({ ...cur, [id]: (cur[id] ?? 0) + 1 }));
  const sub = (id: string) =>
    setCart((cur) => {
      const q = (cur[id] ?? 0) - 1;
      const next = { ...cur };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  const ops: CartOps = { add, sub };

  const lines: CartLine[] = useMemo(
    () =>
      products
        .filter((p) => cart[p.id])
        .map((p) => ({ name: p.name, unit: p.unit, qty: cart[p.id], unitPriceCents: p.price_cents })),
    [cart, products],
  );
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const totalCents = lines.reduce((a, l) => a + Math.round(l.unitPriceCents * l.qty), 0);

  // La première option est le retrait en boutique. Son libellé est traduit,
  // mais on n'envoie pas ce libellé au serveur : il ne correspond à aucune zone
  // enregistrée par le marchand.
  const zones = [{ name: c.pickup, fee_cents: 0 }, ...(business.delivery_zones ?? [])];
  const zone = zones[zoneIdx] ?? zones[0];
  const isPickup = zoneIdx === 0;

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
    if (tableNum) return { name: c.message.table(tableNum), feeCents: 0 };
    return { name: zone.name, feeCents: zone.fee_cents };
  }, [tableNum, zone, c]);

  const grandTotalCents = totalCents + deliveryOption.feeCents;

  const baseMessage = count
    ? buildOrderMessage(business.name, lines, {
        currency: business.default_currency,
        delivery: deliveryOption,
        labels: { greeting: c.message.greeting, delivery: c.message.delivery, total: c.message.total },
      })
    : c.message.interested(business.name);

  const extra = [
    source ? c.message.source(source) : null,
    customerNote.trim() ? `${c.message.note}: ${customerNote.trim()}` : null,
  ].filter(Boolean);
  const message = [baseMessage, ...extra].join("\n");
  const orderHref = waMeLink(business.phone_e164 ?? "", message);

  const handleSendOrder = async () => {
    if (count === 0) return;
    try {
      // On n'envoie que des identifiants et des quantités : le serveur relit
      // les prix et les frais de livraison en base.
      await createStorefrontOrderAction({
        businessId: business.id,
        items: Object.entries(cart).map(([productId, qty]) => ({ productId, qty })),
        tableNum,
        deliveryZoneName: isPickup ? null : zone.name,
        note: customerNote.trim() || null,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        source,
      });
    } catch (err) {
      console.error("Order record error:", err);
    }
  };

  const isPromo = (p: Product) => p.category === "Pwomosyon" || p.id.startsWith("promo-");

  const featured = useMemo(() => {
    const promo = products.filter(isPromo);
    const rest = products.filter((p) => !isPromo(p)).sort((a, b) => b.sold_count - a.sold_count);
    return [...promo, ...rest].slice(0, 8);
  }, [products]);

  const activePromoProducts = useMemo(() => products.filter(isPromo), [products]);

  useEffect(() => {
    if (activePromoProducts.length <= 1) return;
    const timer = setInterval(() => setPromoSlideIdx((prev) => (prev + 1) % activePromoProducts.length), 4000);
    return () => clearInterval(timer);
  }, [activePromoProducts.length]);

  const grouped = useMemo(() => {
    let list = [...products];
    if (inStockOnly) list = list.filter((p) => p.stock_state !== "fini");
    if (sort === "price_up") list.sort((a, b) => a.price_cents - b.price_cents);
    else if (sort === "price_down") list.sort((a, b) => b.price_cents - a.price_cents);
    else list.sort((a, b) => b.sold_count - a.sold_count);

    const map = new Map<string, Product[]>();
    for (const p of list) {
      const cat = p.category || "—";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
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

  const openZoom = (photos: string[], index: number) => setLightbox({ photos, index });
  const visitHref = (p: Product) =>
    waMeLink(business.phone_e164 ?? "", `${c.message.interested(business.name)}\n${c.scheduleVisit}: ${p.name}`);

  const fieldCls = `h-11 w-full rounded-xl border px-3 text-[13px] font-medium outline-none focus:border-brand ${
    darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-line bg-slate-50 text-ink"
  }`;

  return (
    <div className={`relative min-h-[100dvh] pb-16 md:mx-auto md:my-6 md:max-w-5xl md:rounded-3xl md:shadow-[0_4px_24px_rgba(0,0,0,0.08)] md:ring-1 lg:max-w-6xl overflow-hidden transition-colors duration-300 ${darkMode ? "bg-[#111827] text-white md:ring-gray-800" : "bg-white text-ink md:ring-line"}`}>
      {view === "vitrine" ? (
        <>
          {/* Bannière */}
          <div
            className="relative h-[220px] transition-all sm:h-[280px] md:h-[340px] lg:h-[380px]"
            style={{ background: business.cover_url ? `center / cover no-repeat url(${business.cover_url})` : theme.cover }}
          >
            <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
              <LanguageToggle variant="compact" />
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-transform active:scale-90"
                title={darkMode ? c.lightMode : c.darkMode}
                aria-label={darkMode ? c.lightMode : c.darkMode}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>

          {/* Logo : celui du marchand, sinon ses initiales */}
          <div className="relative z-10 -mt-14 flex justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-white shadow-[0_8px_24px_rgba(17,27,33,0.18)]">
              <div className="flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-[26px]" style={{ background: theme.cover }}>
                {business.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logo_url} alt={business.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[30px] font-extrabold tracking-tight text-white">{initialsOf(business.name)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Identité */}
          <div className="flex flex-col items-center gap-1.5 px-6 pt-3.5 text-center">
            <h1 className="text-2xl font-extrabold -tracking-[0.4px]">{business.name}</h1>
            <span className={`text-[13.5px] font-medium ${darkMode ? "text-slate-400" : "text-ink-muted"}`}>
              {sector.label}
              {business.address ? ` · ${business.address}` : ""}
            </span>
            {business.hours && (
              <div className="mt-1 flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: theme.accentSoft }}>
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                <span className="text-xs font-bold" style={{ color: theme.accentText }}>{c.open} · {business.hours}</span>
              </div>
            )}
            {socialLinks(business, darkMode).length > 0 && (
              <div className="mt-3 flex gap-2.5">
                {socialLinks(business, darkMode).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                    className={`flex h-11 w-11 items-center justify-center rounded-[13px] border transition-colors active:scale-95 ${darkMode ? "border-gray-700 bg-gray-800 text-white" : "border-line bg-white text-ink"}`}>
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Promotions */}
          {(business.promo_text || activePromoProducts.length > 0) && (
            <div className={`mx-4 mt-5 flex flex-col gap-3 rounded-2xl border p-4 ${darkMode ? "border-amber-500/30 bg-amber-500/10" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide ${darkMode ? "text-amber-300" : "text-amber-900"}`}>
                  <FlameIcon />
                  {c.promoActive}
                  {activePromoProducts.length > 1 && (
                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black normal-case text-amber-950">
                      {promoSlideIdx + 1} / {activePromoProducts.length}
                    </span>
                  )}
                </span>
                {activePromoProducts.length > 1 && (
                  <div className="flex items-center gap-1">
                    <RoundArrow dir="left" label={c.previous} onClick={() => setPromoSlideIdx((prev) => (prev - 1 + activePromoProducts.length) % activePromoProducts.length)} />
                    <RoundArrow dir="right" label={c.next} onClick={() => setPromoSlideIdx((prev) => (prev + 1) % activePromoProducts.length)} />
                  </div>
                )}
              </div>

              {activePromoProducts.length > 0 ? (
                (() => {
                  const promo = activePromoProducts[promoSlideIdx % activePromoProducts.length] || activePromoProducts[0];
                  const photos = photosOf(promo);
                  return (
                    <div className={`flex flex-col items-center gap-3 rounded-2xl border p-3.5 sm:flex-row ${darkMode ? "border-slate-700 bg-slate-900" : "border-amber-100 bg-white"}`}>
                      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl sm:w-32">
                        <ProductImage photos={photos} name={promo.name} dark={darkMode} />
                      </div>
                      <div className="flex w-full flex-1 flex-col justify-center gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold">{promo.name}</span>
                          <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-950">{c.promoBadge}</span>
                        </div>
                        <span className="text-sm font-black" style={{ color: theme.accent }}>{formatMoney(promo.price_cents, promo.currency)}</span>
                        <button
                          onClick={() => add(promo.id)}
                          className="mt-1 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand-green px-4 text-xs font-extrabold text-white transition-all active:scale-95 sm:w-fit"
                        >
                          {c.addToCart}{cart[promo.id] ? ` · ${cart[promo.id]}` : ""}
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className={`flex items-center gap-3 rounded-xl border p-3 ${darkMode ? "border-slate-700 bg-slate-900" : "border-amber-100 bg-white"}`}>
                  <span className="flex-1 whitespace-pre-line text-[13px] font-semibold">{business.promo_text}</span>
                  <a href={orderHref} target="_blank" rel="noopener noreferrer"
                    className="flex h-9 shrink-0 items-center justify-center rounded-xl bg-brand-green px-3 text-[12px] font-extrabold text-white">
                    {c.orderOnWhatsapp}
                  </a>
                </div>
              )}

              {activePromoProducts.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {activePromoProducts.map((_, idx) => (
                    <button key={idx} onClick={() => setPromoSlideIdx(idx)} aria-label={`${idx + 1}`}
                      className={`h-2 cursor-pointer rounded-full transition-all ${idx === promoSlideIdx ? "w-6 bg-amber-600" : "w-2 bg-amber-300"}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Produits mis en avant */}
          {featured.length === 0 ? (
            <div className="mx-4 mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center"
              style={{ borderColor: darkMode ? "#374151" : "#E3E9E6" }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: theme.accentSoft }}>
                <BagIcon color={theme.accentText} size={24} />
              </span>
              <span className="text-[15px] font-bold">{c.emptyTitle}</span>
              <span className={`max-w-[320px] text-[13.5px] leading-relaxed ${darkMode ? "text-slate-400" : "text-ink-muted"}`}>{c.emptyBody}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 pt-7">
                <h2 className="text-[16px] font-extrabold">{c.bestSellers}</h2>
                <Link href={`/b/${business.slug}/katalog`} className="text-xs font-bold" style={{ color: theme.accentText }}>
                  {sector.catalog}
                </Link>
              </div>
              <FeaturedSection
                layout={business.layout}
                verticalId={vertical.id}
                featured={featured}
                cart={cart}
                ops={ops}
                dark={darkMode}
                onZoom={openZoom}
                visitHref={visitHref}
              />
              <div className="px-4 pt-5">
                <Link
                  href={`/b/${business.slug}/katalog`}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl active:scale-[0.99]"
                  style={{ background: theme.accentSoft, color: theme.accentText }}
                >
                  <span className="text-sm font-bold">{c.seeAll(products.length)}</span>
                  <ChevronIcon color={theme.accentText} dir="right" />
                </Link>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Catalogue complet */}
          <header className="sticky top-0 z-10 flex flex-col gap-3 px-4 pb-3 pt-5" style={{ background: theme.accent }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link href={`/b/${business.slug}`} aria-label={c.back} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <ChevronIcon color="#fff" dir="left" />
                </Link>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-white">{sector.catalog}</span>
                  <span className="text-[12px] text-white/75">{business.name}</span>
                </div>
              </div>
              <LanguageToggle variant="compact" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInStockOnly((v) => !v)}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${inStockOnly ? "bg-white" : "bg-white/15 text-white"}`}
                  style={inStockOnly ? { color: theme.accent } : undefined}
                >
                  {c.inStockOnly}
                </button>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold text-white outline-none"
                  aria-label={c.sortPopular}
                >
                  <option value="popular" className="text-ink">{c.sortPopular}</option>
                  <option value="price_up" className="text-ink">{c.sortPriceUp}</option>
                  <option value="price_down" className="text-ink">{c.sortPriceDown}</option>
                </select>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-black/20 p-1">
                {(["grid", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCatalogViewMode(mode)}
                    className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all ${catalogViewMode === mode ? "bg-white text-slate-900" : "text-white/80"}`}
                  >
                    {mode === "grid" ? c.viewGrid : c.viewList}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-5 pt-4">
            {grouped.map(([cat, items]) => (
              <section key={cat}>
                <h2 className="px-4 pb-2 text-[15px] font-extrabold">{cat}</h2>
                {catalogViewMode === "list" ? (
                  <div>{items.map((p) => <MenuRow key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} dark={darkMode} />)}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 px-3 sm:gap-4 sm:px-4 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((p) =>
                      vertical.id === "restauration" ? (
                        <FoodCard key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} dark={darkMode} onZoom={openZoom} />
                      ) : (
                        <GridCard key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} dark={darkMode} onZoom={openZoom} />
                      ),
                    )}
                  </div>
                )}
              </section>
            ))}
            {grouped.length === 0 && <p className="px-6 pt-16 text-center text-sm text-ink-faint">{c.noProducts}</p>}
          </div>
        </>
      )}

      {/* Bouton de commande, en fin de page pour ne pas masquer les cartes */}
      <div className="mx-auto max-w-xl px-4 pb-8 pt-10 md:max-w-2xl">
        {count > 0 ? (
          <button onClick={() => setCheckoutOpen(true)}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-brand-green shadow-[0_6px_20px_rgba(37,211,102,0.4)] active:scale-[0.99]">
            <WaIcon />
            <span className="text-[16px] font-extrabold text-white">{c.orderCta(count, formatMoney(totalCents))}</span>
          </button>
        ) : (
          <a href={orderHref} target="_blank" rel="noopener noreferrer"
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-green shadow-[0_6px_20px_rgba(37,211,102,0.4)] active:scale-[0.99]">
            <WaIcon />
            <span className="text-[16px] font-extrabold text-white">{c.orderOnWhatsapp}</span>
          </a>
        )}
      </div>

      {/* Vérification avant envoi */}
      {checkoutOpen && count > 0 && (
        <div className="fixed inset-0 z-40 mx-auto flex max-w-xl flex-col justify-end md:max-w-2xl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCheckoutOpen(false)} />
          <div className={`relative max-h-[92dvh] overflow-y-auto rounded-t-[28px] px-5 pb-8 pt-4 shadow-2xl ${darkMode ? "border-t border-slate-700 bg-[#1F2937] text-white" : "border-t border-line bg-white text-ink"}`}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-extrabold">{c.checkoutTitle}</h2>
                <p className="text-[12.5px] text-slate-400">{c.checkoutSubtitle}</p>
              </div>
              <button onClick={() => setCheckoutOpen(false)} aria-label={c.close}
                className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                <CloseIcon color={darkMode ? "#CBD5E1" : "#475569"} />
              </button>
            </div>

            {tableNum && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs font-bold text-amber-600">
                <span>{c.dineIn}</span>
                <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-black text-slate-950">{c.table(tableNum)}</span>
              </div>
            )}

            <div className="mt-3 flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
              {lines.map((l, i) => {
                const prod = products.find((p) => p.name === l.name);
                const photos = prod ? photosOf(prod) : [];
                return (
                  <div key={i} className={`flex items-center justify-between gap-3 rounded-xl border p-2 text-xs ${darkMode ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                        <ProductImage photos={photos} name={l.name} dark={darkMode} compact />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-bold">{l.qty}× {l.name}</span>
                        {l.unit && <span className="text-[11px] text-slate-400">{l.unit}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 font-extrabold text-emerald-600">{formatMoney(Math.round(l.unitPriceCents * l.qty))}</span>
                  </div>
                );
              })}
            </div>

            {/* Coordonnées facultatives : elles créent la fiche client chez le
                marchand, ce qui rend possibles la relance et le suivi de dette. */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-slate-400">{c.yourName} <span className="font-normal">({c.optional})</span></span>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoComplete="name" className={fieldCls} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-slate-400">{c.yourWhatsapp} <span className="font-normal">({c.optional})</span></span>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="3712 4488" className={fieldCls} />
              </label>
            </div>

            <label className="mt-3 flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-slate-400">{c.note} <span className="font-normal">({c.optional})</span></span>
              <input value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder={c.notePlaceholder} className={fieldCls} />
            </label>

            {!tableNum && (
              <label className="mt-3 flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-slate-400">{c.deliveryWhere}</span>
                <select value={zoneIdx} onChange={(e) => setZoneIdx(Number(e.target.value))} className={fieldCls}>
                  {zones.map((z, i) => (
                    <option key={i} value={i}>{z.name} · {z.fee_cents > 0 ? formatMoney(z.fee_cents) : c.free}</option>
                  ))}
                </select>
              </label>
            )}

            <div className={`mt-4 flex items-center justify-between border-t pt-3 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <span className="text-[13px] font-semibold text-slate-400">{c.total}</span>
              <span className="text-xl font-extrabold text-emerald-600">{formatMoney(grandTotalCents)}</span>
            </div>

            <a
              href={orderHref}
              onClick={handleSendOrder}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-brand-green text-white shadow-lg active:scale-[0.99]"
            >
              <WaIcon />
              <span className="text-[15px] font-extrabold">{c.confirmSend}</span>
            </a>
          </div>
        </div>
      )}

      {/* Visionneuse plein écran */}
      {lightbox && lightbox.photos.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4">
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold text-white/80">{c.photoOf(lightbox.index + 1, lightbox.photos.length)}</span>
            <button onClick={() => setLightbox(null)} aria-label={c.close}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <CloseIcon color="#fff" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.photos[lightbox.index]} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
            {lightbox.photos.length > 1 && (
              <>
                <button aria-label={c.previous}
                  onClick={() => setLightbox((prev) => (prev ? { ...prev, index: (prev.index - 1 + prev.photos.length) % prev.photos.length } : null))}
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/25">
                  <ChevronIcon color="#fff" dir="left" />
                </button>
                <button aria-label={c.next}
                  onClick={() => setLightbox((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.photos.length } : null))}
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/25">
                  <ChevronIcon color="#fff" dir="right" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Produits mis en avant, selon le secteur et le design ─────────── */

function FeaturedSection({
  layout,
  verticalId,
  featured,
  cart,
  ops,
  dark,
  onZoom,
  visitHref,
}: {
  layout: string | null;
  verticalId: string;
  featured: Product[];
  cart: Record<string, number>;
  ops: CartOps;
  dark: boolean;
  onZoom: (photos: string[], index: number) => void;
  visitHref: (p: Product) => string;
}) {
  const c = useCopy();

  if (layout === "design3") {
    return (
      <div className="mt-3 grid grid-cols-1 gap-4 px-4 sm:grid-cols-2">
        {featured.map((p) => (
          <div key={p.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl">
            <div className="relative h-52 w-full overflow-hidden">
              <ProductImage photos={photosOf(p)} name={p.name} dark onZoom={onZoom} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
              {p.category && (
                <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-0.5 text-[10.5px] font-bold text-white/90">{p.category}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <h4 className="line-clamp-1 text-base font-extrabold">{p.name}</h4>
                <span className="text-base font-extrabold text-amber-300">{formatMoney(p.price_cents, p.currency)}</span>
              </div>
              <QtyControl p={p} qty={cart[p.id] ?? 0} ops={ops} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (verticalId === "restauration") {
    return (
      <div className="mt-3 grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 lg:grid-cols-4">
        {featured.map((p) => <FoodCard key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} dark={dark} onZoom={onZoom} />)}
      </div>
    );
  }

  if (layout === "design2" && (verticalId === "sante_bienetre" || verticalId === "automobile")) {
    // Grille asymétrique : une grande carte, puis des cartes plus étroites.
    return (
      <div className="mt-3 grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
        {featured.slice(0, 4).map((p, idx) => (
          <OverlayCard key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} onZoom={onZoom}
            className={idx === 0 || idx === 3 ? "col-span-2 sm:col-span-2 h-[170px]" : "col-span-1 h-[170px]"} />
        ))}
      </div>
    );
  }

  if (layout === "design2" && verticalId === "immobilier") {
    return (
      <div className="mt-3 grid grid-cols-2 gap-3 px-4">
        {featured.slice(0, 3).map((p, idx) => (
          <OverlayCard key={p.id} p={p} onZoom={onZoom}
            className={idx === 2 ? "col-span-2 h-[180px]" : "col-span-1 h-[160px]"}
            action={
              <a href={visitHref(p)} target="_blank" rel="noopener noreferrer"
                className="rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900">
                {c.scheduleVisit}
              </a>
            } />
        ))}
      </div>
    );
  }

  if (verticalId === "commerce_vente" && layout !== "design2") {
    // Une grande carte en tête, puis deux cartes côte à côte.
    const [hero, ...rest] = featured;
    return (
      <div className="flex flex-col gap-3.5 px-4 pt-3">
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {hero && <OverlayCard p={hero} qty={cart[hero.id] ?? 0} ops={ops} onZoom={onZoom} className="h-[230px] md:col-span-2 md:h-[330px]" />}
          <div className="grid grid-cols-2 gap-3.5 md:col-span-1 md:grid-cols-1">
            {rest.slice(0, 2).map((p) => (
              <OverlayCard key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} onZoom={onZoom} className="h-[220px] md:h-[158px]" />
            ))}
          </div>
        </div>
        {rest.length > 2 && (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {rest.slice(2).map((p) => <GridCard key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} dark={dark} onZoom={onZoom} />)}
          </div>
        )}
      </div>
    );
  }

  if (layout === "design2") {
    return (
      <div className="mt-3 grid grid-cols-1 gap-3 px-4 sm:grid-cols-2">
        {featured.map((p) => <MenuRow key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} dark={dark} boxed />)}
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-4 px-4 sm:grid-cols-4">
      {featured.map((p) => <GridCard key={p.id} p={p} qty={cart[p.id] ?? 0} ops={ops} dark={dark} onZoom={onZoom} />)}
    </div>
  );
}

/* ─────────── Cartes produit ─────────── */

function QtyControl({ p, qty, ops, onDark }: { p: Product; qty: number; ops: CartOps; onDark?: boolean }) {
  const c = useCopy();
  if (p.stock_state === "fini") {
    return <span className={`text-[12px] font-bold ${onDark ? "text-white/70" : "text-ink-faint"}`}>{c.soldOut}</span>;
  }
  if (qty === 0) {
    return (
      <button onClick={() => ops.add(p.id)}
        className="flex h-9 items-center justify-center gap-1.5 rounded-[11px] bg-[#E7F7F1] px-3 text-brand active:scale-95">
        <PlusIcon /><span className="text-[12.5px] font-bold">{c.add}</span>
      </button>
    );
  }
  return (
    <div className="flex h-9 items-center gap-2 rounded-[11px] bg-[#E7F7F1] px-1.5">
      <button onClick={() => ops.sub(p.id)} aria-label="−" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white font-bold text-brand">−</button>
      <span className="min-w-4 text-center text-sm font-extrabold text-brand">{qty}</span>
      <button onClick={() => ops.add(p.id)} aria-label="+" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white font-bold text-brand">+</button>
    </div>
  );
}

function PriceLabel({ p }: { p: Product }) {
  return (
    <span className="text-base font-extrabold">
      {formatMoney(p.price_cents, p.currency).replace(` ${p.currency}`, "")}{" "}
      <span className="text-[11px] font-semibold opacity-60">{p.currency}</span>
    </span>
  );
}

/** Image produit, ou emplacement neutre quand le marchand n'a pas mis de photo. */
function ProductImage({
  photos,
  name,
  dark,
  compact,
  onZoom,
  index = 0,
}: {
  photos: string[];
  name: string;
  dark?: boolean;
  compact?: boolean;
  onZoom?: (photos: string[], index: number) => void;
  index?: number;
}) {
  if (photos.length === 0) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${dark ? "bg-slate-800" : "bg-[#F1F4F2]"}`} aria-label={name}>
        <BagIcon color={dark ? "#64748B" : "#A3B5AF"} size={compact ? 18 : 34} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photos[index]}
      alt={name}
      draggable={false}
      onClick={onZoom ? () => onZoom(photos, index) : undefined}
      className={`h-full w-full object-cover ${onZoom ? "cursor-zoom-in" : ""}`}
    />
  );
}

/** Carte à image pleine avec texte en surimpression. */
function OverlayCard({
  p,
  qty = 0,
  ops,
  onZoom,
  className,
  action,
}: {
  p: Product;
  qty?: number;
  ops?: CartOps;
  onZoom: (photos: string[], index: number) => void;
  className: string;
  action?: React.ReactNode;
}) {
  const photos = photosOf(p);
  return (
    <div className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md ${className}`}>
      <div className="absolute inset-0">
        <ProductImage photos={photos} name={p.name} dark onZoom={onZoom} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="relative z-10 flex flex-col gap-1 p-3">
        {p.category && <span className="text-[10.5px] font-bold uppercase tracking-wide text-white/70">{p.category}</span>}
        <h4 className="line-clamp-1 text-sm font-extrabold">{p.name}</h4>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="text-[13px] font-extrabold text-emerald-200">{formatMoney(p.price_cents, p.currency)}</span>
          {action ?? (ops ? <QtyControl p={p} qty={qty} ops={ops} onDark /> : null)}
        </div>
      </div>
    </div>
  );
}

function GridCard({
  p,
  qty,
  ops,
  dark,
  onZoom,
}: {
  p: Product;
  qty: number;
  ops: CartOps;
  dark?: boolean;
  onZoom: (photos: string[], index: number) => void;
}) {
  const c = useCopy();
  const photos = photosOf(p);
  const [imgIdx, setImgIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  function handleEnd(clientX: number) {
    if (touchStartX === null) return;
    const deltaX = touchStartX - clientX;
    setTouchStartX(null);
    if (photos.length < 2) return;
    if (deltaX > 30) setImgIdx((prev) => (prev + 1) % photos.length);
    else if (deltaX < -30) setImgIdx((prev) => (prev - 1 + photos.length) % photos.length);
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(17,27,33,0.06)] ring-1 ${dark ? "bg-[#1F2937] text-white ring-gray-700" : "bg-white text-ink ring-line"}`}>
      <div
        className="relative aspect-[3/5] max-h-[300px] w-full select-none"
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
      >
        <ProductImage photos={photos} name={p.name} dark={dark} onZoom={onZoom} index={imgIdx} />

        {p.sold_count > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-brand shadow-sm">
            {c.sold(p.sold_count)}
          </span>
        )}
        {p.stock_state === "fini" && (
          <span className="absolute right-2 top-2 rounded-full bg-[#FCE4E4] px-2 py-0.5 text-[10.5px] font-bold text-[#C0392B]">{c.soldOut}</span>
        )}

        {photos.length > 1 && (
          <>
            <button onClick={() => setImgIdx((prev) => (prev - 1 + photos.length) % photos.length)} aria-label={c.previous}
              className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow active:scale-90">
              <ChevronIcon color="#111B21" dir="left" size={14} />
            </button>
            <button onClick={() => setImgIdx((prev) => (prev + 1) % photos.length)} aria-label={c.next}
              className="absolute right-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow active:scale-90">
              <ChevronIcon color="#111B21" dir="right" size={14} />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
              {photos.map((_, idx) => (
                <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === imgIdx ? "w-4 bg-brand" : "w-1.5 bg-white/80"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1 p-3">
        <div>
          <span className="line-clamp-1 text-[13.5px] font-semibold">{p.name}</span>
          <div className="mt-0.5"><PriceLabel p={p} /></div>
        </div>
        <div className="mt-2">
          {p.stock_state === "fini" ? <span className="text-[12px] text-ink-faint">{c.unavailable}</span> : <QtyControl p={p} qty={qty} ops={ops} />}
        </div>
      </div>
    </div>
  );
}

function MenuRow({ p, qty, ops, dark, boxed }: { p: Product; qty: number; ops: CartOps; dark?: boolean; boxed?: boolean }) {
  const c = useCopy();
  const photos = photosOf(p);
  const shell = boxed
    ? `rounded-2xl border p-3 ${dark ? "border-slate-700 bg-[#1F2937]" : "border-slate-200 bg-white"}`
    : `border-b px-4 py-3 ${dark ? "border-gray-800 bg-[#111827]" : "border-[#F2F4F5] bg-white"}`;
  return (
    <div className={`flex items-center gap-3 ${shell}`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
        <ProductImage photos={photos} name={p.name} dark={dark} compact />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-1 text-[15px] font-bold leading-snug">{p.name}</span>
        <div className="flex items-center gap-2">
          <PriceLabel p={p} />
          {p.sold_count > 0 && <span className="text-[11px] text-ink-faint">· {c.sold(p.sold_count)}</span>}
        </div>
      </div>
      <QtyControl p={p} qty={qty} ops={ops} />
    </div>
  );
}

function FoodCard({
  p,
  qty,
  ops,
  dark,
  onZoom,
}: {
  p: Product;
  qty: number;
  ops: CartOps;
  dark?: boolean;
  onZoom: (photos: string[], index: number) => void;
}) {
  const c = useCopy();
  const photos = photosOf(p);
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border shadow-md transition-shadow hover:shadow-xl sm:rounded-3xl ${dark ? "border-slate-700 bg-[#1E293B] text-white" : "border-slate-200 bg-white text-ink"}`}>
      {/* Format 4:5 pour voir le plat en entier */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <ProductImage photos={photos} name={p.name} dark={dark} onZoom={onZoom} />
        <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
          {p.category && (
            <span className="max-w-[110px] truncate rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-950">{p.category}</span>
          )}
          {p.sold_count > 0 && (
            <span className="hidden rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white sm:inline-block">{c.bestSeller}</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 p-2.5 sm:p-3.5">
        <div>
          <h3 className="line-clamp-1 text-[13px] font-extrabold leading-tight sm:text-sm">{p.name}</h3>
          {p.unit && <span className="mt-0.5 block line-clamp-1 text-[11px] text-slate-400">{p.unit}</span>}
          <div className="mt-1 text-amber-600"><PriceLabel p={p} /></div>
        </div>
        <div className={`border-t pt-2 ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <QtyControl p={p} qty={qty} ops={ops} />
        </div>
      </div>
    </div>
  );
}

/* ─────────── Utilitaires ─────────── */

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "•"
  );
}

function socialLinks(b: Business, dark?: boolean) {
  return [
    { name: "Instagram", url: b.social_instagram, icon: <InstagramIcon dark={dark} /> },
    { name: "Facebook", url: b.social_facebook, icon: <FacebookIcon dark={dark} /> },
    { name: "TikTok", url: b.social_tiktok, icon: <TiktokIcon dark={dark} /> },
  ].filter((s): s is { name: string; url: string; icon: JSX.Element } => !!s.url);
}

/* ─────────── Icônes ─────────── */

function WaIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20z" /></svg>;
}
function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
function BagIcon({ color, size = 40 }: { color: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
}
function ChevronIcon({ color, dir, size = 18 }: { color: string; dir: "left" | "right"; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} /></svg>;
}
function CloseIcon({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function SunIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
}
function MoonIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>;
}
function FlameIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true"><path d="M12 2c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" /></svg>;
}
function RoundArrow({ dir, label, onClick }: { dir: "left" | "right"; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-amber-300 bg-white">
      <ChevronIcon color="#78350F" dir={dir} size={15} />
    </button>
  );
}
function InstagramIcon({ dark }: { dark?: boolean }) {
  const color = dark ? "#FFFFFF" : "#111B21";
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill={color} stroke="none" /></svg>;
}
function FacebookIcon({ dark }: { dark?: boolean }) {
  const color = dark ? "#FFFFFF" : "#111B21";
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={color} aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-3.5 1.4-3.5 3.6V11H8v3h2.5v6H14v-6h2.4l.6-3H14V9.8c0-.6.3-.8.9-.8z" /></svg>;
}
function TiktokIcon({ dark }: { dark?: boolean }) {
  const color = dark ? "#FFFFFF" : "#111B21";
  return <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true"><path d="M16 3c.3 2 1.6 3.6 3.6 3.9v2.8c-1.3.1-2.6-.3-3.6-1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.9a2.7 2.7 0 1 0 1.9 2.6V3z" /></svg>;
}
