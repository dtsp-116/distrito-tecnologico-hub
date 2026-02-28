import Link from "next/link";
import { Agencia, Edital, Topico } from "@/types";
import { BadgeStatus } from "@/components/BadgeStatus";
import { Tag } from "@/components/Tag";

interface CardEditalProps {
  edital: Edital;
  agencia?: Agencia;
  topicos: Topico[];
}

export function CardEdital({ edital, agencia, topicos }: CardEditalProps) {
  return (
    <Link
      href={`/edital/${edital.id}`}
      aria-label={`Abrir detalhes do edital ${edital.nome}`}
      className="group block h-full min-w-0 rounded-mdx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
    >
      <article className="flex h-full flex-col gap-4 rounded-mdx border border-district-border bg-white p-4 shadow-card transition group-hover:-translate-y-1 group-hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <h3 className="break-words text-base font-semibold text-gray-900 dark:text-gray-100">{edital.nome}</h3>
          <BadgeStatus status={edital.status} />
        </div>

        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-200">Agencia:</span> {agencia?.sigla ?? "N/D"}
          </p>
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-200">Publicacao:</span> {edital.dataPublicacao}
          </p>
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-200">Prazo:</span> {edital.dataLimite}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{edital.resumo}</p>

        <div className="flex flex-wrap gap-2">
          {topicos.map((topico) => (
            <Tag label={topico.nome} key={topico.id} />
          ))}
        </div>

        <p className="mt-auto rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-district-red dark:bg-red-950/30">
          Toque para ver detalhes
        </p>
      </article>
    </Link>
  );
}
