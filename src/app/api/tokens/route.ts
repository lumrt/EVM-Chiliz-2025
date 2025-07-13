import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { chilizSpicyTestnet } from "@/lib/chiliz";
import { CONTRACTS } from "@/lib/contracts";
import tokenFactoryAbi from "@root/contracts/abi/TokenFactory.json";

export async function GET(request: Request) {
  try {
    const factoryAddress = CONTRACTS.TOKEN_FACTORY as `0x${string}`;

    const publicClient = createPublicClient({
      chain: chilizSpicyTestnet,
      transport: http(),
    });

    // Obtenir le nombre total de tokens
    const totalTokens = await publicClient.readContract({
      address: factoryAddress,
      abi: tokenFactoryAbi.abi,
      functionName: "getTotalTokens",
    });

    // Récupérer les informations de chaque token
    const tokensInfo = await Promise.all(
      Array.from({ length: Number(totalTokens) }, (_, i) => i).map(async (tokenId) => {
        try {
          const tokenInfo = await publicClient.readContract({
            address: factoryAddress,
            abi: tokenFactoryAbi.abi,
            functionName: "getTokenInfo",
            args: [tokenId],
          });

          const tokenAddress = tokenInfo.tokenAddress;

          // Obtenir les informations du token ERC20
          const tokenContract = {
            address: tokenAddress,
            abi: [
              {
                "inputs": [],
                "name": "name",
                "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "symbol", 
                "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "totalSupply",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
              }
            ]
          };

          const [name, symbol, actualTotalSupply] = await Promise.all([
            publicClient.readContract({
              ...tokenContract,
              functionName: "name",
            }),
            publicClient.readContract({
              ...tokenContract,
              functionName: "symbol",
            }),
            publicClient.readContract({
              ...tokenContract,
              functionName: "totalSupply",
            }),
          ]);

          return {
            tokenId: tokenId.toString(),
            address: tokenAddress,
            name: name as string,
            symbol: symbol as string,
            totalSupply: actualTotalSupply.toString(),
            owner: tokenInfo.owner,
            createdAt: tokenInfo.createdAt.toString(),
            initialLiquidity: tokenInfo.initialLiquidity.toString(),
            // Pour la compatibilité avec l'ancien format
            chzLiquidity: tokenInfo.initialLiquidity.toString(),
            currentLiquidity: tokenInfo.initialLiquidity.toString(),
            imageUrl: "", // L'image sera récupérée via les events si nécessaire
          };
        } catch (error) {
          console.error(`Erreur lors de la récupération des infos pour le token ${tokenId}:`, error);
          return null;
        }
      })
    );

    // Filtrer les tokens null (erreurs)
    const validTokens = tokensInfo.filter(token => token !== null);

    return NextResponse.json({
      tokens: validTokens,
      totalTokens: validTokens.length,
    });
  } catch (error) {
    console.error("Erreur API Tokens:", error);
    
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite lors de la récupération des tokens." },
      { status: 500 }
    );
  }
}

// GET endpoint pour un token spécifique
export async function POST(request: Request) {
  try {
    const { tokenId } = await request.json();
    
    if (tokenId === undefined || tokenId === null) {
      return NextResponse.json(
        { error: "tokenId est obligatoire" },
        { status: 400 }
      );
    }

    const factoryAddress = CONTRACTS.TOKEN_FACTORY as `0x${string}`;

    const publicClient = createPublicClient({
      chain: chilizSpicyTestnet,
      transport: http(),
    });

    const tokenInfo = await publicClient.readContract({
      address: factoryAddress,
      abi: tokenFactoryAbi.abi,
      functionName: "getTokenInfo",
      args: [tokenId],
    });

    const tokenAddress = tokenInfo.tokenAddress;

    // Obtenir les informations du token ERC20
    const tokenContract = {
      address: tokenAddress,
      abi: [
        {
          "inputs": [],
          "name": "name",
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "symbol", 
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "totalSupply",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ]
    };

    const [name, symbol, actualTotalSupply] = await Promise.all([
      publicClient.readContract({
        ...tokenContract,
        functionName: "name",
      }),
      publicClient.readContract({
        ...tokenContract,
        functionName: "symbol",
      }),
      publicClient.readContract({
        ...tokenContract,
        functionName: "totalSupply",
      }),
    ]);

    return NextResponse.json({
      tokenId: tokenId.toString(),
      address: tokenAddress,
      name: name as string,
      symbol: symbol as string,
      totalSupply: actualTotalSupply.toString(),
      owner: tokenInfo.owner,
      createdAt: tokenInfo.createdAt.toString(),
      initialLiquidity: tokenInfo.initialLiquidity.toString(),
      // Pour la compatibilité avec l'ancien format
      chzLiquidity: tokenInfo.initialLiquidity.toString(),
      currentLiquidity: tokenInfo.initialLiquidity.toString(),
      imageUrl: "", // L'image sera récupérée via les events si nécessaire
    });
  } catch (error) {
    console.error("Erreur API Token Info:", error);
    
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite lors de la récupération des informations du token." },
      { status: 500 }
    );
  }
} 