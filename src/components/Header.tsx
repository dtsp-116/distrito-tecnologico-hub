"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DistrictLogo } from "@/components/DistrictLogo";
import { ButtonBase } from "@/components/ui/ButtonBase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Agencia } from "@/types";

interface HeaderProps {
  onMenuClick: () => void;
  agencias: Agencia[];
  activeAgencyId?: string;
  role?: "admin" | "editor" | "user" | null;
}

export function Header({ onMenuClick, agencias, activeAgencyId, role }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAgenciesOpen, setIsAgenciesOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isHubActive = pathname?.startsWith("/hub") || pathname?.startsWith("/agencia");
  const isFapiActive = pathname?.startsWith("/fapi");
  const isAdmin = role === "admin";

  const activeAgency = agencias.find((agencia) => agencia.id === activeAgencyId);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b backdrop-blur"
      style={{ borderColor: "var(--border-color)", background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)" }}
    >
      <div className="page-container flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <ButtonBase
            variant="secondary"
            onClick={onMenuClick}
            className="h-10 w-10 px-0 md:hidden"
            aria-label="Abrir menu de navegacao"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </ButtonBase>
          <DistrictLogo />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">
              Distrito Tecnologico Hub
            </p>
            <p className="text-subtle hidden text-xs sm:block">Hub Inteligente de Editais</p>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center gap-3 md:flex">
          <nav
            aria-label="Navegacao principal"
            className="inline-flex items-center gap-1 rounded-full bg-[color:var(--bg-subtle)] p-1 text-sm"
          >
            <Link
              href="/hub"
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
                isHubActive
                  ? "bg-[var(--primary-soft)] text-[color:var(--primary)]"
                  : "text-[color:var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              <span>Editais</span>
            </Link>
            <Link
              href="/fapi"
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
                isFapiActive
                  ? "bg-[var(--primary-soft)] text-[color:var(--primary)]"
                  : "text-[color:var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              <span>Análise de FAPI</span>
            </Link>
          </nav>

          {agencias.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAgenciesOpen((value) => !value)}
                className="btn-base btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
                aria-haspopup="listbox"
                aria-expanded={isAgenciesOpen}
              >
                <span>Agencias</span>
                {activeAgency ? (
                  <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--text-secondary)]">
                    {activeAgency.sigla}
                  </span>
                ) : null}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isAgenciesOpen && (
                <div className="panel absolute right-0 z-50 mt-2 w-56 space-y-1 p-2 text-sm shadow-lg">
                  {agencias.map((agencia) => (
                    <Link
                      key={agencia.id}
                      href={`/agencia/${agencia.id}`}
                      onClick={() => setIsAgenciesOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                        activeAgencyId === agencia.id
                          ? "bg-[var(--primary-soft)] text-[color:var(--primary)]"
                          : "text-[color:var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                      }`}
                    >
                      <span className="truncate">{agencia.nome}</span>
                      <span className="ml-2 text-xs font-semibold uppercase text-subtle">{agencia.sigla}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(role === "editor" || role === "admin") && (
            <Link
              href={role === "admin" ? "/admin" : "/editor"}
              className="btn-base btn-secondary hidden h-10 items-center gap-2 px-3 text-xs md:inline-flex"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16v4H4z" />
                <path d="M4 10h10v4H4z" />
                <path d="M4 16h7v4H4z" />
              </svg>
              <span>{role === "admin" ? "Painel admin" : "Gestao de editais"}</span>
            </Link>
          )}
          <Link
            href="/perfil"
            className="btn-base btn-secondary h-10 w-10 px-0"
            aria-label="Abrir perfil"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-base btn-secondary h-10 w-10 px-0"
            aria-label="Sair da conta"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" strokeLinecap="round" />
              <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
