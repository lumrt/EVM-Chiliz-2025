import { NextResponse } from "next/server";

// Hardcoded staking pool with realistic data
const STAKING_POOL = {
  totalStaked: "125000", // 125K CHZ currently staked
  apyRate: 0.08, // 8% APY - realistic for DeFi
  minimumStake: 10, // Minimum 10 CHZ
  stakingRewards: "15000", // 15K CHZ available as rewards
};

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

      // Simulate transaction hash
      const stakeHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      return NextResponse.json({
        message: "Staking successful!",
        transactionHash: stakeHash,
        stakingType: "Staking",
        amount: amountFloat,
        tokenAddress: tokenAddress,
        totalStaked: newStakeAmount,
        apy: STAKING_POOL.apyRate,
        estimatedYearlyRewards: (newStakeAmount * STAKING_POOL.apyRate).toFixed(6),
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