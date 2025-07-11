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