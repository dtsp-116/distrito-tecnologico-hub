"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DistrictLogo } from "@/components/DistrictLogo";
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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-district-border bg-white/95 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-district-border text-gray-700 dark:border-gray-700 dark:text-gray-100 md:hidden"
            aria-label="Abrir menu de navegacao"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <DistrictLogo />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              Distrito Tecnologico Hub
            </p>
            <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">Hub Inteligente de Editais</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/perfil"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-district-border text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-district-border text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
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
