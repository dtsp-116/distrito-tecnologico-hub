import type { SupabaseClient } from "@supabase/supabase-js";
import { createFapiRuleSchema, updateFapiRuleSchema } from "@/modules/fapi/validators/fapiSchemas";

export async function listFapiRulesController(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("fapi_rules")
    .select("id,tipo,agencia_id,edital_id,descricao,ativa,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return { rules: data ?? [] };
}

export async function createFapiRuleController(input: { supabase: SupabaseClient; body: unknown }) {
  const parsed = createFapiRuleSchema.safeParse(input.body);
  if (!parsed.success) throw new Error("Payload invalido.");

  const payload = parsed.data;
  const insert = await input.supabase
    .from("fapi_rules")
    .insert({
      tipo: payload.tipo,
      agencia_id: payload.agenciaId ?? null,
      edital_id: payload.editalId ?? null,
      descricao: payload.descricao.trim(),
      ativa: payload.ativa ?? true
    })
    .select("id")
    .single();

  if (insert.error) throw new Error(insert.error.message);
  return { id: insert.data.id };
}

export async function updateFapiRuleController(input: {
  supabase: SupabaseClient;
  id: string;
  body: unknown;
}) {
  const parsed = updateFapiRuleSchema.safeParse(input.body);
  if (!parsed.success) throw new Error("Payload invalido.");

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.tipo) updates.tipo = parsed.data.tipo;
  if (parsed.data.descricao !== undefined) updates.descricao = parsed.data.descricao.trim();
  if (parsed.data.ativa !== undefined) updates.ativa = parsed.data.ativa;
  if (parsed.data.agenciaId !== undefined) updates.agencia_id = parsed.data.agenciaId;
  if (parsed.data.editalId !== undefined) updates.edital_id = parsed.data.editalId;

  const patch = await input.supabase.from("fapi_rules").update(updates).eq("id", input.id);
  if (patch.error) throw new Error(patch.error.message);
  return { updated: true };
}

export async function deleteFapiRuleController(input: { supabase: SupabaseClient; id: string }) {
  const remove = await input.supabase.from("fapi_rules").delete().eq("id", input.id);
  if (remove.error) throw new Error(remove.error.message);
  return { deleted: true };
}
