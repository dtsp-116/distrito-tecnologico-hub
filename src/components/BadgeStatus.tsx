import { EditalStatus } from "@/types";

interface BadgeStatusProps {
  status: EditalStatus;
}

const statusMap: Record<EditalStatus, { label: string; className: string }> = {
  aberto: {
    label: "Aberto",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200"
  },
  encerrado: {
    label: "Encerrado",
    className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
  },
  em_breve: {
    label: "Em breve",
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200"
  }
};

export function BadgeStatus({ status }: BadgeStatusProps) {
  const config = statusMap[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
