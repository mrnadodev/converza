import { NextResponse } from "next/server";
import { hasSupabase } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

// Réception des évènements d'audience envoyés par `navigator.sendBeacon`.
//
// Pourquoi une route et non l'action serveur : un clic vers une boutique part
// en même temps que la navigation. L'action serveur était interrompue par le
// départ de la page, et le clic — la seule mesure qui dise que l'annuaire
// envoie vraiment du monde chez les marchands — n'arrivait jamais.
// `sendBeacon` est fait pour ça : le navigateur s'engage à livrer la requête
// même si la page disparaît dans la seconde.
//
// Rien de personnel n'entre ici : pas d'adresse IP, pas de cookie, pas
// d'identifiant de visiteur. On compte des évènements.

const KINDS = ["visit", "search", "shop_click"] as const;
const MAX_TERM = 80;
const MAX_PATH = 200;
/** Un identifiant de boutique, ou rien. Tout le reste est écarté. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  // La réponse est toujours la même, quoi qu'il arrive : cette route ne dit
  // rien à qui la sonde, et `sendBeacon` ne lit pas le corps de toute façon.
  const ok = () => new NextResponse(null, { status: 204 });
  if (!hasSupabase()) return ok();

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return ok();
  }

  const p = corps as { kind?: string; path?: string; term?: string; businessId?: string };
  const kind = KINDS.find((k) => k === p.kind);
  if (!kind) return ok();

  const admin = createAdminClient();
  if (!admin) return ok();

  await admin.from("site_events").insert({
    kind,
    path: typeof p.path === "string" ? p.path.trim().slice(0, MAX_PATH) || null : null,
    term: kind === "search" && typeof p.term === "string" ? p.term.trim().toLowerCase().slice(0, MAX_TERM) || null : null,
    business_id: typeof p.businessId === "string" && UUID.test(p.businessId) ? p.businessId : null,
  });

  return ok();
}
