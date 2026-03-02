import { EditalStatus } from "@/types";

interface BadgeStatusProps {
  status: EditalStatus;
}

const statusMap: Record<EditalStatus, { label: string; className: string }> = {
  aberto: {
    label: "Aberto",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/35 dark:border-emerald-700 dark:text-emerald-200"
  },
  encerrado: {
    label: "Encerrado",
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200"
  },
  em_breve: {
    label: "Em breve",
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/35 dark:border-amber-700 dark:text-amber-200"
  }
};

export function BadgeStatus({ status }: BadgeStatusProps) {
  const config = statusMap[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
