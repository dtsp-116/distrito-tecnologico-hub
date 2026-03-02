"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DistrictLogo } from "@/components/DistrictLogo";
import { ButtonBase } from "@/components/ui/ButtonBase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b backdrop-blur" style={{ borderColor: "var(--border-color)", background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)" }}>
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

        <div className="flex items-center gap-2">
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
