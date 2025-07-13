"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowUpDown, Coins, DollarSign, Zap, TrendingUp, Info } from "lucide-react";
import Link from "next/link";

interface Token {
  address: string;
  name: string;
  symbol: string;
  imageUrl: string;
  totalSupply: string;
  owner: string;
  chzLiquidity: string;
  createdAt: string;
  currentLiquidity: string;
}

export default function SwapPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  const [isChzToToken, setIsChzToToken] = useState(true);
  const [estimatedOutput, setEstimatedOutput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/tokens");
      const data = await response.json();
      setTokens(data.tokens || []);
      if (data.tokens && data.tokens.length > 0) {
        setSelectedToken(data.tokens[0]);
      }
    } catch (error) {
      console.error("Error while fetching tokens:", error);
    }
  };

  const calculateEstimatedOutput = () => {
    if (!selectedToken || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const liquidity = parseFloat(selectedToken.currentLiquidity);
    const totalSupply = parseFloat(selectedToken.totalSupply);

    if (isChzToToken) {
      // CHZ to Token: tokenAmount = (chzAmount * totalSupply) / chzLiquidity
      const estimated = (amountNum * totalSupply) / liquidity;
      setEstimatedOutput(estimated.toFixed(6));
    } else {
      // Token to CHZ: chzAmount = (tokenAmount * chzLiquidity) / totalSupply
      const estimated = (amountNum * liquidity) / totalSupply;
      setEstimatedOutput(estimated.toFixed(6));
    }
  };

  useEffect(() => {
    calculateEstimatedOutput();
  }, [amount, selectedToken, isChzToToken]);

  const handleSwap = async () => {
    if (!selectedToken || !amount || !user?.wallet?.address) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenAddress: selectedToken.address,
          amount: parseFloat(amount),
          isChzToToken,
          userAddress: user.wallet.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error during swap");
      }

      setResult(data.message);
      setAmount("");
      setEstimatedOutput("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setResult(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSwapDirection = () => {
    setIsChzToToken(!isChzToToken);
    setAmount("");
    setEstimatedOutput("");
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chiliz-dark via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chiliz-primary mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chiliz-dark via-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-chiliz-primary" />
                <h1 className="text-xl font-bold gradient-text">Swap</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-chiliz-primary/20 rounded-full text-sm">
                {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Token Selection */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Coins className="h-5 w-5 mr-2 text-chiliz-primary" />
                Select a Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => setSelectedToken(token)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedToken?.address === token.address
                        ? "border-chiliz-primary bg-chiliz-primary/10"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {token.imageUrl && (
                        <img
                          src={token.imageUrl}
                          alt={token.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                      <div className="text-left">
                        <h3 className="font-medium text-white">{token.symbol}</h3>
                        <p className="text-sm text-gray-400">{token.name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Swap Interface */}
          {selectedToken && (
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-chiliz-primary" />
                  Swap {selectedToken.symbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* From */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    From: {isChzToToken ? "CHZ" : selectedToken.symbol}
                  </label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-lg"
                    disabled={isLoading}
                  />
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={toggleSwapDirection}
                    variant="outline"
                    size="icon"
                    className="rounded-full border-gray-600 hover:border-chiliz-primary"
                    disabled={isLoading}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* To */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    To: {isChzToToken ? selectedToken.symbol : "CHZ"}
                  </label>
                  <Input
                    type="text"
                    value={estimatedOutput}
                    readOnly
                    placeholder="0.0"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-lg"
                  />
                </div>

                {/* Info */}
                <div className="bg-gray-800/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-chiliz-primary mt-0.5" />
                    <div className="text-sm text-gray-300">
                      <p>Available liquidity: {parseFloat(selectedToken.currentLiquidity).toFixed(6)} CHZ</p>
                      <p>Total supply: {parseFloat(selectedToken.totalSupply).toFixed(0)} {selectedToken.symbol}</p>
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <Button
                  onClick={handleSwap}
                  disabled={isLoading || !amount || parseFloat(amount) <= 0}
                  className="w-full text-lg py-6"
                >
                                      {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Swapping...
                      </>
                    ) : (
                      `Swap ${isChzToToken ? "CHZ" : selectedToken.symbol} → ${isChzToToken ? selectedToken.symbol : "CHZ"}`
                    )}
                </Button>

                {/* Result */}
                {result && (
                  <div className={`p-4 rounded-lg ${
                    result.includes("Error") ? "bg-red-900/50 border border-red-500" : "bg-green-900/50 border border-green-500"
                  }`}>
                                          <p className={`text-sm ${
                        result.includes("Error") ? "text-red-300" : "text-green-300"
                      }`}>
                      {result}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 