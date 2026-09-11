"use client";

import { analyzeStockRisk, type StockAlert } from "@/lib/stock_ai";
import type { Product } from "@/lib/types";
import { useTranslation } from "@/components/LanguageContext";

export function StockAIWidget({ products, businessPlan = "gratis" }: { products: Product[]; businessPlan?: string }) {
  const { t } = useTranslation();
  const isPremium = businessPlan.toLowerCase() === "premium";
  const alerts = analyzeStockRisk(products);

  if (!isPremium) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-4 text-white shadow-md border border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 text-2xl font-black shadow-md">
            👑
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">IA Assistant & Inventè CONVERZA</span>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/40">
                Premium
              </span>
            </div>
            <span className="text-xs text-purple-200">
              Deteksyon otomatik rupture stok & Repons entèlijan sou WhatsApp 24/7.
            </span>
          </div>
        </div>
        <a
          href="/abonman"
          className="shrink-0 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-amber-950 hover:bg-amber-300 transition-all shadow-sm text-center"
        >
          🚀 Debloke ak Premium
        </a>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] border border-[#EAF7F1]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F7F1] text-xl">
          🤖
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-brand">IA Inventè CONVERZA</span>
          <span className="text-xs text-ink-muted">Tout stòk ou yo an nòmal. Pa gen okenn pwodwi ki an risk rupture.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(17,27,33,0.08)] border border-[#FFE8E8]">
      <div className="flex items-center justify-between border-b border-[#F5E6E6] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF0F0] text-lg">
            🤖
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-[#C0392B]">
              IA Inventè · {alerts.length} alèt stòk
            </span>
            <span className="text-[11px] text-ink-faint">
              Deteksyon anvan rupture & Sourcing depo
            </span>
          </div>
        </div>
        <span className="rounded-full bg-[#FFE6E6] px-2.5 py-0.5 text-[10px] font-extrabold text-[#C0392B]">
          Urgent
        </span>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        {alerts.map((alt) => (
          <div key={alt.productId} className="flex flex-col gap-2 rounded-xl bg-[#FAF8F8] p-3 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="text-sm text-ink">{alt.productName}</span>
              <span className="text-[#C0392B]">
                Stòk: {alt.currentStock} inite (Rupture nan {alt.daysRemaining}j)
              </span>
            </div>

            {alt.supplierRecommendation ? (
              <div className="flex flex-col gap-1.5 rounded-lg bg-white p-2.5 border border-[#EBF0EE]">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-brand">
                    🏭 {alt.supplierRecommendation.depositName}
                  </span>
                  <span className="font-bold text-ink-soft">
                    {alt.supplierRecommendation.availableStock} inite disponib
                  </span>
                </div>
                <span className="text-[11px] text-ink-muted">
                  📍 {alt.supplierRecommendation.location}
                </span>
                <a
                  href={alt.supplierRecommendation.orderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-green font-bold text-white shadow-sm active:scale-95 text-xs"
                >
                  <span>📲 Voye kòmand re-apwovizyonman sou WhatsApp</span>
                </a>
              </div>
            ) : (
              <span className="text-[11px] text-ink-faint">
                Pa gen okenn depo nan rezo a ki gen pwodwi sa an stòk kounye a.
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
