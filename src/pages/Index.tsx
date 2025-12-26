import { useState } from 'react';
import { Header } from '@/components/Header';
import { SearchBox } from '@/components/SearchBox';
import { TicketCard } from '@/components/TicketCard';
import { ClientSummaryCard } from '@/components/ClientSummaryCard';
import { TotalsByTicketTable } from '@/components/TotalsByTicketTable';
import { PaymentProjections } from '@/components/PaymentProjections';
import { EmptyState } from '@/components/EmptyState';
import { ImportExcel } from '@/components/ImportExcel';
import { searchTicketsOrClient, getClientSummary, getTotalsByTicket } from '@/lib/realData';
import { Ticket, ClientSummary, OperationRow } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, LayoutList, Table, Calendar, Loader2 } from 'lucide-react';
import { useOperationsData } from '@/hooks/useOperationsData';

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'search' | 'totals' | 'projections'>('totals');
  const [searchResult, setSearchResult] = useState<{
    type: 'ticket' | 'client' | 'not_found' | 'initial';
    tickets: Ticket[];
    clientName?: string;
    summary?: ClientSummary | null;
  }>({ type: 'initial', tickets: [] });

  const { isLoading, isSaving, importData, refreshKey } = useOperationsData();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveView('search');
    const result = searchTicketsOrClient(query);
    
    if (result.type === 'not_found') {
      setSearchResult({ type: 'not_found', tickets: [] });
    } else {
      const summary = result.tickets.length > 1 ? getClientSummary(result.tickets) : null;
      setSearchResult({
        type: result.type,
        tickets: result.tickets,
        clientName: result.clientName,
        summary,
      });
    }
  };

  const handleImport = async (data: Partial<OperationRow>[]) => {
    await importData(data);
  };

  const totalsByTicket = getTotalsByTicket();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveView('search')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeView === 'search' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <FileText className="w-4 h-4" />
                Buscar Operación
              </button>
              <button
                onClick={() => setActiveView('totals')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeView === 'totals' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Table className="w-4 h-4" />
                Total por Boleto
              </button>
              <button
                onClick={() => setActiveView('projections')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeView === 'projections' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Proyecciones
              </button>
            </div>

            <ImportExcel onImport={handleImport} isLoading={isSaving} />
          </div>

          {activeView === 'search' && (
            <>
              <SearchBox onSearch={handleSearch} />

              {searchResult.type === 'initial' && (
                <EmptyState type="initial" />
              )}

              {searchResult.type === 'not_found' && (
                <EmptyState type="not_found" query={searchQuery} />
              )}

              {searchResult.type === 'ticket' && searchResult.tickets.length === 1 && (
                <TicketCard ticket={searchResult.tickets[0]} />
              )}

              {searchResult.type === 'client' && searchResult.tickets.length > 0 && (
                <div className="space-y-4">
                  {searchResult.summary && (
                    <ClientSummaryCard summary={searchResult.summary} />
                  )}

                  <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
                    <Tabs defaultValue="summary" className="w-full">
                      <div className="border-b border-border px-4 pt-3">
                        <TabsList className="bg-muted/50 h-8">
                          <TabsTrigger value="summary" className="gap-1.5 text-xs h-7">
                            <LayoutList className="w-3.5 h-3.5" />
                            Resumen
                          </TabsTrigger>
                          <TabsTrigger value="details" className="gap-1.5 text-xs h-7">
                            <FileText className="w-3.5 h-3.5" />
                            Detalle
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="summary" className="p-4">
                        <p className="text-muted-foreground text-center text-sm py-6">
                          El resumen se muestra arriba. Seleccione "Detalle" para ver cada boleto.
                        </p>
                      </TabsContent>

                      <TabsContent value="details" className="p-4 space-y-4">
                        {searchResult.tickets.map((ticket) => (
                          <TicketCard key={ticket.ticketNumber} ticket={ticket} />
                        ))}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </>
          )}

          {activeView === 'totals' && (
            <TotalsByTicketTable key={refreshKey} totals={totalsByTicket} />
          )}

          {activeView === 'projections' && (
            <PaymentProjections key={refreshKey} />
          )}
        </div>
      </main>

      <footer className="border-t border-border py-4 mt-8">
        <div className="container text-center text-xs text-muted-foreground">
          AUTOBUS S.A. — Sistema de Gestión de Operaciones
        </div>
      </footer>
    </div>
  );
}
