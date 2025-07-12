"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { chilizSpicyTestnet } from "@/lib/chiliz";
import tokenFactoryAbi from "@root/contracts/abi/TokenFactory.json";
import influencerTokenAbi from "@root/artifacts/contracts/InfluencerToken.sol/InfluencerToken.json";
import { tokenBlacklist } from "@/lib/token-blacklist";

const factoryAddress =
  process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS! as `0x${string}`;

const publicClient = createPublicClient({
  chain: chilizSpicyTestnet,
  transport: http(),
});

interface OwnedTokenInfo {
    address: `0x${string}`;
    name: string;
    symbol: string;
    balance: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    contractAddress?: string;
    transactionHash?: string;
  } | null>(null);
  const [ownedTokens, setOwnedTokens] = useState<OwnedTokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    const fetchOwnedTokens = async () => {
        if (!user?.wallet?.address || !factoryAddress) {
            setIsLoadingTokens(false);
            return;
        }

        setIsLoadingTokens(true);
        try {
            const allDeployedTokenAddresses = (await publicClient.readContract({
                address: factoryAddress,
                abi: tokenFactoryAbi.abi,
                functionName: "getDeployedTokens",
            })) as `0x${string}`[];

            const deployedTokenAddresses = allDeployedTokenAddresses.filter(
                (address) => !tokenBlacklist.includes(address)
            );

            const tokenCheckPromises = deployedTokenAddresses.map(async (tokenAddress) => {
                const balance = (await publicClient.readContract({
                    address: tokenAddress,
                    abi: influencerTokenAbi.abi,
                    functionName: 'balanceOf',
                    args: [user.wallet!.address as `0x${string}`],
                })) as bigint;
                
                if (balance > 0) {
                    const [name, symbol] = await Promise.all([
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
                    ]);
                    return {
                        address: tokenAddress,
                        name,
                        symbol,
                        balance: formatUnits(balance, 18), // assuming 18 decimals
                    } as OwnedTokenInfo;
                }
                return null;
            });

            const checkedTokens = await Promise.all(tokenCheckPromises);
            const owned = checkedTokens.filter(t => t !== null) as OwnedTokenInfo[];
            setOwnedTokens(owned.reverse());
        } catch (error) {
            console.error("Failed to fetch owned tokens:", error);
            // Optionally set an error state here to show in the UI
        } finally {
            setIsLoadingTokens(false);
        }
    };
    
    if (ready && authenticated) {
        fetchOwnedTokens();
    }
  }, [ready, authenticated, user?.wallet?.address]);

  const handleLaunch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const tokenName = formData.get("tokenName");
    const tokenSymbol = formData.get("tokenSymbol");
    const totalSupply = formData.get("totalSupply");
    const userAddress = user?.wallet?.address;

    if (!userAddress) {
      setResult({ message: "Error: Wallet not connected" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/launch-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenName,
          tokenSymbol,
          totalSupply,
          userAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult({
        message: data.message,
        contractAddress: data.contractAddress,
        transactionHash: data.transactionHash,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setResult({ message: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-8 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Launch your Token
        </h1>
        <form className="mt-8 space-y-6" onSubmit={handleLaunch}>
          <div>
            <label
              htmlFor="tokenName"
              className="block text-sm font-medium text-gray-900"
            >
              Token Name
            </label>
            <div className="mt-1">
              <input
                id="tokenName"
                name="tokenName"
                type="text"
                required
                className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. Chloe's Token"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="tokenSymbol"
              className="block text-sm font-medium text-gray-900"
            >
              Token Symbol
            </label>
            <div className="mt-1">
              <input
                id="tokenSymbol"
                name="tokenSymbol"
                type="text"
                required
                className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. CHLOE"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="totalSupply"
              className="block text-sm font-medium text-gray-900"
            >
              Total Supply
            </label>
            <div className="mt-1">
              <input
                id="totalSupply"
                name="totalSupply"
                type="number"
                required
                className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. 1000000"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Launching..." : "Launch Token"}
            </button>
          </div>
        </form>

        {result && (
          <div
            className={`mt-4 p-4 rounded-md ${
              result.contractAddress ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                result.contractAddress ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.message}
            </p>
            {result.contractAddress && (
              <p className="mt-2 text-xs text-gray-600">
                Contract Address:{" "}
                <code className="font-mono">{result.contractAddress}</code>
              </p>
            )}
            {result.transactionHash && (
              <p className="mt-2 text-xs text-gray-600">
                Transaction:{" "}
                <a
                  href={`https://spicy-explorer.chiliz.com/tx/${result.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View on Explorer
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">My Tokens</h2>
          {isLoadingTokens ? (
              <p className="text-center text-gray-500">Loading your tokens...</p>
          ) : ownedTokens.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                  <table className="min-w-full">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                          {ownedTokens.map((token) => (
                              <tr key={token.address}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{token.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{token.symbol}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{token.balance}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          ) : (
              <p className="text-center text-gray-500">You do not own any influencer tokens yet.</p>
          )}
      </div>
    </main>
  );
} 