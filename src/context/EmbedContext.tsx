import { createContext, useContext, type ReactNode } from 'react';
import type { EmbedConfig } from '../types/embedContext';

const EmbedContext = createContext<EmbedConfig | null>(null);

interface EmbedProviderProps {
  value: EmbedConfig;
  children: ReactNode;
}

export function EmbedProvider({ value, children }: EmbedProviderProps) {
  return <EmbedContext.Provider value={value}>{children}</EmbedContext.Provider>;
}

export function useEmbedContext(): EmbedConfig {
  const ctx = useContext(EmbedContext);
  if (!ctx) {
    throw new Error('useEmbedContext must be used within EmbedProvider');
  }
  return ctx;
}

export function useOptionalEmbedContext(): EmbedConfig | null {
  return useContext(EmbedContext);
}
