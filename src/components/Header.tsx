import { Building2, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada');
  };

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
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary-foreground/70 hidden sm:inline">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Salir</span>
                </Button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
