import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DEFAULT_RESET_PASSWORD = "12345678";

const createAdminUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "editor", "user"]).default("user"),
  password: z.string().min(8).optional()
});

interface AuthUserLite {
  id: string;
  email: string;
  createdAt: string | null;
  name: string;
}

async function listAllAuthUsers() {
  const admin = createSupabaseAdminClient();
  const users: AuthUserLite[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    users.push(
      ...(data.users ?? []).map((user) => ({
        id: user.id,
        email: user.email ?? "",
        createdAt: user.created_at ?? null,
        name: (user.user_metadata?.name as string | undefined) ?? user.email ?? "Usuario"
      }))
    );

    if (!data.nextPage) break;
    page = data.nextPage;
  }

  return users;
}

export async function GET() {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  try {
    const admin = createSupabaseAdminClient();
    const [authUsers, profilesResult] = await Promise.all([
      listAllAuthUsers(),
      admin.from("profiles").select("id,name,role,created_at")
    ]);

    if (profilesResult.error) {
      return NextResponse.json({ error: profilesResult.error.message }, { status: 400 });
    }

    const profileById = new Map(
      (profilesResult.data ?? []).map((profile) => [
        profile.id,
        {
          name: profile.name ?? "Usuario",
          role: (profile.role as "admin" | "editor" | "user") ?? "user",
          createdAt: profile.created_at ?? null
        }
      ])
    );

    const users = authUsers
      .map((user) => {
        const profile = profileById.get(user.id);
        return {
          id: user.id,
          name: profile?.name ?? user.name,
          email: user.email,
          role: profile?.role ?? "user",
          createdAt: profile?.createdAt ?? user.createdAt
        };
      })
      .sort((a, b) => {
        const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTs - aTs;
      });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao listar usuarios." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createAdminUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const payload = parsed.data;
  const password = payload.password?.trim() || DEFAULT_RESET_PASSWORD;

  const createUserResult = await admin.auth.admin.createUser({
    email: payload.email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name: payload.name.trim() }
  });

  if (createUserResult.error || !createUserResult.data.user) {
    return NextResponse.json({ error: createUserResult.error?.message ?? "Falha ao criar usuario." }, { status: 400 });
  }

  const createdUser = createUserResult.data.user;
  const profileInsert = await admin.from("profiles").upsert(
    {
      id: createdUser.id,
      name: payload.name.trim(),
      role: payload.role
    },
    { onConflict: "id" }
  );

  if (profileInsert.error) {
    return NextResponse.json({ error: profileInsert.error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      id: createdUser.id,
      name: payload.name.trim(),
      email: createdUser.email ?? payload.email,
      role: payload.role,
      defaultPassword: payload.password ? null : DEFAULT_RESET_PASSWORD
    },
    { status: 201 }
  );
}
