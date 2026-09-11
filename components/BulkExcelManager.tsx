"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateExcelTemplate, parseBulkProducts, type ImportResult } from "@/lib/excel";
import { saveBulkProducts } from "@/app/katalog/actions";
import { formatMoney } from "@/lib/money";
import type { Business } from "@/lib/types";

export function BulkExcelManager({ business }: { business: Business }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [importData, setImportData] = useState<ImportResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // 1. Télécharger le modèle Excel (CSV UTF-8)
  function handleDownloadTemplate() {
    try {
      const csvContent = generateExcelTemplate();
      const slug = business?.slug || "boutik";
      const fileName = `modele_katalog_converza_${slug}.csv`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.setAttribute("download", fileName);

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback Data URI si Blob URL est bloqué
      const csvContent = generateExcelTemplate();
      const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      window.open(encodedUri);
    }
  }

  // 2. Traiter le fichier uploadé par le marchand
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = parseBulkProducts(text, business.id);
        setImportData(result);
        setModalOpen(true);
      }
    };
    reader.readAsText(file, "UTF-8");
    // reset input
    e.target.value = "";
  }

  // 3. Valider et envoyer les produits en base
  function confirmImport() {
    if (!importData || importData.products.length === 0) return;
    start(async () => {
      const res = await saveBulkProducts(importData.products);
      if (res.ok) {
        setStatusMsg(`✅ ${res.count ?? importData.products.length} pwodwi ajoute ak siksè!`);
        setImportData(null);
        setModalOpen(false);
        router.refresh();
      } else {
        setStatusMsg(`❌ Erè: ${res.error}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold">Import / Eksport an Vrak</span>
            <span className="text-xs text-ink-muted">Manje, Rad, Dépôt Excel Template</span>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-xl bg-[#E7F7F1] p-3 text-xs font-bold text-brand">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <a
          href="/api/download-template"
          download={`modele_katalog_converza_${business?.slug || "boutik"}.csv`}
          onClick={(e) => {
            // fallback JS blob si besoin
            handleDownloadTemplate();
          }}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-[#F7F8F9] px-3 text-xs font-bold text-ink active:scale-95 cursor-pointer no-underline"
        >
          <span>📥 Telechaje Modèl Excel</span>
        </a>

        <label className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E7F7F1] px-3 text-xs font-bold text-brand cursor-pointer active:scale-95">
          <span>📤 Enpòte Fichye Excel</span>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Modal de prévisualisation de l'import */}
      {modalOpen && importData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold">Preview Enpòtasyon Katalòg</h3>
            <p className="text-xs text-ink-muted mt-1">
              {importData.products.length} pwodwi pre pou enpòte.
            </p>

            {/* Rapport d'erreurs éventuel */}
            {importData.errors.length > 0 && (
              <div className="mt-3 max-h-24 overflow-y-auto rounded-xl bg-[#FCE4E4] p-3 text-xs text-[#C0392B]">
                <span className="font-bold">⚠️ Alèt sou kèk liy:</span>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {importData.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Aperçu des produits */}
            <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-line p-2 divide-y divide-line">
              {importData.products.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-ink">{p.name}</span>
                    <span className="text-ink-faint">
                      {p.category} · Stòk: {p.stock_qty ?? "—"}
                    </span>
                  </div>
                  <span className="font-extrabold text-brand">
                    {formatMoney(p.price_cents ?? 0, p.currency ?? "HTG")}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setModalOpen(false)}
                className="h-11 rounded-xl bg-[#F7F8F9] px-4 text-xs font-bold text-ink-muted"
              >
                Anile
              </button>
              <button
                onClick={confirmImport}
                disabled={pending || importData.products.length === 0}
                className="h-11 rounded-xl bg-brand-green px-5 text-xs font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
              >
                {pending ? "N ap anregistre…" : "Konfime Enpòtasyon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
