// Configuration des contrats optimisés
export const CONTRACTS = {
  TOKEN_FACTORY: "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE",
  SWAP_ROUTER: "0x68B1D87F95878fE05B998F19b66F4baba5De1aed"
} as const;

export const getContractAddress = (contractName: keyof typeof CONTRACTS) => {
  return CONTRACTS[contractName];
};

// Types pour les contrats optimisés
export interface OptimizedTokenInfo {
  tokenAddress: string;
  owner: string;
  createdAt: number;
  totalSupply: bigint;
  initialLiquidity: bigint;
}

export interface PoolInfo {
  tokenReserves: bigint;
  chzReserves: bigint;
}

export interface TokenCreatedEvent {
  tokenId: bigint;
  tokenAddress: string;
  owner: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
}

export interface SwapExecutedEvent {
  user: string;
  token: string;
  chzAmount: bigint;
  tokenAmount: bigint;
  isChzToToken: boolean;
} 