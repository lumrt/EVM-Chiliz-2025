import { defineChain } from "viem";

export const chilizSpicyTestnet = defineChain({
  id: 88882,
  name: "Chiliz Spicy Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Chiliz",
    symbol: "CHZ",
  },
  rpcUrls: {
    default: {
      http: ["https://spicy-rpc.chiliz.com/"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://spicy-explorer.chiliz.com/" },
  },
  testnet: true,
});

export const hardhatLocalhost = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});

export const getActiveChain = () => {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  if (network === 'localhost') {
    return hardhatLocalhost;
  }
  return chilizSpicyTestnet;
} 