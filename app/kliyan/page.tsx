import { BottomNav } from "@/components/BottomNav";
import { getCustomers } from "@/lib/data";
import { waMeLink } from "@/lib/whatsapp";

const TAG_LABEL: Record<string, string> = {
  kliyan_fidel: "Kliyan fidèl",
  nouvo_kliyan: "Nouvo",
};

const AVATAR_TONES = [
  "bg-[#DCF8C6] text-[#2A7D3F]",
  "bg-[#D7EBFF] text-[#1A6BB8]",
  "bg-[#FCE4E4] text-[#C0392B]",
  "bg-[#EADCF8] text-[#7A3EAF]",
  "bg-[#FDECC8] text-[#B7791F]",
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default async function KliyanPage() {
  const customers = await getCustomers();

  return (
    <div className="relative min-h-[100dvh] bg-white pb-[96px]">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white">
          <Rooster />
        </div>
        <span className="text-[21px] font-extrabold tracking-tight text-white">Kliyan</span>
        <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
          {customers.length}
        </span>
      </header>

      <div>
        {customers.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 border-b border-[#F2F4F5] px-4 py-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
              {initials(c.full_name)}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{c.full_name}</span>
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[12.5px] text-ink-faint">{c.phone_e164}</span>
                {c.tags?.filter((t) => TAG_LABEL[t]).map((t) => (
                  <span key={t} className="rounded-md bg-[#E7F7F1] px-1.5 py-px text-[10px] font-semibold text-brand">
                    {TAG_LABEL[t]}
                  </span>
                ))}
              </div>
            </div>
            <a
              href={waMeLink(c.phone_e164)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F7F1] active:scale-95"
              aria-label={`WhatsApp ${c.full_name}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" /></svg>
            </a>
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <p className="px-6 pt-16 text-center text-sm text-ink-faint">
          Pa gen kliyan ankò. Yo ap parèt otomatikman lè yo kòmande.
        </p>
      )}

      <BottomNav active="kliyan" />
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
