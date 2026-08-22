import { signIn } from "./actions";
import { CvzMark } from "@/components/CvzMark";

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
        <h1 className="text-xl font-extrabold">Konekte</h1>
        <p className="mt-1 text-sm text-ink-muted">Antre nan kont biznis ou.</p>

        {searchParams.error && (
          <div className="mt-4 rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">
            {searchParams.error}
          </div>
        )}

        <form action={signIn} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink-soft">Imèl</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="ou@egzanp.com"
              className="h-12 rounded-xl border border-line bg-[#F7F8F9] px-4 text-[15px] outline-none focus:border-brand focus:bg-white"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink-soft">Modpas</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-12 rounded-xl border border-line bg-[#F7F8F9] px-4 text-[15px] outline-none focus:border-brand focus:bg-white"
            />
          </label>

          <button
            type="submit"
            className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99]"
          >
            Konekte
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-ink-muted">
          Ou poko gen yon kont?{" "}
          <a href="/enskri" className="font-bold text-brand">Kreye biznis ou</a>
        </p>
      </div>
    </div>
  );
}
