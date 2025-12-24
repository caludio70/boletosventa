import { Bus } from 'lucide-react';

export function Header() {
  return (
    <header className="header-gradient text-primary-foreground">
      <div className="container py-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
            <Bus className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AUTOBUS S.A.</h1>
            <p className="text-primary-foreground/80 text-sm">Sistema de Gestión de Operaciones</p>
          </div>
        </div>
      </div>
    </header>
  );
}
