import { defineChain } from "viem";

export const chilizSpicyTestnet = defineChain({
  id: 31337, // Hardhat network chainId
  name: "Hardhat Local Network",
  nativeCurrency: {
    decimals: 18,
    name: "Chiliz",
    symbol: "CHZ",
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"], // Point vers le node Hardhat local
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://spicy-explorer.chiliz.com/" },
  },
  testnet: true,
}); 