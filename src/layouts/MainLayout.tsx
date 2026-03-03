"use client";

import { ReactNode, useState } from "react";
import { Agencia } from "@/types";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DrawerMobile } from "@/components/DrawerMobile";
import { FloatingChat } from "@/components/FloatingChat";
import { ButtonBase } from "@/components/ui/ButtonBase";
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
  const hasDesktopSidebar = canViewAdmin;

  return (
    <div className="min-h-screen">
      <Header onMenuClick={() => setIsDrawerOpen(true)} agencias={agencias} activeAgencyId={activeAgencyId} role={role} />

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
        className={`page-container w-full px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-20 sm:px-4 md:px-6 md:pb-8 md:pt-24 ${
          hasDesktopSidebar ? (isDesktopNavCollapsed ? "lg:pl-[90px]" : "lg:pl-[350px]") : ""
        } ${hasLeftChatRail ? "lg:pr-[360px]" : ""}`}
      >
        <section className="min-w-0">{children}</section>
      </main>

      {hasDesktopSidebar && (
        <aside
          className={`fixed bottom-0 left-4 top-16 z-30 hidden overflow-hidden pb-3 transition-all duration-300 lg:block ${
            isDesktopNavCollapsed ? "w-14" : "w-[320px]"
          }`}
        >
          <div className="panel flex h-full flex-col overflow-hidden p-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
                {!isDesktopNavCollapsed && "Menu"}
              </p>
              <ButtonBase
                variant="secondary"
                onClick={() => setIsDesktopNavCollapsed((value) => !value)}
                className="h-8 w-8 px-0"
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
              </ButtonBase>
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
      )}

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
