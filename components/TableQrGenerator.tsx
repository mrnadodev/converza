"use client";

import { useState } from "react";
import type { Business } from "@/lib/types";

export function TableQrGenerator({ business }: { business: Business }) {
  const [tableCount, setTableCount] = useState<number>(10);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://converza.ht";
  const storefrontUrl = `${baseUrl}/p/${business.slug}`;

  function getTableUrl(num: number) {
    return `${storefrontUrl}?table=${num}`;
  }

  function getQrImageUrl(url: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=0E1B17`;
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const cardsHtml = Array.from({ length: tableCount }, (_, i) => i + 1)
      .map(
        (num) => `
        <div style="border: 2px solid #0E1B17; border-radius: 20px; padding: 20px; text-align: center; font-family: system-ui, sans-serif; background: #ffffff; page-break-inside: avoid; display: flex; flex-col; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #16B67C; margin-bottom: 4px;">CONVERZA RESTORAN</div>
          <div style="font-size: 18px; font-weight: 900; color: #0E1B17; margin-bottom: 12px;">${business.name}</div>
          
          <div style="background: #F7F8F9; padding: 12px; border-radius: 16px; display: inline-block; margin-bottom: 12px; border: 1px solid #E7EBED;">
            <img src="${getQrImageUrl(getTableUrl(num))}" alt="QR Table ${num}" style="width: 180px; height: 180px; display: block;" />
          </div>

          <div style="font-size: 24px; font-weight: 900; color: #0E1B17; margin-bottom: 4px;">📍 TABLE #${num}</div>
          <div style="font-size: 12px; font-weight: 600; color: #536471;">Scannez pour voir le Menu & Commander</div>
          <div style="font-size: 10px; color: #8696A0; margin-top: 8px;">Pas besoin d'application · Commande directe WhatsApp</div>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chevalets QR Code Tables - ${business.name}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10mm; background: #fff; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15mm; }
            }
            body { font-family: system-ui, sans-serif; background: #f0f2f5; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 20px; text-align: center;" class="no-print">
            <button onclick="window.print()" style="background: #16B67C; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer;">
              🖨️ Imprimer les Chevalets de Table (${tableCount} Tables)
            </button>
          </div>
          <div class="grid">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-6 text-white shadow-xl border border-emerald-500/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 font-black text-2xl shadow-md">
            🍽️
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Générateur de QR Codes Menu & Tables</h3>
            <p className="text-xs text-emerald-200">
              Imprimez des cartes QR Code pour vos tables. Vos clients scannent et commandent en salle sans menu papier !
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          type="button"
          className="rounded-xl bg-brand-green px-4 py-2.5 text-xs font-black text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          🖨️ Imprimer les Chevalets (${tableCount} Tables)
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div>
          <label className="text-xs font-extrabold text-emerald-300 block mb-1">
            Nombre de Tables dans votre Restaurant :
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={tableCount}
            onChange={(e) => setTableCount(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="h-11 w-full rounded-xl border border-emerald-500/40 bg-slate-900 px-3.5 text-sm font-bold text-white outline-none focus:border-brand-green"
          />
        </div>

        <div className="sm:col-span-2 rounded-2xl bg-white/5 p-3.5 border border-white/10 text-xs">
          <span className="font-bold text-amber-300 block mb-1">💡 Comment installer sur vos tables ?</span>
          <p className="text-slate-300 leading-relaxed">
            Cliquez sur <b>"Imprimer"</b>, découpez les chevalets et posez-les sur chaque table. Le système inclut automatiquement <code>?table=1</code>, <code>?table=2</code>... dans l'URL pour identifier les commandes du manager.
          </p>
        </div>
      </div>

      {/* Aperçu des QR Codes */}
      <div className="mt-6">
        <span className="text-xs font-black uppercase text-emerald-400 tracking-wider block mb-3">
          Aperçu des Cartes de Table (Exemples 1 à {Math.min(4, tableCount)}) :
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: Math.min(4, tableCount) }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-3.5 text-slate-900 shadow-md border border-emerald-200 text-center"
            >
              <span className="text-[10px] font-black text-brand uppercase tracking-wider">CONVERZA</span>
              <span className="text-xs font-black text-slate-900 line-clamp-1">{business.name}</span>

              <img
                src={getQrImageUrl(getTableUrl(num))}
                alt={`QR Table ${num}`}
                className="my-2.5 h-24 w-24 rounded-xl border border-slate-200 bg-white p-1"
              />

              <span className="text-sm font-black text-slate-900">📍 TABLE #{num}</span>
              <span className="text-[9.5px] font-semibold text-slate-500 mt-0.5">Scannez pour commander</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
