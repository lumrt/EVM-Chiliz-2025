import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chilizSpicyTestnet } from "@/lib/chiliz";
import tokenFactoryAbi from "@/contracts/abi/TokenFactory.json";

export async function POST(request: Request) {
  try {
    const { tokenName, tokenSymbol, totalSupply, userAddress } =
      await request.json();
    const factoryAddress =
      process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS! as `0x${string}`;
    const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY! as `0x${string}`;

    if (!tokenName || !tokenSymbol || !totalSupply || !userAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const operatorAccount = privateKeyToAccount(operatorPrivateKey);

    const walletClient = createWalletClient({
      account: operatorAccount,
      chain: chilizSpicyTestnet,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: chilizSpicyTestnet,
      transport: http(),
    });

    const { request: contractRequest } = await publicClient.simulateContract({
      address: factoryAddress,
      abi: tokenFactoryAbi.abi,
      functionName: "createToken",
      args: [tokenName, tokenSymbol, BigInt(totalSupply), userAddress],
      account: operatorAccount,
    });

    const hash = await walletClient.writeContract(contractRequest);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const logs = receipt.logs;
    // The address of the new token is in the first topic of the TokenCreated event log
    const newTokenAddress = logs[0].topics[1];

    return NextResponse.json({
      message: "Token launched successfully!",
      contractAddress: newTokenAddress,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
} 