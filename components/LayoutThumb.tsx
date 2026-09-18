import type { DesignShape } from "@/lib/storefront-designs";

/**
 * Schéma d'un design de vitrine : chaque bloc est une image mise en avant,
 * dans la géométrie de la vitrine sur téléphone.
 */
export function LayoutThumb({ shape, color = "#008069", active }: { shape: DesignShape; color?: string; active?: boolean }) {
  const strong = { background: active ? color : "#A3B5AF" };
  const soft = { background: active ? `${color}80` : "#C9D6D1" };
  const b = (cls: string, big?: boolean, extra?: string) => <span className={`rounded-[5px] ${cls} ${extra ?? ""}`} style={big ? strong : soft} />;

  const layouts: Record<DesignShape, { cols: string; rows: string; blocks: JSX.Element[] }> = {
    hero3: { cols: "1fr 1fr", rows: "1.3fr 1fr", blocks: [b("col-span-2", true), b(""), b("")] },
    showroom3: { cols: "1fr 1fr", rows: "1.4fr 1fr", blocks: [b("col-span-2", true), b(""), b("")] },
    grid4: { cols: "1fr 1fr", rows: "1fr 1fr", blocks: [b(""), b(""), b(""), b("")] },
    portrait4: { cols: "1fr 1fr 1fr 1fr", rows: "1fr", blocks: [b(""), b(""), b(""), b("")] },
    circles4: { cols: "1fr 1fr", rows: "1fr 1fr", blocks: [0, 1, 2, 3].map((i) => b("mx-auto aspect-square h-full !rounded-full", false, String(i))) },
    stack3: { cols: "1fr", rows: "1fr 1fr 1fr", blocks: [b(""), b(""), b("")] },
    split3: { cols: "1fr 1fr", rows: "1fr 1fr", blocks: [b(""), b(""), b("col-span-2", true)] },
    alt4: { cols: "2fr 1fr", rows: "1fr 1fr", blocks: [b("", true), b(""), b("order-4", true), b("order-3")] },
    capsule4: { cols: "1fr 1fr", rows: "1fr 1fr", blocks: [b("!rounded-t-full", true), b(""), b("!rounded-b-full", true), b("")] },
    masonry4: { cols: "1fr 1fr", rows: "1.4fr 1fr", blocks: [b("", true), b("row-span-2", true), b("")] },
    feature4: { cols: "1fr 1fr 1fr", rows: "1.4fr 1fr", blocks: [b("col-span-3", true), b(""), b(""), b("")] },
    columns3: { cols: "1fr 1fr 1fr", rows: "1fr", blocks: [b(""), b(""), b("")] },
    pricing3: { cols: "1fr 1fr 1fr", rows: "1fr", blocks: [b("my-2"), b("", true), b("my-2")] },
    list: { cols: "1fr", rows: "1fr 1fr 1fr", blocks: [b(""), b(""), b("")] },
    table: { cols: "1fr", rows: "0.6fr 1fr 1fr 1fr", blocks: [b("", true), b(""), b(""), b("")] },
  };
  const l = layouts[shape];

  return (
    <div
      className="grid h-[88px] w-full gap-1 rounded-lg bg-white p-1.5 ring-1 ring-line"
      style={{ gridTemplateColumns: l.cols, gridTemplateRows: l.rows }}
      aria-hidden="true"
    >
      {l.blocks.map((el, i) => (
        <span key={i} className="contents">
          {el}
        </span>
      ))}
    </div>
  );
}
