"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { cropImage, fitImage, frameImage, scaleImage, type Frame } from "@/lib/image";
import { PhotoFramer } from "@/components/PhotoFramer";
import { useDict } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";

const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

const MAX_UPLOAD_MB = 12;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// Upload d'image vers Supabase Storage (bucket "media") + renvoie l'URL publique.
export function ImageUpload({
  value,
  onChange,
  folder,
  shape = "square",
  label,
  targetWidth,
  targetHeight,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  shape?: "square" | "wide";
  label?: string;
  targetWidth?: number;
  targetHeight?: number;
}) {
  const c = useDict(COMMON_COPY).upload;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Photo de produit en attente de cadrage : le marchand décide avant l'envoi.
  const [pending, setPending] = useState<File | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Le champ garde la dernière valeur choisie : sans cette remise à zéro,
    // reprendre la même photo après une annulation ne déclenche plus rien.
    e.target.value = "";
    if (!file) return;

    // L'attribut `accept` du champ ne filtre que la boîte de dialogue : un
    // glisser-déposer ou un navigateur permissif laisse passer autre chose.
    if (!file.type.startsWith("image/")) {
      setErr(c.notImage);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErr(c.tooBig(MAX_UPLOAD_MB));
      return;
    }

    setErr(null);

    // Une photo de produit passe d'abord par l'écran de cadrage : c'est le
    // marchand qui décide de ce qui restera visible sur sa vitrine.
    if (folder === "products") {
      setPending(file);
      return;
    }

    // Les autres images n'ont rien à décider. Seule la bannière est recadrée :
    // c'est un bandeau. Un logo ou un QR code est posé entier dans un carré —
    // recadrer un QR de paiement le rendrait impossible à scanner.
    const isBanner = folder === "covers" || shape === "wide";
    await send(
      isBanner
        ? await cropImage(file, targetWidth ?? 1200, targetHeight ?? 400)
        : await fitImage(file, targetWidth ?? targetHeight ?? 800, targetWidth ?? targetHeight ?? 800),
    );
  }

  // Le marchand a choisi son cadrage, ou préféré garder la photo entière.
  const longestSide = Math.max(targetWidth ?? 0, targetHeight ?? 0) || 1200;
  async function onFramed(frame: Frame) {
    const file = pending;
    setPending(null);
    if (file) await send(await frameImage(file, frame, Math.min(longestSide, Math.round(frame.size))));
  }
  async function onWhole() {
    const file = pending;
    setPending(null);
    if (file) await send(await scaleImage(file, longestSide));
  }

  async function send(file: File) {
    if (!HAS_SUPABASE) {
      setErr(c.storageOff);
      return;
    }
    setBusy(true);
    try {
      const sb = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("media").upload(path, file, {
        upsert: true,
        cacheControl: "3600",
      });
      if (error) throw error;
      const { data } = sb.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : c.failed);
    } finally {
      setBusy(false);
    }
  }

  // La bannière occupe toute la largeur : sur un écran de 375 px, garder le
  // bouton sur la même ligne le poussait hors de l'écran.
  const box = shape === "wide" ? "h-28 w-full max-w-[280px]" : "h-24 w-24";

  // Ce qu'on annonce au marchand vient du MÊME test que le traitement appliqué
  // plus haut. Un texte écrit à la main sur chaque écran d'appel finirait par
  // décrire un comportement qui a changé ailleurs, sans que rien ne le signale.
  //
  // Rien n'est annoncé pour une photo de produit lorsqu'un écran de cadrage
  // suit : le marchand va voir de ses yeux ce qui sera gardé.
  const annonce = (() => {
    if (folder === "covers" || shape === "wide") return c.format.banner(targetWidth ?? 1200, targetHeight ?? 400);
    if (folder === "products") return c.format.product;
    return c.format.square(targetWidth ?? targetHeight ?? 800);
  })();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {pending && <PhotoFramer file={pending} onCancel={() => setPending(null)} onFrame={onFramed} onWhole={onWhole} />}
      <div className={`relative flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-[#F7F8F9]`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-5-5L5 21" /></svg>
        )}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[11px] font-semibold text-brand">{c.loading}</div>}
      </div>

      <div className="flex flex-col gap-1.5">
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex h-9 items-center justify-center rounded-lg bg-[#E7F7F1] px-3 text-[12.5px] font-bold text-brand disabled:opacity-60">
          {value ? c.change : label ?? c.change}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-[12px] font-semibold text-[#C0392B]">
            {c.remove}
          </button>
        )}
        {err
          ? <span className="max-w-[240px] text-[11px] text-[#C0392B]">{err}</span>
          : <span className="max-w-[240px] text-[11px] leading-snug text-ink-muted">{annonce}</span>}
      </div>
    </div>
  );
}
