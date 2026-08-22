import { BottomNav } from "@/components/BottomNav";
import { PipelineBoard } from "@/components/PipelineBoard";
import { getPipeline, getMyBusiness } from "@/lib/data";

// Écran Kòmand — Vue Pipeline (Kanban).
export default async function KomandPage() {
  const [cards, business] = await Promise.all([getPipeline(), getMyBusiness()]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#F0F2F3]">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white">
          <RoosterLogo />
        </div>
        <div className="flex flex-col">
          <span className="text-[19px] font-extrabold text-white">Pipeline</span>
          <span className="text-[11.5px] text-[#B9F5E4]">Deplase kòmand yo soti nan yon etap</span>
        </div>
      </header>

      <PipelineBoard initial={cards} businessName={business.name} />

      <BottomNav active="komand" />
    </div>
  );
}

function RoosterLogo() {
  return (
    <svg width="25" height="25" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" />
      <circle cx="41" cy="11" r="4" fill="#FFD34E" />
      <circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#075E54" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" />
      <path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" />
      <circle cx="45" cy="22" r="2.4" fill="#FFFFFF" />
    </svg>
  );
}
