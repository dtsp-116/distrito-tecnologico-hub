"use client";

import { useMemo, useState } from "react";
import { CardEdital } from "@/components/CardEdital";
import { MainLayout } from "@/layouts/MainLayout";
import { Agencia, Edital, EditalStatus, Topico } from "@/types";

interface AgencyPageProps {
  agencyId: string;
  agencias: Agencia[];
  editais: Edital[];
  topicos: Topico[];
}

export function AgencyPage({ agencyId, agencias, editais, topicos }: AgencyPageProps) {
  const [status, setStatus] = useState<EditalStatus | "">("");
  const agencia = agencias.find((item) => item.id === agencyId);

  const editaisAgencia = useMemo(() => {
    return editais.filter((item) => item.agenciaId === agencyId && (status ? item.status === status : true));
  }, [agencyId, editais, status]);

  if (!agencia) {
    return (
      <MainLayout agencias={agencias}>
        <section className="rounded-mdx border border-dashed border-district-border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agencia nao encontrada</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Selecione uma agencia valida no menu lateral.</p>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout agencias={agencias} activeAgencyId={agencyId}>
      <section className="space-y-4">
        <header className="rounded-mdx border border-district-border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{agencia.sigla}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{agencia.descricao}</p>
        </header>

        <div className="w-full sm:max-w-xs">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Filtrar por status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as EditalStatus | "")}
              className="h-11 rounded-mdx border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              aria-label="Filtrar editais da agencia por status"
            >
              <option value="">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="encerrado">Encerrado</option>
              <option value="em_breve">Em breve</option>
            </select>
          </label>
        </div>

        {editaisAgencia.length === 0 ? (
          <section className="rounded-mdx border border-dashed border-district-border bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-300">Nao ha editais com o filtro atual.</p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {editaisAgencia.map((edital) => (
              <CardEdital
                key={edital.id}
                edital={edital}
                agencia={agencia}
                topicos={topicos.filter((topico) => edital.topicos.includes(topico.id))}
              />
            ))}
          </section>
        )}
      </section>
    </MainLayout>
  );
}
