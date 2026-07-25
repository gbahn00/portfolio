import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ children, className, title = false }: { children: ReactNode; className?: string; title?: boolean }) {
  return <div className={cn(title ? "title-container" : "page-container", className)}>{children}</div>;
}
