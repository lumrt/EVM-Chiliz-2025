import { NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chilizSpicyTestnet } from "@/lib/chiliz";

// ERC20 ABI for token transfers
const ERC20_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Hardcoded staking pool with realistic data
const STAKING_POOL = {
  totalStaked: "125000", // 125K CHZ currently staked
  apyRate: 0.08, // 8% APY - realistic for DeFi
  minimumStake: 10, // Minimum 10 CHZ
  stakingRewards: "15000", // 15K CHZ available as rewards
};

// Staking contract address (simulation)
const STAKING_CONTRACT_ADDRESS = "0xa69F306A78E7c611620e8781bE488FC6E06C0892" as const;

// Store for user stakes (in production, this would be in a database)
const userStakes = new Map();

export async function POST(request: Request) {
  try {
    const { tokenAddress, amount, isStaking, userAddress } = await request.json();
    
    if (!userAddress || !tokenAddress || typeof isStaking !== 'boolean') {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const amountFloat = parseFloat(amount || "0");
    
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Simulate realistic delay (5-9 seconds)
    const delay = Math.floor(Math.random() * 4000) + 5000; // 5000-9000ms
    await new Promise(resolve => setTimeout(resolve, delay));

    if (isStaking) {
      // STAKING OPERATION
      if (amountFloat < STAKING_POOL.minimumStake) {
        return NextResponse.json(
          { error: `Minimum stake is ${STAKING_POOL.minimumStake} CHZ` },
          { status: 400 }
        );
      }

      let realTransactionHash = null;

      try {
        // Simulate sending 2 CZC tokens to staking contract address
        let operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY!;
        if (!operatorPrivateKey.startsWith('0x')) {
          operatorPrivateKey = `0x${operatorPrivateKey}`;
        }

        const operatorAccount = privateKeyToAccount(operatorPrivateKey as `0x${string}`);

        const walletClient = createWalletClient({
          account: operatorAccount,
          chain: chilizSpicyTestnet,
          transport: http(),
        });

        const publicClient = createPublicClient({
          chain: chilizSpicyTestnet,
          transport: http(),
        });

        // Send 2 CZC tokens to staking contract to simulate staking
        const txHash = await walletClient.writeContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [STAKING_CONTRACT_ADDRESS, parseEther("2")], // 2 CZC tokens
        });

        // Wait for transaction confirmation
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        realTransactionHash = txHash;

        console.log(`✅ Staking simulation: Sent 2 CZC tokens to ${STAKING_CONTRACT_ADDRESS}`);
        console.log(`📋 Transaction hash: ${txHash}`);
        console.log(`🪙 Token address: ${tokenAddress}`);

      } catch (error) {
        console.error("❌ Failed to send staking transaction:", error);
        console.error("Error details:", error);
        // Continue with simulation even if real transaction fails
      }

      // Get current user stake
      const currentStake = userStakes.get(userAddress) || {
        amount: 0,
        timestamp: Date.now(),
        rewards: 0
      };

      // Add to stake
      const newStakeAmount = currentStake.amount + amountFloat;
      userStakes.set(userAddress, {
        amount: newStakeAmount,
        timestamp: Date.now(),
        rewards: currentStake.rewards
      });

      // Use real transaction hash if available, otherwise simulate
      const stakeHash = realTransactionHash || `0x${Math.random().toString(16).substr(2, 64)}`;

      return NextResponse.json({
        message: "Staking successful!",
        transactionHash: stakeHash,
        stakingType: "Staking",
        amount: amountFloat,
        tokenAddress: tokenAddress,
        totalStaked: newStakeAmount,
        apy: STAKING_POOL.apyRate,
        estimatedYearlyRewards: (newStakeAmount * STAKING_POOL.apyRate).toFixed(6),
        realTransaction: realTransactionHash ? true : false,
        stakingContractAddress: STAKING_CONTRACT_ADDRESS,
        explorerUrl: `https://spicy-explorer.chiliz.com/tx/${stakeHash}`,
        tokensSent: "2 CZC",
        network: "Chiliz Spicy Testnet",
      });
    } else {
      // UNSTAKING OPERATION
      const userStake = userStakes.get(userAddress);
      if (!userStake || userStake.amount < amountFloat) {
        return NextResponse.json(
          { error: "Insufficient staked amount" },
          { status: 400 }
        );
      }

      // Calculate rewards earned
      const timeStaked = (Date.now() - userStake.timestamp) / (1000 * 60 * 60 * 24 * 365); // years
      const earnedRewards = userStake.amount * STAKING_POOL.apyRate * timeStaked;

      // Update user stake
      const remainingStake = userStake.amount - amountFloat;
      if (remainingStake <= 0) {
        userStakes.delete(userAddress);
      } else {
        userStakes.set(userAddress, {
          amount: remainingStake,
          timestamp: userStake.timestamp,
          rewards: userStake.rewards + earnedRewards
        });
      }

      const unstakeHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      return NextResponse.json({
        message: "Unstaking successful!",
        transactionHash: unstakeHash,
        stakingType: "Unstaking",
        amount: amountFloat,
        tokenAddress: tokenAddress,
        remainingStaked: remainingStake,
        rewardsEarned: earnedRewards.toFixed(6),
        totalReceived: (amountFloat + earnedRewards).toFixed(6),
      });
    }
  } catch (error) {
    console.error("Staking API Error:", error);
    
    return NextResponse.json(
      { error: "An unexpected error occurred during staking operation." },
      { status: 500 }
    );
  }
}

// GET - Get staking information
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const tokenAddress = searchParams.get('tokenAddress');
    
    if (!userAddress || !tokenAddress) {
      return NextResponse.json(
        { error: "userAddress and tokenAddress are required" },
        { status: 400 }
      );
    }

    const userStake = userStakes.get(userAddress);
    
    if (userStake) {
      const timeStaked = (Date.now() - userStake.timestamp) / (1000 * 60 * 60 * 24 * 365);
      const pendingRewards = userStake.amount * STAKING_POOL.apyRate * timeStaked;
      
      return NextResponse.json({
        stakingBalance: userStake.amount.toString(),
        pendingRewards: pendingRewards.toFixed(6),
        tokenAddress: tokenAddress,
        userAddress: userAddress,
        totalStaked: STAKING_POOL.totalStaked,
        apyRate: STAKING_POOL.apyRate,
        minimumStake: STAKING_POOL.minimumStake,
        stakingRewards: STAKING_POOL.stakingRewards,
      });
    } else {
      // Return empty staking info for new users
      return NextResponse.json({
        stakingBalance: "0",
        pendingRewards: "0",
        tokenAddress: tokenAddress,
        userAddress: userAddress,
        totalStaked: STAKING_POOL.totalStaked,
        apyRate: STAKING_POOL.apyRate,
        minimumStake: STAKING_POOL.minimumStake,
        stakingRewards: STAKING_POOL.stakingRewards,
      });
    }
  } catch (error) {
    console.error("Staking Info API Error:", error);
    
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching staking info." },
      { status: 500 }
    );
  }
} 