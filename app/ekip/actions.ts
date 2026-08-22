"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";

export async function removeAgent(memberId: string) {
  if (!hasSupabase()) return { ok: true, demo: true };
  const sb = createClient();
  const { error } = await sb.from("members").delete().eq("id", memberId);
  revalidatePath("/ekip");
  return { ok: !error, error: error?.message };
}
