"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const FULL_WIDTH_ROUTES = ["/docs"];

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fullWidth = FULL_WIDTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (fullWidth) {
    return <>{children}</>;
  }

  return (
    <div className="app-viewport">
      <div className="app-shell">{children}</div>
    </div>
  );
}
