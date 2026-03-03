"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Agencia } from "@/types";

interface SidebarProps {
  agencias: Agencia[];
  activeAgencyId?: string;
  isAdminRoute?: boolean;
  canViewAdmin?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  agencias,
  activeAgencyId,
  isAdminRoute = false,
  canViewAdmin = false,
  onNavigate
}: SidebarProps) {
  const pathname = usePathname();
  const isProfileRoute = pathname?.startsWith("/perfil");
  const isFapiRoute = pathname?.startsWith("/fapi");
  const isAdminRulesRoute = pathname?.startsWith("/admin/fapi-rules");
  const linkBaseClass =
    "group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200";
  const linkIdleClass = "text-[color:var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[color:var(--text-primary)]";
  const linkActiveClass = "bg-[var(--primary-soft)] text-[color:var(--primary)]";

  return (
    <aside className="h-full overflow-y-auto rounded-2xl p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-subtle">Navegacao</h2>
      <nav aria-label="Menu principal" className="space-y-2">
        <Link
          href="/hub"
          onClick={onNavigate}
          className={`${linkBaseClass} ${
            !isAdminRoute && !activeAgencyId ? linkActiveClass : linkIdleClass
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          Todos os editais
        </Link>
        <Link
          href="/fapi"
          onClick={onNavigate}
          className={`${linkBaseClass} ${isFapiRoute ? linkActiveClass : linkIdleClass}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          Analise de FAPI
        </Link>
      </nav>

      {canViewAdmin && (
        <>
          <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-subtle">Administracao</h2>
          <nav aria-label="Menu administrativo" className="space-y-2">
            <Link
              href="/admin"
              onClick={onNavigate}
              className={`${linkBaseClass} ${isAdminRoute ? linkActiveClass : linkIdleClass}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              Painel Admin
            </Link>
            <Link
              href="/admin/fapi-rules"
              onClick={onNavigate}
              className={`${linkBaseClass} ${isAdminRulesRoute ? linkActiveClass : linkIdleClass}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              Regras FAPI
            </Link>
          </nav>
        </>
      )}

      <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-subtle text-[11px]">Agencias</h2>
      <nav aria-label="Lista de agencias" className="space-y-2">
        {agencias.map((agencia) => (
          <Link
            href={`/agencia/${agencia.id}`}
            onClick={onNavigate}
            key={agencia.id}
            className={`${linkBaseClass} ${
              activeAgencyId === agencia.id
                ? linkActiveClass
                : linkIdleClass
            }`}
          >
            {agencia.sigla}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
