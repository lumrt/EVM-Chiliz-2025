"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    contractAddress?: string;
    transactionHash?: string;
  } | null>(null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

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
    </main>
  );
} 