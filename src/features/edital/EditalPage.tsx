import Link from "next/link";
import { BadgeStatus } from "@/components/BadgeStatus";
import { FloatingChat } from "@/components/FloatingChat";
import { Tag } from "@/components/Tag";
import { MainLayout } from "@/layouts/MainLayout";
import { Agencia, Edital, Topico } from "@/types";

interface EditalPageProps {
  editalId: string;
  agencias: Agencia[];
  editais: Edital[];
  topicos: Topico[];
}

export function EditalPage({ editalId, agencias, editais, topicos }: EditalPageProps) {
  const edital = editais.find((item) => item.id === editalId);

  if (!edital) {
    return (
      <MainLayout agencias={agencias}>
        <section className="rounded-mdx border border-dashed border-district-border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edital nao encontrado</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Verifique o link e tente novamente.</p>
        </section>
      </MainLayout>
    );
  }

  const agencia = agencias.find((item) => item.id === edital.agenciaId);
  const editalTopicos = topicos.filter((item) => edital.topicos.includes(item.id));

  return (
    <MainLayout agencias={agencias} activeAgencyId={edital.agenciaId}>
      <article className="space-y-4">
        <header className="rounded-mdx border border-district-border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <Link
            href="/hub"
            className="mb-4 inline-flex h-9 items-center rounded-md border border-district-border px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Voltar para Home
          </Link>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{edital.nome}</h1>
            <BadgeStatus status={edital.status} />
          </div>

          <div className="grid gap-2 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
            <p>
              <span className="font-medium">Agencia:</span> {agencia?.sigla ?? "N/D"}
            </p>
            <p>
              <span className="font-medium">Publicacao:</span> {edital.dataPublicacao}
            </p>
            <p>
              <span className="font-medium">Prazo final:</span> {edital.dataLimite}
            </p>
            {(edital.valorMinimo !== undefined || edital.valorMaximo !== undefined) && (
              <p>
                <span className="font-medium">Faixa de valor:</span>{" "}
                {edital.valorMinimo !== undefined ? `R$ ${edital.valorMinimo.toLocaleString("pt-BR")}` : "N/D"} -{" "}
                {edital.valorMaximo !== undefined ? `R$ ${edital.valorMaximo.toLocaleString("pt-BR")}` : "N/D"}
              </p>
            )}
            {(edital.trlMinimo !== undefined || edital.trlMaximo !== undefined) && (
              <p>
                <span className="font-medium">Faixa de TRL:</span> {edital.trlMinimo ?? "N/D"} -{" "}
                {edital.trlMaximo ?? "N/D"}
              </p>
            )}
          </div>

          <button
            type="button"
            className="mt-4 h-10 rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Download do edital
          </button>
          {edital.linkAcesso && (
            <a
              href={edital.linkAcesso}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex h-10 items-center rounded-md border border-district-border px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Link de acesso
            </a>
          )}
        </header>

        <section className="rounded-mdx border border-district-border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Descricao</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{edital.descricao}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {editalTopicos.map((topico) => (
              <Tag key={topico.id} label={topico.nome} />
            ))}
          </div>
        </section>

        <section className="rounded-mdx border border-district-border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Arquivos do edital</h2>
          <ul className="mt-3 space-y-2">
            {edital.arquivos.map((arquivo) => (
              <li
                key={arquivo.id}
                className="flex items-center justify-between gap-3 rounded-md border border-district-border px-3 py-2 text-sm dark:border-gray-700 dark:text-gray-200"
              >
                <span className="min-w-0 break-words">{arquivo.nome}</span>
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{arquivo.tamanho}</span>
              </li>
            ))}
          </ul>
        </section>
      </article>
      <FloatingChat
        title="Chat do edital"
        botName="Especialista do Edital"
        noticeId={edital.id}
        triggerLabel="Chat do edital"
        emptyStateMessage="Ainda nao ha mensagens neste chat."
        initialMessages={[
          {
            id: "msg-1",
            usuario: "Especialista do Edital",
            conteudo: "Use este canal para tirar duvidas sobre requisitos e documentacao.",
            horario: "09:00"
          }
        ]}
      />
    </MainLayout>
  );
}
