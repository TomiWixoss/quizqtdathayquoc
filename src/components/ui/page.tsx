import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page component - replacement for zmp-ui Page
 * Acts as a simple wrapper div with min-h-screen
 */
export function Page({ children, className }: PageProps) {
  return <div className={cn("min-h-screen", className)}>{children}</div>;
}
