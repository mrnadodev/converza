import { createAdminClient } from "@/lib/supabase/admin";

// Journal des erreurs techniques (db/migrate-2026-7-support.sql).
//
// Sans lui, une panne ne se voit que si un marchand téléphone. On enregistre
// l'échec et on continue : journaliser ne doit jamais casser l'action en cours.

export async function logAppError(entry: {
  /** Où l'erreur s'est produite, ex. « stock.movement » ou « purchase.record ». */
  scope: string;
  message: string;
  businessId?: string | null;
  userId?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    await admin.from("app_errors").insert({
      scope: entry.scope.slice(0, 80),
      message: entry.message.slice(0, 500),
      business_id: entry.businessId ?? null,
      user_id: entry.userId ?? null,
      details: entry.details ?? {},
    });
  } catch {
    // Table absente (migration 7) ou base injoignable : on n'insiste pas.
  }
}
