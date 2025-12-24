import { useState } from 'react';
import { Header } from '@/components/Header';
import { SearchBox } from '@/components/SearchBox';
import { TicketCard } from '@/components/TicketCard';
import { ClientSummaryCard } from '@/components/ClientSummaryCard';
import { TotalsByTicketTable } from '@/components/TotalsByTicketTable';
import { EmptyState } from '@/components/EmptyState';
import { searchTicketsOrClient, getClientSummary, getTotalsByTicket } from '@/lib/realData';
import { Ticket, ClientSummary, TotalByTicket } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, LayoutList, Table } from 'lucide-react';

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'search' | 'totals'>('search');
  const [searchResult, setSearchResult] = useState<{
    type: 'ticket' | 'client' | 'not_found' | 'initial';
    tickets: Ticket[];
    clientName?: string;
    summary?: ClientSummary | null;
  }>({ type: 'initial', tickets: [] });

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

  const handleShowTotals = () => {
    setActiveView('totals');
  };

  const totalsByTicket = getTotalsByTicket();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Navigation Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveView('search')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeView === 'search' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <FileText className="w-4 h-4" />
              Buscar Operación
            </button>
            <button
              onClick={handleShowTotals}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeView === 'totals' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Table className="w-4 h-4" />
              Total por Boleto
            </button>
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
                <div className="space-y-6">
                  {searchResult.summary && (
                    <ClientSummaryCard summary={searchResult.summary} />
                  )}

                  <div className="bg-card rounded-xl card-shadow overflow-hidden">
                    <Tabs defaultValue="summary" className="w-full">
                      <div className="border-b border-border px-5 pt-4">
                        <TabsList className="bg-muted/50">
                          <TabsTrigger value="summary" className="gap-2">
                            <LayoutList className="w-4 h-4" />
                            Resumen
                          </TabsTrigger>
                          <TabsTrigger value="details" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Detalle por Boleto
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="summary" className="p-5">
                        <p className="text-muted-foreground text-center py-8">
                          El resumen de cuenta se muestra arriba. Seleccione "Detalle por Boleto" para ver cada operación.
                        </p>
                      </TabsContent>

                      <TabsContent value="details" className="p-5 space-y-6">
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
            <TotalsByTicketTable totals={totalsByTicket} />
          )}
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>AUTOBUS S.A. — Sistema de Gestión de Operaciones</p>
        </div>
      </footer>
    </div>
  );
}
