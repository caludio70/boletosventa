import { Search, FileX } from 'lucide-react';

interface EmptyStateProps {
  type: 'initial' | 'not_found';
  query?: string;
}

export function EmptyState({ type, query }: EmptyStateProps) {
  if (type === 'initial') {
    return (
      <div className="bg-card rounded-xl card-shadow p-12 text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Buscar Operación
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Ingrese un número de boleto para ver el detalle de la operación, o un código de cliente para ver el resumen de cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl card-shadow p-12 text-center animate-fade-in">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <FileX className="w-8 h-8 text-destructive" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No se encontraron resultados
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        No se encontró ningún boleto ni cliente con el criterio: <span className="font-medium text-foreground">"{query}"</span>
      </p>
    </div>
  );
}
