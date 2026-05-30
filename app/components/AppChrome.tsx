"use client";

import type { ReactNode } from "react";

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <div className="app-viewport">
      <div className="app-shell">{children}</div>
    </div>
  );
}
