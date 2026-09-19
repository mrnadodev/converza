import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_PLANS, DEFAULT_PAYMENT_INFO, type Plan, type PlatformPaymentInfo } from "./plans";
import { DEFAULT_PLATFORM_SETTINGS, type PlatformGlobalSettings } from "./platform-config";
import { DEFAULT_LEGAL_INFO, mergeLegalInfo, type LegalInfo } from "./legal";

// Persistance de la configuration plateforme (tarifs, coordonnées de paiement
// CONVERZA, feature flags).
//
// Ces valeurs vivaient dans des `let` de module : sur Vercel, chaque instance
// serverless gardait sa propre copie et tout redéploiement remettait les prix
// d'origine. Un changement de tarif décidé par le super-admin ne tenait pas.
// Elles sont maintenant stockées en base, dans une table à une ligne par clé.

type SettingsKey = "plans" | "payment_info" | "global_settings" | "legal_info";

const TABLE = "platform_settings";
const CACHE_TTL_MS = 30_000;

const cache = new Map<SettingsKey, { value: unknown; expires: number }>();

async function readSetting<T>(key: SettingsKey, fallback: T): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const admin = createAdminClient();
  if (!admin) return fallback;

  const { data, error } = await admin.from(TABLE).select("value").eq("key", key).maybeSingle();
  if (error || !data?.value) return fallback;

  cache.set(key, { value: data.value, expires: Date.now() + CACHE_TTL_MS });
  return data.value as T;
}

async function writeSetting<T>(key: SettingsKey, value: T): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from(TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error(`platform-store: échec écriture ${key}:`, error.message);
    return false;
  }
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  return true;
}

export async function loadPlans(): Promise<Plan[]> {
  const stored = await readSetting<Plan[]>("plans", DEFAULT_PLANS);
  return Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_PLANS;
}

/** Coordonnées affichées dans les conditions et la confidentialité. */
export async function loadLegalInfo(): Promise<LegalInfo> {
  return mergeLegalInfo(await readSetting<Partial<LegalInfo>>("legal_info", DEFAULT_LEGAL_INFO));
}

export async function saveLegalInfo(info: LegalInfo): Promise<boolean> {
  return writeSetting("legal_info", mergeLegalInfo(info));
}

export async function loadPaymentInfo(): Promise<PlatformPaymentInfo> {
  return readSetting<PlatformPaymentInfo>("payment_info", DEFAULT_PAYMENT_INFO);
}

export async function loadPlatformSettings(): Promise<PlatformGlobalSettings> {
  const stored = await readSetting<Partial<PlatformGlobalSettings>>("global_settings", {});
  // Fusion avec les valeurs par défaut : une clé ajoutée au code après le
  // dernier enregistrement doit apparaître, pas manquer.
  return { ...DEFAULT_PLATFORM_SETTINGS, ...stored };
}

/** Tarif d'un plan, avec repli sur le plan gratuit si la clé est inconnue. */
export async function planByKey(key: string | null | undefined): Promise<Plan> {
  const plans = await loadPlans();
  return plans.find((p) => p.key === key) ?? plans[0];
}

export async function savePlan(key: string, patch: Partial<Plan>): Promise<Plan | null> {
  const plans = await loadPlans();
  const idx = plans.findIndex((p) => p.key === key);
  if (idx === -1) return null;

  const next = plans.map((p, i) => (i === idx ? { ...p, ...patch } : p));

  // Le prix du Menu QR Express est affiché à deux endroits : le plan et la
  // configuration du service QR. On les garde alignés.
  if (key === "qr_express" && patch.priceGdes !== undefined) {
    const settings = await loadPlatformSettings();
    await writeSetting("global_settings", {
      ...settings,
      qrMenuService: { ...settings.qrMenuService, standalonePriceGdes: patch.priceGdes },
    });
  }

  const ok = await writeSetting("plans", next);
  return ok ? next[idx] : null;
}

export async function savePaymentInfo(patch: Partial<PlatformPaymentInfo>): Promise<PlatformPaymentInfo | null> {
  const current = await loadPaymentInfo();
  const next = { ...current, ...patch };
  return (await writeSetting("payment_info", next)) ? next : null;
}

export async function savePlatformSettings(
  patch: Partial<PlatformGlobalSettings>,
): Promise<PlatformGlobalSettings | null> {
  const current = await loadPlatformSettings();
  const next = { ...current, ...patch };

  if (patch.qrMenuService?.standalonePriceGdes !== undefined) {
    const plans = await loadPlans();
    await writeSetting(
      "plans",
      plans.map((p) =>
        p.key === "qr_express" ? { ...p, priceGdes: patch.qrMenuService!.standalonePriceGdes } : p,
      ),
    );
  }

  return (await writeSetting("global_settings", next)) ? next : null;
}
