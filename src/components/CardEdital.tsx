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
      className="group block h-full min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
    >
      <article className="panel flex h-full flex-col gap-3 p-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-hover)] sm:gap-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="break-words text-[1.05rem] font-semibold leading-snug text-[color:var(--text-primary)] sm:text-base">{edital.nome}</h3>
          <BadgeStatus status={edital.status} />
        </div>

        <div className="space-y-1 text-sm text-subtle">
          <p>
            <span className="font-semibold text-[color:var(--text-primary)]">Agencia:</span> {agencia?.sigla ?? "N/D"}
          </p>
          <p>
            <span className="font-semibold text-[color:var(--text-primary)]">Publicacao:</span> {edital.dataPublicacao}
          </p>
          <p>
            <span className="font-semibold text-[color:var(--text-primary)]">Prazo:</span> {edital.dataLimite}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-subtle break-words">{edital.resumo}</p>

        <div className="flex flex-wrap gap-2">
          {topicos.map((topico) => (
            <Tag label={topico.nome} key={topico.id} />
          ))}
        </div>

        <p className="mt-auto rounded-lg bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--primary)]">
          Toque para ver detalhes
        </p>
      </article>
    </Link>
  );
}
