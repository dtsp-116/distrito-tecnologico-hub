"use client";

import { ReactNode, useState } from "react";
import { Agencia } from "@/types";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DrawerMobile } from "@/components/DrawerMobile";
import { FloatingChat } from "@/components/FloatingChat";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";

interface MainLayoutProps {
  agencias: Agencia[];
  activeAgencyId?: string;
  isAdminRoute?: boolean;
  children: ReactNode;
  showGeneralChat?: boolean;
  hasLeftChatRail?: boolean;
}

export function MainLayout({
  agencias,
  activeAgencyId,
  isAdminRoute = false,
  children,
  showGeneralChat = false,
  hasLeftChatRail = false
}: MainLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDesktopNavCollapsed, setIsDesktopNavCollapsed] = useState(false);
  const { role } = useCurrentProfile();
  const canViewAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-district-light dark:bg-gray-950">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />

      <DrawerMobile title="Navegacao" isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <Sidebar
          agencias={agencias}
          activeAgencyId={activeAgencyId}
          isAdminRoute={isAdminRoute}
          canViewAdmin={canViewAdmin}
          onNavigate={() => setIsDrawerOpen(false)}
        />
      </DrawerMobile>

      <main
        className={`mx-auto w-full max-w-[1700px] px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-20 sm:px-4 md:px-6 md:pb-8 md:pt-24 ${
          isDesktopNavCollapsed ? "lg:pl-[90px]" : "lg:pl-[350px]"
        } ${hasLeftChatRail ? "lg:pr-[360px]" : ""}`}
      >
        <section className="min-w-0">{children}</section>
      </main>

      <aside
        className={`fixed bottom-0 left-4 top-16 z-30 hidden overflow-hidden pb-3 transition-all duration-300 lg:block ${
          isDesktopNavCollapsed ? "w-14" : "w-[320px]"
        }`}
      >
        <div className="flex h-full flex-col rounded-mdx border border-district-border bg-white p-2 shadow-card dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
              {!isDesktopNavCollapsed && "Menu"}
            </p>
            <button
              type="button"
              onClick={() => setIsDesktopNavCollapsed((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-district-border text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              aria-label={isDesktopNavCollapsed ? "Expandir navegacao" : "Recolher navegacao"}
            >
              {isDesktopNavCollapsed ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          {!isDesktopNavCollapsed && (
            <Sidebar
              agencias={agencias}
              activeAgencyId={activeAgencyId}
              isAdminRoute={isAdminRoute}
              canViewAdmin={canViewAdmin}
            />
          )}
        </div>
      </aside>

      {showGeneralChat && (
        <FloatingChat
          title="Chat Geral"
          botName="Hub Assistente"
          triggerLabel="Chat Geral"
          emptyStateMessage="Ainda nao ha mensagens neste chat."
          desktopDocked
          desktopDockedSide="right"
        />
      )}
    </div>
  );
}
