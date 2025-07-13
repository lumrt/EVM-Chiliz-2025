"use client";

declare global {
  interface Window {
    ethereum?: any;
  }
}

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Gift, Clock, TrendingUp, Info, Coins, Wallet, Plus } from "lucide-react";
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

interface StakingInfo {
  stakingBalance: string;
  pendingRewards: string;
  tokenAddress: string;
  userAddress: string;
}

interface StakingResult {
  message: string;
  transactionHash?: string;
  explorerUrl?: string;
  tokensSent?: string;
  network?: string;
  stakingContractAddress?: string;
  realTransaction?: boolean;
  stakingType?: string;
  amount?: number;
  totalStaked?: number;
  apy?: number;
  estimatedYearlyRewards?: string;
}

export default function StakingPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  const [isStaking, setIsStaking] = useState(true);
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [result, setResult] = useState<StakingResult | null>(null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    if (selectedToken && user?.wallet?.address) {
      fetchStakingInfo();
    }
  }, [selectedToken, user?.wallet?.address]);

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

  const fetchStakingInfo = async () => {
    if (!selectedToken || !user?.wallet?.address) return;

    try {
      const response = await fetch(
        `/api/staking?tokenAddress=${selectedToken.address}&userAddress=${user.wallet.address}`
      );
      const data = await response.json();
      setStakingInfo(data);
    } catch (error) {
      console.error("Error while fetching staking info:", error);
    }
  };

  const handleStaking = async () => {
    if (!selectedToken || !amount || !user?.wallet?.address) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/staking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenAddress: selectedToken.address,
          amount: parseFloat(amount),
          isStaking,
          userAddress: user.wallet.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error during operation");
      }

      setResult(data);
      setAmount("");
      // Refresh staking info
      fetchStakingInfo();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setResult({ message: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return "0.0";
    return num.toFixed(6);
  };

  const calculateAPY = () => {
    // 10% APY as defined in the contract
    return "10.0";
  };

  // Add Chiliz network to wallet
  const addChilizNetwork = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet");
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x15b32', // 88882 in hex
          chainName: 'Chiliz Spicy Testnet',
          nativeCurrency: {
            name: 'CHZ',
            symbol: 'CHZ',
            decimals: 18,
          },
          rpcUrls: ['https://spicy-rpc.chiliz.com'],
          blockExplorerUrls: ['https://spicy-explorer.chiliz.com'],
        }],
      });
      alert("Chiliz network added successfully!");
    } catch (error) {
      console.error("Error adding network:", error);
      alert("Failed to add network");
    }
  };

  // Fund wallet with 10 tokens
  const fundWallet = async () => {
    if (!selectedToken || !user?.wallet?.address) {
      alert("Please select a token and connect wallet");
      return;
    }

    try {
      const response = await fetch("/api/fund-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenAddress: selectedToken.address,
          recipientAddress: user.wallet.address,
          amount: "10",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Successfully funded! ${data.amount} ${selectedToken.symbol} sent to your wallet`);
      } else {
        alert(`Funding failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Funding error:", error);
      alert("Funding failed");
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
                <Users className="h-6 w-6 text-chiliz-primary" />
                <h1 className="text-xl font-bold gradient-text">Staking</h1>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Selection */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Coins className="h-5 w-5 mr-2 text-chiliz-primary" />
                Sélectionnez un Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => setSelectedToken(token)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
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
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      )}
                      <div className="text-left flex-1">
                        <h3 className="font-medium text-white">{token.symbol}</h3>
                        <p className="text-sm text-gray-400">{token.name}</p>
                        <p className="text-xs text-chiliz-primary">APY: {calculateAPY()}%</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-chiliz-primary" />
                Quick Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={addChilizNetwork}
                className="w-full bg-chiliz-primary hover:bg-chiliz-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chiliz Network
              </Button>
              
              {selectedToken && (
                <Button 
                  onClick={fundWallet}
                  variant="outline"
                  className="w-full border-chiliz-primary text-chiliz-primary hover:bg-chiliz-primary hover:text-white"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Get 10 {selectedToken.symbol}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Staking Stats */}
          {selectedToken && stakingInfo && (
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-chiliz-primary" />
                  Your Staking Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4 text-chiliz-primary" />
                      <p className="text-sm text-gray-400">Staked</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {formatBalance(stakingInfo.stakingBalance)}
                    </p>
                    <p className="text-xs text-gray-400">{selectedToken.symbol}</p>
                  </div>
                  
                  <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gift className="h-4 w-4 text-chiliz-primary" />
                      <p className="text-sm text-gray-400">Rewards</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {formatBalance(stakingInfo.pendingRewards)}
                    </p>
                    <p className="text-xs text-gray-400">{selectedToken.symbol}</p>
                  </div>
                </div>

                <div className="bg-gray-800/30 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-chiliz-primary" />
                    <p className="text-sm text-gray-400">APY</p>
                  </div>
                  <p className="text-2xl font-bold text-chiliz-primary">{calculateAPY()}%</p>
                  <p className="text-xs text-gray-400">Rendement annuel</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staking Interface */}
          {selectedToken && (
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-chiliz-primary" />
                  Staking {selectedToken.symbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Staking/Unstaking Toggle */}
                <div className="flex space-x-4">
                  <Button
                    onClick={() => setIsStaking(true)}
                    variant={isStaking ? "default" : "outline"}
                    className="flex-1"
                  >
                    Stake
                  </Button>
                  <Button
                    onClick={() => setIsStaking(false)}
                    variant={!isStaking ? "default" : "outline"}
                    className="flex-1"
                  >
                    Unstake
                  </Button>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Amount ({selectedToken.symbol})
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

                {/* Info */}
                <div className="bg-gray-800/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-chiliz-primary mt-0.5" />
                    <div className="text-sm text-gray-300">
                      <p>• Reward rate: {calculateAPY()}% APY</p>
                      <p>• Rewards are calculated continuously</p>
                      <p>• You can unstake at any time</p>
                      <p>• Tokens are sent to a secure staking address</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleStaking}
                  disabled={isLoading || !amount || parseFloat(amount) <= 0}
                  className="w-full text-lg py-6"
                >
                                      {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {isStaking ? "Staking..." : "Unstaking..."}
                      </>
                    ) : (
                      `${isStaking ? "Stake" : "Unstake"} ${selectedToken.symbol}`
                    )}
                </Button>

                {/* Result */}
                {result && (
                  <div className={`p-4 rounded-lg ${
                    result.message.includes("Error") ? "bg-red-900/50 border border-red-500" : "bg-green-900/50 border border-green-500"
                  }`}>
                    <p className={`text-sm font-medium mb-3 ${
                      result.message.includes("Error") ? "text-red-300" : "text-green-300"
                    }`}>
                      {result.message}
                    </p>
                    
                    {/* Transaction Details */}
                    {result.transactionHash && !result.message.includes("Error") && (
                      <div className="space-y-2 text-xs text-gray-300 border-t border-gray-600 pt-3">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Transaction Hash:</span>
                            <span className="font-mono text-chiliz-primary truncate ml-2" title={result.transactionHash}>
                              {result.transactionHash.slice(0, 10)}...{result.transactionHash.slice(-8)}
                            </span>
                          </div>
                          
                          {result.tokensSent && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Tokens Sent:</span>
                              <span className="text-green-300">{result.tokensSent}</span>
                            </div>
                          )}
                          
                          {result.stakingContractAddress && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Staking Contract:</span>
                              <span className="font-mono text-gray-300 truncate ml-2" title={result.stakingContractAddress}>
                                {result.stakingContractAddress.slice(0, 6)}...{result.stakingContractAddress.slice(-4)}
                              </span>
                            </div>
                          )}
                          
                          {result.network && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Network:</span>
                              <span className="text-blue-300">{result.network}</span>
                            </div>
                          )}
                          
                          {result.realTransaction !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Transaction Type:</span>
                              <span className={result.realTransaction ? "text-green-300" : "text-yellow-300"}>
                                {result.realTransaction ? "Real Blockchain" : "Simulation"}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Explorer Link */}
                        {result.explorerUrl && (
                          <div className="mt-3 pt-2 border-t border-gray-600">
                            <a 
                              href={result.explorerUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-xs bg-chiliz-primary/20 hover:bg-chiliz-primary/30 text-chiliz-primary px-3 py-2 rounded-md transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>View on Explorer</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
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