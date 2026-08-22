"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// Upload d'image vers Supabase Storage (bucket "media") + renvoie l'URL publique.
export function ImageUpload({
  value,
  onChange,
  folder,
  shape = "square",
  label = "Ajoute yon foto",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  shape?: "square" | "wide";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!HAS_SUPABASE) {
      setErr("Storage pa konfigire (mode demo)");
      return;
    }
    setErr(null);
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
      setErr(e instanceof Error ? e.message : "Erè pandan upload");
    } finally {
      setBusy(false);
    }
  }

  const box = shape === "wide" ? "h-28 w-full" : "h-24 w-24";

  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-[#F7F8F9]`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-5-5L5 21" /></svg>
        )}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[11px] font-semibold text-brand">N ap chaje…</div>}
      </div>

      <div className="flex flex-col gap-1.5">
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex h-9 items-center justify-center rounded-lg bg-[#E7F7F1] px-3 text-[12.5px] font-bold text-brand disabled:opacity-60">
          {value ? "Chanje foto" : label}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-[12px] font-semibold text-[#C0392B]">
            Retire
          </button>
        )}
        {err && <span className="max-w-[180px] text-[11px] text-[#C0392B]">{err}</span>}
      </div>
    </div>
  );
}
