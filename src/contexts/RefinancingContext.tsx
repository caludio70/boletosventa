import { createContext, useContext, useState, ReactNode } from 'react';

export interface RefinancingData {
  clientName: string;
  clientCode: string;
  ticketNumber: string;
  debtAmount: number;
  concept: string;
}

interface RefinancingContextType {
  refinancingData: RefinancingData | null;
  setRefinancingData: (data: RefinancingData | null) => void;
  clearRefinancingData: () => void;
}

const RefinancingContext = createContext<RefinancingContextType | undefined>(undefined);

export function RefinancingProvider({ children }: { children: ReactNode }) {
  const [refinancingData, setRefinancingData] = useState<RefinancingData | null>(null);

  const clearRefinancingData = () => setRefinancingData(null);

  return (
    <RefinancingContext.Provider value={{ refinancingData, setRefinancingData, clearRefinancingData }}>
      {children}
    </RefinancingContext.Provider>
  );
}

export function useRefinancing() {
  const context = useContext(RefinancingContext);
  if (context === undefined) {
    throw new Error('useRefinancing must be used within a RefinancingProvider');
  }
  return context;
}
