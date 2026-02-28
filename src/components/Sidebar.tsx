import Link from "next/link";
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
  return (
    <aside className="rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Navegacao</h2>
      <nav aria-label="Menu lateral de agencias" className="space-y-2">
        <Link
          href="/hub"
          onClick={onNavigate}
          className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
            !isAdminRoute && !activeAgencyId
              ? "bg-red-50 text-district-red dark:bg-red-950/40"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          }`}
        >
          Todos os editais
        </Link>
        {canViewAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
              isAdminRoute
                ? "bg-red-50 text-district-red dark:bg-red-950/40"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            Painel Admin
          </Link>
        )}
      </nav>

      <h2 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Agencias</h2>
      <nav aria-label="Lista de agencias" className="space-y-2">
        {agencias.map((agencia) => (
          <Link
            href={`/agencia/${agencia.id}`}
            onClick={onNavigate}
            key={agencia.id}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
              activeAgencyId === agencia.id
                ? "bg-red-50 text-district-red dark:bg-red-950/40"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            {agencia.sigla}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
