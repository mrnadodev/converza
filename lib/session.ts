import { cookies } from "next/headers";
import type { UserSession } from "./rbac";

// Personas de démonstration. Ils n'existent que lorsque Supabase n'est pas
// configuré (mode vitrine/dev) : en production, l'identité vient de la session
// Supabase et du rôle stocké dans `members`.
export const DEMO_PERSONAS: Record<string, UserSession> = {
  marie: { full_name: "Marie Joseph", role: "agent", specialty: "Caissière / Pèman", agentId: "marie" },
  jean: { full_name: "Jean Baptiste", role: "agent", specialty: "Commercial / Ventes", agentId: "jean" },
  pierre: { full_name: "Pierre-Louis K.", role: "agent", specialty: "Stockist / Livrezon", agentId: "pierre" },
  florence: { full_name: "Florence Désir", role: "agent", specialty: "Sèvis Kliyan & Dèt", agentId: "florence" },
  steeve: { full_name: "Steeve Alexis", role: "agent", specialty: "Ajan Relans & Promo", agentId: "steeve" },
  gerant: { full_name: "Supervisè Jeneral", role: "agent", specialty: "Gérant Général (Délégué Interim)", agentId: "gerant" },
};

export const DEFAULT_OWNER_SESSION: UserSession = {
  full_name: "Fondateur",
  role: "owner",
  specialty: "Fondateur / Admin",
  agentId: "owner",
};

// L'identité est lue dans les cookies de la requête courante. On n'utilise plus
// `globalThis` : sur un serveur partagé, le dernier utilisateur connecté
// écraserait l'identité de tous les autres.
export function getCurrentUserSession(): UserSession {
  try {
    const roleCookie = cookies().get("converza_role")?.value;
    const userNameCookie = cookies().get("converza_user_name")?.value;

    // Le cookie porte le profil métier ; le nom affiché reste celui du vrai
    // membre, pas celui du persona qui sert de gabarit de permissions.
    if (roleCookie && DEMO_PERSONAS[roleCookie]) {
      const persona = DEMO_PERSONAS[roleCookie];
      return userNameCookie ? { ...persona, full_name: userNameCookie } : persona;
    }

    if (userNameCookie || roleCookie === "owner" || roleCookie === "admin") {
      return { ...DEFAULT_OWNER_SESSION, full_name: userNameCookie || DEFAULT_OWNER_SESSION.full_name };
    }

    if (roleCookie === "agent") {
      return { full_name: userNameCookie || "Ajan", role: "agent", specialty: "Ajan", agentId: "agent" };
    }
  } catch {
    // cookies() appelé hors contexte de requête (build statique) : on retombe
    // sur la session par défaut.
  }

  return DEFAULT_OWNER_SESSION;
}
