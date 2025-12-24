import { Building2 } from 'lucide-react';

export function Header() {
  return (
    <header className="header-bg text-primary-foreground border-b border-border">
      <div className="container py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded bg-primary-foreground/10">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">AUTOBUS S.A.</h1>
            <p className="text-primary-foreground/70 text-xs">Sistema de Gestión de Operaciones</p>
          </div>
        </div>
      </div>
    </header>
  );
}
