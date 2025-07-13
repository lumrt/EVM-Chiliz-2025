"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { getActiveChain } from "@/lib/chiliz";
import tokenFactoryAbi from "@root/contracts/abi/TokenFactory.json";
import influencerNftAbi from "@root/artifacts/contracts/InfluencerNFT.sol/InfluencerNFT.json";
import marketplaceAbi from "@root/artifacts/contracts/Marketplace.sol/Marketplace.json";
import { tokenBlacklist } from "@/lib/token-blacklist";
import FileUpload from "@/components/FileUpload";
import ListNFTModal from "@/components/ListNFTModal";
import { useToast } from "@/components/Toast";
import { formatAddress } from "@/lib/utils";

const factoryAddress =
  formatAddress(process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS);
const marketplaceAddress = 
  formatAddress(process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS);

const activeChain = getActiveChain();

const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(),
});

interface OwnedNFTInfo {
    address: `0x${string}`;
    name: string;
    symbol: string;
    tokenURI: string;
    imageUrl?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    contractAddress?: string;
    transactionHash?: string;
  } | null>(null);
  const [ownedNfts, setOwnedNfts] = useState<OwnedNFTInfo[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(true);
  
  const [imageUrl, setImageUrl] = useState("");

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<OwnedNFTInfo | null>(null);
  const [isListing, setIsListing] = useState(false);


  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const fetchOwnedNfts = async () => {
    const activeWallet = wallets[0];
    if (!activeWallet?.address || !factoryAddress) {
        setIsLoadingNfts(false);
        return;
    }

    setIsLoadingNfts(true);
    try {
        const allDeployedCollections = (await publicClient.readContract({
            address: factoryAddress,
            abi: tokenFactoryAbi.abi,
            functionName: "getDeployedNFTCollections",
        })) as `0x${string}`[];

        const deployedCollections = allDeployedCollections.filter(
            (address) => !tokenBlacklist.includes(address)
        );

        const nftCheckPromises = deployedCollections.map(async (collectionAddress) => {
            try {
                const owner = await publicClient.readContract({
                    address: collectionAddress,
                    abi: influencerNftAbi.abi,
                    functionName: 'ownerOf',
                    args: [0],
                });
                
                if (owner === activeWallet.address) {
                    const [name, symbol, tokenURI] = await Promise.all([
                        publicClient.readContract({
                            address: collectionAddress,
                            abi: influencerNftAbi.abi,
                            functionName: 'name',
                        }),
                        publicClient.readContract({
                            address: collectionAddress,
                            abi: influencerNftAbi.abi,
                            functionName: 'symbol',
                        }),
                        publicClient.readContract({
                            address: collectionAddress,
                            abi: influencerNftAbi.abi,
                            functionName: 'tokenURI',
                            args: [0]
                        }),
                    ]);

                    let nftImageUrl;
                    try {
                        const metadataResponse = await fetch(tokenURI as string);
                        if(metadataResponse.ok) {
                            const metadata = await metadataResponse.json();
                            nftImageUrl = metadata.image;
                        }
                    } catch (e) {
                        console.error("Failed to fetch NFT metadata", e);
                    }

                    return {
                        address: collectionAddress,
                        name,
                        symbol,
                        tokenURI,
                        imageUrl: nftImageUrl
                    } as OwnedNFTInfo;
                }
            } catch (error) {
                console.log(`Could not query NFT ${collectionAddress}. It might be an old token contract.`);
            }
            return null;
        });

        const checkedNfts = await Promise.all(nftCheckPromises);
        const owned = checkedNfts.filter(t => t !== null) as OwnedNFTInfo[];
        setOwnedNfts(owned.reverse());
    } catch (error) {
        console.error("Failed to fetch owned tokens:", error);
    } finally {
        setIsLoadingNfts(false);
    }
  };
  
  useEffect(() => {
    if (ready && authenticated && wallets.length > 0) {
        fetchOwnedNfts();
    }
  }, [ready, authenticated, wallets]);

  const handleLaunch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const wallet = wallets[0];
    if (!wallet) {
      addToast("No wallet connected", "error");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const tokenName = formData.get("tokenName");
    const tokenSymbol = formData.get("tokenSymbol");
    const twitterUrl = formData.get("twitterUrl");
    const instagramUrl = formData.get("instagramUrl");
    const quantity = formData.get("quantity");
    const userAddress = wallet.address;

    if (!userAddress) {
      setResult({ message: "Error: Wallet not connected" });
      setIsLoading(false);
      return;
    }
    
    if (!imageUrl) {
        setResult({ message: "Error: Please upload a profile image." });
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch("/api/launch-nft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tokenName,
          symbol: tokenSymbol,
          owner: userAddress,
          metadata: {
            image: imageUrl,
            socials: {
                twitter: twitterUrl,
                instagram: instagramUrl
            }
          },
          quantity: quantity ? quantity.toString() : "1"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult({
        message: data.message,
        contractAddress: data.contractAddress,
        transactionHash: data.transactionHash,
      });

      addToast("NFT Collection created successfully!", "success");
      fetchOwnedNfts();
      (event.target as HTMLFormElement).reset();
      setImageUrl("");

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setResult({ message: `Error: ${errorMessage}` });
      addToast(`Error: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleListSubmit = async (price: bigint) => {
    if (!selectedNft) return;

    if (!marketplaceAddress) {
      addToast("Marketplace address is not configured. Check environment variables.", "error");
      return;
    }
    
    const wallet = wallets[0];
    if (!wallet) {
      addToast("No wallet connected.", "error");
      return;
    }

    // Check if the wallet is on the correct chain
    if (wallet.chainId !== `eip155:${activeChain.id}`) {
      try {
        addToast("Please switch to the correct network.", "info");
        await wallet.switchChain(activeChain.id);
      } catch (e) {
        console.error("Failed to switch network:", e);
        addToast("Failed to switch network. Please do it manually in your wallet.", "error");
        return;
      }
    }

    setIsListing(true);

    try {
      console.log("Attempting to list NFT with parameters:", {
        nftAddress: selectedNft.address,
        marketplaceAddress: marketplaceAddress,
        tokenId: 0,
        price: price.toString(),
        seller: user?.wallet?.address
      });

      const ethereumProvider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
          account: user!.wallet!.address as `0x${string}`,
          chain: activeChain,
          transport: custom(ethereumProvider)
      });
      
      addToast("Approving marketplace...", "info");

      // 1. Approve the marketplace to manage this specific NFT
      const { request: approveRequest } = await publicClient.simulateContract({
        address: selectedNft.address,
        abi: influencerNftAbi.abi,
        functionName: "approve",
        args: [marketplaceAddress, 0], // tokenId is 0
        account: wallet.address as `0x${string}`,
      });
      const approveHash = await walletClient.writeContract(approveRequest);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      addToast("Approval successful! Listing on marketplace...", "info");

      // 2. List the item on the marketplace
      const { request: listItemRequest } = await publicClient.simulateContract({
        address: marketplaceAddress,
        abi: marketplaceAbi.abi,
        functionName: "listItem",
        args: [selectedNft.address, 0, price],
        account: wallet.address as `0x${string}`,
      });
      const listItemHash = await walletClient.writeContract(listItemRequest);
      await publicClient.waitForTransactionReceipt({ hash: listItemHash });

      addToast("NFT listed successfully!", "success");
      setIsListModalOpen(false);
      
    } catch (error) {
      console.error("Listing failed:", error);
      const errorMessage = error instanceof Error ? (error as any).shortMessage || error.message : "An unknown error occurred.";
      addToast(`Listing failed: ${errorMessage}`, "error");
    } finally {
      setIsListing(false);
    }
  };


  if (!ready || !authenticated) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <>
      <ListNFTModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSubmit={handleListSubmit}
        nftName={selectedNft?.name || ''}
        isListing={isListing}
      />
      <main className="flex flex-col items-center min-h-screen p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Launch your NFT Collection
          </h1>
          <form className="mt-8 space-y-6" onSubmit={handleLaunch}>
            <FileUpload onFileUpload={setImageUrl} />
            <div>
              <label
                htmlFor="tokenName"
                className="block text-sm font-medium text-gray-900"
              >
                Collection Name
              </label>
              <div className="mt-1">
                <input
                  id="tokenName"
                  name="tokenName"
                  type="text"
                  required
                  className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. Chloe's Collection"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="tokenSymbol"
                className="block text-sm font-medium text-gray-900"
              >
                Collection Symbol
              </label>
              <div className="mt-1">
                <input
                  id="tokenSymbol"
                  name="tokenSymbol"
                  type="text"
                  required
                  className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. CHLOE"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-900"
              >
                Quantity
              </label>
              <div className="mt-1">
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  required
                  min="1"
                  className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. 100"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="twitterUrl"
                className="block text-sm font-medium text-gray-900"
              >
                Twitter URL (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="twitterUrl"
                  name="twitterUrl"
                  type="url"
                  className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="instagramUrl"
                className="block text-sm font-medium text-gray-900"
              >
                Instagram URL (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="instagramUrl"
                  name="instagramUrl"
                  type="url"
                  className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? "Launching..." : "Launch Collection"}
              </button>
            </div>
          </form>

          {result && (
            <div
              className={`mt-4 p-4 rounded-md ${
                result.contractAddress ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  result.contractAddress ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.message}
              </p>
              {result.contractAddress && (
                <p className="mt-2 text-xs text-gray-600">
                  Contract Address:{" "}
                  <code className="font-mono">{result.contractAddress}</code>
                </p>
              )}
              {result.transactionHash && (
                <p className="mt-2 text-xs text-gray-600">
                  Transaction:{" "}
                  <a
                    href={`https://spicy-explorer.chiliz.com/tx/${result.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    View on Explorer
                  </a>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="w-full max-w-4xl mt-16">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">My NFT Collections</h2>
            {isLoadingNfts ? (
                <p className="text-center text-gray-500">Loading your collections...</p>
            ) : ownedNfts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ownedNfts.map((nft) => (
                        <div key={nft.address} className="bg-white rounded-lg shadow overflow-hidden">
                          {nft.imageUrl ? (
                             <img src={nft.imageUrl} alt={`Image for ${nft.name}`} className="w-full h-48 object-cover" />
                          ) : (
                              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                  <p className="text-gray-500">No Image</p>
                              </div>
                          )}
                          <div className="p-4">
                              <h3 className="text-lg font-bold text-gray-900">{nft.name}</h3>
                              <p className="text-sm text-gray-500">{nft.symbol}</p>
                              <p className="text-xs text-gray-400 mt-2 truncate">
                                  {nft.address}
                              </p>
                              <button
                                onClick={() => {
                                  setSelectedNft(nft);
                                  setIsListModalOpen(true);
                                }}
                                className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Sell on Marketplace
                              </button>
                          </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">You do not own any NFT collection yet.</p>
            )}
        </div>
      </main>
    </>
  );
} 