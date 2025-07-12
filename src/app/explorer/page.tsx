"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { chilizSpicyTestnet } from "@/lib/chiliz";
import tokenFactoryAbi from "@root/contracts/abi/TokenFactory.json";
import influencerTokenAbi from "@root/artifacts/contracts/InfluencerToken.sol/InfluencerToken.json";
import Link from "next/link";
import { tokenBlacklist } from "@/lib/token-blacklist";

const factoryAddress =
  process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS! as `0x${string}`;

const publicClient = createPublicClient({
  chain: chilizSpicyTestnet,
  transport: http(),
});

interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  totalSupply: string;
}

export default function ExplorerPage() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const deployedTokenAddresses = (await publicClient.readContract({
          address: factoryAddress,
          abi: tokenFactoryAbi.abi,
          functionName: "getDeployedTokens",
        })) as `0x${string}`[];

        const tokenDetailsPromises = deployedTokenAddresses.map(async (tokenAddress) => {
            const [name, symbol, totalSupply] = await Promise.all([
                publicClient.readContract({
                    address: tokenAddress,
                    abi: influencerTokenAbi.abi,
                    functionName: 'name',
                }),
                publicClient.readContract({
                    address: tokenAddress,
                    abi: influencerTokenAbi.abi,
                    functionName: 'symbol',
                }),
                publicClient.readContract({
                    address: tokenAddress,
                    abi: influencerTokenAbi.abi,
                    functionName: 'totalSupply',
                }),
            ]);
            return {
                address: tokenAddress,
                name,
                symbol,
                // format from wei
                totalSupply: (Number(totalSupply as bigint) / 1e18).toLocaleString(),
            } as TokenInfo;
        });

        const tokensInfo = await Promise.all(tokenDetailsPromises);
        
        const filteredTokens = tokensInfo.filter(
            (token) => !tokenBlacklist.includes(token.address)
        );

        setTokens(filteredTokens.reverse()); // Show latest tokens first
      } catch (e) {
        console.error(e);
        setError("Failed to fetch tokens. Make sure your environment variables are set.");
      } finally {
        setIsLoading(false);
      }
    };

    if (factoryAddress) {
        fetchTokens();
    } else {
        setError("Token factory address is not configured.");
        setIsLoading(false);
    }
  }, []);

  return (
    <main className="flex flex-col items-center min-h-screen p-8 bg-gray-50">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Token Explorer
        </h1>

        {isLoading && <p className="text-center">Loading tokens...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        
        {!isLoading && !error && (
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Supply</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tokens.map((token) => (
                            <tr key={token.address}>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{token.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{token.symbol}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{token.totalSupply}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`https://spicy-explorer.chiliz.com/address/${token.address}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                                        {token.address}
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </main>
  );
} 