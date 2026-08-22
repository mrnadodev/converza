import { signIn } from "./actions";

// Écran de connexion (owner / agent).
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[440px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      {/* En-tête de marque */}
      <div className="flex flex-col items-center gap-4 bg-brand px-6 pb-12 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-lg">
          <RoosterLogo />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-extrabold tracking-tight text-white">CONVERZA</span>
          <span className="text-[13px] text-[#B9F5E4]">Jere vant WhatsApp ou nan yon sèl kote</span>
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

function RoosterLogo() {
  return (
    <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" />
      <circle cx="41" cy="11" r="4" fill="#FFD34E" />
      <circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#075E54" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" />
      <path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" />
      <circle cx="45" cy="22" r="2.4" fill="#FFFFFF" />
      <path d="M18 30c-6-3-11-2-14 3 4 0 5 3 4 7 4-3 8-3 12-1z" fill="#FFD34E" />
      <path d="M16 36c-6-1-10 1-12 6 4-1 6 2 6 6 3-4 7-5 11-4z" fill="#12B886" />
    </svg>
  );
}
