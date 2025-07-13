"use client";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Coins, TrendingUp, Users, Zap, Star } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  return (
    <div className="min-h-screen bg-gradient-to-br from-chiliz-dark via-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
                          <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-chiliz-primary" />
                <h1 className="text-2xl font-bold gradient-text">Fandoms</h1>
              </div>
            
            <div className="flex items-center space-x-4">
              {ready && authenticated && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/swap">Swap</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/staking">Staking</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/tokens">Tokens</Link>
                  </Button>
                  <div className="h-6 w-px bg-gray-600"></div>
                </>
              )}
              {ready && authenticated ? (
                <>
                  <div className="px-3 py-1 bg-chiliz-primary/20 rounded-full text-sm">
                    {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                  </div>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                  >
                    Disconnect
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={login}
                  disabled={!ready}
                  className="animate-pulse-chiliz"
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
                          <div className="inline-flex items-center space-x-2 bg-chiliz-primary/20 px-4 py-2 rounded-full mb-6">
                <Star className="h-4 w-4 text-chiliz-primary" />
                <span className="text-sm font-medium">Your token creation laboratory</span>
              </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Fandoms</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform your community into an economy. Create memecoins, 
              offer exclusive access and generate new revenue with Fandoms.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {ready && authenticated ? (
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/dashboard">Create a Token</Link>
                </Button>
              ) : (
                <Button
                  onClick={login}
                  disabled={!ready}
                  size="lg"
                  className="text-lg px-8"
                >
                  Start Now
                </Button>
              )}
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link href="/tokens">View Tokens</Link>
              </Button>
            </div>
          </div>

          {/* Features Cards */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-chiliz-primary/20 rounded-lg">
                    <Coins className="h-6 w-6 text-chiliz-primary" />
                  </div>
                  <CardTitle className="text-white">Simple Creation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Create your memecoin in just a few clicks. Name, symbol, image and CHZ liquidity.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-chiliz-primary/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-chiliz-primary" />
                  </div>
                  <CardTitle className="text-white">Swap & Stake</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Trade your tokens for CHZ and stake to earn rewards.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-chiliz-primary/20 rounded-lg">
                    <Users className="h-6 w-6 text-chiliz-primary" />
                  </div>
                  <CardTitle className="text-white">Community</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Build your community and create value for your fans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-chiliz-primary/10 rounded-full blur-3xl animate-bounce-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chiliz-secondary/10 rounded-full blur-3xl animate-bounce-slow" style={{animationDelay: '1s'}}></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">0.5%</div>
              <div className="text-gray-400">Trading Fees</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">8%</div>
              <div className="text-gray-400">Staking APY</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">15%</div>
              <div className="text-gray-400">Platform Revenue Share</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-chiliz-primary" />
              <span className="text-lg font-semibold">Fandoms</span>
            </div>
            <div className="mt-4 md:mt-0 text-gray-400">
              © 2025 Fandoms. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
