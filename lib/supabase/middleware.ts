import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session Supabase ET protège les routes de l'app.
// - Mode démo (pas d'env Supabase) : aucun garde, tout est accessible.
// - Mode Supabase : les routes app exigent une session ; la vitrine /b/* et
//   /login restent publiques.
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // démo : pas de login requis

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path === "/acceuil" ||
    path === "/accueil" ||
    path === "/login" ||
    path === "/enskri" ||
    path === "/join" ||
    // Cible du lien de réinitialisation : la session n'existe pas encore quand
    // le marchand arrive ici, elle se crée à partir du jeton dans l'URL.
    path === "/nouvo-modpas" ||
    path.startsWith("/b/") ||
    path.startsWith("/api") ||
    path.startsWith("/manifest") ||
    path === "/sw.js" ||
    path === "/icon.svg" ||
    path === "/apple-touch-icon.png";

  // NOTE: le cookie `converza_role` ne vaut PAS authentification. Il n'est
  // qu'un indice d'affichage, écrit par le serveur après connexion — un visiteur
  // peut le poser lui-même depuis la console. Seule la session Supabase compte.
  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
