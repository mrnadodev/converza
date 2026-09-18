"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDict } from "@/components/LanguageContext";
import { CATALOG_COPY } from "@/lib/i18n/app/catalog";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { generateExcelTemplate, parseBulkProducts, type ImportResult } from "@/lib/excel";
import { saveBulkProducts } from "@/app/katalog/actions";
import { formatMoney } from "@/lib/money";
import type { Business } from "@/lib/types";

export function BulkExcelManager({ business }: { business: Business }) {
  const k = useDict(CATALOG_COPY);
  const c = useDict(COMMON_COPY);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [importData, setImportData] = useState<ImportResult | null>(null);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const fileName = `modele_katalog_converza_${business?.slug || "boutik"}.csv`;

  function downloadTemplate() {
    try {
      const blob = new Blob([generateExcelTemplate()], { type: "text/csv;charset=utf-8;" });
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
    } catch {
      window.open("data:text/csv;charset=utf-8," + encodeURIComponent(generateExcelTemplate()));
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportData(parseBulkProducts(text, business.id));
        setModalOpen(true);
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  function confirmImport() {
    if (!importData || importData.products.length === 0) return;
    start(async () => {
      const res = await saveBulkProducts(importData.products);
      if (res.ok) {
        setStatus({ tone: "ok", text: k.bulk.imported(res.count ?? importData.products.length) });
        setImportData(null);
        setModalOpen(false);
        router.refresh();
      } else {
        setStatus({ tone: "error", text: res.error ?? c.actions.retry });
      }
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-extrabold text-ink">{k.bulk.title}</h2>
        <p className="text-xs text-ink-muted">{k.bulk.desc}</p>
      </div>

      {status && (
        <p
          role="status"
          className={`rounded-xl p-3 text-xs font-bold ${status.tone === "ok" ? "bg-[#E7F7F1] text-brand" : "bg-[#FCE4E4] text-[#C0392B]"}`}
        >
          {status.text}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <a
          href="/api/download-template"
          download={fileName}
          onClick={downloadTemplate}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-[#F7F8F9] px-3 text-xs font-bold text-ink no-underline active:scale-95"
        >
          {k.bulk.download}
        </a>
        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E7F7F1] px-3 text-xs font-bold text-brand active:scale-95">
          <span>{k.bulk.upload}</span>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {modalOpen && importData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold">{k.bulk.previewTitle}</h3>
            <p className="mt-1 text-xs text-ink-muted">{k.bulk.ready(importData.products.length)}</p>

            {importData.errors.length > 0 && (
              <div className="mt-3 max-h-24 overflow-y-auto rounded-xl bg-[#FCE4E4] p-3 text-xs text-[#C0392B]">
                <span className="font-bold">{k.bulk.lineWarnings}</span>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {importData.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex-1 divide-y divide-line overflow-y-auto rounded-xl border border-line p-2">
              {importData.products.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-bold text-ink">{p.name}</span>
                    <span className="text-ink-faint">
                      {p.category} · {p.stock_qty ?? "—"}
                    </span>
                  </div>
                  <span className="shrink-0 font-extrabold text-brand">{formatMoney(p.price_cents ?? 0, p.currency ?? "HTG")}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-line pt-2">
              <button onClick={() => setModalOpen(false)} className="h-11 cursor-pointer rounded-xl bg-[#F7F8F9] px-4 text-xs font-bold text-ink-muted">
                {c.actions.cancel}
              </button>
              <button
                onClick={confirmImport}
                disabled={pending || importData.products.length === 0}
                className="h-11 cursor-pointer rounded-xl bg-brand-green px-5 text-xs font-extrabold text-white active:scale-95 disabled:opacity-50"
              >
                {pending ? k.bulk.importing : k.bulk.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
