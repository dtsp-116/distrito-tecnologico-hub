import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}

export function FormField({ label, children, hint, className = "" }: FormFieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <span className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</span>
      {children}
      {hint ? <span className="text-xs text-subtle">{hint}</span> : null}
    </label>
  );
}
