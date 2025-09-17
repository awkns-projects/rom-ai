'use client'

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth'

interface PrivyProviderProps {
  children: React.ReactNode
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  // Don't render if required env vars are missing
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    console.warn('⚠️ NEXT_PUBLIC_PRIVY_APP_ID is not set')
    return <>{children}</>
  }

  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1',
        },
        loginMethods: [
          'email',
          'sms', 
          'wallet',
          'google',
          'twitter',
          'discord',
          'github',
          'linkedin',
          'apple',
        ],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Configure supported chains - focus on Sepolia testnet
        defaultChain: {
          id: 11155111,
          name: 'Sepolia',
          network: 'sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'Sepolia Ether',
            symbol: 'ETH',
          },
          rpcUrls: {
            public: { http: ['https://sepolia.infura.io/v3/'] },
            default: { http: ['https://sepolia.infura.io/v3/'] },
          },
          blockExplorers: {
            etherscan: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
            default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
          },
          testnet: true,
        },
        supportedChains: [{
          id: 11155111,
          name: 'Sepolia',
          network: 'sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'Sepolia Ether',
            symbol: 'ETH',
          },
          rpcUrls: {
            public: { http: ['https://sepolia.infura.io/v3/'] },
            default: { http: ['https://sepolia.infura.io/v3/'] },
          },
          blockExplorers: {
            etherscan: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
            default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
          },
          testnet: true,
        }],
      }}
    >
      {children}
    </BasePrivyProvider>
  )
} 