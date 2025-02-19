'use client';

import { Client } from '@xmtp/xmtp-js';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { createXMTPSigner } from '../utils/xmtp-signer';

interface XMTPContextType {
  client: Client | null;
  isLoading: boolean;
  error: Error | null;
}

const XMTPContext = createContext<XMTPContextType>({
  client: null,
  isLoading: false,
  error: null,
});

export function XMTPProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const initClient = async () => {
      if (!isConnected || !address || !walletClient || client) return;

      try {
        setIsLoading(true);
        setError(null);

        const signer = createXMTPSigner(walletClient, address);
        const xmtp = await Client.create(signer, { env: 'production' });
        setClient(xmtp);
      } catch (e) {
        console.error('Error initializing XMTP client:', e);
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initClient();
  }, [address, isConnected, walletClient]);

  // Clean up when wallet disconnects
  useEffect(() => {
    if (!isConnected && client) {
      setClient(null);
      setError(null);
    }
  }, [isConnected, client]);

  return (
    <XMTPContext.Provider value={{ client, isLoading, error }}>
      {children}
    </XMTPContext.Provider>
  );
}

export const useXMTP = () => useContext(XMTPContext); 