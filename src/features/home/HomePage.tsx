"use client";

import { useEffect, useMemo, useState } from "react";
import { CardEdital } from "@/components/CardEdital";
import { FilterBar } from "@/components/FilterBar";
import { SearchInput } from "@/components/SearchInput";
import { useEditaisFiltro } from "@/hooks/useEditaisFiltro";
import { ButtonBase } from "@/components/ui/ButtonBase";
import { CardBase } from "@/components/ui/CardBase";
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
        <CardBase className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-[color:var(--text-primary)] sm:text-lg">Central de editais</h1>
              <p className="text-subtle mt-1 hidden text-sm sm:block">
                Explore oportunidades por agencia, status e topicos de interesse.
              </p>
            </div>
            <ButtonBase type="button" variant="secondary" onClick={resetFiltros} className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm">
              Limpar filtros
            </ButtonBase>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] font-medium text-subtle">
              Total: {editais.length}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
              Abertos: {abertoCount}
            </span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] font-medium text-subtle">
              Encerrados: {encerradoCount}
            </span>
          </div>
          <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-3">
            <div className="panel-muted px-3 py-2">
              <p className="text-subtle text-xs uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-[color:var(--text-primary)]">{editais.length}</p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Abertos</p>
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{abertoCount}</p>
            </div>
            <div className="panel-muted px-3 py-2">
              <p className="text-subtle text-xs uppercase tracking-wide">Encerrados</p>
              <p className="text-lg font-bold text-[color:var(--text-primary)]">{encerradoCount}</p>
            </div>
          </div>
        </CardBase>

        <CardBase className="p-3 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen((value) => !value)}
            className="btn-base btn-secondary w-full justify-between"
          >
            <span>Filtros e busca</span>
            <span>{isMobileFiltersOpen ? "Ocultar" : "Mostrar"}</span>
          </button>
          {(termoBusca || agenciaId || status || topicoId) && <p className="text-subtle mt-2 text-xs">Filtros ativos.</p>}
        </CardBase>

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
          <CardBase className="border-dashed p-8 text-center">
            <h2 className="text-base font-semibold text-[color:var(--text-primary)]">Nenhum edital encontrado</h2>
            <p className="text-subtle mt-2 text-sm">
              Ajuste os filtros para visualizar editais disponiveis. Se sua base estiver vazia, cadastre editais no painel admin.
            </p>
          </CardBase>
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
