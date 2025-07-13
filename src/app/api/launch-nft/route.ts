import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getActiveChain } from "@/lib/chiliz";
import tokenFactoryAbi from "@root/contracts/abi/TokenFactory.json";
import fs from "fs/promises";
import path from "path";
import { formatAddress } from "@/lib/utils";

const localnodePrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export async function POST(request: Request) {
  try {
    const { name, symbol, owner, metadata, quantity } = await request.json();
    const factoryAddress =
      formatAddress(process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS);
    
    const isLocalhost = process.env.NEXT_PUBLIC_NETWORK === 'localhost';
    
    let operatorKey = isLocalhost ? localnodePrivateKey : process.env.OPERATOR_PRIVATE_KEY;

    if (!operatorKey) {
      return NextResponse.json(
        { error: "Operator private key is not configured." },
        { status: 500 }
      );
    }
    
    const operatorPrivateKey = formatAddress(operatorKey);

    if (!factoryAddress || !operatorPrivateKey) {
      return NextResponse.json(
          { error: "Server configuration error: missing addresses." },
          { status: 500 }
      );
    }

    if (!name || !symbol || !owner || !metadata || !metadata.image || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Create and save metadata file
    const metadataToStore = {
      name,
      description: `NFT collection for ${name}`,
      image: metadata.image,
      socials: metadata.socials || {},
    };

    const metadataDir = path.join(process.cwd(), "public", "uploads", "metadata");
    await fs.mkdir(metadataDir, { recursive: true });
    
    // Use a unique filename, e.g., based on symbol and timestamp
    const fileName = `${symbol}-${Date.now()}.json`;
    const filePath = path.join(metadataDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(metadataToStore, null, 2));

    // 2. Get the public URL for the metadata file
    const tokenURI = `${process.env.NEXT_PUBLIC_APP_URL}/uploads/metadata/${fileName}`;

    // 3. On-chain transaction
    const operatorAccount = privateKeyToAccount(operatorPrivateKey as `0x${string}`);

    const activeChain = getActiveChain();

    const walletClient = createWalletClient({
      account: operatorAccount,
      chain: activeChain,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: activeChain,
      transport: http(),
    });

    const { request: contractRequest } = await publicClient.simulateContract({
      address: factoryAddress,
      abi: tokenFactoryAbi.abi,
      functionName: "createNFT",
      args: [name, symbol, owner, tokenURI, BigInt(quantity)],
      account: operatorAccount,
    });

    const hash = await walletClient.writeContract(contractRequest);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (!receipt.logs || receipt.logs.length === 0) {
        throw new Error("Could not find NFTCollectionCreated event logs.");
    }
    
    // The address of the new NFT collection is in the first topic of the NFTCollectionCreated event log
    // topics[0] is the signature of the event
    // topics[1] is the first indexed argument (nftAddress)
    // topics[2] is the second indexed argument (owner)
    // The new address is encoded in the topics, need to handle potential 0-padding
    const newCollectionAddress = receipt.logs[0].topics[1] ? ('0x' + receipt.logs[0].topics[1].slice(26)) as `0x${string}` : undefined;

    if (!newCollectionAddress) {
        throw new Error("Could not parse new collection address from logs.");
    }

    return NextResponse.json({
      message: "NFT Collection launched successfully!",
      contractAddress: newCollectionAddress,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 