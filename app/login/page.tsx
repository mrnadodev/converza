import { signIn } from "./actions";
import { CvzMark } from "@/components/CvzMark";
import { LoginForm } from "@/components/LoginForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { hasSupabase } from "@/lib/data";
import { Slogan } from "@/components/Slogan";
import { Wordmark } from "@/components/Wordmark";

// Écran de connexion (owner / agent).
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[440px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      {/* Bannière de marque */}
      {/* Du vert foncé au vert moins foncé, et pas l'inverse : le logo inversé
          et l'accent vert du mot ont tous deux besoin d'un fond sombre.
          L'ancien dégradé partait de #25D366 — contre le ruban vert du logo
          il mesurait 1,01, soit exactement la même couleur, et l'arche y
          perdait la moitié d'elle-même.

          La borne claire ne peut pas monter plus haut : à #0A7D52 le ruban
          vert tombe à 2,58 et l'accent à 2,60. #086647 est le vert le moins
          foncé qui laisse encore passer les deux. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#04392F] to-[#086647] px-6 pb-12 pt-16">
        <div className="absolute right-4 top-4 z-10">
          <LanguageToggle />
        </div>
        {/* motif de bulles de conversation en filigrane */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden="true">
          <defs>
            <pattern id="bubbles" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
              <path d="M14 10a10 10 0 1 0-4 8l-3 4 5-1a10 10 0 0 0 2-11z" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bubbles)" />
        </svg>
        {/* Le mot chevauche l'arche, comme sur le logo d'origine : il remonte
            dans l'ouverture, entre les deux pieds, et n'est pas simplement
            posé dessous.

            Le chevauchement est borné par la lisibilité. Sur le logo
            d'origine le mot est noir sur blanc ; ici il est blanc, et l'arche
            a un ruban blanc — s'il montait plus haut, les lettres toucheraient
            ce ruban et disparaîtraient dedans. Il s'arrête donc dans
            l'ouverture, là où le fond est la bannière.

            Les deux nombres viennent d'une mesure du fichier : dans la bande
            du mot, l'arche garde 43 % de matière jusqu'à 67 % de sa hauteur,
            et ne se dégage qu'à partir de 76 %. Le mot remonte donc de 20 px
            sur une arche de 84 px de haut — pas davantage — et reste assez
            étroit pour passer entre les deux pieds.

            Le mot est décalé à gauche, comme sur le logo d'origine où son
            centre tombe vers 38 % de la largeur et non au milieu. L'arche est
            asymétrique : à la hauteur du mot le pied gauche s'est déjà
            terminé, et seul le pied droit descend — il reste 44 px de jeu à
            gauche contre 9 à droite. Les 24 px de décalage tiennent donc
            largement dans l'ouverture. */}
        <div className="relative flex flex-col items-center">
          <CvzMark tone="onDark" size={196} />
          <div className="-mt-5 flex flex-col items-center gap-1 text-center">
            <Wordmark tone="onBrand" className="inline-block -translate-x-6 text-[30px] font-extrabold tracking-tight text-white" />
            <Slogan className="text-[13.5px] font-medium text-[#CFF5E7]" />
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pt-8">
        <LoginForm signInAction={signIn} error={searchParams.error} />

        {/* Personas de démonstration : visibles uniquement tant qu'aucune base
            n'est configurée. Avec une vraie base, ces boutons donneraient une
            liste de comptes à essayer sur l'écran de connexion public. */}
        {!hasSupabase() && (
        <div className="mt-6 flex flex-col gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950">
          <span className="font-extrabold text-emerald-900 text-[12.5px]">🔑 Klike sou yon Manm pou w wè Espas Travay Pa li an :</span>

          {/* 1. Marie Joseph */}
          <form action={signIn} className="flex flex-col gap-1 rounded-xl bg-white p-2.5 border border-blue-200 shadow-2xs">
            <input type="hidden" name="email" value="marie@pasrel.ht" />
            <input type="hidden" name="password" value="Marie2026!" />
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-ink">💳 Marie Joseph (Caissière / Pèman)</span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-900">Ajan</span>
            </div>
            <button
              type="submit"
              className="mt-1 flex h-8 w-full items-center justify-center gap-1 rounded-xl bg-blue-600 text-[11.5px] font-black text-white active:scale-95 shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <span>🔑 Konekte kòm Marie Joseph (Caissière)</span>
            </button>
          </form>

          {/* 2. Jean Baptiste */}
          <form action={signIn} className="flex flex-col gap-1 rounded-xl bg-white p-2.5 border border-slate-200 shadow-2xs">
            <input type="hidden" name="email" value="jean@pasrel.ht" />
            <input type="hidden" name="password" value="Jean2026!" />
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-ink">💬 Jean Baptiste (Commercial / Ventes)</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-900">Ajan</span>
            </div>
            <button
              type="submit"
              className="mt-1 flex h-8 w-full items-center justify-center gap-1 rounded-xl bg-slate-800 text-[11.5px] font-black text-white active:scale-95 shadow-2xs hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <span>🔑 Konekte kòm Jean Baptiste (Ventes)</span>
            </button>
          </form>

          {/* 3. Pierre-Louis K. */}
          <form action={signIn} className="flex flex-col gap-1 rounded-xl bg-white p-2.5 border border-purple-200 shadow-2xs">
            <input type="hidden" name="email" value="pierre@pasrel.ht" />
            <input type="hidden" name="password" value="Pierre2026!" />
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-ink">📦 Pierre-Louis K. (Stockist / Livrezon)</span>
              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-black text-purple-900">Ajan</span>
            </div>
            <button
              type="submit"
              className="mt-1 flex h-8 w-full items-center justify-center gap-1 rounded-xl bg-purple-600 text-[11.5px] font-black text-white active:scale-95 shadow-2xs hover:bg-purple-700 transition-colors cursor-pointer"
            >
              <span>🔑 Konekte kòm Pierre-Louis (Livreur)</span>
            </button>
          </form>

          {/* 4. Florence Désir */}
          <form action={signIn} className="flex flex-col gap-1 rounded-xl bg-white p-2.5 border border-amber-200 shadow-2xs">
            <input type="hidden" name="email" value="florence@pasrel.ht" />
            <input type="hidden" name="password" value="Florence2026!" />
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-ink">🏷️ Florence Désir (Sèvis Kliyan & Dèt)</span>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-900">Ajan</span>
            </div>
            <button
              type="submit"
              className="mt-1 flex h-8 w-full items-center justify-center gap-1 rounded-xl bg-amber-600 text-[11.5px] font-black text-white active:scale-95 shadow-2xs hover:bg-amber-700 transition-colors cursor-pointer"
            >
              <span>🔑 Konekte kòm Florence Désir (Dèt)</span>
            </button>
          </form>

          {/* 5. Andro Charles (Admin) */}
          <form action={signIn} className="flex flex-col gap-1 rounded-xl bg-white p-2.5 border border-emerald-300 shadow-2xs">
            <input type="hidden" name="email" value="andro@pasrel.ht" />
            <input type="hidden" name="password" value="Andro2026!" />
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-ink">👑 Andro Charles (Fondateur / Admin)</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-900">Admin</span>
            </div>
            <button
              type="submit"
              className="mt-1 flex h-8 w-full items-center justify-center gap-1 rounded-xl bg-emerald-700 text-[11.5px] font-black text-white active:scale-95 shadow-2xs hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <span>🔑 Konekte kòm Andro Charles (Admin)</span>
            </button>
          </form>
        </div>
        )}

        <p className="pb-6 text-center text-[13px] text-ink-muted">
          <span className="sr-only">PASRÈL</span>
        </p>
      </div>
    </div>
  );
}
