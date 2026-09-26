"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { landingCopy } from "@/lib/i18n/landing";
import { applyOverrides, type LandingOverrides } from "@/lib/landing-overrides";
import { initialsOf, type ShowcaseMerchant } from "@/lib/showcase";
import { paletteFor } from "@/lib/storefront-designs";
import { useScrollReveal, useScrolledPast } from "@/components/useScrollReveal";
import { planTexts } from "@/lib/plan-texts";
import type { Plan } from "@/lib/plans";
import { INDUSTRY_SECTORS, SECTOR_COUNT, TRADE_COUNT } from "@/lib/verticals";
import { Wordmark } from "@/components/Wordmark";

// Ordre d'affichage des secteurs : celui de lib/verticals.ts, qui va du plus
// courant au plus spécialisé. Rien à maintenir ici.
const SECTORS = Object.values(INDUSTRY_SECTORS);

// Page d'accueil publique.
//
// Les couleurs sont écrites en valeurs explicites plutôt qu'avec les classes
// utilitaires du thème : cette page alterne volontairement surfaces sombres et
// claires, et les surcharges de mode sombre de l'application (qui ciblent
// `.bg-white`, `.text-ink`…) inverseraient ces surfaces.

const INK = "#06231C";
const GREEN = "#008069";
const ACTION = "#25D366";

export function LandingPage({
  plans = [],
  overrides,
  showcase = [],
}: {
  /** Offres telles que la console les enregistre : prix et textes par langue. */
  plans?: Plan[];
  overrides?: LandingOverrides;
  /** Vraies boutiques qui vendent, choisies par lib/showcase.ts (quatre au plus). */
  showcase?: ShowcaseMerchant[];
}) {
  const { language } = useLanguage();
  // Textes du code, corrigés par ce que le super-admin a modifié dans la console.
  const c = applyOverrides(landingCopy(language), overrides?.[language]);

  const rootRef = useRef<HTMLDivElement>(null);
  useScrollReveal(rootRef);
  const scrolled = useScrolledPast(40);

  // Prix et textes des offres viennent de la console : un changement s'y fait
  // une seule fois, et se voit ici comme sur la page Abonnement des marchands.
  const PLAN_ORDER = ["gratis", "pro", "premium"];
  const offers = PLAN_ORDER.map((key) => plans.find((p) => p.key === key)).filter(Boolean) as Plan[];
  // Le menu QR se vend seul, et il est aussi inclus dans Premium. C'est son
  // propre prix qui s'affiche ici : afficher celui de Premium annonçait 2 500
  // gourdes pour une offre qui en vaut 1 000.
  const qrPrice = plans.find((p) => p.key === "qr_express")?.priceGdes;

  return (
    <div ref={rootRef} style={{ background: "#FFFFFF", color: INK }} className="overflow-x-hidden">

      {/* ══════════ ACCROCHE ══════════ */}
      <section className="relative overflow-hidden" style={{ background: INK }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-56 h-[900px] w-[900px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,168,132,0.30) 0%, rgba(0,168,132,0) 62%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-80 -left-60 h-[760px] w-[760px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,211,102,0.14) 0%, rgba(37,211,102,0) 65%)" }}
        />

        {/* En-tête */}
        <header
          className={`cvz-nav sticky top-0 z-50 ${scrolled ? "shadow-[0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md" : ""}`}
          style={{ background: scrolled ? "rgba(6,35,28,0.88)" : "transparent" }}
        >
          <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-12">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2.5">
                <Mark />
                <Wordmark className="text-[18px] font-extrabold tracking-tight text-white" />
              </Link>
              <nav className="hidden items-center gap-7 lg:flex">
                <a href="#produit" className="text-[14.5px] font-semibold text-[#A9C4BC] transition-colors hover:text-white">{c.nav.product}</a>
                <a href="#restaurants" className="text-[14.5px] font-semibold text-[#A9C4BC] transition-colors hover:text-white">{c.nav.restaurants}</a>
                {/* Seul lien de la barre qui quitte la page : l'annuaire
                    s'adresse aux acheteurs, pas aux futurs marchands. */}
                <Link href="/boutik" className="text-[14.5px] font-semibold text-[#A9C4BC] transition-colors hover:text-white">{c.nav.directory}</Link>
                <a href="#tarifs" className="text-[14.5px] font-semibold text-[#A9C4BC] transition-colors hover:text-white">{c.nav.pricing}</a>
                <a href="#questions" className="text-[14.5px] font-semibold text-[#A9C4BC] transition-colors hover:text-white">{c.nav.help}</a>
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageToggle />
              <Link href="/login" className="hidden text-[14.5px] font-semibold text-[#A9C4BC] transition-colors hover:text-white sm:block">
                {c.nav.signIn}
              </Link>
              <Link
                href="/enskri"
                className="flex h-10 items-center whitespace-nowrap rounded-[10px] px-4 text-[14px] font-bold transition-transform active:scale-95 sm:h-11 sm:px-5 sm:text-[14.5px]"
                style={{ background: ACTION, color: INK }}
              >
                <span className="sm:hidden">{c.nav.createAccountShort}</span>
                <span className="hidden sm:inline">{c.nav.createAccount}</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-14 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[6fr_5fr] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-16">
          <div className="flex flex-col gap-7">
            <div data-reveal className="flex items-center gap-2.5 self-start rounded-full border px-4 py-2"
              style={{ background: "rgba(37,211,102,0.14)", borderColor: "rgba(37,211,102,0.28)" }}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACTION }} />
              <span className="text-[12.5px] font-bold text-[#7FE8AC]">{c.hero.badge}</span>
            </div>

            <h1 data-reveal style={{ ["--reveal-delay" as string]: "60ms" }}
              className="text-balance text-[40px] font-extrabold leading-[1.04] tracking-[-1.6px] text-white sm:text-[54px] sm:tracking-[-2.2px] lg:text-[66px] lg:tracking-[-3px]">
              {c.hero.titleLead} <span style={{ color: ACTION }}>{c.hero.titleAccent}</span>
            </h1>

            <p data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}
              className="max-w-[540px] text-[17px] leading-[1.6] text-[#A9C4BC] sm:text-[19.5px]">
              {c.hero.subtitle}
            </p>

            <div data-reveal style={{ ["--reveal-delay" as string]: "180ms" }} className="flex flex-col gap-3.5 pt-1 sm:flex-row sm:items-center">
              <Link href="/enskri"
                className="flex h-[58px] items-center justify-center rounded-xl px-8 text-[16.5px] font-bold transition-transform active:scale-[0.98]"
                style={{ background: ACTION, color: INK, boxShadow: "0 12px 32px rgba(37,211,102,0.28)" }}>
                {c.hero.ctaPrimary}
              </Link>
              <Link href="/b/ti-kok-boutik"
                className="flex h-[58px] items-center justify-center gap-2.5 rounded-xl border px-7 text-[16px] font-semibold text-white transition-colors hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.16)" }}>
                <PlayIcon />
                <span>{c.hero.ctaSecondary}</span>
              </Link>
            </div>

            <div data-reveal style={{ ["--reveal-delay" as string]: "240ms" }} className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
              {c.hero.trust.map((item, i) => (
                <div key={item} className="flex items-center gap-5">
                  {i > 0 && <span className="hidden h-1 w-1 rounded-full bg-[#3B5E54] sm:block" />}
                  <span className="text-[14px] text-[#7D9A92]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Produit */}
          <div className="relative flex flex-col items-center lg:min-h-[600px] lg:justify-center">
            <div data-reveal="zoom"
              className="w-[286px] rounded-[40px] p-2.5 sm:w-[318px]"
              style={{
                ["--reveal-delay" as string]: "160ms",
                background: "linear-gradient(160deg, #123B31, #06231C)",
                boxShadow: "0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
              }}>
              <div className="overflow-hidden rounded-[31px] bg-white">
                <div className="flex h-[112px] items-end p-4" style={{ background: "linear-gradient(135deg, #008069, #00A884)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white text-[15.5px] font-extrabold" style={{ color: GREEN }}>TK</div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[16px] font-bold text-white">Ti Kòk Boutik</span>
                      <span className="text-[11.5px] font-medium text-[#C4F0E3]">{c.shop.open}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-[15px]">
                  <div className="grid grid-cols-2 gap-2.5">
                    <ShopItem name={c.shop.product1} price="180 HTG" tone="linear-gradient(145deg, #FFF0D6, #FFE0AB)" />
                    <ShopItem name={c.shop.product2} price="155 HTG" tone="linear-gradient(145deg, #DFF3E9, #BEE8D6)" />
                  </div>
                  <div className="flex items-center justify-between rounded-[11px] px-3.5 py-3" style={{ background: "#F2F6F4" }}>
                    <span className="text-[12.5px] font-medium text-[#47605A]">{c.shop.delivery}</span>
                    <span className="text-[12.5px] font-bold">50 HTG</span>
                  </div>
                  <div className="flex h-[50px] items-center justify-center gap-2.5 rounded-[13px]" style={{ background: ACTION }}>
                    <WaIcon />
                    <span className="text-[15px] font-extrabold" style={{ color: INK }}>{c.shop.send} · 385 HTG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte commande, côté marchand */}
            <div data-reveal="left"
              className="cvz-float mt-5 w-[238px] rounded-2xl bg-white p-4 lg:absolute lg:-left-8 lg:top-14 lg:mt-0"
              style={{ ["--reveal-delay" as string]: "320ms", boxShadow: "0 24px 54px rgba(0,0,0,0.34)" }}>
              <div className="flex items-center justify-between pb-2.5">
                <span className="text-[11.5px] font-semibold text-[#7D9A92]">CMD-4471</span>
                <span className="rounded-md px-2.5 py-1 text-[10.5px] font-extrabold" style={{ background: "#E7F7F1", color: GREEN }}>{c.hero.orderPaid}</span>
              </div>
              <div className="text-[22px] font-extrabold tracking-[-0.8px]">385 HTG</div>
              <div className="flex items-center gap-2 pt-2.5">
                <span className="rounded-md px-2.5 py-1 text-[11px] font-extrabold" style={{ background: "#FFF3DF", color: "#B25E09" }}>{c.hero.orderCode}</span>
                <span className="text-[11.5px] text-[#7D9A92]">{c.hero.onDelivery}</span>
              </div>
            </div>

            {/* Bulle du message */}
            <div data-reveal="right"
              className="cvz-float-slow mt-4 w-full max-w-[286px] rounded-[16px_16px_4px_16px] p-4 sm:max-w-[264px] lg:absolute lg:-right-10 lg:bottom-10 lg:mt-0"
              style={{ ["--reveal-delay" as string]: "400ms", background: ACTION, boxShadow: "0 24px 54px rgba(0,0,0,0.34)" }}>
              <p className="whitespace-pre-line text-[13px] font-medium leading-[1.62]" style={{ color: INK }}>
                {c.message.text}
              </p>
            </div>
          </div>
        </div>

        {/* Preuve : de vraies boutiques qui vendent. Sans elles, la section
            disparaît plutôt que d'afficher des cases vides. */}
        {showcase.length > 0 && (
          <div data-reveal="fade" className="relative mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-5 pb-14 sm:px-8 lg:flex-row lg:items-center lg:gap-10 lg:px-12">
            <span className="whitespace-nowrap text-[13.5px] font-semibold text-[#7D9A92]">{c.proof.label}</span>
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              {showcase.map((m) => (
                <a
                  key={m.slug}
                  href={`/b/${m.slug}`}
                  className="flex h-[60px] min-w-0 items-center gap-3 rounded-[11px] border px-3 transition-colors hover:bg-white/[0.06]"
                  style={{ borderColor: "rgba(255,255,255,0.14)" }}
                >
                  {m.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.logoUrl} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain" />
                  ) : (
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-black text-white"
                      style={{ background: paletteFor(m.sector).strong }}
                    >
                      {initialsOf(m.name)}
                    </span>
                  )}
                  <span className="truncate text-[13.5px] font-bold text-[#DCEAE5]">{m.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════════ COMMENT ÇA MARCHE ══════════ */}
      <section id="produit" className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="flex flex-col gap-8 pb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:pb-14">
          <div data-reveal className="flex flex-col gap-4">
            <Eyebrow>{c.how.eyebrow}</Eyebrow>
            <H2>{c.how.title}</H2>
          </div>
          <p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }} className="max-w-[380px] text-[17px] leading-[1.6] text-[#47605A] lg:text-[18px]">
            {c.how.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {c.how.steps.map((step, i) => {
            const dark = i === 2;
            return (
              <div key={step.title} data-reveal
                className="cvz-lift flex flex-col gap-4 rounded-[20px] p-8"
                style={{ ["--reveal-delay" as string]: `${i * 110}ms`, background: dark ? INK : "#F2F6F4" }}>
                <span className="text-[52px] font-extrabold leading-none tracking-[-2.5px]" style={{ color: dark ? ACTION : "#00A884" }}>
                  0{i + 1}
                </span>
                <span className="text-[22px] font-bold tracking-[-0.6px]" style={{ color: dark ? "#fff" : INK }}>{step.title}</span>
                <span className="text-[16px] leading-[1.66]" style={{ color: dark ? "#A9C4BC" : "#47605A" }}>{step.body}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════ SUIVI DES COMMANDES ══════════ */}
      <section className="mx-auto w-full max-w-[1240px] px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="flex flex-col gap-8 pb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div data-reveal className="flex max-w-[620px] flex-col gap-4">
            <Eyebrow>{c.pipeline.eyebrow}</Eyebrow>
            <H2>{c.pipeline.title}</H2>
          </div>
          <p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }} className="max-w-[400px] text-[17px] leading-[1.6] text-[#47605A] lg:text-[18px]">
            {c.pipeline.subtitle}
          </p>
        </div>

        <div data-reveal="zoom" className="overflow-hidden rounded-[20px] border bg-white"
          style={{ borderColor: "#E6ECEA", boxShadow: "0 20px 50px rgba(6,35,28,0.07)" }}>
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" style={{ borderColor: "#E6ECEA" }}>
            <div className="flex items-center gap-3.5">
              <span className="text-[15.5px] font-bold">{c.pipeline.boardTitle}</span>
              <span className="rounded-[7px] px-2.5 py-1 text-[12px] font-semibold text-[#47605A]" style={{ background: "#F2F6F4" }}>
                12 {c.pipeline.inProgress}
              </span>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-[13px] font-semibold text-[#7D9A92]">{c.pipeline.thisWeek}</span>
              <span className="text-[13px] font-bold" style={{ color: "#B25E09" }}>
                <CountUp to={9000} /> HTG {c.pipeline.toCollect}
              </span>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto p-5 lg:grid lg:grid-cols-7 lg:overflow-visible">
            <Column label={c.pipeline.columns[0]} count={2}>
              <Card ref_="CMD-4471" name="W. Désir" amount="385 HTG" />
              <Card ref_="CMD-4472" name="J. Pierre" amount="1 240 HTG" />
            </Column>
            <Column label={c.pipeline.columns[1]} count={1}>
              <Card ref_="CMD-4468" name="M. Saint-Fleur" amount="920 HTG" />
            </Column>
            <Column label={c.pipeline.columns[2]} count={1}>
              <Card ref_="CMD-4465" name="K. Joseph" tag="MonCash" tagBg="#EDF2F0" tagColor="#47605A" />
            </Column>
            <Column label={c.pipeline.columns[3]} count={1} accent={GREEN}>
              <Card ref_="CMD-4460" name="R. Lafleur" amount="2 100 HTG" amountColor={GREEN} bg="#E7F7F1" border="#00A884" />
            </Column>
            <Column label={c.pipeline.columns[4]} count={1}>
              <Card ref_="CMD-4455" name="E. Charles" tag={c.pipeline.code} tagBg="#FFF3DF" tagColor="#B25E09" />
            </Column>
            <Column label={c.pipeline.columns[5]} count={1}>
              <Card ref_="CMD-4441" name="N. Baptiste" amount="640 HTG" />
            </Column>
            <Column label={c.pipeline.columns[6]} count={1} accent="#B25E09">
              <Card ref_="CMD-4402" name="S. Georges" amount={`${c.pipeline.remains} 900 HTG`} amountColor="#B25E09" bg="#FFFAF2" border="#F2DFC2" />
            </Column>
          </div>
        </div>
      </section>

      {/* ══════════ LE MESSAGE ══════════ */}
      <section className="relative overflow-hidden py-20 lg:py-28" style={{ background: INK }}>
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 -top-44 h-[620px] w-[760px] -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse, rgba(0,168,132,0.22) 0%, rgba(0,168,132,0) 64%)" }} />
        <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[6fr_5fr] lg:gap-20 lg:px-12">
          <div className="flex flex-col gap-6">
            <div data-reveal><Eyebrow color={ACTION}>{c.message.eyebrow}</Eyebrow></div>
            <h2 data-reveal style={{ ["--reveal-delay" as string]: "60ms" }}
              className="text-balance text-[32px] font-bold leading-[1.08] tracking-[-1.2px] text-white sm:text-[40px] lg:text-[46px] lg:tracking-[-1.8px]">
              {c.message.title}
            </h2>
            <p data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="max-w-[520px] text-[17px] leading-[1.62] text-[#A9C4BC] lg:text-[19px]">
              {c.message.body}
            </p>
            <div className="flex flex-col gap-3.5 pt-2">
              {c.message.points.map((point, i) => (
                <div key={point} data-reveal="left" style={{ ["--reveal-delay" as string]: `${160 + i * 90}ms` }} className="flex items-center gap-3.5">
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(37,211,102,0.16)" }}>
                    <CheckIcon />
                  </span>
                  <span className="text-[15.5px] font-medium text-[#D8E6E1] lg:text-[16.5px]">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal="right"
            className="flex flex-col gap-3.5 rounded-[22px] border p-6 sm:p-8"
            style={{ ["--reveal-delay" as string]: "140ms", background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}>
            <span className="text-[12.5px] font-bold uppercase tracking-[1px] text-[#7D9A92]">{c.message.receivedOn}</span>
            <div className="rounded-[16px_16px_16px_4px] p-5" style={{ background: ACTION }}>
              <p className="whitespace-pre-line text-[14.5px] font-medium leading-[1.74] sm:text-[15.5px]" style={{ color: INK }}>
                {c.message.text}
              </p>
            </div>
            <span className="text-[13px] text-[#7D9A92]">{c.message.langNote}</span>
          </div>
        </div>
      </section>

      {/* ══════════ CE QUI EST INCLUS ══════════ */}
      <section className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div data-reveal className="flex flex-col gap-4 pb-12 lg:pb-14">
          <Eyebrow>{c.features.eyebrow}</Eyebrow>
          <H2>{c.features.title}</H2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.items.map((item, i) => (
            <div key={item.title} data-reveal
              className="cvz-lift flex flex-col gap-3.5 rounded-[18px] border p-7"
              style={{ ["--reveal-delay" as string]: `${(i % 3) * 90}ms`, borderColor: "#E6ECEA" }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: i === 3 ? "#FFF3DF" : "#E7F7F1" }}>
                <FeatureIcon index={i} />
              </div>
              <span className="text-[19px] font-bold tracking-[-0.4px]">{item.title}</span>
              <span className="text-[15.5px] leading-[1.64] text-[#47605A]">{item.body}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ ONZE SECTEURS ══════════ */}
      {/* La première question d'un visiteur n'est pas « combien ça coûte »
          mais « est-ce que c'est pour moi ». La page répondait par un seul
          exemple, le restaurant, alors que onze métiers sont déjà configurés.
          La liste se construit sur lib/verticals.ts : un secteur ajouté
          apparaît ici sans qu'on y touche. */}
      <section id="secteurs" className="mx-auto w-full max-w-[1240px] px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div data-reveal className="flex flex-col gap-4 pb-10 lg:pb-12">
          <Eyebrow>{c.sectors.eyebrow}</Eyebrow>
          <H2>{c.sectors.title}</H2>
          <p className="max-w-[640px] text-[16px] leading-[1.64] text-[#47605A] lg:text-[17.5px]">{c.sectors.body}</p>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map((sector, i) => (
            <div
              key={sector.id}
              data-reveal
              className="cvz-lift flex items-center gap-4 rounded-[16px] border px-5 py-4"
              style={{ ["--reveal-delay" as string]: `${(i % 3) * 80}ms`, borderColor: "#E6ECEA" }}
            >
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[21px]" style={{ background: "#E7F7F1" }}>
                {sector.icon}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[16px] font-bold leading-[1.3] tracking-[-0.3px]">{c.sectors.names[sector.id]}</span>
                <span className="text-[13.5px] text-[#6B837D]">
                  {sector.subTypes.length === 1 ? c.sectors.trade : c.sectors.trades.replace("{n}", String(sector.subTypes.length))}
                </span>
              </span>
            </div>
          ))}
        </div>
        <p data-reveal className="pt-8 text-center text-[14.5px] font-semibold text-[#47605A]">
          {c.sectors.count.replace("{secteurs}", String(SECTOR_COUNT)).replace("{metiers}", String(TRADE_COUNT))}
        </p>
      </section>

      {/* ══════════ RESTAURANTS ══════════ */}
      <section id="restaurants" className="mx-auto w-full max-w-[1240px] px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div data-reveal="zoom" className="relative grid items-center gap-12 overflow-hidden rounded-[26px] p-8 sm:p-12 lg:grid-cols-[6fr_5fr] lg:gap-16 lg:p-16"
          style={{ background: "linear-gradient(135deg, #00614F, #008069)" }}>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -right-28 h-[480px] w-[480px] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="relative flex flex-col gap-5">
            <Eyebrow color="#A9F0D6">{c.resto.eyebrow}</Eyebrow>
            <h2 className="text-[29px] font-bold leading-[1.1] tracking-[-1.1px] text-white sm:text-[36px] lg:text-[40px] lg:tracking-[-1.5px]">{c.resto.title}</h2>
            <p className="max-w-[460px] text-[16px] leading-[1.62] text-[#C4E8DD] lg:text-[17.5px]">{c.resto.body}</p>
            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:gap-5">
              <Link href="/enskri" className="flex h-[52px] items-center justify-center rounded-[11px] bg-white px-7 text-[15.5px] font-bold transition-transform active:scale-[0.98]" style={{ color: "#00614F" }}>
                {c.resto.cta}
              </Link>
              <div className="flex flex-col">
                <span className="text-[21px] font-extrabold tracking-[-0.6px] text-white">
                  {qrPrice !== undefined ? `${qrPrice.toLocaleString("fr-HT")} ${c.pricing.perMonth}` : c.resto.price}
                </span>
                <span className="text-[13.5px] text-[#A9F0D6]">{c.resto.tables}</span>
              </div>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="w-[196px] rounded-2xl bg-white px-5 pb-6 pt-6 sm:w-[218px]" style={{ boxShadow: "0 24px 50px rgba(0,0,0,0.24)" }}>
              <div className="flex flex-col items-center gap-4">
                <span className="text-[13px] font-bold sm:text-[13.5px]" style={{ color: INK }}>{c.resto.scan}</span>
                <QrArt />
                <div className="flex items-center rounded-full px-4 py-1.5" style={{ background: INK }}>
                  <span className="text-[12.5px] font-bold text-white sm:text-[13px]">{c.resto.table}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TARIFS ══════════ */}
      <section id="tarifs" className="border-t py-20 lg:py-28" style={{ background: "#F7FAF9", borderColor: "#E6ECEA" }}>
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-8 pb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:pb-14">
            <div data-reveal className="flex flex-col gap-4">
              <Eyebrow>{c.pricing.eyebrow}</Eyebrow>
              <H2>{c.pricing.title}</H2>
            </div>
            <p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }} className="text-[17px] text-[#47605A]">{c.pricing.note}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {offers.map((offer, i) => {
              const plan = planTexts(offer, language);
              const highlighted = offer.key === "pro";
              return (
                <div key={offer.key} data-reveal
                  className="cvz-lift relative flex flex-col gap-5 rounded-[20px] p-8"
                  style={{
                    ["--reveal-delay" as string]: `${i * 90}ms`,
                    ...(highlighted
                      ? { background: INK, boxShadow: "0 24px 54px rgba(6,35,28,0.24)" }
                      : { background: "#FFFFFF", border: "1px solid #E6ECEA" }),
                  }}>
                  {highlighted && (
                    <span className="absolute -top-3 left-8 rounded-[7px] px-3 py-1.5 text-[11.5px] font-extrabold" style={{ background: ACTION, color: INK }}>
                      {c.pricing.mostChosen}
                    </span>
                  )}
                  <span className="text-[17px] font-bold" style={{ color: highlighted ? "#fff" : INK }}>{plan.name}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[44px] font-extrabold tracking-[-2px]" style={{ color: highlighted ? ACTION : INK }}>
                      {offer.priceGdes.toLocaleString("fr-HT")}
                    </span>
                    <span className="text-[14.5px] font-semibold text-[#7D9A92]">{offer.priceGdes === 0 ? c.pricing.currency : c.pricing.perMonth}</span>
                  </div>
                  <div className="h-px" style={{ background: highlighted ? "rgba(255,255,255,0.14)" : "#E6ECEA" }} />
                  <div className="flex flex-col gap-2.5">
                    {plan.features.map((f: string) => (
                      <span key={f} className="text-[14.5px]" style={{ color: highlighted ? "#C4E8DD" : "#47605A" }}>{f}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ QUESTIONS ══════════ */}
      <section id="questions" className="mx-auto w-full max-w-[1240px] border-t px-5 py-20 sm:px-8 lg:px-12 lg:py-28" style={{ borderColor: "#E6ECEA" }}>
        <div className="grid gap-10 lg:grid-cols-[4fr_8fr] lg:gap-20">
          <div data-reveal className="flex flex-col gap-4">
            <Eyebrow>{c.faq.eyebrow}</Eyebrow>
            <H2>{c.faq.title}</H2>
          </div>
          <div className="flex flex-col gap-3.5">
            {c.faq.items.map((item, i) => (
              <div key={item.q} data-reveal
                className="flex flex-col gap-2.5 rounded-2xl p-6 sm:p-7"
                style={{ ["--reveal-delay" as string]: `${i * 80}ms`, background: "#F7FAF9" }}>
                <span className="text-[17px] font-bold sm:text-[18px]">{item.q}</span>
                <span className="text-[15.5px] leading-[1.64] text-[#47605A] sm:text-[16px]">{item.a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ APPEL FINAL ══════════ */}
      <section className="relative overflow-hidden py-20 lg:py-28" style={{ background: INK }}>
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 -top-72 h-[800px] w-[1100px] -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse, rgba(37,211,102,0.20) 0%, rgba(37,211,102,0) 62%)" }} />
        <div className="relative mx-auto flex w-full max-w-[1240px] flex-col items-center gap-6 px-5 sm:px-8 lg:px-12">
          <h2 data-reveal className="max-w-[780px] text-balance text-center text-[34px] font-extrabold leading-[1.06] tracking-[-1.4px] text-white sm:text-[46px] lg:text-[56px] lg:tracking-[-2.4px]">
            {c.finalCta.title}
          </h2>
          <p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }} className="max-w-[520px] text-center text-[17px] leading-[1.6] text-[#A9C4BC] lg:text-[19px]">
            {c.finalCta.body}
          </p>
          <div data-reveal style={{ ["--reveal-delay" as string]: "160ms" }} className="flex w-full flex-col gap-3.5 pt-2 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/enskri" className="flex h-[58px] items-center justify-center rounded-xl px-8 text-[16.5px] font-bold transition-transform active:scale-[0.98]"
              style={{ background: ACTION, color: INK, boxShadow: "0 12px 32px rgba(37,211,102,0.28)" }}>
              {c.finalCta.primary}
            </Link>
            <a href="https://wa.me/50937124488" target="_blank" rel="noopener noreferrer"
              className="flex h-[58px] items-center justify-center rounded-xl border px-7 text-[16px] font-semibold text-white transition-colors hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.16)" }}>
              {c.finalCta.secondary}
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ PIED DE PAGE ══════════ */}
      <footer className="px-5 pb-12 pt-14 sm:px-8 lg:px-12" style={{ background: "#041A15" }}>
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="grid gap-10 sm:grid-cols-3 lg:grid-cols-[5fr_2fr_2fr_2fr]">
            <div className="flex flex-col gap-3.5 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <Mark size={28} />
                <Wordmark className="text-[16.5px] font-extrabold tracking-tight text-white" />
              </div>
              <span className="max-w-[290px] text-[14px] leading-[1.62] text-[#7D9A92]">{c.footer.tagline}</span>
            </div>
            <FooterCol title={c.footer.productCol} links={c.footer.productLinks} />
            <FooterCol
              title={c.footer.companyCol}
              links={c.footer.companyLinks}
              hrefs={{ 1: "/kondisyon", 2: "/konfidansyalite" }}
            />
            <FooterCol title={c.footer.languageCol} links={["Français", "Kreyòl", "English"]} />
          </div>
          {/* La signature de la marque, et le retour à l'accueil.
              Le pied de page menait partout sauf en haut : un visiteur arrivé
              par un lien profond n'avait aucun chemin vers la page d'accueil. */}
          <div className="mt-9 flex flex-col gap-4 border-t pt-9" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
              <span className="text-[13.5px] font-semibold text-[#7D9A92]">
                <Wordmark className="font-extrabold text-white" /> · {c.footer.slogan}
              </span>
              <Link
                href="/"
                className="flex h-10 shrink-0 items-center rounded-xl border px-4 text-[13px] font-bold text-white transition-colors hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.22)" }}
              >
                {c.footer.home}
              </Link>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[13px] text-[#5E7E75]">{c.footer.rights}</span>
              <span className="text-[13px] text-[#5E7E75]">{c.footer.city}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────── Sous-composants ─────────── */

function Eyebrow({ children, color = GREEN }: { children: React.ReactNode; color?: string }) {
  return <span className="text-[12.5px] font-bold uppercase tracking-[1.4px]" style={{ color }}>{children}</span>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-balance text-[30px] font-bold leading-[1.1] tracking-[-1.1px] sm:text-[38px] lg:text-[46px] lg:tracking-[-1.8px]" style={{ color: INK }}>
      {children}
    </h2>
  );
}

function ShopItem({ name, price, tone }: { name: string; price: string; tone: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border p-2.5" style={{ borderColor: "#E6ECEA" }}>
      <div className="h-[72px] rounded-[9px]" style={{ background: tone }} />
      <span className="text-[12.5px] font-semibold">{name}</span>
      <span className="text-[14px] font-extrabold" style={{ color: INK }}>{price}</span>
    </div>
  );
}

function Column({ label, count, accent, children }: { label: string; count: number; accent?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[162px] flex-col gap-2.5 lg:min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-bold" style={{ color: accent ?? "#47605A" }}>{label}</span>
        <span className="text-[12px] font-semibold" style={{ color: accent ?? "#A3B5AF" }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

function Card({
  ref_, name, amount, amountColor, tag, tagBg, tagColor, bg = "#F7FAF9", border = "#E6ECEA",
}: {
  ref_: string; name: string; amount?: string; amountColor?: string;
  tag?: string; tagBg?: string; tagColor?: string; bg?: string; border?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl p-3.5" style={{ background: bg, border: `1px solid ${border}` }}>
      <span className="text-[11px] font-semibold text-[#7D9A92]">{ref_}</span>
      <span className="text-[13px] font-semibold">{name}</span>
      {amount && <span className="text-[14px] font-extrabold" style={{ color: amountColor ?? INK }}>{amount}</span>}
      {tag && (
        <span className="self-start rounded-md px-2 py-0.5 text-[10.5px] font-bold" style={{ background: tagBg, color: tagColor }}>{tag}</span>
      )}
    </div>
  );
}

function FooterCol({ title, links, hrefs }: { title: string; links: string[]; hrefs?: Record<number, string> }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] font-bold text-white">{title}</span>
      {links.map((l, i) =>
        hrefs?.[i] ? (
          <a key={l} href={hrefs[i]} className="text-[14px] text-[#7D9A92] underline-offset-4 hover:text-white hover:underline">
            {l}
          </a>
        ) : (
          <span key={l} className="text-[14px] text-[#7D9A92]">{l}</span>
        ),
      )}
    </div>
  );
}

/** Compte de 0 jusqu'à `to` la première fois que le nombre entre dans l'écran. */
function CountUp({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setValue(to);
      return;
    }

    let frame = 0;
    let started = false;

    const run = () => {
      started = true;
      window.removeEventListener("scroll", maybeStart);
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        // Décélération : le chiffre ralentit en approchant de sa valeur.
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    // Même raison que pour la révélation : on mesure la position au lieu de
    // s'en remettre à IntersectionObserver, qui ne se déclenche pas sans rendu.
    const maybeStart = () => {
      if (started) return;
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) run();
    };

    maybeStart();
    window.addEventListener("scroll", maybeStart, { passive: true });

    return () => {
      window.removeEventListener("scroll", maybeStart);
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return <span ref={ref} className="tabular-nums">{value.toLocaleString("fr-HT")}</span>;
}

/* ─────────── Icônes ─────────── */

function Mark({ size = 32 }: { size?: number }) {
  const id = `cvzlg-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#25D366" />
          <stop offset="1" stopColor="#008069" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="116" height="116" rx="30" fill={`url(#${id})`} />
      <circle cx="60" cy="56" r="40" fill="#fff" />
      <path d="M38 80 L28 100 L56 85 Z" fill="#fff" />
      <path d="M75.6 38.4 A 22 22 0 1 0 75.6 69.6" fill="none" stroke="#008069" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="m10 9 5 3-5 3z" />
    </svg>
  );
}

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={INK} aria-hidden="true">
      <path d="M20 3.9A9.9 9.9 0 0 0 4.6 16.1L3.3 21l5-1.3a9.9 9.9 0 0 0 14.4-8.8A9.8 9.8 0 0 0 20 3.9zM12 19.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 19.2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACTION} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 13 5 5L20 7" />
    </svg>
  );
}

function FeatureIcon({ index }: { index: number }) {
  const stroke = index === 3 ? "#B25E09" : GREEN;
  const common = { width: 21, height: 21, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (index) {
    case 0: return (<svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></svg>);
    case 1: return (<svg {...common}><path d="M20 7h-9M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></svg>);
    case 2: return (<svg {...common}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>);
    case 3: return (<svg {...common}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>);
    case 4: return (<svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg>);
    default: return (<svg {...common}><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /></svg>);
  }
}

/** Motif décoratif évoquant un QR. Ce n'est pas un code scannable. */
function QrArt() {
  const modules = [
    [10,1],[12,1],[15,1],[18,1],[11,3],[13,3],[16,3],[10,4],[14,4],[18,4],[12,6],[15,6],[17,6],
    [1,10],[3,10],[6,10],[9,10],[12,10],[14,10],[17,10],[20,10],[23,10],[26,10],
    [2,12],[5,12],[8,12],[11,12],[13,12],[16,12],[19,12],[22,12],[25,12],[27,12],
    [1,14],[4,14],[7,14],[10,14],[15,14],[18,14],[21,14],[24,14],
    [3,16],[6,16],[9,16],[12,16],[14,16],[17,16],[20,16],[23,16],[26,16],
    [2,18],[5,18],[11,18],[16,18],[19,18],[22,18],[25,18],
    [10,21],[13,21],[16,21],[19,21],[22,21],[26,21],
    [11,23],[14,23],[18,23],[21,23],[24,23],
    [10,25],[12,25],[15,25],[20,25],[23,25],[27,25],
    [11,27],[13,27],[17,27],[19,27],[22,27],[25,27],
  ];
  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width="7" height="1" /><rect x={x} y={y + 6} width="7" height="1" />
      <rect x={x} y={y} width="1" height="7" /><rect x={x + 6} y={y} width="1" height="7" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg width="108" height="108" viewBox="0 0 29 29" shapeRendering="crispEdges" className="sm:h-[118px] sm:w-[118px]" aria-hidden="true">
      <rect x="0" y="0" width="29" height="29" fill="#fff" />
      <g fill={INK}>
        {finder(1, 1)}{finder(21, 1)}{finder(1, 21)}
        {modules.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)}
      </g>
    </svg>
  );
}
