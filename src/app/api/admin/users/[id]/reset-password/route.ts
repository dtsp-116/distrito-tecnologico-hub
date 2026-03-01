import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DEFAULT_RESET_PASSWORD = "12345678";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const updateResult = await admin.auth.admin.updateUserById(id, {
    password: DEFAULT_RESET_PASSWORD
  });

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 400 });
  }

  return NextResponse.json({ reset: true, temporaryPassword: DEFAULT_RESET_PASSWORD });
}
