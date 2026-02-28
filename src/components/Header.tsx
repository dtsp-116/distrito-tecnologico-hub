"use client";

import { useRouter } from "next/navigation";
import { DistrictLogo } from "@/components/DistrictLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
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
            className="inline-flex h-10 items-center rounded-md border border-district-border px-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-100 md:hidden"
            aria-label="Abrir menu de navegacao"
          >
            Menu
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
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-10 items-center rounded-md border border-district-border px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
