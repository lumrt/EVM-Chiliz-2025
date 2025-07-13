import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chilizSpicyTestnet } from "@/lib/chiliz";
import { CONTRACTS } from "@/lib/contracts";
import swapRouterAbi from "@root/contracts/abi/SwapRouter.json";

// GET - Obtenir les informations d'un pool
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('tokenAddress');
    
    if (!tokenAddress) {
      return NextResponse.json(
        { error: "tokenAddress est obligatoire" },
        { status: 400 }
      );
    }

    const routerAddress = CONTRACTS.SWAP_ROUTER as `0x${string}`;

    const publicClient = createPublicClient({
      chain: chilizSpicyTestnet,
      transport: http(),
    });

    // Obtenir les informations du pool
    const poolInfo = await publicClient.readContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "getPoolInfo",
      args: [tokenAddress],
    });

    // Vérifier si le pool est supporté
    const isSupported = await publicClient.readContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "supportedTokens",
      args: [tokenAddress],
    });

    // Obtenir le taux de frais
    const feeRate = await publicClient.readContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "feeRate",
    });

    return NextResponse.json({
      tokenAddress,
      tokenReserves: poolInfo.tokenReserves.toString(),
      chzReserves: poolInfo.chzReserves.toString(),
      isSupported: Boolean(isSupported),
      feeRate: feeRate.toString(),
      exists: poolInfo.tokenReserves > 0n,
    });
  } catch (error) {
    console.error("Erreur API Pool Info:", error);
    
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite lors de la récupération des informations du pool." },
      { status: 500 }
    );
  }
}

// POST - Créer un pool de liquidité
export async function POST(request: Request) {
  try {
    const { tokenAddress, tokenAmount, chzAmount, userAddress } = await request.json();
    
    const routerAddress = CONTRACTS.SWAP_ROUTER as `0x${string}`;
    let operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY!;

    if (!operatorPrivateKey.startsWith('0x')) {
      operatorPrivateKey = `0x${operatorPrivateKey}`;
    }

    if (!tokenAddress || !tokenAmount || !chzAmount || !userAddress) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
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

    // Vérifier si le pool existe déjà
    const existingPoolInfo = await publicClient.readContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "getPoolInfo",
      args: [tokenAddress],
    });

    if (existingPoolInfo.tokenReserves > 0n) {
      return NextResponse.json(
        { error: "Un pool existe déjà pour ce token" },
        { status: 400 }
      );
    }

    // Créer le pool de liquidité
    const { request: contractRequest } = await publicClient.simulateContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "createPool",
      args: [tokenAddress, parseEther(tokenAmount.toString())],
      account: operatorAccount,
      value: parseEther(chzAmount.toString()),
    });

    const hash = await walletClient.writeContract(contractRequest);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Obtenir les nouvelles informations du pool
    const newPoolInfo = await publicClient.readContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "getPoolInfo",
      args: [tokenAddress],
    });

    return NextResponse.json({
      message: "Pool de liquidité créé avec succès !",
      transactionHash: hash,
      tokenAddress: tokenAddress,
      tokenAmount: tokenAmount,
      chzAmount: chzAmount,
      routerAddress: routerAddress,
      poolInfo: {
        tokenReserves: newPoolInfo.tokenReserves.toString(),
        chzReserves: newPoolInfo.chzReserves.toString(),
      },
    });
  } catch (error) {
    console.error("Erreur API Create Pool:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Pool exists")) {
        return NextResponse.json(
          { error: "Un pool existe déjà pour ce token" },
          { status: 400 }
        );
      }
      if (error.message.includes("insufficient funds")) {
        return NextResponse.json(
          { error: "Fonds insuffisants pour créer le pool" },
          { status: 400 }
        );
      }
      if (error.message.includes("Transfer failed")) {
        return NextResponse.json(
          { error: "Échec du transfert de tokens. Vérifiez les approbations." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite lors de la création du pool." },
      { status: 500 }
    );
  }
}

// PUT - Ajouter de la liquidité à un pool existant
export async function PUT(request: Request) {
  try {
    const { tokenAddress, tokenAmount, chzAmount, userAddress } = await request.json();
    
    const routerAddress = CONTRACTS.SWAP_ROUTER as `0x${string}`;
    let operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY!;

    if (!operatorPrivateKey.startsWith('0x')) {
      operatorPrivateKey = `0x${operatorPrivateKey}`;
    }

    if (!tokenAddress || !tokenAmount || !chzAmount || !userAddress) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
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

    // Vérifier si le pool existe
    const poolInfo = await publicClient.readContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "getPoolInfo",
      args: [tokenAddress],
    });

    if (poolInfo.tokenReserves === 0n) {
      return NextResponse.json(
        { error: "Pool inexistant. Créez d'abord un pool." },
        { status: 400 }
      );
    }

    // Ajouter de la liquidité
    const { request: contractRequest } = await publicClient.simulateContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "addLiquidity",
      args: [tokenAddress, parseEther(tokenAmount.toString())],
      account: operatorAccount,
      value: parseEther(chzAmount.toString()),
    });

    const hash = await walletClient.writeContract(contractRequest);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Obtenir les nouvelles informations du pool
    const newPoolInfo = await publicClient.readContract({
      address: routerAddress,
      abi: swapRouterAbi.abi,
      functionName: "getPoolInfo",
      args: [tokenAddress],
    });

    return NextResponse.json({
      message: "Liquidité ajoutée avec succès !",
      transactionHash: hash,
      tokenAddress: tokenAddress,
      tokenAmount: tokenAmount,
      chzAmount: chzAmount,
      routerAddress: routerAddress,
      poolInfo: {
        tokenReserves: newPoolInfo.tokenReserves.toString(),
        chzReserves: newPoolInfo.chzReserves.toString(),
      },
    });
  } catch (error) {
    console.error("Erreur API Add Liquidity:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Pool not found")) {
        return NextResponse.json(
          { error: "Pool inexistant" },
          { status: 400 }
        );
      }
      if (error.message.includes("insufficient funds")) {
        return NextResponse.json(
          { error: "Fonds insuffisants pour ajouter de la liquidité" },
          { status: 400 }
        );
      }
      if (error.message.includes("Insufficient token amount")) {
        return NextResponse.json(
          { error: "Montant de tokens insuffisant pour maintenir le ratio" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite lors de l'ajout de liquidité." },
      { status: 500 }
    );
  }
} 