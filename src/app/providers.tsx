"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { chilizSpicyTestnet } from "@/lib/chiliz";
import { ToastProvider } from "@/components/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        // Add Chiliz Spicy Testnet to the list of supported chains
        supportedChains: [chilizSpicyTestnet],
        // Set Chiliz Spicy Testnet as the default chain
        defaultChain: chilizSpicyTestnet,
        // Customize Privy's appearance in your app
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          logo: "https://your-logo-url",
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </PrivyProvider>
  );
} 