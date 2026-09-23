"use client";

import type { CSSProperties } from "react";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import type { LayoutKey } from "@/lib/storefront-layouts";
import { designFor, type DesignCta, type DesignSkin, type SectorPalette } from "@/lib/storefront-designs";
import {
  PriceText,
  ProductCategory,
  ProductImage,
  SoldBadge,
  photosOf,
  useCopy,
  type CartOps,
} from "@/components/storefront/product";

// Section « À la une » de la vitrine : le design du secteur de la boutique
// (lib/storefront-designs), dans la disposition choisie par le marchand.
//
// Chaque design affiche un nombre fixe d'images ; les autres produits sont
// dans le catalogue complet. Les couleurs sont celles du secteur.
//
// Ce fichier ne décide que de la mise en page. Ce qu'une carte montre d'un
// produit vient de components/storefront/product.tsx, partagé avec le
// catalogue complet.

type Zoom = (photos: string[], index: number) => void;

interface Ctx {
  cart: Record<string, number>;
  ops: CartOps;
  onZoom: Zoom;
  visitHref: (p: Product) => string;
  cta: DesignCta;
  skin: DesignSkin;
  pal: SectorPalette;
}

export function FeaturedSection({
  layout,
  verticalId,
  featured,
  cart,
  ops,
  onZoom,
  visitHref,
  palette,
}: {
  layout: LayoutKey;
  verticalId: string;
  /** Couleurs du thème choisi par le marchand (lib/themes). */
  palette: SectorPalette;
  featured: Product[];
  cart: Record<string, number>;
  ops: CartOps;
  dark?: boolean;
  onZoom: Zoom;
  visitHref: (p: Product) => string;
}) {
  const spec = designFor(verticalId, layout);
  const items = featured.slice(0, spec.slots);
  const ctx: Ctx = { cart, ops, onZoom, visitHref, cta: spec.cta, skin: spec.skin, pal: palette };
  if (items.length === 0) return null;

  const tile = (p: Product, className: string, extra?: { tone?: "dark" | "light"; shape?: string }) => (
    <Tile key={p.id} p={p} ctx={ctx} className={className} tone={extra?.tone} shapeClass={extra?.shape} />
  );
  const sheet = (p: Product, aspect: string, key?: string) => <Sheet key={key ?? p.id} p={p} ctx={ctx} aspect={aspect} />;
  const overlaySkin = spec.skin === "dark" || spec.skin === "light";

  switch (spec.shape) {
    case "hero3": {
      const [hero, ...rest] = items;
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4 md:auto-rows-[164px] md:grid-cols-3">
          {tile(hero, "col-span-2 h-[230px] md:row-span-2 md:h-auto")}
          {rest.map((p) => tile(p, "h-[190px] md:h-auto"))}
        </div>
      );
    }
    case "showroom3": {
      const [hero, ...rest] = items;
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4">
          {tile(hero, "col-span-2 h-[240px] md:h-[340px]")}
          {rest.map((p) => tile(p, "h-[170px] md:h-[200px]"))}
        </div>
      );
    }
    case "grid4":
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-4">
          {items.map((p) => (overlaySkin ? tile(p, "h-[220px] md:h-[260px]") : sheet(p, "aspect-[4/5]")))}
        </div>
      );
    case "portrait4":
      return <div className="mt-3 grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-4">{items.map((p) => sheet(p, "aspect-[3/4]"))}</div>;
    case "circles4":
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-4">
          {items.map((p) => (
            <Circle key={p.id} p={p} ctx={ctx} />
          ))}
        </div>
      );
    case "stack3":
      return <div className="mt-3 grid grid-cols-1 gap-3.5 px-4 md:grid-cols-3">{items.map((p) => sheet(p, "aspect-video"))}</div>;
    case "split3": {
      const [a, b, banner] = items;
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4">
          {tile(a, "h-[170px] md:h-[230px]")}
          {b && tile(b, "h-[170px] md:h-[230px]")}
          {banner && tile(banner, "col-span-2 h-[190px] md:h-[250px]")}
        </div>
      );
    }
    case "alt4":
      return (
        <div className="mt-3 grid grid-cols-3 gap-3 px-4">
          {items.map((p, i) => tile(p, `${i === 0 || i === 3 ? "col-span-2" : "col-span-1"} h-[150px] md:h-[210px]`))}
        </div>
      );
    case "capsule4": {
      // Téléphone : 2 colonnes (capsules à gauche). Tablette et plus : les
      // colonnes s'effacent (md:contents) et les 4 cartes tiennent sur une ligne.
      const [a, b, c, e] = items;
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4 md:grid-cols-4">
          <div className="flex flex-col gap-3 md:contents">
            {tile(a, "h-[170px] md:h-[280px]", { shape: "rounded-b-2xl rounded-t-[64px]" })}
            {b && tile(b, "h-[170px] md:h-[280px]", { shape: "rounded-t-2xl rounded-b-[64px]" })}
          </div>
          <div className="flex flex-col gap-3 md:contents">
            {c && tile(c, "h-[170px] md:h-[280px]")}
            {e && tile(e, "h-[170px] md:h-[280px]")}
          </div>
        </div>
      );
    }
    case "masonry4": {
      // Téléphone : 2 colonnes aux hauteurs croisées, comme un fil Instagram.
      // Tablette et plus : 3 colonnes, une haute, deux empilées, une haute.
      const [a, b, c, e] = items;
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4 md:auto-rows-[190px] md:grid-cols-3">
          <div className="flex flex-col gap-3 md:contents">
            {tile(a, "h-[260px] md:col-start-1 md:row-span-2 md:row-start-1 md:h-auto")}
            {c && tile(c, "h-[190px] md:col-start-2 md:row-start-2 md:h-auto")}
          </div>
          <div className="flex flex-col gap-3 md:contents">
            {b && tile(b, "h-[190px] md:col-start-2 md:row-start-1 md:h-auto")}
            {e && tile(e, "h-[260px] md:col-start-3 md:row-span-2 md:row-start-1 md:h-auto")}
          </div>
        </div>
      );
    }
    case "arch4":
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-4">
          {items.map((p) => (
            <Arch key={p.id} p={p} ctx={ctx} />
          ))}
        </div>
      );
    case "feature4": {
      // Bannière vedette, puis 3 cartes sur une ligne. Pas de défilement
      // horizontal : sur téléphone, une carte coupée au bord passait pour un bug.
      const [hero, ...rest] = items;
      return (
        <div className="mt-3 flex flex-col gap-2.5 px-4 sm:gap-3">
          {tile(hero, "h-[230px] md:h-[300px]", { tone: "dark" })}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {rest.map((p) => (
              <Sheet key={p.id} p={p} ctx={ctx} aspect="aspect-square" compact />
            ))}
          </div>
        </div>
      );
    }
    case "columns3":
      return <div className="mt-3 grid grid-cols-1 gap-3.5 px-4 sm:grid-cols-3">{items.map((p) => sheet(p, "aspect-[4/3]"))}</div>;
    case "pricing3":
      return (
        <div className="mt-3 grid grid-cols-1 gap-3.5 px-4 md:grid-cols-3 md:items-center">
          {items.map((p, i) => (
            <PricingColumn key={p.id} p={p} ctx={ctx} highlight={i === 1} />
          ))}
        </div>
      );
    case "list":
      return (
        <div className="mt-3 grid grid-cols-1 gap-2.5 px-4 md:grid-cols-2">
          {items.map((p) => (
            <Row key={p.id} p={p} ctx={ctx} />
          ))}
        </div>
      );
    case "table":
      return <TableView items={items} ctx={ctx} />;
  }
}

/* ─────────── Habillages ─────────── */

interface SkinStyle {
  shell: string;
  style?: CSSProperties;
  sub: string;
  price: string;
  priceStyle?: CSSProperties;
  button: "solid" | "gold" | "white";
}

function skinOf(skin: DesignSkin, pal: SectorPalette): SkinStyle {
  switch (skin) {
    case "vip":
      return { shell: "bg-gradient-to-b from-slate-900 to-indigo-950 text-white shadow-xl ring-1 ring-indigo-900/60", sub: "text-indigo-200/80", price: "text-amber-300", button: "gold" };
    case "neon":
      return {
        shell: "bg-slate-950 text-white",
        style: { boxShadow: `0 0 0 1.5px ${pal.strong}, 0 0 22px ${pal.strong}55` },
        sub: "text-slate-400",
        price: "",
        priceStyle: { color: pal.soft },
        button: "solid",
      };
    case "gold":
      return { shell: "bg-white text-ink shadow-sm ring-1 ring-amber-300", sub: "text-ink-muted", price: "text-amber-700", button: "gold" };
    case "pastel":
      return { shell: "text-ink shadow-sm", style: { background: `${pal.soft}80` }, sub: "text-ink-soft", price: "", priceStyle: { color: pal.strong }, button: "solid" };
    case "metal":
      return { shell: "bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 text-slate-900 shadow-md ring-1 ring-slate-400", sub: "text-slate-600", price: "text-slate-900", button: "solid" };
    case "minimal":
      return { shell: "bg-white text-ink border border-slate-200", sub: "text-ink-muted", price: "", priceStyle: { color: pal.strong }, button: "solid" };
    case "executive":
      return { shell: "bg-slate-900 text-white shadow-lg", sub: "text-slate-400", price: "", priceStyle: { color: pal.soft }, button: "white" };
    default:
      return { shell: "bg-white text-ink shadow-[0_2px_10px_rgba(17,27,33,0.06)] ring-1 ring-line", sub: "text-ink-muted", price: "", priceStyle: { color: pal.strong }, button: "solid" };
  }
}

/* ─────────── Bouton d'action ─────────── */

function Cta({ p, ctx, variant, full, compact }: { p: Product; ctx: Ctx; variant: SkinStyle["button"]; full?: boolean; compact?: boolean }) {
  const c = useCopy();
  const qty = ctx.cart[p.id] ?? 0;
  const { pal } = ctx;
  // Hauteur minimale plutôt que fixe : sur une carte étroite (tablette, 4 par
  // ligne) un libellé long passe sur deux lignes au lieu de déborder.
  const size = compact ? "min-h-8 px-1.5 text-[11px] sm:min-h-9 sm:px-3 sm:text-[12.5px]" : "min-h-9 px-3 text-[12.5px]";
  const base = `flex ${size} shrink-0 items-center justify-center gap-1 rounded-xl py-1.5 text-center font-extrabold leading-tight active:scale-95 ${full ? "w-full" : "max-w-full"}`;
  const look: { className: string; style?: CSSProperties } =
    variant === "gold"
      ? { className: "bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 shadow" }
      : variant === "white"
        ? { className: "bg-white text-slate-900" }
        : { className: "text-white shadow-sm", style: { background: pal.strong } };

  if (ctx.cta === "visit") {
    return (
      <a href={ctx.visitHref(p)} target="_blank" rel="noopener noreferrer" className={`${base} ${look.className}`} style={look.style}>
        {c.scheduleVisit}
      </a>
    );
  }
  if (p.stock_state === "fini") return <span className="text-[12px] font-bold opacity-70">{c.soldOut}</span>;

  if (qty > 0) {
    return (
      <div className={`flex h-9 shrink-0 items-center rounded-xl bg-white px-1 text-slate-900 shadow-sm ${compact ? "gap-0.5 sm:gap-2 sm:px-1.5" : "gap-2 px-1.5"} ${full ? "w-full justify-between" : ""}`}>
        <button onClick={() => ctx.ops.sub(p.id)} aria-label="−" className="flex h-7 w-7 items-center justify-center rounded-lg font-bold" style={{ background: `${pal.soft}` }}>−</button>
        <span className="min-w-4 text-center text-sm font-extrabold">{qty}</span>
        <button onClick={() => ctx.ops.add(p.id)} aria-label="+" className="flex h-7 w-7 items-center justify-center rounded-lg font-bold" style={{ background: `${pal.soft}` }}>+</button>
      </div>
    );
  }
  const label = { add: c.add, book: c.ctaBook, enroll: c.ctaEnroll, appointment: c.ctaAppointment, quote: c.ctaQuote }[ctx.cta];
  return (
    <button onClick={() => ctx.ops.add(p.id)} className={`${base} ${look.className}`} style={look.style}>
      {ctx.cta === "add" && <span aria-hidden="true">+</span>}
      {label}
    </button>
  );
}

/* ─────────── Cartes ─────────── */

/** Photo pleine carte, texte en surimpression. */
function Tile({ p, ctx, className, tone, shapeClass }: { p: Product; ctx: Ctx; className: string; tone?: "dark" | "light"; shapeClass?: string }) {
  const light = (tone ?? (ctx.skin === "light" ? "light" : "dark")) === "light";
  const photos = photosOf(p);
  const vip = ctx.skin === "vip";
  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden ${shapeClass ?? "rounded-3xl"} ${light ? "bg-white text-ink ring-1 ring-line" : "bg-slate-900 text-white"} shadow-md ${className}`}
      style={ctx.skin === "neon" ? skinOf("neon", ctx.pal).style : undefined}
    >
      <div className="absolute inset-0">
        <ProductImage photos={photos} name={p.name} dark={!light} onZoom={ctx.onZoom} />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${
          light ? "bg-gradient-to-t from-white via-white/60 to-transparent" : vip ? "bg-gradient-to-t from-indigo-950 via-indigo-950/40 to-transparent" : "bg-gradient-to-t from-black/85 via-black/25 to-transparent"
        }`}
      />
      <div className="relative z-10 flex flex-col gap-1 p-3">
        <h4 className="line-clamp-1 text-sm font-extrabold">{p.name}</h4>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PriceText p={p} className="text-[13px]" style={light ? { color: ctx.pal.strong } : { color: vip ? "#FCD34D" : "#A7F3D0" }} />
          <Cta p={p} ctx={ctx} variant={vip ? "gold" : light ? "solid" : "white"} />
        </div>
      </div>
    </div>
  );
}

/** Photo en haut, fiche en dessous. */
function Sheet({ p, ctx, aspect, compact }: { p: Product; ctx: Ctx; aspect: string; compact?: boolean }) {
  const s = skinOf(ctx.skin, ctx.pal);
  const c = useCopy();
  const photos = photosOf(p);
  // « compact » : 3 cartes par ligne sur téléphone. On retire la catégorie et
  // le compteur de ventes sous 640 px, et le prix peut passer à la ligne.
  const hideSmall = compact ? "hidden sm:block" : "";
  return (
    <div className={`flex h-full min-w-0 flex-col overflow-hidden rounded-2xl ${s.shell}`} style={s.style}>
      <div className={`relative w-full overflow-hidden ${aspect}`}>
        <ProductImage photos={photos} name={p.name} dark={ctx.skin === "vip" || ctx.skin === "neon" || ctx.skin === "executive"} onZoom={ctx.onZoom} />
        <SoldBadge p={p} className={`absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-slate-900 shadow-sm ${hideSmall}`} />
      </div>
      <div className={`flex flex-1 flex-col justify-between gap-2 ${compact ? "p-2 sm:p-3" : "p-3"}`}>
        <div className="flex min-w-0 flex-col gap-0.5">
          <ProductCategory p={p} className={`truncate text-[10.5px] font-bold uppercase tracking-wide ${s.sub} ${hideSmall}`} />
          <h4 className={`line-clamp-2 font-extrabold leading-snug ${compact ? "text-[12px] sm:text-[13.5px]" : "text-[13.5px]"}`}>{p.name}</h4>
          <PriceText p={p} wrap={compact} className={`${compact ? "text-[12px] sm:text-[14px]" : "text-[14px]"} ${s.price}`} style={s.priceStyle} />
        </div>
        <Cta p={p} ctx={ctx} variant={s.button} full compact={compact} />
      </div>
    </div>
  );
}

/** Photo ronde, style bistrot. */
function Circle({ p, ctx }: { p: Product; ctx: Ctx }) {
  const s = skinOf(ctx.skin, ctx.pal);
  return (
    <div className={`flex flex-col items-center gap-2 rounded-3xl p-3.5 text-center ${s.shell}`} style={s.style}>
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 shadow-md md:h-32 md:w-32" style={{ borderColor: ctx.pal.strong }}>
        <ProductImage photos={photosOf(p)} name={p.name} onZoom={ctx.onZoom} />
      </div>
      <ProductCategory p={p} className="text-[10px] font-extrabold uppercase" style={{ color: ctx.pal.strong }} />
      <h4 className="line-clamp-1 text-[13px] font-extrabold">{p.name}</h4>
      <PriceText p={p} className="rounded-full bg-white px-3 py-0.5 text-[13px] shadow-sm" style={{ color: ctx.pal.strong }} />
      <Cta p={p} ctx={ctx} variant="solid" full />
    </div>
  );
}

/** Photo en arche sur fond pastel, texte centré : ambiance spa. */
function Arch({ p, ctx }: { p: Product; ctx: Ctx }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[28px] p-3 text-center text-ink" style={{ background: `${ctx.pal.soft}66` }}>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-b-2xl rounded-t-full border-4 border-white shadow-sm">
        <ProductImage photos={photosOf(p)} name={p.name} onZoom={ctx.onZoom} />
      </div>
      <ProductCategory p={p} className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: ctx.pal.strong }} />
      <h4 className="line-clamp-2 text-[13.5px] font-extrabold leading-snug">{p.name}</h4>
      <PriceText p={p} className="text-[13.5px]" style={{ color: ctx.pal.strong }} />
      <Cta p={p} ctx={ctx} variant="solid" full />
    </div>
  );
}

/** Ligne horizontale : menu, tarif, fiche programme. */
function Row({ p, ctx }: { p: Product; ctx: Ctx }) {
  const s = skinOf(ctx.skin, ctx.pal);
  const c = useCopy();
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-2.5 ${s.shell}`} style={s.style}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        <ProductImage photos={photosOf(p)} name={p.name} compact onZoom={ctx.onZoom} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <ProductCategory p={p} className={`truncate text-[10.5px] font-bold uppercase tracking-wide ${s.sub}`} />
        <h4 className="line-clamp-1 text-[14px] font-extrabold">{p.name}</h4>
        <div className="flex items-center gap-2">
          <PriceText p={p} className={`text-[13.5px] ${s.price}`} style={s.priceStyle} />
          <SoldBadge p={p} prefix="· " className={`hidden whitespace-nowrap text-[11px] sm:inline ${s.sub}`} />
        </div>
      </div>
      <Cta p={p} ctx={ctx} variant={s.button} />
    </div>
  );
}

/** Formule tarifaire : celle du milieu est mise en avant. */
function PricingColumn({ p, ctx, highlight }: { p: Product; ctx: Ctx; highlight: boolean }) {
  const c = useCopy();
  const neon = ctx.skin === "neon";
  const glow = neon ? `0 0 0 1.5px ${ctx.pal.strong}, 0 0 ${highlight ? 32 : 14}px ${ctx.pal.strong}${highlight ? "88" : "44"}` : null;
  return (
    <div
      className={`relative flex flex-col items-center gap-2 rounded-3xl p-5 text-center ${neon ? "bg-slate-950 text-white" : "bg-white text-ink"} ${highlight ? "shadow-xl md:py-8" : neon ? "" : "border border-slate-200"}`}
      style={
        glow
          ? { boxShadow: glow }
          : highlight
            ? { boxShadow: `0 0 0 2px ${ctx.pal.strong}, 0 12px 30px rgba(17,27,33,0.12)` }
            : undefined
      }
    >
      {highlight && (
        <span className="absolute -top-3 rounded-full px-3 py-1 text-[10.5px] font-extrabold text-white" style={{ background: ctx.pal.strong }}>
          {c.popular}
        </span>
      )}
      <div className="h-14 w-14 overflow-hidden rounded-2xl">
        <ProductImage photos={photosOf(p)} name={p.name} compact onZoom={ctx.onZoom} />
      </div>
      <ProductCategory p={p} className={`text-[10.5px] font-bold uppercase tracking-wide ${neon ? "text-slate-400" : "text-ink-muted"}`} />
      <h4 className="line-clamp-2 text-[15px] font-extrabold">{p.name}</h4>
      <span className="text-[22px] font-black" style={{ color: neon ? ctx.pal.soft : ctx.pal.strong }}>
        {formatMoney(p.price_cents, p.currency)}
      </span>
      {p.unit && <span className={`-mt-1 text-[12px] ${neon ? "text-slate-400" : "text-ink-muted"}`}>/ {p.unit}</span>}
      <Cta p={p} ctx={ctx} variant="solid" full />
    </div>
  );
}

/** Tableau de prix : grossistes, quincaillerie. */
function TableView({ items, ctx }: { items: Product[]; ctx: Ctx }) {
  const c = useCopy();
  const s = skinOf(ctx.skin, ctx.pal);
  const dark = ctx.skin === "vip";
  return (
    <div className="mt-3 px-4">
      <div className={`overflow-hidden rounded-2xl ${s.shell}`} style={s.style}>
        <div
          className="grid grid-cols-[1fr_auto] gap-3 px-3.5 py-2.5 text-[11px] font-extrabold uppercase tracking-wide md:grid-cols-[1fr_160px_auto]"
          style={dark ? { background: "rgba(255,255,255,0.06)" } : { background: ctx.pal.soft, color: ctx.pal.strong }}
        >
          <span>{c.colProduct}</span>
          <span className="hidden md:block">{c.colPrice}</span>
          <span className="sr-only md:not-sr-only" />
        </div>
        {items.map((p) => (
          <div key={p.id} className={`grid grid-cols-[1fr_auto] items-center gap-3 border-t px-3.5 py-2.5 md:grid-cols-[1fr_160px_auto] ${dark ? "border-white/10" : "border-slate-100"}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                <ProductImage photos={photosOf(p)} name={p.name} compact onZoom={ctx.onZoom} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="line-clamp-1 text-[13.5px] font-extrabold">{p.name}</span>
                <PriceText p={p} className={`text-[12.5px] md:hidden ${s.price}`} style={s.priceStyle} />
                <ProductCategory p={p} className={`hidden truncate text-[11px] md:block ${s.sub}`} />
              </div>
            </div>
            <PriceText p={p} className={`hidden text-[14px] md:block ${s.price}`} style={s.priceStyle} />
            <Cta p={p} ctx={ctx} variant={s.button} />
          </div>
        ))}
      </div>
    </div>
  );
}
