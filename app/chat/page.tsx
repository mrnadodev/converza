import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";

// Le modèle CONVERZA repose sur wa.me : les conversations vivent dans WhatsApp.
// L'app n'héberge pas de messagerie — elle ouvre WhatsApp avec le bon client.
export default function ChatPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#F7F8F9] pb-[96px]">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white">
          <Rooster />
        </div>
        <span className="text-[21px] font-extrabold tracking-tight text-white">Konvèsasyon</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#E7F7F1]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#25D366" stroke="none">
            <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-extrabold">Konvèsasyon yo nan WhatsApp</h1>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">
            CONVERZA ouvri WhatsApp dirèkteman ak bon kliyan an — pa gen mesaj ki pèdi,
            pa gen dwòl aplikasyon pou aprann. Chwazi yon kliyan pou kòmanse.
          </p>
        </div>
        <Link
          href="/kliyan"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99]"
        >
          Wè kliyan yo
        </Link>
      </div>

      <BottomNav active="chat" />
    </div>
  );
}

function Rooster() {
  return (
    <svg width="25" height="25" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" /><circle cx="41" cy="11" r="4" fill="#FFD34E" /><circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#075E54" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" /><path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" /><circle cx="45" cy="22" r="2.4" fill="#FFFFFF" />
    </svg>
  );
}
