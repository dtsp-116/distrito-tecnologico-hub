"use client";

import { useEffect, useMemo, useState } from "react";
import { CardEdital } from "@/components/CardEdital";
import { FilterBar } from "@/components/FilterBar";
import { SearchInput } from "@/components/SearchInput";
import { useEditaisFiltro } from "@/hooks/useEditaisFiltro";
import { Agencia, Edital, EditalStatus, Topico } from "@/types";
import { MainLayout } from "@/layouts/MainLayout";

interface HomePageProps {
  agencias: Agencia[];
  editais: Edital[];
  topicos: Topico[];
}

export function HomePage({ agencias, editais, topicos }: HomePageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [agenciaId, setAgenciaId] = useState("");
  const [status, setStatus] = useState<EditalStatus | "">("");
  const [topicoId, setTopicoId] = useState("");

  useEffect(() => {
    // Simula consumo de API para preparar o front para futura integracao.
    const timer = window.setTimeout(() => setIsLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const filtrados = useEditaisFiltro({
    editais,
    agencias,
    topicos,
    filtros: { termoBusca, agenciaId, status, topicoId }
  });

  const agenciaOptions = useMemo(
    () => agencias.map((agencia) => ({ value: agencia.id, label: `${agencia.sigla} - ${agencia.nome}` })),
    [agencias]
  );
  const topicoOptions = useMemo(
    () => topicos.map((topico) => ({ value: topico.id, label: topico.nome })),
    [topicos]
  );
  const abertoCount = useMemo(() => editais.filter((item) => item.status === "aberto").length, [editais]);
  const encerradoCount = useMemo(() => editais.filter((item) => item.status === "encerrado").length, [editais]);

  const resetFiltros = () => {
    setTermoBusca("");
    setAgenciaId("");
    setStatus("");
    setTopicoId("");
  };

  return (
    <MainLayout agencias={agencias} showGeneralChat>
      <div className="space-y-5">
        <section className="rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Central de editais</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Explore oportunidades por agencia, status e topicos de interesse.
              </p>
            </div>
            <button
              type="button"
              onClick={resetFiltros}
              className="h-10 rounded-md border border-district-border px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Limpar filtros
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-district-border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{editais.length}</p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Abertos</p>
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{abertoCount}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Encerrados</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{encerradoCount}</p>
            </div>
          </div>
        </section>

        <SearchInput value={termoBusca} onChange={setTermoBusca} />
        <FilterBar
          agenciaOptions={agenciaOptions}
          topicoOptions={topicoOptions}
          statusOptions={[
            { value: "aberto", label: "Aberto" },
            { value: "encerrado", label: "Encerrado" },
            { value: "em_breve", label: "Em breve" }
          ]}
          selectedAgencia={agenciaId}
          selectedStatus={status}
          selectedTopico={topicoId}
          onAgenciaChange={setAgenciaId}
          onStatusChange={setStatus}
          onTopicoChange={setTopicoId}
        />

        {isLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Carregando editais">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-mdx border border-district-border bg-white/70 dark:border-gray-700 dark:bg-gray-900/80"
              />
            ))}
          </section>
        ) : filtrados.length === 0 ? (
          <section className="rounded-mdx border border-dashed border-district-border bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Nenhum edital encontrado</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Ajuste os filtros para visualizar editais disponiveis. Se sua base estiver vazia, cadastre editais no painel admin.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filtrados.map((edital) => (
              <CardEdital
                key={edital.id}
                edital={edital}
                agencia={agencias.find((agencia) => agencia.id === edital.agenciaId)}
                topicos={topicos.filter((topico) => edital.topicos.includes(topico.id))}
              />
            ))}
          </section>
        )}
      </div>
    </MainLayout>
  );
}
