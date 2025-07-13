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
  }
] as const;

export async function POST(request: Request) {
  try {
    const { tokenAddress, recipientAddress, amount } = await request.json();
    
    if (!tokenAddress || !recipientAddress || !amount) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

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

    // Send tokens to recipient
    const txHash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipientAddress as `0x${string}`, parseEther(amount)],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      message: "Tokens sent successfully!",
      transactionHash: txHash,
      amount: amount,
      tokenAddress: tokenAddress,
      recipientAddress: recipientAddress,
      explorerUrl: `https://spicy-explorer.chiliz.com/tx/${txHash}`,
    });

  } catch (error) {
    console.error("Fund wallet error:", error);
    return NextResponse.json(
      { error: "Failed to fund wallet" },
      { status: 500 }
    );
  }
} 