"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { CUSTOMERS_COPY } from "@/lib/i18n/app/customers";
import { MESSAGE_COPY } from "@/lib/i18n/app/messages";
import { scaleImage } from "@/lib/image";
import { waMeLink } from "@/lib/whatsapp";
import type { Customer } from "@/lib/types";

/**
 * Envoi guidé d'une promotion à plusieurs clients.
 *
 * WhatsApp n'offre aucun envoi groupé gratuit : `wa.me` ouvre une conversation,
 * une seule. Plutôt que de promettre une diffusion qui n'existe pas, on enchaîne
 * les clients un par un — message déjà écrit, photos déjà préparées — et le
 * marchand n'a qu'à appuyer sur envoyer dans WhatsApp.
 *
 * Le mot « envoyé » n'est jamais employé : l'application ouvre la conversation,
 * elle ne peut pas savoir si le marchand a réellement appuyé. Les libellés
 * disent donc « ouvert », ce qui est la seule chose dont on soit sûr.
 */

const REPRISE = "cvz-promo-encours";

interface Reprise {
  ids: string[];
  index: number;
  message: string;
}

export function PromoBroadcast({
  customers,
  businessName,
  businessSlug,
  initialPromoText,
  onClose,
}: {
  customers: Customer[];
  businessName: string;
  businessSlug: string;
  initialPromoText?: string | null;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const k = useDict(CUSTOMERS_COPY);
  const c = useDict(COMMON_COPY);
  const m = MESSAGE_COPY[language] ?? MESSAGE_COPY.fr;
  const b = k.broadcast;

  const [etape, setEtape] = useState<"qui" | "message" | "envoi">("qui");
  const [choisis, setChoisis] = useState<string[]>([]);
  const [texte, setTexte] = useState(initialPromoText?.trim() || m.promoDefault(businessName));
  const [photos, setPhotos] = useState<File[]>([]);
  const [apercus, setApercus] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [ouverts, setOuverts] = useState<string[]>([]);
  const [photosPretes, setPhotosPretes] = useState(false);
  const fichiers = useRef<HTMLInputElement>(null);

  const lien = typeof window === "undefined" ? `/b/${businessSlug}` : `${window.location.origin}/b/${businessSlug}`;

  // Reprise après une interruption. Sur téléphone, ouvrir WhatsApp quitte le
  // navigateur ; au retour, le système a pu recharger la page. Sans cela, un
  // marchand à mi-chemin de quarante clients repartait de zéro.
  useEffect(() => {
    try {
      const brut = localStorage.getItem(REPRISE);
      if (!brut) return;
      const r = JSON.parse(brut) as Reprise;
      const vivants = r.ids.filter((id) => customers.some((cl) => cl.id === id));
      if (vivants.length === 0 || r.index >= vivants.length) {
        localStorage.removeItem(REPRISE);
        return;
      }
      setChoisis(vivants);
      setIndex(r.index);
      setTexte(r.message);
      setOuverts(vivants.slice(0, r.index));
      setEtape("envoi");
      // Les photos ne survivent pas : un fichier ne se range pas dans
      // localStorage. On le dit plutôt que de laisser croire le contraire.
      setPhotosPretes(true);
    } catch {
      /* stockage indisponible : on démarre simplement à zéro */
    }
  }, [customers]);

  useEffect(() => {
    if (etape !== "envoi") return;
    try {
      localStorage.setItem(REPRISE, JSON.stringify({ ids: choisis, index, message: texte } satisfies Reprise));
    } catch {
      /* rien à faire : la reprise est un confort, pas une exigence */
    }
  }, [etape, choisis, index, texte]);

  const destinataires = useMemo(
    () => choisis.map((id) => customers.find((cl) => cl.id === id)).filter((x): x is Customer => Boolean(x)),
    [choisis, customers],
  );
  const courant = destinataires[index];

  const messageDe = (nom: string) => `${m.promoGreeting(nom)}\n\n${texte.trim()}\n👉 ${lien}`;

  function basculer(id: string) {
    setChoisis((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  async function choisirPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const pris = Array.from(e.target.files).slice(0, 3);
    const reduites = await Promise.all(pris.map((f) => scaleImage(f, 1200)));
    setPhotos(reduites);
    setApercus(reduites.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  }

  /**
   * Les photos sont téléchargées une seule fois, au début.
   *
   * Un téléchargement par client aurait rempli le dossier du marchand de
   * quarante copies de la même image. Sur les appareils qui savent partager
   * un fichier, on s'en passe : la photo voyage alors avec le message.
   */
  function preparerPhotos() {
    if (photos.length === 0 || photosPretes) return;
    for (const [i, f] of photos.entries()) {
      const a = document.createElement("a");
      a.download = `promo-${i + 1}-${f.name}`;
      a.href = URL.createObjectURL(f);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setPhotosPretes(true);
  }

  async function ouvrir(client: Customer) {
    const corps = messageDe(client.full_name);
    if (photos.length > 0 && navigator.canShare?.({ files: photos })) {
      try {
        await navigator.share({ files: photos, title: businessName, text: corps });
        avancer(client.id);
        return;
      } catch {
        /* partage refusé : on retombe sur WhatsApp */
      }
    }
    window.open(waMeLink(client.phone_e164, corps), "_blank");
    avancer(client.id);
  }

  function avancer(id: string) {
    setOuverts((l) => (l.includes(id) ? l : [...l, id]));
    setIndex((i) => i + 1);
  }

  function terminer() {
    try {
      localStorage.removeItem(REPRISE);
    } catch {
      /* ignore */
    }
    onClose();
  }

  const fini = etape === "envoi" && index >= destinataires.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-[15px] font-extrabold text-ink">{b.title}</h2>
            <p className="truncate text-[11.5px] text-ink-muted">
              {etape === "qui" ? b.stepWho : etape === "message" ? b.stepMessage : fini ? b.done(ouverts.length) : b.progress(index + 1, destinataires.length)}
            </p>
          </div>
          <button onClick={terminer} aria-label={c.actions.close} className="h-9 w-9 shrink-0 cursor-pointer rounded-full text-lg text-ink-muted hover:bg-[#F3F6F4]">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {etape === "qui" && (
            <>
              <div className="flex flex-wrap items-center gap-2 pb-3">
                <button
                  onClick={() => setChoisis(choisis.length === customers.length ? [] : customers.map((x) => x.id))}
                  className="h-8 cursor-pointer rounded-lg border border-line px-3 text-[12px] font-bold text-ink active:scale-95"
                >
                  {choisis.length === customers.length ? b.selectNone : b.selectAll}
                </button>
                {(["vip", "kliyan_fidel", "nouvo_kliyan"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChoisis(customers.filter((x) => (x.tags ?? []).includes(t)).map((x) => x.id))}
                    className="h-8 cursor-pointer rounded-lg border border-line px-3 text-[12px] font-bold text-ink-muted active:scale-95"
                  >
                    {k.tags[t]}
                  </button>
                ))}
              </div>
              <ul className="flex flex-col divide-y divide-line/60">
                {customers.map((cl) => (
                  <li key={cl.id}>
                    <label className="flex cursor-pointer items-center gap-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={choisis.includes(cl.id)}
                        onChange={() => basculer(cl.id)}
                        className="h-4 w-4 shrink-0 accent-[#008069]"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[13.5px] font-bold text-ink">{cl.full_name}</span>
                        <span className="text-[11.5px] text-ink-muted">{cl.phone_e164}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          {etape === "message" && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-bold text-ink-muted">{b.messageLabel}</span>
                <textarea
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  rows={5}
                  maxLength={700}
                  className="rounded-xl border border-line p-3 text-[13px] leading-relaxed outline-none focus:border-brand"
                />
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-[11.5px] font-bold text-ink-muted">{b.photos}</span>
                <input ref={fichiers} type="file" accept="image/*" multiple onChange={choisirPhotos} className="hidden" />
                <button
                  onClick={() => fichiers.current?.click()}
                  className="h-10 cursor-pointer rounded-xl border border-line text-[12.5px] font-bold text-ink active:scale-95"
                >
                  {photos.length > 0 ? b.photosChosen(photos.length) : b.addPhotos}
                </button>
                {apercus.length > 0 && (
                  <div className="flex gap-2">
                    {apercus.map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={src} alt="" className="h-16 w-16 rounded-xl border border-line object-cover" />
                    ))}
                  </div>
                )}
                <p className="text-[11px] leading-snug text-ink-muted">{b.photosHint}</p>
              </div>

              <div className="rounded-xl bg-[#F7F8F9] p-3">
                <span className="text-[11px] font-bold uppercase text-ink-muted">{b.preview}</span>
                <p className="whitespace-pre-wrap pt-1 text-[12.5px] leading-relaxed text-ink">
                  {messageDe(destinataires[0]?.full_name ?? k.tags.vip)}
                </p>
              </div>
            </div>
          )}

          {etape === "envoi" && !fini && courant && (
            <div className="flex flex-col gap-3 py-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF2F1]">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(index / destinataires.length) * 100}%` }} />
              </div>
              <div className="flex flex-col items-center gap-1 py-4 text-center">
                <span className="text-[19px] font-extrabold text-ink">{courant.full_name}</span>
                <span className="text-[12.5px] text-ink-muted">{courant.phone_e164}</span>
              </div>
              <div className="rounded-xl bg-[#F7F8F9] p-3">
                <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">{messageDe(courant.full_name)}</p>
              </div>
            </div>
          )}

          {fini && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-[17px] font-extrabold text-ink">{b.done(ouverts.length)}</span>
              <p className="max-w-xs text-[12.5px] leading-relaxed text-ink-muted">{b.doneHint}</p>
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-line px-4 py-3">
          {etape === "qui" && (
            <>
              <span className="text-[12px] font-bold text-ink-muted">{b.chosen(choisis.length)}</span>
              <button
                onClick={() => setEtape("message")}
                disabled={choisis.length === 0}
                className="ml-auto h-11 cursor-pointer rounded-xl bg-brand px-5 text-[13px] font-extrabold text-white disabled:opacity-40 active:scale-95"
              >
                {b.next}
              </button>
            </>
          )}

          {etape === "message" && (
            <>
              <button onClick={() => setEtape("qui")} className="h-11 cursor-pointer rounded-xl border border-line px-4 text-[13px] font-bold text-ink active:scale-95">
                {c.actions.back}
              </button>
              <button
                onClick={() => {
                  preparerPhotos();
                  setEtape("envoi");
                }}
                disabled={!texte.trim()}
                className="ml-auto h-11 cursor-pointer rounded-xl bg-brand px-5 text-[13px] font-extrabold text-white disabled:opacity-40 active:scale-95"
              >
                {b.start(destinataires.length)}
              </button>
            </>
          )}

          {etape === "envoi" && !fini && courant && (
            <>
              <button
                onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                disabled={index === 0}
                className="h-11 cursor-pointer rounded-xl border border-line px-4 text-[13px] font-bold text-ink disabled:opacity-40 active:scale-95"
              >
                {c.actions.back}
              </button>
              <button onClick={() => setIndex((i) => i + 1)} className="h-11 cursor-pointer rounded-xl px-3 text-[12.5px] font-bold text-ink-muted active:scale-95">
                {b.skip}
              </button>
              <button
                onClick={() => ouvrir(courant)}
                className="ml-auto h-11 flex-1 cursor-pointer rounded-xl bg-brand-green px-4 text-[13px] font-extrabold text-white active:scale-95"
              >
                {b.open}
              </button>
            </>
          )}

          {fini && (
            <button onClick={terminer} className="ml-auto h-11 cursor-pointer rounded-xl bg-brand px-5 text-[13px] font-extrabold text-white active:scale-95">
              {c.actions.close}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
