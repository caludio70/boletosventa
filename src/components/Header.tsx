import { Building2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="header-bg text-primary-foreground border-b border-border">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded bg-primary-foreground/10">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">AUTOBUS S.A.</h1>
              <p className="text-primary-foreground/70 text-xs">Av. Juan Bautista Alberdi 7334 (1440) Capital Federal</p>
              <p className="text-primary-foreground/70 text-xs">CUIT 30-63148185-6</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
