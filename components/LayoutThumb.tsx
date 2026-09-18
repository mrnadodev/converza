import type { LayoutKey } from "@/lib/storefront-layouts";

/**
 * Schéma d'une disposition de vitrine : chaque bloc est une image mise en
 * avant, dans la même géométrie que la vitrine sur téléphone.
 */
export function LayoutThumb({ layout, active }: { layout: LayoutKey; active?: boolean }) {
  const block = `rounded-[5px] ${active ? "bg-brand/70" : "bg-[#C9D6D1]"}`;
  const big = `rounded-[5px] ${active ? "bg-brand" : "bg-[#A3B5AF]"}`;

  return (
    <div className="grid h-[88px] w-full grid-cols-2 gap-1 rounded-lg bg-white p-1.5 ring-1 ring-line" aria-hidden="true"
      style={{ gridTemplateRows: layout === "design1" ? "1fr 1fr" : layout === "design2" ? "1.3fr 1fr" : "1.2fr 1fr 1fr" }}>
      {layout === "design1" && [0, 1, 2, 3].map((i) => <span key={i} className={block} />)}
      {layout === "design2" && (
        <>
          <span className={`col-span-2 ${big}`} />
          <span className={block} />
          <span className={block} />
        </>
      )}
      {layout === "design3" && (
        <>
          <span className={`col-span-2 ${big}`} />
          <span className={block} />
          <span className={block} />
          <span className={`col-span-2 ${block}`} />
        </>
      )}
    </div>
  );
}
