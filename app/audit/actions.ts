"use server";

import { cookies } from "next/headers";

export async function markAllAuditsReadAction() {
  // Marqueur par utilisateur : un flag sur globalThis passerait tous les
  // comptes du serveur en « lu ».
  try {
    cookies().set("converza_audit_read", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    // hors contexte de requête
  }
  return { ok: true };
}
