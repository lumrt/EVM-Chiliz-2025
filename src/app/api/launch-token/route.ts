import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chilizSpicyTestnet } from "@/lib/chiliz";
import { CONTRACTS } from "@/lib/contracts";
import tokenFactoryAbi from "@root/contracts/abi/TokenFactory.json";

export async function POST(request: Request) {
  try {
    const { tokenName, tokenSymbol, totalSupply, chzLiquidity, tokenImage, userAddress } =
      await request.json();
    
    const factoryAddress = CONTRACTS.TOKEN_FACTORY as `0x${string}`;
    let operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY!;

    if (!operatorPrivateKey.startsWith('0x')) {
      operatorPrivateKey = `0x${operatorPrivateKey}`;
    }

    if (!tokenName || !tokenSymbol || !totalSupply || !chzLiquidity || !userAddress) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
    }

    // Validate CHZ liquidity amount
    const chzAmount = parseFloat(chzLiquidity);
    if (isNaN(chzAmount) || chzAmount <= 0) {
      return NextResponse.json(
        { error: "Le montant de liquidité CHZ doit être supérieur à 0" },
        { status: 400 }
      );
    }

    // Validate total supply
    const supply = parseFloat(totalSupply);
    if (isNaN(supply) || supply <= 0) {
      return NextResponse.json(
        { error: "Le supply total doit être supérieur à 0" },
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

    // Utiliser le nouveau contrat TokenFactory optimisé
    const { request: contractRequest } = await publicClient.simulateContract({
      address: factoryAddress,
      abi: tokenFactoryAbi.abi,
      functionName: "createToken",
      args: [
        tokenName,
        tokenSymbol,
        tokenImage || "", // imageUrl
        parseEther(totalSupply.toString()),
        userAddress,
      ],
      account: operatorAccount,
      value: parseEther(chzLiquidity.toString()),
    });

    const hash = await walletClient.writeContract(contractRequest);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Parser les événements pour obtenir les infos du token créé
    const logs = parseEventLogs({
      abi: tokenFactoryAbi.abi,
      eventName: "TokenCreated",
      logs: receipt.logs,
    });

    let tokenId = null;
    let tokenAddress = null;
    
    if (logs && logs.length > 0) {
      const tokenCreatedEvent = logs[0];
      tokenId = tokenCreatedEvent.args.tokenId;
      tokenAddress = tokenCreatedEvent.args.tokenAddress;
    }

    // Obtenir les informations du token créé
    const tokenInfo = await publicClient.readContract({
      address: factoryAddress,
      abi: tokenFactoryAbi.abi,
      functionName: "getTokenInfo",
      args: [tokenId],
    });

    return NextResponse.json({
      message: "Token créé avec succès !",
      tokenId: tokenId?.toString(),
      tokenAddress: tokenAddress,
      transactionHash: hash,
      tokenInfo: {
        name: tokenName,
        symbol: tokenSymbol,
        supply: totalSupply,
        chzLiquidity: chzLiquidity,
        image: tokenImage,
        owner: userAddress,
        createdAt: tokenInfo.createdAt.toString(),
        initialLiquidity: tokenInfo.initialLiquidity.toString(),
      },
    });
  } catch (error) {
    console.error("Erreur API:", error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes("insufficient funds")) {
        return NextResponse.json(
          { error: "Fonds insuffisants pour créer le token" },
          { status: 400 }
        );
      }
      if (error.message.includes("execution reverted")) {
        return NextResponse.json(
          { error: "Erreur lors de l'exécution du contrat. Vérifiez les paramètres." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite lors de la création du token." },
      { status: 500 }
    );
  }
} 