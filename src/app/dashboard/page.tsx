"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { ArrowLeft, Coins, DollarSign, Image, Type, Hash, Zap, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

interface TokenResult {
  message: string;
  contractAddress?: string;
  transactionHash?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TokenResult | null>(null);
  const [tokenImage, setTokenImage] = useState<string>("");

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
    const tokenName = formData.get("tokenName") as string;
    const tokenSymbol = formData.get("tokenSymbol") as string;
    const totalSupply = formData.get("totalSupply") as string;
    const chzLiquidity = formData.get("chzLiquidity") as string;
    const userAddress = user?.wallet?.address;

    if (!userAddress) {
      setResult({ message: "Error: Wallet not connected" });
      setIsLoading(false);
      return;
    }

    if (!tokenName || !tokenSymbol || !totalSupply || !chzLiquidity) {
      setResult({ message: "Error: All fields are required" });
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
          chzLiquidity,
          tokenImage,
          userAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
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
                <Zap className="h-6 w-6 text-chiliz-primary" />
                <h1 className="text-xl font-bold gradient-text">Fandoms</h1>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Coins className="h-6 w-6 mr-2 text-chiliz-primary" />
                  Create your Fan Token
                </CardTitle>
                <p className="text-gray-400">
                  Launch your custom token on the Chiliz blockchain
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLaunch} className="space-y-6">
                  {/* Token Image */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Image className="h-4 w-4 mr-2" />
                      Token Image
                    </label>
                    <ImageUpload
                      value={tokenImage}
                      onChange={setTokenImage}
                      onRemove={() => setTokenImage("")}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Token Name */}
                  <div className="space-y-2">
                    <label htmlFor="tokenName" className="text-sm font-medium text-gray-300 flex items-center">
                      <Type className="h-4 w-4 mr-2" />
                      Token Name
                    </label>
                    <Input
                      id="tokenName"
                      name="tokenName"
                      type="text"
                      required
                      placeholder="ex: Dogecoin Killer"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Token Symbol */}
                  <div className="space-y-2">
                    <label htmlFor="tokenSymbol" className="text-sm font-medium text-gray-300 flex items-center">
                      <Hash className="h-4 w-4 mr-2" />
                      Token Symbol
                    </label>
                    <Input
                      id="tokenSymbol"
                      name="tokenSymbol"
                      type="text"
                      required
                      placeholder="ex: DOGK"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Total Supply */}
                  <div className="space-y-2">
                    <label htmlFor="totalSupply" className="text-sm font-medium text-gray-300 flex items-center">
                      <Coins className="h-4 w-4 mr-2" />
                      Total Supply
                    </label>
                    <Input
                      id="totalSupply"
                      name="totalSupply"
                      type="number"
                      required
                      placeholder="ex: 1000000000"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                      disabled={isLoading}
                    />
                  </div>

                  {/* CHZ Liquidity */}
                  <div className="space-y-2">
                    <label htmlFor="chzLiquidity" className="text-sm font-medium text-gray-300 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      CHZ Liquidity
                    </label>
                    <Input
                      id="chzLiquidity"
                      name="chzLiquidity"
                      type="number"
                      step="0.001"
                      required
                      placeholder="ex: 10.5"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500">
                      Amount of CHZ to add as initial liquidity
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-lg py-6 animate-pulse-chiliz"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Token"
                    )}
                  </Button>
                </form>

                {/* Result */}
                {result && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    result.contractAddress ? "bg-green-900/50 border border-green-500" : "bg-red-900/50 border border-red-500"
                  }`}>
                    <p className={`text-sm font-medium ${
                      result.contractAddress ? "text-green-300" : "text-red-300"
                    }`}>
                      {result.message}
                    </p>
                    {result.contractAddress && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-400">
                          Adresse du contrat:
                        </p>
                        <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-green-300">
                          {result.contractAddress}
                        </code>
                      </div>
                    )}
                    {result.transactionHash && (
                      <div className="mt-2">
                        <a
                          href={`https://spicy-explorer.chiliz.com/tx/${result.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-chiliz-primary hover:text-chiliz-secondary underline"
                        >
                          Voir sur l'explorateur →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Features */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-chiliz-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white">Automatic Swap</h4>
                    <p className="text-xs text-gray-400">Trade CHZ for your tokens</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-chiliz-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white">Rewarded Staking</h4>
                    <p className="text-xs text-gray-400">Earn rewards by staking</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-chiliz-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white">Instant Deployment</h4>
                    <p className="text-xs text-gray-400">Your token is ready in seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Creator Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">LP Fees</span>
                    <span className="text-sm font-medium text-chiliz-primary">50%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">LP Pool after 1 year</span>
                    <span className="text-sm font-medium text-chiliz-primary">50%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Vested supply</span>
                    <span className="text-sm font-medium text-chiliz-primary">0% - 80%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 