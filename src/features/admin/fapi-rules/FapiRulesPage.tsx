"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/layouts/MainLayout";
import { Agencia, Edital } from "@/types";

type RuleType = "geral" | "agencia" | "edital";

interface FapiRule {
  id: string;
  tipo: RuleType;
  agencia_id: string | null;
  edital_id: string | null;
  descricao: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

interface FapiRulesPageProps {
  agencias: Agencia[];
  editais: Edital[];
}

const emptyForm = {
  id: "",
  tipo: "geral" as RuleType,
  agenciaId: "",
  editalId: "",
  descricao: "",
  ativa: true
};

export function FapiRulesPage({ agencias, editais }: FapiRulesPageProps) {
  const [rules, setRules] = useState<FapiRule[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const editalNameById = useMemo(() => {
    return new Map(editais.map((item) => [item.id, item.nome]));
  }, [editais]);

  const agencyNameById = useMemo(() => {
    return new Map(agencias.map((item) => [item.id, `${item.sigla} - ${item.nome}`]));
  }, [agencias]);

  const loadRules = async () => {
    setIsLoading(true);
    setFeedback("");
    try {
      const response = await fetch("/api/admin/fapi-rules");
      const data = (await response.json()) as { error?: string; rules?: FapiRule[] };
      if (!response.ok || !data.rules) throw new Error(data.error ?? "Falha ao carregar regras.");
      setRules(data.rules);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao carregar regras.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, []);

  const clearForm = () => setForm(emptyForm);

  const handleSave = async () => {
    if (!form.descricao.trim()) {
      setFeedback("Descricao da regra e obrigatoria.");
      return;
    }

    setIsSaving(true);
    setFeedback("");
    try {
      const payload = {
        tipo: form.tipo,
        agenciaId: form.tipo === "agencia" ? form.agenciaId || null : null,
        editalId: form.tipo === "edital" ? form.editalId || null : null,
        descricao: form.descricao.trim(),
        ativa: form.ativa
      };

      const url = form.id ? `/api/admin/fapi-rules/${form.id}` : "/api/admin/fapi-rules";
      const method = form.id ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Falha ao salvar regra.");

      clearForm();
      await loadRules();
      setFeedback("Regra FAPI salva com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao salvar regra.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja excluir esta regra FAPI?")) return;
    try {
      const response = await fetch(`/api/admin/fapi-rules/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Falha ao excluir regra.");
      await loadRules();
      setFeedback("Regra excluida.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao excluir regra.");
    }
  };

  const toggleRule = async (rule: FapiRule) => {
    try {
      const response = await fetch(`/api/admin/fapi-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: rule.tipo,
          agenciaId: rule.agencia_id,
          editalId: rule.edital_id,
          descricao: rule.descricao,
          ativa: !rule.ativa
        })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Falha ao atualizar regra.");
      await loadRules();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao atualizar regra.");
    }
  };

  return (
    <MainLayout agencias={agencias} isAdminRoute>
      <div className="space-y-4">
        <section className="rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Admin - Regras FAPI</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Defina regras gerais, por agencia e por edital para analise tecnica.
              </p>
            </div>
            <Link
              href="/admin"
              className="h-10 rounded-md border border-district-border px-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
            >
              Voltar ao admin
            </Link>
          </div>
        </section>

        <section className="rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tipo</span>
              <select
                value={form.tipo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tipo: event.target.value as RuleType,
                    agenciaId: "",
                    editalId: ""
                  }))
                }
                className="h-10 w-full rounded-md border border-district-border px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value="geral">Geral</option>
                <option value="agencia">Agencia</option>
                <option value="edital">Edital</option>
              </select>
            </label>

            {form.tipo === "agencia" && (
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Agencia</span>
                <select
                  value={form.agenciaId}
                  onChange={(event) => setForm((current) => ({ ...current, agenciaId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-district-border px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                >
                  <option value="">Selecione</option>
                  {agencias.map((agency) => (
                    <option value={agency.id} key={agency.id}>
                      {agency.sigla} - {agency.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {form.tipo === "edital" && (
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Edital</span>
                <select
                  value={form.editalId}
                  onChange={(event) => setForm((current) => ({ ...current, editalId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-district-border px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                >
                  <option value="">Selecione</option>
                  {editais.map((edital) => (
                    <option value={edital.id} key={edital.id}>
                      {edital.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <label className="mt-3 block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Descricao da regra</span>
            <textarea
              value={form.descricao}
              onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
              rows={5}
              className="w-full rounded-md border border-district-border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </label>

          <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={form.ativa}
              onChange={(event) => setForm((current) => ({ ...current, ativa: event.target.checked }))}
            />
            Regra ativa
          </label>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 rounded-md bg-district-red px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : form.id ? "Atualizar regra" : "Criar regra"}
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="h-10 rounded-md border border-district-border px-4 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
            >
              Limpar
            </button>
          </div>
          {feedback && <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{feedback}</p>}
        </section>

        <section className="rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Regras cadastradas</h2>
          {isLoading ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando regras...</p>
          ) : rules.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Nenhuma regra cadastrada.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {rules.map((rule) => (
                <article key={rule.id} className="rounded-md border border-district-border p-3 dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {rule.tipo} • {rule.ativa ? "ativa" : "inativa"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            id: rule.id,
                            tipo: rule.tipo,
                            agenciaId: rule.agencia_id ?? "",
                            editalId: rule.edital_id ?? "",
                            descricao: rule.descricao,
                            ativa: rule.ativa
                          })
                        }
                        className="rounded-md border border-district-border px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRule(rule)}
                        className="rounded-md border border-district-border px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                      >
                        {rule.ativa ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:text-red-300"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{rule.descricao}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {rule.tipo === "agencia"
                      ? `Agencia: ${agencyNameById.get(rule.agencia_id ?? "") ?? "nao encontrada"}`
                      : rule.tipo === "edital"
                        ? `Edital: ${editalNameById.get(rule.edital_id ?? "") ?? "nao encontrado"}`
                        : "Escopo: geral"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
