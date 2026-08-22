// Liste des emails autorisés à accéder au panneau super-admin de CONVERZA.
// Défini via la variable d'env ADMIN_EMAILS (séparés par des virgules).
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = adminEmails();
  return list.length > 0 && list.includes(email.toLowerCase());
}
