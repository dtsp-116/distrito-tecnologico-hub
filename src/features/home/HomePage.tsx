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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
    setIsMobileFiltersOpen(false);
  };

  return (
    <MainLayout agencias={agencias} showGeneralChat hasLeftChatRail>
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-mdx border border-district-border bg-white p-3 shadow-card dark:border-gray-700 dark:bg-gray-900 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">Central de editais</h1>
              <p className="mt-1 hidden text-sm text-gray-600 dark:text-gray-300 sm:block">
                Explore oportunidades por agencia, status e topicos de interesse.
              </p>
            </div>
            <button
              type="button"
              onClick={resetFiltros}
              className="h-9 rounded-md border border-district-border px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:h-10 sm:px-4 sm:text-sm"
            >
              Limpar filtros
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
            <span className="rounded-full border border-district-border bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              Total: {editais.length}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
              Abertos: {abertoCount}
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              Encerrados: {encerradoCount}
            </span>
          </div>
          <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-3">
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

        <section className="rounded-mdx border border-district-border bg-white p-3 shadow-card dark:border-gray-700 dark:bg-gray-900 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen((value) => !value)}
            className="inline-flex h-10 w-full items-center justify-between rounded-md border border-district-border px-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
          >
            <span>Filtros e busca</span>
            <span>{isMobileFiltersOpen ? "Ocultar" : "Mostrar"}</span>
          </button>
          {(termoBusca || agenciaId || status || topicoId) && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Filtros ativos.</p>}
        </section>

        <div className={`${isMobileFiltersOpen ? "block" : "hidden"} md:block`}>
          <SearchInput value={termoBusca} onChange={setTermoBusca} />
        </div>
        <div className={`${isMobileFiltersOpen ? "block" : "hidden"} md:block`}>
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
        </div>

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
          <section className="grid gap-3 sm:gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filtrados.map((edital) => (
              <CardEdital
                key={edital.id}
                edital={edital}
                agencia={agencias.find((agencia) => agencia.id === edital.agenciaId)}
                topicos={topicos.filter(
                  (topico) =>
                    edital.topicos.includes(topico.id) ||
                    edital.topicos.some((item) => item.toLowerCase() === topico.nome.toLowerCase())
                )}
              />
            ))}
          </section>
        )}
      </div>
    </MainLayout>
  );
}
