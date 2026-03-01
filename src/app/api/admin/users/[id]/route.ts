import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const updateUserSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(["admin", "user"]).optional()
  })
  .refine((data) => Boolean(data.name || data.email || data.role), {
    message: "Informe ao menos um campo para atualizar."
  });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const payload = parsed.data;

  if (payload.email || payload.name) {
    const currentUserResult = await admin.auth.admin.getUserById(id);
    if (currentUserResult.error || !currentUserResult.data.user) {
      return NextResponse.json({ error: currentUserResult.error?.message ?? "Usuario nao encontrado." }, { status: 404 });
    }

    const currentUser = currentUserResult.data.user;
    const userUpdateResult = await admin.auth.admin.updateUserById(id, {
      email: payload.email?.trim().toLowerCase(),
      user_metadata: payload.name
        ? { ...currentUser.user_metadata, name: payload.name.trim() }
        : currentUser.user_metadata
    });

    if (userUpdateResult.error) {
      return NextResponse.json({ error: userUpdateResult.error.message }, { status: 400 });
    }
  }

  if (payload.name || payload.role) {
    const profileResult = await admin.from("profiles").select("name,role").eq("id", id).maybeSingle();
    if (profileResult.error) {
      return NextResponse.json({ error: profileResult.error.message }, { status: 400 });
    }

    const upsertResult = await admin.from("profiles").upsert(
      {
        id,
        name: payload.name?.trim() ?? profileResult.data?.name ?? "Usuario",
        role: payload.role ?? ((profileResult.data?.role as "admin" | "user" | undefined) ?? "user")
      },
      { onConflict: "id" }
    );
    if (upsertResult.error) {
      return NextResponse.json({ error: upsertResult.error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ updated: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (id === auth.user.id) {
    return NextResponse.json({ error: "Nao e permitido excluir o proprio usuario administrador." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const deleteResult = await admin.auth.admin.deleteUser(id);
  if (deleteResult.error) {
    return NextResponse.json({ error: deleteResult.error.message }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
