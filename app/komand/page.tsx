import { BottomNav } from "@/components/BottomNav";
import { PipelineBoard } from "@/components/PipelineBoard";
import { getPipeline, getMyBusiness, getCurrentUserSession } from "@/lib/data";

// Écran Kòmand — tableau des commandes par étape.
export default async function KomandPage() {
  const [cards, business] = await Promise.all([getPipeline(), getMyBusiness()]);
  const session = getCurrentUserSession();

  return (
    <div className="app-page with-topnav relative flex min-h-[100dvh] flex-col bg-[#F0F2F3]">
      <PipelineBoard
        initial={cards}
        userSession={session}
        businessName={business.name}
        businessLogoUrl={business.logo_url}
        businessPhone={business.phone_e164 ?? undefined}
        businessSlogan={business.slogan}
        businessSlug={business.slug}
        businessPromoText={business.promo_text}
        businessCurrency={business.default_currency}
        businessUsdExchangeRate={business.usd_exchange_rate}
        businessBankAccounts={business.bank_accounts}
        businessZelleInfo={business.zelle_info}
        businessUsdtAddress={business.usdt_trc20_address}
        businessMoncashNumber={business.moncash_number}
        businessMoncashName={business.moncash_name}
        businessMoncashQrUrl={business.moncash_qr_url}
        businessNatcashNumber={business.natcash_number}
        businessNatcashName={business.natcash_name}
        businessNatcashQrUrl={business.natcash_qr_url}
        businessZelleQrUrl={business.zelle_qr_url}
        businessUsdtQrUrl={business.usdt_qr_url}
      />

      <BottomNav active="komand" userSession={session} />
    </div>
  );
}
