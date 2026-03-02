"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/layouts/MainLayout";
import { Agencia, Edital } from "@/types";
import { CardBase } from "@/components/ui/CardBase";
import { ButtonBase } from "@/components/ui/ButtonBase";

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
        <CardBase className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-[color:var(--text-primary)]">Admin - Regras FAPI</h1>
              <p className="text-subtle text-sm">
                Defina regras gerais, por agencia e por edital para analise tecnica.
              </p>
            </div>
            <Link
              href="/admin"
              className="btn-base btn-secondary h-10 px-3 text-sm"
            >
              Voltar ao admin
            </Link>
          </div>
        </CardBase>

        <CardBase className="p-4">
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
                className="input-base h-10"
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
                  className="input-base h-10"
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
                  className="input-base h-10"
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
              className="textarea-base"
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
            <ButtonBase
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 px-4 disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : form.id ? "Atualizar regra" : "Criar regra"}
            </ButtonBase>
            <ButtonBase
              type="button"
              variant="secondary"
              onClick={clearForm}
              className="h-10 px-4"
            >
              Limpar
            </ButtonBase>
          </div>
          {feedback && <p className="text-subtle mt-2 text-xs">{feedback}</p>}
        </CardBase>

        <CardBase className="p-4">
          <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Regras cadastradas</h2>
          {isLoading ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando regras...</p>
          ) : rules.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Nenhuma regra cadastrada.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {rules.map((rule) => (
                <article key={rule.id} className="panel-muted p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-subtle text-xs font-semibold uppercase tracking-wide">
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
                        className="btn-base btn-secondary h-7 rounded-md px-2 py-1 text-xs"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRule(rule)}
                        className="btn-base btn-secondary h-7 rounded-md px-2 py-1 text-xs"
                      >
                        {rule.ativa ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="btn-base btn-danger h-7 rounded-md px-2 py-1 text-xs"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--text-primary)]">{rule.descricao}</p>
                  <p className="text-subtle mt-1 text-xs">
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
        </CardBase>
      </div>
    </MainLayout>
  );
}
