import { ReactNode } from "react";

interface DrawerMobileProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function DrawerMobile({ title, isOpen, onClose, children }: DrawerMobileProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 md:hidden" role="dialog" aria-modal="true">
      <div className="ml-auto h-full w-[86%] max-w-sm bg-white p-4 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md border border-district-border px-3 py-1.5 text-sm font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:border-gray-700 dark:text-gray-100"
            aria-label="Fechar menu lateral"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
