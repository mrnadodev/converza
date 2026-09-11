import { signIn } from "./actions";
import { CvzMark } from "@/components/CvzMark";
import { LoginForm } from "@/components/LoginForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { hasSupabase } from "@/lib/data";

// Écran de connexion (owner / agent).
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[440px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      {/* Bannière de marque */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-green to-brand-dark px-6 pb-12 pt-16">
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
        <div className="relative flex flex-col items-center gap-4">
          <div className="rounded-[26px] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <CvzMark size={84} />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-[28px] font-extrabold tracking-tight text-white">CONVERZA</span>
            <span className="text-[13.5px] font-medium text-[#CFF5E7]">Turn conversations into customers</span>
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
            <input type="hidden" name="email" value="marie@converza.ht" />
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
            <input type="hidden" name="email" value="jean@converza.ht" />
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
            <input type="hidden" name="email" value="pierre@converza.ht" />
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
            <input type="hidden" name="email" value="florence@converza.ht" />
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
            <input type="hidden" name="email" value="andro@converza.ht" />
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
          <span className="sr-only">CONVERZA</span>
        </p>
      </div>
    </div>
  );
}
