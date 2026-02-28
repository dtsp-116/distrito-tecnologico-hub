import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const { data: existingProfile } = await admin.from("profiles").select("id,role").eq("id", user.id).maybeSingle();

  if (!existingProfile) {
    const { data: profile, error } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        name: user.user_metadata?.name ?? user.email ?? "Usuario",
        role: "user"
      })
      .select("id,role")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: profile.id, role: profile.role });
  }

  return NextResponse.json({ id: existingProfile.id, role: existingProfile.role });
}
