import { useState } from 'react';
import { Search, FileText, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBox({ onSearch, isLoading }: SearchBoxProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const quickSearches = [
    { label: 'BOL-2024-001', icon: FileText },
    { label: 'CLI-001', icon: Users },
    { label: 'CLI-002', icon: Users },
  ];

  return (
    <div className="bg-card rounded-xl card-shadow p-6 animate-fade-in">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ingrese N° de Boleto o Código de Cliente..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="h-12 px-8"
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Búsquedas rápidas:</span>
        {quickSearches.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setQuery(item.label);
              onSearch(item.label);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
