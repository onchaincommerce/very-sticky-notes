import { type WalletClient } from 'viem';

export interface Signer {
  getAddress: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

export const createXMTPSigner = (walletClient: WalletClient, address: string): Signer => {
  return {
    getAddress: async () => address,
    signMessage: async (message: string) => {
      const signature = await walletClient.signMessage({
        message,
        account: walletClient.account!
      });
      return signature;
    }
  };
}; 