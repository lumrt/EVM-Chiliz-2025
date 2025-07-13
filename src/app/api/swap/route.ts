import { NextResponse } from "next/server";

// Hardcoded pool - realistic liquidity pool
const HARDCODED_POOL = {
  chzReserves: "75000", // 75K CHZ liquidity pool
  tokenReserves: "150000", // 150K tokens available
  exchangeRate: 0.5, // 1 CHZ = 2 tokens (0.5 CHZ per token)
  feeRate: 0.005 // 0.5% fee - standard AMM fee
};

export async function POST(request: Request) {
  try {
    const { tokenAddress, amount, isChzToToken, userAddress } = await request.json();
    
    if (!tokenAddress || !amount || typeof isChzToToken !== 'boolean' || !userAddress) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Simulate realistic delay (5-9 seconds)
    const delay = Math.floor(Math.random() * 4000) + 5000; // 5000-9000ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simple hardcoded pool logic with realistic calculations
    let outputAmount: number;
    let swapType: string;

    if (isChzToToken) {
      // CHZ to Token swap: 1 CHZ = 2 tokens
      if (amountFloat > parseFloat(HARDCODED_POOL.chzReserves)) {
        return NextResponse.json(
          { error: "Insufficient CHZ liquidity in pool" },
          { status: 400 }
        );
      }
      
      // Calculate tokens received (1 CHZ = 2 tokens, minus fees)
      outputAmount = (amountFloat / HARDCODED_POOL.exchangeRate) * (1 - HARDCODED_POOL.feeRate);
      swapType = "CHZ to Token";
    } else {
      // Token to CHZ swap: 2 tokens = 1 CHZ
      if (amountFloat > parseFloat(HARDCODED_POOL.tokenReserves)) {
        return NextResponse.json(
          { error: "Insufficient Token liquidity in pool" },
          { status: 400 }
        );
      }
      
      // Calculate CHZ received (2 tokens = 1 CHZ, minus fees)
      outputAmount = (amountFloat * HARDCODED_POOL.exchangeRate) * (1 - HARDCODED_POOL.feeRate);
      swapType = "Token to CHZ";
    }

    // Simulate transaction hash
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    return NextResponse.json({
      message: "Swap completed successfully!",
      transactionHash: mockTxHash,
      swapType: swapType,
      inputAmount: amountFloat,
      outputAmount: outputAmount.toFixed(6),
      tokenAddress: tokenAddress,
      fee: (amountFloat * HARDCODED_POOL.feeRate).toFixed(6),
      exchangeRate: HARDCODED_POOL.exchangeRate,
    });
  } catch (error) {
    console.error("Swap API Error:", error);
    
    return NextResponse.json(
      { error: "An unexpected error occurred during swap." },
      { status: 500 }
    );
  }
}

// GET - Get pool information
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('tokenAddress');
    
    return NextResponse.json({
      tokenAddress: tokenAddress || "any",
      chzReserves: HARDCODED_POOL.chzReserves,
      tokenReserves: HARDCODED_POOL.tokenReserves,
      exchangeRate: HARDCODED_POOL.exchangeRate,
      feeRate: HARDCODED_POOL.feeRate,
      available: true,
    });
  } catch (error) {
    console.error("Pool Info API Error:", error);
    
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching pool info." },
      { status: 500 }
    );
  }
} 