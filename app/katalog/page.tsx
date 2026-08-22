import { BottomNav } from "@/components/BottomNav";
import { getCatalog } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import type { StockState } from "@/lib/types";

const STOCK: Record<StockState, { label: string; cls: string }> = {
  en_stok: { label: "En stòk", cls: "text-brand bg-[#E7F7F1]" },
  ba_stok: { label: "Ba stòk", cls: "text-owed-text bg-owed-bg" },
  fini: { label: "Fini", cls: "text-[#C0392B] bg-[#FCE4E4]" },
};

export default async function KatalogPage() {
  const products = await getCatalog();

  return (
    <div className="relative min-h-[100dvh] bg-[#F7F8F9] pb-[96px]">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white">
          <Rooster />
        </div>
        <span className="text-[21px] font-extrabold tracking-tight text-white">Katalòg</span>
      </header>

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {products.map((p) => {
          const s = STOCK[p.stock_state];
          return (
            <div key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(17,27,33,0.06)]">
              <div className="relative flex h-24 items-center justify-center" style={{ background: "linear-gradient(135deg,#FEF3E2,#FCE0B8)" }}>
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <Bag />
                )}
                <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>{s.label}</span>
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <span className="text-[13.5px] font-semibold">{p.name}</span>
                {p.stock_qty != null && (
                  <span className="text-[11px] text-ink-faint">{p.stock_qty} disponib</span>
                )}
                <span className="mt-0.5 text-base font-extrabold">
                  {formatMoney(p.price_cents, p.currency).replace(` ${p.currency}`, "")}{" "}
                  <span className="text-[11px] font-semibold text-ink-faint">{p.currency}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <p className="px-6 pt-16 text-center text-sm text-ink-faint">
          Pa gen pwodwi ankò. Ajoute premye pwodwi ou an.
        </p>
      )}

      <BottomNav active="katalog" />
    </div>
  );
}

function Rooster() {
  return (
    <svg width="25" height="25" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" /><circle cx="41" cy="11" r="4" fill="#FFD34E" /><circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#075E54" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" /><path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" /><circle cx="45" cy="22" r="2.4" fill="#FFFFFF" />
    </svg>
  );
}
function Bag() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#B7791F" strokeWidth="1.5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
