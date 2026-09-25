"use client";

import { useState } from "react";
import { useDict } from "@/components/LanguageContext";
import { SETTINGS_COPY } from "@/lib/i18n/app/settings";
import type { Business } from "@/lib/types";

// Les offres annoncent « jusqu'à 25 tables ». Le champ acceptait 50 : ce qu'on
// vend et ce qu'on livre doivent dire la même chose.
const MAX_TABLES = 25;

export function TableQrGenerator({ business }: { business: Business }) {
  const q = useDict(SETTINGS_COPY).tables;
  const [tableCount, setTableCount] = useState<number>(10);

  // La vitrine vit sur /b/<slug> : les chevalets pointaient vers /p/<slug>, une
  // adresse qui n'existe pas — chaque QR imprimé menait à une page d'erreur.
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const tableUrl = (num: number) => `${baseUrl}/b/${business.slug}?table=${num}`;
  const qrImageUrl = (url: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=0E1B17`;

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch] ?? ch);
    const cards = Array.from({ length: tableCount }, (_, i) => i + 1)
      .map(
        (num) => `
        <div class="card">
          <div class="brand">${esc(business.name)}</div>
          <img src="${esc(qrImageUrl(tableUrl(num)))}" alt="" />
          <div class="table">${esc(q.tableLabel(String(num)))}</div>
          <div class="hint">${esc(q.scanHint)}</div>
          <div class="note">${esc(q.noAppNote)}</div>
        </div>`,
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>${esc(q.printTitle(business.name))}</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #f0f2f5; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
            .card { border: 2px solid #0E1B17; border-radius: 20px; padding: 20px; text-align: center; background: #fff; page-break-inside: avoid; }
            .brand { font-size: 18px; font-weight: 900; color: #0E1B17; margin-bottom: 12px; }
            .card img { width: 180px; height: 180px; display: block; margin: 0 auto 12px; }
            .table { font-size: 24px; font-weight: 900; color: #0E1B17; margin-bottom: 4px; }
            .hint { font-size: 12px; font-weight: 600; color: #536471; }
            .note { font-size: 10px; color: #8696A0; margin-top: 8px; }
            @media print {
              body { margin: 0; padding: 10mm; background: #fff; }
              .grid { grid-template-columns: 1fr 1fr; gap: 15mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom:20px;text-align:center">
            <button onclick="window.print()" style="background:#16B67C;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;font-size:16px;cursor:pointer">
              ${esc(q.print(tableCount))}
            </button>
          </div>
          <div class="grid">${cards}</div>
        </body>
      </html>`);
    printWindow.document.close();
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[14px] font-extrabold text-ink">{q.title}</h2>
        <p className="text-[11.5px] text-ink-muted">{q.desc}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">{q.count}</span>
          <input
            type="number"
            min={1}
            max={MAX_TABLES}
            value={tableCount}
            onChange={(e) => setTableCount(Math.max(1, Math.min(MAX_TABLES, Number(e.target.value) || 1)))}
            className="h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[15px] outline-none focus:border-brand focus:bg-white"
          />
        </label>
        <button
          type="button"
          onClick={handlePrint}
          className="flex h-12 cursor-pointer items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-white active:scale-[0.99]"
        >
          {q.print(tableCount)}
        </button>
      </div>

      <p className="rounded-xl bg-[#F3F8F6] p-3 text-[11.5px] leading-relaxed text-ink-soft">{q.howTo}</p>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{q.preview}</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: Math.min(4, tableCount) }, (_, i) => i + 1).map((num) => (
            <div key={num} className="flex flex-col items-center rounded-2xl border border-line bg-white p-3 text-center">
              <span className="line-clamp-1 text-xs font-black text-ink">{business.name}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImageUrl(tableUrl(num))} alt="" className="my-2.5 h-24 w-24 rounded-xl border border-line bg-white p-1" />
              <span className="text-sm font-black text-ink">{q.tableLabel(String(num))}</span>
              <span className="mt-0.5 text-[9.5px] font-semibold text-ink-faint">{q.scanHint}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
