import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditLogEntry {
  adminEmail: string;
  action:
    | "ACTIVATE_PLAN"
    | "SET_PLAN"
    | "RENEW_PLAN"
    | "REJECT_PAYMENT"
    | "REVOKE_PLAN"
    | "UPGRADE_PLAN"
    | "UPDATE_PLAN_CONFIG"
    | "UPDATE_PAYMENT_INFO"
    | "UPDATE_PLATFORM_SETTINGS"
    | "UPDATE_MERCHANT"
    | "REPAIR_MERCHANT_MEDIA"
    | "APPROVE_PHONE_CHANGE"
    | "REJECT_PHONE_CHANGE"
    | "SUSPEND_MERCHANT"
    | "UNSUSPEND_MERCHANT"
    | "RESET_PASSWORD_LINK"
    | "CHANGE_OWNER_EMAIL"
    | "TRANSFER_OWNERSHIP"
    | "VIEW_MERCHANT"
    | "TOGGLE_FREEZE"
    | "SECURITY_ALERT";
  targetBusinessId?: string;
  targetPaymentId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Enregistre une action d'administration dans la table d'audit de sécurité.
 */
export async function logAdminAction(entry: AuditLogEntry) {
  try {
    const admin = createAdminClient();
    if (!admin) {
      console.warn("[AUDIT LOG WARN] Client Admin Supabase non disponible pour enregistrer l'action:", entry);
      return;
    }

    const { error } = await admin.from("security_audit_logs").insert({
      admin_email: entry.adminEmail,
      action: entry.action,
      business_id: entry.targetBusinessId ?? null,
      payment_id: entry.targetPaymentId ?? null,
      details: entry.details ?? {},
      ip_address: entry.ipAddress ?? null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[AUDIT LOG ERROR] Impossible d'insérer dans security_audit_logs:", error.message);
    }
  } catch (err) {
    console.error("[AUDIT LOG EXCEPTION]:", err);
  }
}
