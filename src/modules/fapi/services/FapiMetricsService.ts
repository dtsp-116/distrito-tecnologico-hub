import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export class FapiMetricsService {
  async registerAnalysis(input: { agencyId: string | null; responseMs: number }) {
    try {
      const admin = createSupabaseAdminClient();
      const today = new Date().toISOString().slice(0, 10);
      let query = admin
        .from("fapi_analysis_metrics")
        .select("id,analysis_count,avg_response_ms")
        .eq("metric_date", today);

      query = input.agencyId ? query.eq("agency_id", input.agencyId) : query.is("agency_id", null);
      const { data: current } = await query.maybeSingle();

      const nextCount = (current?.analysis_count ?? 0) + 1;
      const currentAvg = Number(current?.avg_response_ms ?? 0);
      const nextAvg = current
        ? (currentAvg * current.analysis_count + input.responseMs) / nextCount
        : input.responseMs;

      if (current?.id) {
        await admin
          .from("fapi_analysis_metrics")
          .update({
            analysis_count: nextCount,
            avg_response_ms: Number(nextAvg.toFixed(2)),
            updated_at: new Date().toISOString()
          })
          .eq("id", current.id);
      } else {
        await admin.from("fapi_analysis_metrics").insert({
          metric_date: today,
          agency_id: input.agencyId,
          analysis_count: 1,
          avg_response_ms: Number(input.responseMs.toFixed(2)),
          updated_at: new Date().toISOString()
        });
      }
    } catch {
      // Metricas nao bloqueiam o fluxo principal.
    }
  }
}
