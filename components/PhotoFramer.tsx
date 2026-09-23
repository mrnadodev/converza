"use client";

import { useEffect, useRef, useState } from "react";
import { frameFromView, type Frame } from "@/lib/image";
import { useDict } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";

// Cadrage d'une photo de produit, au moment où le marchand la choisit.
//
// Les marchands photographient au téléphone, souvent de loin : une chaussure
// prise à deux mètres se retrouve minuscule au milieu de la carte, quel que
// soit le design de la vitrine. Aucun réglage d'affichage ne rattrape ça — il
// faut que le marchand puisse se rapprocher lui-même.
//
// Le cadrage n'est jamais imposé : « Garder la photo entière » renvoie la
// photo telle quelle, dans son format d'origine. Ce que le marchand voit dans
// le carré est exactement ce qui sera gardé.

const VIEWPORT = 260;
const MAX_ZOOM = 4;

export function PhotoFramer({
  file,
  onCancel,
  onFrame,
  onWhole,
}: {
  file: File;
  onCancel: () => void;
  onFrame: (frame: Frame) => void;
  onWhole: () => void;
}) {
  const c = useDict(COMMON_COPY).upload.frame;
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => setSize({ w: img.width, h: img.height });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!src || !size) return null;

  // Le carré affiché correspond au plus petit côté de la photo : c'est le plus
  // grand cadrage possible sans inventer de bord vide.
  const widest = Math.min(size.w, size.h);
  const frame = frameFromView(size.w, size.h, zoom, offset.x, offset.y);
  // Facteur entre les pixels de la photo et ceux de l'écran.
  const shown = VIEWPORT / frame.size;

  function move(clientX: number, clientY: number) {
    if (!drag.current || !size) return;
    const dx = (clientX - drag.current.x) / shown;
    const dy = (clientY - drag.current.y) / shown;
    drag.current = { x: clientX, y: clientY };
    const room = (widest - frame.size) / 2 + Math.abs(size.w - size.h) / 2;
    const cap = (v: number) => Math.min(Math.max(v, -room), room);
    setOffset((o) => ({ x: cap(o.x - dx), y: cap(o.y - dy) }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-[340px] flex-col gap-3 rounded-2xl bg-white p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-extrabold text-ink">{c.title}</h3>
          <p className="text-[12px] text-ink-muted">{c.hint}</p>
        </div>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-xl bg-slate-100"
          style={{ width: VIEWPORT, height: VIEWPORT }}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => move(e.clientX, e.clientY)}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute max-w-none cursor-grab select-none active:cursor-grabbing"
            style={{
              width: size.w * shown,
              height: size.h * shown,
              left: -frame.x * shown,
              top: -frame.y * shown,
            }}
          />
        </div>

        <label className="flex items-center gap-2.5">
          <span className="text-[11.5px] font-semibold text-ink-muted">{c.closer}</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 flex-1 accent-brand"
            aria-label={c.closer}
          />
        </label>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onFrame(frame)}
            className="flex h-10 items-center justify-center rounded-xl bg-brand text-[13px] font-extrabold text-white active:scale-95"
          >
            {c.use}
          </button>
          <button
            type="button"
            onClick={onWhole}
            className="flex h-9 items-center justify-center rounded-xl bg-[#E7F7F1] text-[12.5px] font-bold text-brand active:scale-95"
          >
            {c.whole}
          </button>
          <button type="button" onClick={onCancel} className="text-[12px] font-semibold text-ink-muted">
            {c.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
