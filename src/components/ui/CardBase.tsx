import { ReactNode } from "react";

interface CardBaseProps {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}

export function CardBase({ children, className = "", muted = false }: CardBaseProps) {
  return <section className={`${muted ? "panel-muted" : "panel"} ${className}`.trim()}>{children}</section>;
}
