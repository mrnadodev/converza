"use server";

import { hasSupabase } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

// Mesure d'audience du site public.
//
// PASRÈL ne comptait que les commandes : on savait ce qui se vendait, jamais
// ce qui avait conduit à la vente — ni, surtout, ce qui n'y avait pas conduit.
// L'annuaire venait d'ouvrir sans aucun moyen de savoir s'il servait.
//
// CE QUI N'EST PAS ENREGISTRÉ : aucune adresse IP, aucun cookie, aucun
// identifiant de visiteur. On compte des évènements, pas des personnes. Une
// « visite » est donc une page ouverte, et les écrans doivent le dire ainsi.
//
// L'écriture est volontairement silencieuse : une mesure qui casserait la page
// qu'elle mesure serait un mauvais échange.

export type SiteEventKind = "visit" | "search" | "shop_click";

/** Au-delà, ce n'est plus un terme de recherche mais un collage accidentel. */
const MAX_TERM = 80;
const MAX_PATH = 200;

export async function logSiteEvent(input: {
  kind: SiteEventKind;
  path?: string | null;
  term?: string | null;
  businessId?: string | null;
}): Promise<void> {
  if (!hasSupabase()) return;

  const admin = createAdminClient();
  if (!admin) return;

  // Les termes sont rangés en minuscules et sans espaces superflus : sinon
  // « Riz », « riz » et « riz  » compteraient pour trois recherches
  // différentes, et le classement ne voudrait plus rien dire.
  const term = input.term?.trim().toLowerCase().slice(0, MAX_TERM) || null;
  const path = input.path?.trim().slice(0, MAX_PATH) || null;

  const { error } = await admin.from("site_events").insert({
    kind: input.kind,
    path,
    term: input.kind === "search" ? term : null,
    business_id: input.businessId ?? null,
  });

  // Table absente (migration 13 pas encore passée) ou écriture refusée : on se
  // tait. Le visiteur n'a rien demandé, et la page doit continuer.
  if (error && process.env.NODE_ENV === "development") {
    console.warn("site_events:", error.message);
  }
}
