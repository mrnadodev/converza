"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";

// ==========================================
// 1. WIDGET CAISSIÈRE (Marie Joseph)
// ==========================================
export interface CaissierTransaction {
  id: string;
  date: string;
  customerName: string;
  amountCents: number;
  method: "MonCash" | "Natcash" | "Sogebank" | "Kach";
  receiptNo: string;
  status: "Konfime" | "An atant";
}

const MOCK_CAISSIER_TRANSACTIONS: CaissierTransaction[] = [
  { id: "tx-1", date: "2026-08-28 14:32", customerName: "Jean-Marc Baptiste", amountCents: 450000, method: "MonCash", receiptNo: "REC-8842", status: "Konfime" },
  { id: "tx-2", date: "2026-08-28 11:15", customerName: "Clara Saint-Louis", amountCents: 1250000, method: "Sogebank", receiptNo: "REC-8841", status: "Konfime" },
  { id: "tx-3", date: "2026-08-27 16:40", customerName: "Dieudonné Pierre", amountCents: 350000, method: "Natcash", receiptNo: "REC-8840", status: "Konfime" },
  { id: "tx-4", date: "2026-08-27 09:20", customerName: "Marie-Louise Charles", amountCents: 900000, method: "MonCash", receiptNo: "REC-8839", status: "Konfime" },
  { id: "tx-5", date: "2026-08-26 15:10", customerName: "Fabienne Joseph", amountCents: 840000, method: "Kach", receiptNo: "REC-8838", status: "Konfime" },
];

export function CaissierTransactionsWidget() {
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"Journalier" | "Hebdomadaire" | "Mensuel">("Journalier");
  const [exported, setExported] = useState(false);

  const filtered = MOCK_CAISSIER_TRANSACTIONS.filter((tx) => {
    if (methodFilter !== "all" && tx.method !== methodFilter) return false;
    if (search.trim() && !tx.customerName.toLowerCase().includes(search.toLowerCase()) && !tx.receiptNo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalFilteredCents = filtered.reduce((acc, tx) => acc + tx.amountCents, 0);

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-2xs border border-blue-100 md:col-span-2">
      {/* En-tête du Widget Caissière */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-lg">
            💳
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-extrabold text-ink">Istwa Pèman & Reçus Caissière</h2>
            <span className="text-xs text-ink-muted">Lis tout tranzaksyon verifye ak émission de reçus officiels.</span>
          </div>
        </div>

        {/* Boutons Jenerasyon Rapò */}
        <button
          onClick={() => setShowReportModal(true)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-black text-white shadow-2xs hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
        >
          <span>📄 Jenerè Rapò Vant (Journalier / Mensuel)</span>
        </button>
      </div>

      {/* Barre de filtre */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-8 rounded-xl border border-line bg-white px-2.5 text-xs font-bold text-ink outline-none cursor-pointer"
          >
            <option value="all">💳 Tout Tip Pèman</option>
            <option value="MonCash">📱 MonCash</option>
            <option value="Natcash">📲 Natcash</option>
            <option value="Sogebank">🏦 Sogebank / Bank</option>
            <option value="Kach">💵 Kach / Cash</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setDateFilter("today")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer ${
                dateFilter === "today" ? "bg-blue-600 text-white" : "bg-white text-ink-muted border border-line"
              }`}
            >
              Jodi a
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer ${
                dateFilter === "week" ? "bg-blue-600 text-white" : "bg-white text-ink-muted border border-line"
              }`}
            >
              Semèn sa
            </button>
            <button
              onClick={() => setDateFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer ${
                dateFilter === "all" ? "bg-blue-600 text-white" : "bg-white text-ink-muted border border-line"
              }`}
            >
              Tout
            </button>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Chèche pa kliyan oswa No Reçu (#REC)..."
          className="h-8 w-full sm:w-48 rounded-xl border border-line bg-white px-3 text-xs outline-none focus:border-blue-600"
        />
      </div>

      {/* Tableau des Transactions Caissière */}
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F1F5F9] font-extrabold text-ink-soft">
            <tr>
              <th className="px-3.5 py-2.5">Dat & Lè</th>
              <th className="px-3.5 py-2.5">No Reçu</th>
              <th className="px-3.5 py-2.5">Kliyan</th>
              <th className="px-3.5 py-2.5">Tip Pèman</th>
              <th className="px-3.5 py-2.5 text-right">Montan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50">
                <td className="px-3.5 py-2.5 font-mono text-[11px] text-ink-muted">{tx.date}</td>
                <td className="px-3.5 py-2.5 font-bold text-blue-700">{tx.receiptNo}</td>
                <td className="px-3.5 py-2.5 font-bold text-ink">{tx.customerName}</td>
                <td className="px-3.5 py-2.5">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 font-extrabold text-blue-900 border border-blue-200">
                    {tx.method}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 text-right font-black text-ink">
                  {formatMoney(tx.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sommaire */}
      <div className="flex items-center justify-between rounded-xl bg-blue-50/70 p-3 text-xs font-bold text-blue-950">
        <span>Total Tranzaksyon seleksyone ({filtered.length}) :</span>
        <span className="text-base font-black text-blue-900">{formatMoney(totalFilteredCents)}</span>
      </div>

      {/* Modal Jenerasyon Rapò */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-base font-extrabold text-ink">📄 Jeneratè Rapò Caissière</span>
              <button onClick={() => { setShowReportModal(false); setExported(false); }} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            {exported ? (
              <div className="flex flex-col gap-3 text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-black text-xl">
                  ✓
                </div>
                <span className="text-sm font-extrabold text-emerald-950">Rapò {reportType} Generé ak Siksè !</span>
                <p className="text-xs text-ink-muted">
                  Rapò tranzaksyon yo telechaje an nèt nan fòma PDF / Excel imprimable ak tout reçus Caissière yo.
                </p>
                <button onClick={() => { setShowReportModal(false); setExported(false); }} className="mt-2 h-10 rounded-xl bg-blue-600 text-xs font-black text-white cursor-pointer">
                  Fèmen
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-extrabold text-ink">Chwazi Periode Rapò w vle soti an :</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setReportType("Journalier")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Journalier" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-ink border-line"}`}
                  >
                    📅 Journalier (Jodi a)
                  </button>
                  <button
                    onClick={() => setReportType("Hebdomadaire")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Hebdomadaire" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-ink border-line"}`}
                  >
                    📊 Hebdomadaire (Semèn)
                  </button>
                  <button
                    onClick={() => setReportType("Mensuel")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Mensuel" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-ink border-line"}`}
                  >
                    📆 Mensuel (Mwa)
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={() => setShowReportModal(false)} className="h-10 px-4 rounded-xl border text-xs font-bold text-ink-muted cursor-pointer">Anule</button>
                  <button onClick={() => setExported(true)} className="h-10 px-4 rounded-xl bg-blue-600 text-xs font-black text-white shadow-2xs cursor-pointer">
                    Telechaje Rapò {reportType} (PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. WIDGET STOCKIST (Pierre-Louis K.)
// ==========================================
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  category: string;
  isInternal: boolean;
}

const MOCK_SUPPLIERS: Supplier[] = [
  { id: "sup-1", name: "SOGEBANK Wholesaler HT", contactPerson: "Pierre Richard", phone: "+50937001122", category: "Gwo Distribitè", isInternal: true },
  { id: "sup-2", name: "Port-au-Prince Tech Importer", contactPerson: "Jean-Baptiste G.", phone: "+50938445566", category: "Enpòtatè Ekstèn", isInternal: false },
  { id: "sup-3", name: "Maison du Poulet & Alimentation", contactPerson: "Charles E.", phone: "+50936112233", category: "Alimantasyon General", isInternal: true },
];

export interface DeliveryRecord {
  id: string;
  orderNo: string;
  customerName: string;
  address: string;
  date: string;
  period: "today" | "week" | "month";
  status: "Sou Wout" | "Livre";
  securityCodeVerified: boolean;
}

const MOCK_DELIVERIES: DeliveryRecord[] = [
  { id: "del-1", orderNo: "#CMD-8842", customerName: "Dieudonné Pierre", address: "Delmas 75, Rue Metellus #12", date: "2026-08-28 14:10", period: "today", status: "Sou Wout", securityCodeVerified: true },
  { id: "del-2", orderNo: "#CMD-8841", customerName: "Clara Saint-Louis", address: "Pétion-Ville, Rue Ogé #4", date: "2026-08-28 10:45", period: "today", status: "Sou Wout", securityCodeVerified: true },
  { id: "del-3", orderNo: "#CMD-8840", customerName: "Jean-Marc Baptiste", address: "Tabarre 27, Impasse Rose", date: "2026-08-28 09:15", period: "today", status: "Livre", securityCodeVerified: true },
  { id: "del-4", orderNo: "#CMD-8839", customerName: "Fabienne Joseph", address: "Carrefour, Blvd 15 octobre", date: "2026-08-27 16:30", period: "week", status: "Livre", securityCodeVerified: true },
  { id: "del-5", orderNo: "#CMD-8838", customerName: "Marie-Louise Charles", address: "Delmas 33, Rue Charbonnière", date: "2026-08-26 11:20", period: "week", status: "Livre", securityCodeVerified: true },
];

export interface LowStockAlert {
  productName: string;
  currentQty: number;
  minQty: number;
  supplierName: string;
  supplierPhone: string;
}

const MOCK_LOW_STOCK: LowStockAlert[] = [
  { productName: "Sac du Riz TCS 25kg", currentQty: 2, minQty: 10, supplierName: "SOGEBANK Wholesaler HT", supplierPhone: "+50937001122" },
  { productName: "Huile Gourmet 5L", currentQty: 1, minQty: 5, supplierName: "Maison du Poulet & Alimentation", supplierPhone: "+50936112233" },
];

export function StockistReorderWidget() {
  const [periodFilter, setPeriodFilter] = useState<"today" | "week" | "month" | "all">("today");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"Journalier" | "Hebdomadaire" | "Mensuel">("Journalier");
  const [exported, setExported] = useState(false);

  // Filtrage dynamique des livraisons
  const filteredDeliveries = MOCK_DELIVERIES.filter((d) => {
    if (periodFilter === "today") return d.period === "today";
    if (periodFilter === "week") return d.period === "today" || d.period === "week";
    return true;
  });

  // Métriques 100% synchronisées avec le filtre dynamique
  const colisSouWoutCount = filteredDeliveries.filter((d) => d.status === "Sou Wout").length;
  const livrezonFetCount = filteredDeliveries.filter((d) => d.status === "Livre").length;
  const verifiedCount = filteredDeliveries.filter((d) => d.securityCodeVerified).length;
  const verifiedPct = filteredDeliveries.length > 0 ? Math.round((verifiedCount / filteredDeliveries.length) * 100) : 100;

  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-2xs border border-purple-100 md:col-span-2">
      {/* En-tête Stockist avec Jenerasyon Rapò */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 font-extrabold text-lg">
            📦
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-extrabold text-ink">Istwa Livrezon & Stok (Stockist)</h2>
            <span className="text-xs text-ink-muted">Chif ki nan kòt yo senkronize an tan reyèl ak lis livrezon yo.</span>
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3.5 text-xs font-black text-white shadow-2xs hover:bg-purple-700 active:scale-95 transition-all cursor-pointer"
        >
          <span>📄 Jenerè Rapò Livrezon (Journalier / Mensuel)</span>
        </button>
      </div>

      {/* Barre de filtre pa Peryòd (Jodi a / Semèn sa / Mwa sa) */}
      <div className="flex items-center justify-between bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100">
        <span className="text-xs font-extrabold text-purple-950">Filtre pa Peryòd Livrezon :</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPeriodFilter("today")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              periodFilter === "today" ? "bg-purple-600 text-white shadow-2xs" : "bg-white text-ink-muted border border-line"
            }`}
          >
            📅 Jodi a
          </button>
          <button
            onClick={() => setPeriodFilter("week")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              periodFilter === "week" ? "bg-purple-600 text-white shadow-2xs" : "bg-white text-ink-muted border border-line"
            }`}
          >
            📊 Semèn sa
          </button>
          <button
            onClick={() => setPeriodFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              periodFilter === "all" ? "bg-purple-600 text-white shadow-2xs" : "bg-white text-ink-muted border border-line"
            }`}
          >
            📆 Tout Peryòd
          </button>
        </div>
      </div>

      {/* Cartes de Métriques Synchronisées */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 rounded-2xl border border-purple-200 bg-purple-50/60 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-purple-900">Colis Sou Wout ({periodFilter === "today" ? "Jodi a" : "Peryòd"})</span>
          <span className="text-2xl font-black text-purple-950">{colisSouWoutCount} colis</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-900">Livrezon Fèt ({periodFilter === "today" ? "Jodi a" : "Peryòd"})</span>
          <span className="text-2xl font-black text-emerald-950">{livrezonFetCount} colis</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-blue-900">Kòd Sekirite 🔑 Verifye</span>
          <span className="text-2xl font-black text-blue-950">{verifiedPct}% verifye</span>
        </div>
      </div>

      {/* Tableau des Livraisons Synchronisé */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-extrabold text-ink">Lis Livrezon Yo ({filteredDeliveries.length}) :</span>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] font-extrabold text-ink-soft">
              <tr>
                <th className="px-3.5 py-2.5">Dat & Lè</th>
                <th className="px-3.5 py-2.5">Kòmand</th>
                <th className="px-3.5 py-2.5">Kliyan & Adrès</th>
                <th className="px-3.5 py-2.5">Kòd Sekirite 🔑</th>
                <th className="px-3.5 py-2.5 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredDeliveries.map((del) => (
                <tr key={del.id} className="hover:bg-slate-50">
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-ink-muted">{del.date}</td>
                  <td className="px-3.5 py-2.5 font-bold text-purple-700">{del.orderNo}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-ink">{del.customerName}</span>
                      <span className="text-[11px] text-ink-muted">{del.address}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-extrabold text-emerald-900 text-[10.5px]">
                      🔑 Verifye
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black">
                    <span className={`rounded-md px-2 py-0.5 text-[10.5px] ${del.status === "Sou Wout" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
                      {del.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Alèt Rupture & Lis Founisè */}
      <div className="flex flex-col gap-3 pt-2">
        <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
          <span>⚠️ Pwodwi nan Risk Rupture (IA Detection) :</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOCK_LOW_STOCK.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-950 text-xs">{item.productName}</span>
                <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-900">
                  Rupture Imminente
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span>Stok Kounye a : <strong className="text-red-700">{item.currentQty} inite</strong></span>
                <span>Seuil Min : {item.minQty} inite</span>
              </div>
              <a
                href={`https://wa.me/${item.supplierPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjou ${item.supplierName}, nou bezwen kòmande yon nouvo chajman pou ${item.productName} kounye a.`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex h-8 items-center justify-center gap-1 rounded-xl bg-purple-600 text-[11.5px] font-black text-white shadow-2xs hover:bg-purple-700 transition-colors"
              >
                <span>📦 Kòmande nan men Founisè ({item.supplierName})</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Lis Founisè */}
      <div className="flex flex-col gap-3 pt-1">
        <span className="text-xs font-extrabold text-ink flex items-center gap-1.5">
          <span>🏢 Lis Founisè Konpayi an (Anndan & Deyò CONVERZA) :</span>
        </span>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] font-extrabold text-ink-soft">
              <tr>
                <th className="px-3.5 py-2.5">Non Founisè</th>
                <th className="px-3.5 py-2.5">Kontak</th>
                <th className="px-3.5 py-2.5">Kategori</th>
                <th className="px-3.5 py-2.5">Tip Founisè</th>
                <th className="px-3.5 py-2.5 text-right">Aksyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MOCK_SUPPLIERS.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50">
                  <td className="px-3.5 py-2.5 font-bold text-ink">{sup.name}</td>
                  <td className="px-3.5 py-2.5 text-ink-muted">{sup.contactPerson} ({sup.phone})</td>
                  <td className="px-3.5 py-2.5 font-medium">{sup.category}</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold ${sup.isInternal ? "bg-emerald-100 text-emerald-900" : "bg-gray-100 text-gray-800"}`}>
                      {sup.isInternal ? "Anndan CONVERZA" : "Deyò (Ekstèn)"}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <a
                      href={`https://wa.me/${sup.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjou ${sup.contactPerson}, n ap kontakte w sou lis founisè CONVERZA pou yon kòmand stok.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white shadow-2xs"
                    >
                      <span>💬 Kontakte</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Jenerasyon Rapò Stockist */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-base font-extrabold text-ink">📄 Jeneratè Rapò Stockist</span>
              <button onClick={() => { setShowReportModal(false); setExported(false); }} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            {exported ? (
              <div className="flex flex-col gap-3 text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-black text-xl">
                  ✓
                </div>
                <span className="text-sm font-extrabold text-emerald-950">Rapò Livrezon {reportType} Generé !</span>
                <p className="text-xs text-ink-muted">
                  Rapò livrezon ak kòd sekirite verifye yo telechaje nan fòma PDF / Excel imprimable.
                </p>
                <button onClick={() => { setShowReportModal(false); setExported(false); }} className="mt-2 h-10 rounded-xl bg-purple-600 text-xs font-black text-white cursor-pointer">
                  Fèmen
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-extrabold text-ink">Chwazi Periode Rapò Livrezon w vle soti an :</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setReportType("Journalier")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Journalier" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-ink border-line"}`}
                  >
                    📅 Journalier (Jodi a)
                  </button>
                  <button
                    onClick={() => setReportType("Hebdomadaire")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Hebdomadaire" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-ink border-line"}`}
                  >
                    📊 Hebdomadaire (Semèn)
                  </button>
                  <button
                    onClick={() => setReportType("Mensuel")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Mensuel" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-ink border-line"}`}
                  >
                    📆 Mensuel (Mwa)
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={() => setShowReportModal(false)} className="h-10 px-4 rounded-xl border text-xs font-bold text-ink-muted cursor-pointer">Anule</button>
                  <button onClick={() => setExported(true)} className="h-10 px-4 rounded-xl bg-purple-600 text-xs font-black text-white shadow-2xs cursor-pointer">
                    Telechaje Rapò {reportType} (PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. WIDGET PROMO (Steeve Alexis)
// ==========================================
export interface PromoProduct {
  id: string;
  name: string;
  priceCents: number;
  stockQty: number;
  promoBadge: string;
  isNew: boolean;
  photoUrl?: string;
  photoWidth?: number;
  photoHeight?: number;
}

const MOCK_PROMO_PRODUCTS: PromoProduct[] = [
  {
    id: "p-1",
    name: "Riz TCS 25kg Spécial",
    priceCents: 240000,
    stockQty: 45,
    promoBadge: "-15% Promo Semèn",
    isNew: true,
    photoUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    photoWidth: 600,
    photoHeight: 600,
  },
  {
    id: "p-2",
    name: "Huile Gourmet 5L Extra",
    priceCents: 125000,
    stockQty: 18,
    promoBadge: "🔥 Nouvo Arrivage",
    isNew: true,
    photoUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
    photoWidth: 600,
    photoHeight: 600,
  },
  {
    id: "p-3",
    name: "Sucre Indeca 10kg",
    priceCents: 95000,
    stockQty: 30,
    promoBadge: "Vant Flach -10%",
    isNew: false,
    photoUrl: "https://images.unsplash.com/photo-1622484210800-4752c00248a3?w=600&auto=format&fit=crop&q=80",
    photoWidth: 600,
    photoHeight: 600,
  },
];

export function AgentPromoWidget() {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-2xs border border-amber-100 md:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 font-extrabold text-lg">
            📢
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-extrabold text-ink">Nouvo Pwodwi & Pwomosyon Aktif (Synchro Katalòg)</h2>
            <span className="text-xs text-ink-muted">Pwodwi ak promosyon mèt antrepriz la ajoute nan katalòg la ap senkronize la an tan reyèl.</span>
          </div>
        </div>

        <button
          onClick={() => setShowBroadcastModal(true)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 text-xs font-black text-white shadow-2xs hover:bg-amber-700 active:scale-95 transition-all cursor-pointer"
        >
          <span>🚀 Voye Promo bay Tout Kliyan (Broadcast Otomatik)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {MOCK_PROMO_PRODUCTS.map((p) => (
          <div key={p.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-3.5 shadow-2xs hover:border-amber-400 transition-all">
            {/* Foto Pwodwi ak Dimansyon Orijinal */}
            <div className="relative h-36 w-full overflow-hidden rounded-xl bg-gray-100 border border-slate-100">
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photoUrl}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400 font-bold text-xs">
                  📷 Pa gen foto
                </div>
              )}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-black shadow-xs">
                  {p.promoBadge}
                </span>
              </div>
              {p.isNew && (
                <span className="absolute top-2 right-2 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black shadow-xs">
                  NEW
                </span>
              )}
            </div>

            <span className="font-extrabold text-ink text-sm mt-0.5">{p.name}</span>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-black text-brand text-sm">{formatMoney(p.priceCents)}</span>
              <span className="text-ink-muted font-medium">Stok: {p.stockQty} inite</span>
            </div>

            {/* Bouton Voye Foto HD sou WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `🔥 *PWOMOSYON CONVERZA* 🔥\n\n📌 *Pwodwi*: ${p.name}\n💰 *Pri*: ${formatMoney(p.priceCents)}\n🏷️ *Offre*: ${p.promoBadge}\n📦 *Stok*: ${p.stockQty} inite\n\n📷 *Foto Pwodwi HD (Dimansyon ${p.photoWidth || 600}x${p.photoHeight || 600})*: ${p.photoUrl}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex h-8 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[11px] font-black text-white shadow-2xs hover:bg-emerald-700 transition-colors"
            >
              <span>💬 Voye Pwodwi ak Foto bay Kliyan</span>
            </a>
          </div>
        ))}
      </div>

      {/* Modal Broadcast Otomatik sou Tout Kliyan */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-base font-extrabold text-ink">🚀 Difizyon Promo Otomatik bay Tout Kliyan (Broadcast)</span>
              <button onClick={() => { setShowBroadcastModal(false); setBroadcastSent(false); }} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            {broadcastSent ? (
              <div className="flex flex-col gap-3 text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-black text-2xl">
                  ✓
                </div>
                <span className="text-base font-extrabold text-emerald-950">Difizyon Promo Voye ak Siksè bay 5 Kliyan !</span>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Mesaj pwomosyon ak foto pwodwi senkronize yo voye otomakman sou kont WhatsApp tout kliyan ki anrejistre nan sistèm nan.
                </p>
                <button onClick={() => { setShowBroadcastModal(false); setBroadcastSent(false); }} className="mt-2 h-10 rounded-xl bg-amber-600 text-xs font-black text-white cursor-pointer">
                  Fèmen
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-extrabold text-ink">Kliyan ki pral resevwa Difizyon an (5 Kliyan) :</span>
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <span className="rounded-md bg-white px-2 py-1 font-bold text-ink border border-line">👤 Dieudonné Pierre</span>
                  <span className="rounded-md bg-white px-2 py-1 font-bold text-ink border border-line">👤 Clara Saint-Louis</span>
                  <span className="rounded-md bg-white px-2 py-1 font-bold text-ink border border-line">👤 Jean-Marc Baptiste</span>
                  <span className="rounded-md bg-white px-2 py-1 font-bold text-ink border border-line">👤 Fabienne Joseph</span>
                  <span className="rounded-md bg-white px-2 py-1 font-bold text-ink border border-line">👤 Marie-Louise Charles</span>
                </div>

                <span className="text-xs font-extrabold text-ink pt-1">Apesi Mesaj & Foto Pwodwi senkronize nan Katalòg la :</span>
                <div className="flex flex-col gap-2 rounded-2xl bg-amber-50/80 p-3 text-xs border border-amber-200 text-amber-950">
                  <span className="font-extrabold">🔥 *NOUVO PWODWI AK PROMOSYON KATALÒG CONVERZA* 🔥</span>
                  <p className="text-[11.5px] leading-relaxed">
                    📌 <strong>Riz TCS 25kg Spécial</strong>: 2,400 HTG (-15% Promo Semèn)<br />
                    📷 <em>Foto HD</em>: https://images.unsplash.com/photo-1586201375761-83865001e31c<br /><br />
                    📌 <strong>Huile Gourmet 5L Extra</strong>: 1,250 HTG (🔥 Nouvo Arrivage)<br />
                    📷 <em>Foto HD</em>: https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={() => setShowBroadcastModal(false)} className="h-10 px-4 rounded-xl border text-xs font-bold text-ink-muted cursor-pointer">Anule</button>
                  <button onClick={() => setBroadcastSent(true)} className="h-10 px-5 rounded-xl bg-amber-600 text-xs font-black text-white shadow-2xs cursor-pointer active:scale-95">
                    🚀 Lansé Difizyon Otomatik bay 5 Kliyan Yo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. WIDGET DÈT & SÈVIS KLIYAN (Florence Désir)
// ==========================================
export interface DebtRecord {
  id: string;
  customerName: string;
  phone: string;
  amountOwedCents: number;
  dueDate: string;
  daysOverdue: number;
  isPaid: boolean;
  paidDate?: string;
  period: "today" | "week" | "month";
}

const MOCK_DEBT_RECORDS: DebtRecord[] = [
  { id: "deb-1", customerName: "Dieudonné Pierre", phone: "+50937123456", amountOwedCents: 900000, dueDate: "2026-08-20", daysOverdue: 8, isPaid: false, period: "today" },
  { id: "deb-2", customerName: "Clara Saint-Louis", phone: "+50938998877", amountOwedCents: 350000, dueDate: "2026-08-25", daysOverdue: 3, isPaid: false, period: "today" },
  { id: "deb-3", customerName: "Jean-Marc Baptiste", phone: "+50936112233", amountOwedCents: 450000, dueDate: "2026-08-28", daysOverdue: 0, isPaid: true, paidDate: "2026-08-28 15:20", period: "today" },
  { id: "deb-4", customerName: "Fabienne Joseph", phone: "+50937443322", amountOwedCents: 800000, dueDate: "2026-08-27", daysOverdue: 0, isPaid: true, paidDate: "2026-08-27 11:10", period: "week" },
  { id: "deb-5", customerName: "Marie-Louise Charles", phone: "+50938001199", amountOwedCents: 1200000, dueDate: "2026-08-26", daysOverdue: 0, isPaid: true, paidDate: "2026-08-26 14:05", period: "week" },
];

export function DebtorsListWidget() {
  const [periodFilter, setPeriodFilter] = useState<"today" | "week" | "month" | "all">("today");
  const [activeTab, setActiveTab] = useState<"unpaid" | "paid">("unpaid");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"Journalier" | "Hebdomadaire" | "Mensuel">("Journalier");
  const [exported, setExported] = useState(false);

  // Filtrage dynamique
  const filteredDebts = MOCK_DEBT_RECORDS.filter((d) => {
    if (periodFilter === "today" && d.period !== "today") return false;
    if (periodFilter === "week" && d.period !== "today" && d.period !== "week") return false;
    if (activeTab === "unpaid" && d.isPaid) return false;
    if (activeTab === "paid" && !d.isPaid) return false;
    return true;
  });

  // Métriques synchronisées
  const activeUnpaidList = MOCK_DEBT_RECORDS.filter((d) => !d.isPaid && (periodFilter === "all" || d.period === periodFilter || (periodFilter === "week" && d.period === "today")));
  const paidList = MOCK_DEBT_RECORDS.filter((d) => d.isPaid && (periodFilter === "all" || d.period === periodFilter || (periodFilter === "week" && d.period === "today")));

  const totalUnpaidCents = activeUnpaidList.reduce((acc, d) => acc + d.amountOwedCents, 0);

  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-2xs border border-amber-200 md:col-span-2">
      {/* En-tête avec Jenerasyon Rapò Dèt */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 font-extrabold text-lg">
            🏷️
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-extrabold text-ink">Espas Sèvis Kliyan & Dèt (Florence Désir)</h2>
            <span className="text-xs text-ink-muted">Chif ki nan kòt yo senkronize an tan reyèl ak lis dèt an kous ak dèt solde.</span>
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 text-xs font-black text-white shadow-2xs hover:bg-amber-700 active:scale-95 transition-all cursor-pointer"
        >
          <span>📄 Jenerè Rapò Dèt & Rekouvreman (PDF)</span>
        </button>
      </div>

      {/* Barre de filtre pa Peryòd (Jodi a / Semèn sa / Mwa sa) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FFFBEB] p-3 rounded-2xl border border-amber-100">
        <span className="text-xs font-extrabold text-amber-950">Filtre pa Peryòd Dèt :</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPeriodFilter("today")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              periodFilter === "today" ? "bg-amber-600 text-white shadow-2xs" : "bg-white text-ink-muted border border-line"
            }`}
          >
            📅 Jodi a
          </button>
          <button
            onClick={() => setPeriodFilter("week")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              periodFilter === "week" ? "bg-amber-600 text-white shadow-2xs" : "bg-white text-ink-muted border border-line"
            }`}
          >
            📊 Semèn sa
          </button>
          <button
            onClick={() => setPeriodFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              periodFilter === "all" ? "bg-amber-600 text-white shadow-2xs" : "bg-white text-ink-muted border border-line"
            }`}
          >
            📆 Tout Peryòd
          </button>
        </div>
      </div>

      {/* Cartes de Métriques Synchronisées */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-amber-900">Total Dèt an Kous ({periodFilter === "today" ? "Jodi a" : "Peryòd"})</span>
          <span className="text-2xl font-black text-amber-950">{formatMoney(totalUnpaidCents)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-blue-900">Kliyan nan Swivi</span>
          <span className="text-2xl font-black text-blue-950">{activeUnpaidList.length} kliyan</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-900">Dèt Solde ({periodFilter === "today" ? "Jodi a" : "Peryòd"})</span>
          <span className="text-2xl font-black text-emerald-950">{paidList.length} dèt solde</span>
        </div>
      </div>

      {/* Onglets Dèt an Kous (Pako Peye) vs Dèt Solde (Peye) */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab("unpaid")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "unpaid" ? "bg-amber-600 text-white shadow-2xs" : "bg-gray-100 text-ink-muted hover:bg-gray-200"
          }`}
        >
          <span>⚠️ Lis Dèt an Kous (Pako Peye) ({activeUnpaidList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "paid" ? "bg-emerald-600 text-white shadow-2xs" : "bg-gray-100 text-ink-muted hover:bg-gray-200"
          }`}
        >
          <span>✓ Lis Dèt Solde ({paidList.length})</span>
        </button>
      </div>

      {/* Tableau des Dèt Synchronisé */}
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FFFBEB] font-extrabold text-amber-950">
            <tr>
              <th className="px-3.5 py-2.5">Kliyan</th>
              <th className="px-3.5 py-2.5">Telefòn</th>
              <th className="px-3.5 py-2.5">Montan Dèt</th>
              <th className="px-3.5 py-2.5">Statut / Dat Solde</th>
              <th className="px-3.5 py-2.5 text-right">Aksyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredDebts.map((deb) => (
              <tr key={deb.id} className="hover:bg-amber-50/50">
                <td className="px-3.5 py-2.5 font-bold text-ink">{deb.customerName}</td>
                <td className="px-3.5 py-2.5 text-ink-muted">{deb.phone}</td>
                <td className="px-3.5 py-2.5 font-black text-red-700 text-sm">
                  {formatMoney(deb.amountOwedCents)}
                </td>
                <td className="px-3.5 py-2.5">
                  {deb.isPaid ? (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10.5px] font-black text-emerald-900">
                      ✓ SOLDE ({deb.paidDate})
                    </span>
                  ) : (
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10.5px] font-black text-red-900">
                      ⚠️ {deb.daysOverdue} jou an retar
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-2.5 text-right">
                  {deb.isPaid ? (
                    <span className="text-[11px] font-bold text-emerald-700">Pèman Validé ✓</span>
                  ) : (
                    <Link
                      href="/komand"
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-amber-600 px-2.5 text-[11px] font-black text-white shadow-2xs hover:bg-amber-700 transition-colors"
                    >
                      <span>🏷️ Relanse sou Pipeline</span>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 🔥 Nouvo Arrivage & Pwomosyon pou Florence Désir */}
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
            <span>🔥 Nouvo Arrivage & Pwomosyon (Voye bay Kliyan) :</span>
          </span>
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-950">
            Sèvis Kliyan Upsell
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOCK_PROMO_PRODUCTS.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-3 border border-amber-100 shadow-2xs">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-slate-100">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400 text-xs">📷</div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <span className="font-extrabold text-xs text-ink">{p.name}</span>
                <span className="text-[11px] font-black text-brand">{formatMoney(p.priceCents)} ({p.promoBadge})</span>
                <span className="text-[10px] text-ink-muted">Foto HD: {p.photoWidth || 600}x{p.photoHeight || 600}px</span>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Bonjou! Gen yon nouvo pwomosyon sou ${p.name} (${formatMoney(p.priceCents)}) kounye a!\n\n📷 Gade Foto HD (${p.photoWidth || 600}x${p.photoHeight || 600}px): ${p.photoUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[10.5px] font-black text-white shadow-2xs hover:bg-emerald-700 cursor-pointer shrink-0"
              >
                <span>💬 Voye ak Foto</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Jenerasyon Rapò Dèt */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-base font-extrabold text-ink">📄 Jeneratè Rapò Dèt & Rekouvreman</span>
              <button onClick={() => { setShowReportModal(false); setExported(false); }} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            {exported ? (
              <div className="flex flex-col gap-3 text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-black text-xl">
                  ✓
                </div>
                <span className="text-sm font-extrabold text-emerald-950">Rapò Dèt {reportType} Generé ak Siksè !</span>
                <p className="text-xs text-ink-muted">
                  Rapò dèt an kous ak dèt solde yo telechaje nan fòma PDF / Excel imprimable.
                </p>
                <button onClick={() => { setShowReportModal(false); setExported(false); }} className="mt-2 h-10 rounded-xl bg-amber-600 text-xs font-black text-white cursor-pointer">
                  Fèmen
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-extrabold text-ink">Chwazi Periode Rapò Dèt w vle soti an :</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setReportType("Journalier")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Journalier" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-ink border-line"}`}
                  >
                    📅 Journalier (Jodi a)
                  </button>
                  <button
                    onClick={() => setReportType("Hebdomadaire")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Hebdomadaire" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-ink border-line"}`}
                  >
                    📊 Hebdomadaire (Semèn)
                  </button>
                  <button
                    onClick={() => setReportType("Mensuel")}
                    className={`h-11 rounded-xl text-xs font-extrabold border cursor-pointer ${reportType === "Mensuel" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-ink border-line"}`}
                  >
                    📆 Mensuel (Mwa)
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={() => setShowReportModal(false)} className="h-10 px-4 rounded-xl border text-xs font-bold text-ink-muted cursor-pointer">Anule</button>
                  <button onClick={() => setExported(true)} className="h-10 px-4 rounded-xl bg-amber-600 text-xs font-black text-white shadow-2xs cursor-pointer">
                    Telechaje Rapò {reportType} (PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. WIDGET GÉRANT GÉNÉRAL (Délégué Interim)
// ==========================================
export function GerantDashboardWidget() {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-slate-900 p-5 shadow-xl text-white md:col-span-2">
      {/* En-tête du Widget Gérant Général */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 font-extrabold text-xl border border-amber-500/30">
            🛡️
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Supervision Operations & Delegated Manager</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/30">
                Mode Interim
              </span>
            </h2>
            <span className="text-xs text-slate-400">Accès opérationnel étendu sous audit inaltérable.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/audit"
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3.5 text-xs font-black text-slate-950 shadow-2xs hover:bg-amber-400 cursor-pointer transition-all active:scale-95"
          >
            <span>🔍 Supervision Audit (🔴 3)</span>
          </Link>
        </div>
      </div>

      {/* Notifications & Alertes Dérogation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700">
          <span className="text-xs font-bold text-slate-400">📦 Pipeline Total</span>
          <span className="text-lg font-black text-white">48 Kòmand nan Kous</span>
          <span className="text-[11px] text-emerald-400 font-extrabold">✓ 5 Ajan opérationnels</span>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700">
          <span className="text-xs font-bold text-slate-400">🚚 Livrezon pou Valide</span>
          <span className="text-lg font-black text-amber-300">6 Colis en route</span>
          <span className="text-[11px] text-slate-300">🔑 Kòd sekirite verifye</span>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700">
          <span className="text-xs font-bold text-slate-400">🔒 Limites de Sécurité</span>
          <span className="text-xs font-extrabold text-amber-400">Paiements & Owner Locked</span>
          <span className="text-[11px] text-slate-400">MonCash/Banque réservés</span>
        </div>
      </div>

      {/* Alertes d'intervention Gérant */}
      <div className="flex flex-col gap-2 rounded-2xl bg-slate-800/50 p-4 border border-slate-700">
        <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
          <span>⚡ ACTIONS DE GESTION EN ATTENTE DE VOTRE VALIDATION :</span>
        </span>
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3 border border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="text-base">📦</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Commande réapprovisionnement Diri Tchako (50 sak)</span>
                <span className="text-[11px] text-slate-400">Fournisseur : Moulins d'Haïti (60,000 HTG)</span>
              </div>
            </div>
            <button
              onClick={() => { setApprovalAction("Reapprovisionnement Diri Tchako"); setShowApprovalModal(true); }}
              className="h-8 px-3 rounded-xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-500 cursor-pointer"
            >
              Approuver
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3 border border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="text-base">🏷️</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Relance & Remise exceptionnelle dèt client (Wideline Désir)</span>
                <span className="text-[11px] text-slate-400">Montant dèt : 9,000 HTG (-5% escompte)</span>
              </div>
            </div>
            <button
              onClick={() => { setApprovalAction("Remise exceptionnelle dèt"); setShowApprovalModal(true); }}
              className="h-8 px-3 rounded-xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-500 cursor-pointer"
            >
              Approuver
            </button>
          </div>
        </div>
      </div>

      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-3xl bg-slate-900 p-6 border border-slate-700 text-white shadow-2xl">
            <span className="text-base font-extrabold text-amber-400">✓ Action Approuvée par le Gérant</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              L'action <strong>{approvalAction}</strong> a été validée et enregistrée dans le journal d'audit inaltérable. Une notification a été envoyée au Fondateur (Owner).
            </p>
            <button
              onClick={() => setShowApprovalModal(false)}
              className="mt-2 h-10 rounded-xl bg-amber-500 text-xs font-black text-slate-950 hover:bg-amber-400 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
