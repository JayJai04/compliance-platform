"use client";

import { ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader({
  role,
  email,
  onLogout,
}: {
  role: string;
  email?: string;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">ClearPath Compliance</p>
          <p className="truncate text-xs text-muted-foreground">
            {role}
            {email ? ` · ${email}` : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut />
          Log out
        </Button>
      </div>
    </header>
  );
}
