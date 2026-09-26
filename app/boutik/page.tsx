import Link from "next/link";
import type { Metadata } from "next";
import { listDirectoryShops, searchDirectory } from "@/lib/data";
import { formatMoney } from "@/lib/money";

// Annuaire public des boutiques CONVERZA.
//
// CONVERZA donnait à chaque marchand un lien à partager, mais ne l'exposait
// nulle part : celui qui n'est pas sur Facebook n'était découvert par personne.
// Cette page répond à la seule question qui compte pour un acheteur — « qui
// vend ce produit ? » — et renvoie vers la vitrine du marchand.
//
// Elle est rendue à chaque requête : la recherche vient de l'URL, et un
// catalogue qui change doit se voir tout de suite.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trouver un produit — CONVERZA",
  description: "Cherchez un produit et découvrez les boutiques qui le vendent, avec leur vitrine et leur WhatsApp.",
};

export default async function AnnuairePage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q ?? "").trim();
  const [recherche, annuaire] = await Promise.all([searchDirectory(q), q ? Promise.resolve(null) : listDirectoryShops()]);

  // Les vues arrivent avec la migration 11. Tant qu'elle n'est pas passée, on
  // le dit franchement plutôt que d'afficher une page vide qui ressemble à une
  // panne — ou pire, à un annuaire sans aucune boutique.
  const prete = recherche.available && (annuaire?.available ?? true);

  return (
    <main className="min-h-[100dvh] bg-[#F0F2F3]">
      <header className="bg-brand px-5 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-[900px]">
          <Link href="/" className="text-[12.5px] font-bold text-[#B9F5E4] hover:text-white">
            CONVERZA
          </Link>
          <h1 className="pt-2 text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-[32px]">
            Trouvez un produit, découvrez la boutique
          </h1>
          <p className="max-w-[520px] pt-2 text-[14px] leading-relaxed text-[#C4E8DD]">
            Tapez ce que vous cherchez. Nous vous disons quelles boutiques le vendent, et vous leur écrivez sur WhatsApp.
          </p>

          <form action="/boutik" method="get" className="flex gap-2 pt-5">
            <input
              name="q"
              defaultValue={q}
              placeholder="Chaussures, riz, téléphone…"
              aria-label="Chercher un produit"
              className="h-12 flex-1 rounded-xl border-0 px-4 text-[14px] text-ink outline-none"
            />
            <button type="submit" className="h-12 shrink-0 rounded-xl bg-white px-5 text-[14px] font-extrabold text-brand-dark active:scale-95">
              Chercher
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[900px] px-5 py-6">
        {!prete ? (
          <p className="rounded-2xl border border-line bg-white p-6 text-center text-[13px] text-ink-muted">
            L&apos;annuaire n&apos;est pas encore ouvert. Revenez bientôt.
          </p>
        ) : q ? (
          <Resultats q={q} hits={recherche.hits} />
        ) : (
          <Boutiques shops={annuaire?.shops ?? []} />
        )}
      </div>
    </main>
  );
}

function Resultats({ q, hits }: { q: string; hits: Awaited<ReturnType<typeof searchDirectory>>["hits"] }) {
  if (hits.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-[14px] font-bold text-ink">Aucun produit ne correspond à « {q} ».</p>
        <p className="pt-1 text-[12.5px] text-ink-muted">Essayez un mot plus court, ou le nom d&apos;une catégorie.</p>
        <Link href="/boutik" className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-[13px] font-bold text-white">
          Voir toutes les boutiques
        </Link>
      </div>
    );
  }

  // Groupé par boutique : un acheteur veut savoir chez qui aller, pas parcourir
  // une liste de produits dont il faudrait deviner l'origine.
  const parBoutique = new Map<string, typeof hits>();
  for (const h of hits) {
    const liste = parBoutique.get(h.businessSlug) ?? [];
    liste.push(h);
    parBoutique.set(h.businessSlug, liste);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-[12.5px] font-semibold text-ink-muted">
        {hits.length} produit{hits.length > 1 ? "s" : ""} dans {parBoutique.size} boutique{parBoutique.size > 1 ? "s" : ""}
      </p>

      {[...parBoutique.entries()].map(([slug, produits]) => (
        <section key={slug} className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[14.5px] font-extrabold text-ink">{produits[0].businessName}</span>
              {produits[0].businessAddress && (
                <span className="truncate text-[11.5px] text-ink-muted">{produits[0].businessAddress}</span>
              )}
            </div>
            <Link
              href={`/b/${slug}`}
              className="h-9 shrink-0 rounded-xl bg-brand-green px-3.5 text-[12.5px] font-extrabold leading-9 text-white active:scale-95"
            >
              Voir la vitrine
            </Link>
          </div>

          <ul className="divide-y divide-line/60">
            {produits.map((p) => (
              <li key={p.productId} className="flex items-center gap-3 px-4 py-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-slate-50">
                  {p.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13.5px] font-bold text-ink">{p.productName}</span>
                  {p.category && <span className="truncate text-[11.5px] text-ink-muted">{p.category}</span>}
                </span>
                <span className="shrink-0 text-[13.5px] font-extrabold text-brand">{formatMoney(p.priceCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Boutiques({ shops }: { shops: Awaited<ReturnType<typeof listDirectoryShops>>["shops"] }) {
  if (shops.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-white p-8 text-center text-[13px] text-ink-muted">
        Aucune boutique inscrite pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-[12.5px] font-semibold text-ink-muted">
        {shops.length} boutique{shops.length > 1 ? "s" : ""} sur CONVERZA
      </p>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {shops.map((b) => (
          <li key={b.id}>
            <Link href={`/b/${b.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 hover:border-ink-faint">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E7F7F1] text-[15px] font-extrabold text-brand">
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  b.name.slice(0, 2).toUpperCase()
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-extrabold text-ink">{b.name}</span>
                <span className="truncate text-[11.5px] text-ink-muted">
                  {[b.businessType, b.address].filter(Boolean).join(" · ") || "Boutique"}
                </span>
                <span className="text-[11px] font-semibold text-brand">
                  {b.productCount} produit{b.productCount > 1 ? "s" : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
