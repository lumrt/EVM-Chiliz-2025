"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Coins, TrendingUp, Users, DollarSign, Clock, ExternalLink } from "lucide-react";
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

export default function TokensPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (error) {
      console.error("Error while fetching tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: string) => {
    const value = parseFloat(num);
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + "M";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(2) + "K";
    }
    return value.toFixed(2);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
                <Coins className="h-6 w-6 text-chiliz-primary" />
                <h1 className="text-xl font-bold gradient-text">Tokens</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/swap">Swap</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/staking">Staking</Link>
              </Button>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="px-3 py-1 bg-chiliz-primary/20 rounded-full text-sm">
                {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Fandoms Fan Tokens</h2>
              <p className="text-gray-400 mt-2">
                Discover all tokens created on our platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild>
                <Link href="/dashboard">Create a Token</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Coins className="h-8 w-8 text-chiliz-primary" />
                <div>
                  <p className="text-2xl font-bold text-white">{tokens.length}</p>
                  <p className="text-sm text-gray-400">Tokens created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-chiliz-primary" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(
                      tokens.reduce((sum, token) => sum + parseFloat(token.currentLiquidity), 0).toString()
                    )}
                  </p>
                  <p className="text-sm text-gray-400">CHZ in liquidity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-chiliz-primary" />
                <div>
                  <p className="text-2xl font-bold text-white">10%</p>
                  <p className="text-sm text-gray-400">APY Staking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tokens List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chiliz-primary mx-auto mb-4"></div>
            <p className="text-gray-300">Loading tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Coins className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No tokens found</h3>
              <p className="text-gray-400 mb-6">
                Be the first to create a memecoin on Chiliz!
              </p>
              <Button asChild>
                <Link href="/dashboard">Create the first token</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <Card key={token.address} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {token.imageUrl && (
                      <img
                        src={token.imageUrl}
                        alt={token.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-white">{token.symbol}</CardTitle>
                      <p className="text-sm text-gray-400">{token.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Supply</p>
                      <p className="text-sm font-medium text-white">
                        {formatNumber(token.totalSupply)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Liquidity</p>
                      <p className="text-sm font-medium text-white">
                        {formatNumber(token.currentLiquidity)} CHZ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Created</p>
                      <p className="text-sm font-medium text-white">
                        {formatDate(token.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Owner</p>
                      <button
                        onClick={() => copyToClipboard(token.owner)}
                        className="text-sm font-medium text-chiliz-primary hover:text-chiliz-secondary"
                      >
                        {token.owner.slice(0, 6)}...{token.owner.slice(-4)}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyToClipboard(token.address)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Copier
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/swap?token=${token.address}`}>
                        Swap
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 