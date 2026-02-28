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
}

export function MainLayout({
  agencias,
  activeAgencyId,
  isAdminRoute = false,
  children,
  showGeneralChat = false
}: MainLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

      {/* Layout mobile-first: sidebar fixa no desktop e conteudo principal responsivo. */}
      <main className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 px-4 pb-24 pt-28 md:px-6 md:pb-8 md:pt-24 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <Sidebar
              agencias={agencias}
              activeAgencyId={activeAgencyId}
              isAdminRoute={isAdminRoute}
              canViewAdmin={canViewAdmin}
            />
          </div>
        </div>

        <section className="min-w-0">{children}</section>
      </main>

      {showGeneralChat && (
        <FloatingChat
          title="Chat Geral"
          botName="Hub Assistente"
          triggerLabel="Chat Geral"
          emptyStateMessage="Ainda nao ha mensagens neste chat."
        />
      )}
    </div>
  );
}
