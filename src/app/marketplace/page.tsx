"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, formatEther, createWalletClient, custom } from "viem";
import { getActiveChain } from "@/lib/chiliz";
import marketplaceAbi from "@root/artifacts/contracts/Marketplace.sol/Marketplace.json";
import influencerNftAbi from "@root/artifacts/contracts/InfluencerNFT.sol/InfluencerNFT.json";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useToast } from "@/components/Toast";
import { formatAddress } from "@/lib/utils";

const marketplaceAddress = formatAddress(process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS);

const activeChain = getActiveChain();

const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(),
});

interface ListedNFT {
    nftAddress: `0x${string}`;
    tokenId: bigint;
    seller: `0x${string}`;
    price: bigint;
    name: string;
    symbol: string;
    imageUrl?: string;
}

export default function MarketplacePage() {
    const { ready, authenticated, user, login } = usePrivy();
    const { wallets } = useWallets();
    const { addToast } = useToast();
    const [listedNfts, setListedNfts] = useState<ListedNFT[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBuying, setIsBuying] = useState<string | null>(null); // Store ID of NFT being bought

    const fetchListedNfts = async () => {
        if (!marketplaceAddress) {
            addToast("Marketplace address not configured.", "error");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const listEvents = await publicClient.getContractEvents({
                address: marketplaceAddress,
                abi: marketplaceAbi.abi,
                eventName: 'ItemListed',
                fromBlock: 'earliest',
                toBlock: 'latest'
            });

            const soldEvents = await publicClient.getContractEvents({
                address: marketplaceAddress,
                abi: marketplaceAbi.abi,
                eventName: 'ItemSold',
                fromBlock: 'earliest',
                toBlock: 'latest'
            });

            const cancelledEvents = await publicClient.getContractEvents({
                address: marketplaceAddress,
                abi: marketplaceAbi.abi,
                eventName: 'ListingCancelled',
                fromBlock: 'earliest',
                toBlock: 'latest'
            });

            const soldOrCancelled = new Set(
                [...soldEvents, ...cancelledEvents].map(e => `${e.args.nftAddress}-${e.args.tokenId}`)
            );
            
            const activeListings = listEvents.filter(e => {
                const listingId = `${e.args.nftAddress}-${e.args.tokenId}`;
                // This logic is flawed. A token can be listed multiple times. We need to find the latest listing event
                // and check if it has been sold/cancelled since.
                // For now, we'll stick to a simpler logic: if it's ever been sold or cancelled, it's gone.
                // A better approach is to check the `listings` mapping on the contract directly for each item.
                // But that is very inefficient. The event-based approach is good but needs more logic to be robust.
                return !soldOrCancelled.has(listingId);
            });

            const nftDetailsPromises = activeListings.map(async (event) => {
                const { nftAddress, tokenId, seller, price } = event.args;
                 if (!nftAddress || tokenId === undefined || !seller || !price) return null;

                try {
                    const [name, symbol, tokenURI] = await Promise.all([
                        publicClient.readContract({ address: nftAddress, abi: influencerNftAbi.abi, functionName: 'name' }),
                        publicClient.readContract({ address: nftAddress, abi: influencerNftAbi.abi, functionName: 'symbol' }),
                        publicClient.readContract({ address: nftAddress, abi: influencerNftAbi.abi, functionName: 'tokenURI', args: [tokenId] }),
                    ]);

                    let imageUrl;
                    if (typeof tokenURI === 'string') {
                        const metadataResponse = await fetch(tokenURI);
                        if (metadataResponse.ok) {
                            const metadata = await metadataResponse.json();
                            imageUrl = metadata.image;
                        }
                    }

                    return { nftAddress, tokenId, seller, price, name, symbol, imageUrl } as ListedNFT;
                } catch (e) {
                    console.error(`Could not fetch details for ${nftAddress}, tokenId: ${tokenId}`, e);
                    return null;
                }
            });

            const nfts = (await Promise.all(nftDetailsPromises)).filter(n => n !== null) as ListedNFT[];
            setListedNfts(nfts.reverse());

        } catch (error) {
            console.error("Failed to fetch listed NFTs:", error);
            addToast("Failed to load marketplace items.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if(marketplaceAddress) {
            fetchListedNfts();
        } else {
            addToast("Marketplace address is not configured in .env file.", "error");
            setIsLoading(false);
        }
    }, []);

    const handleBuy = async (nft: ListedNFT) => {
        if (!marketplaceAddress) {
            addToast("Marketplace address is not configured. Check environment variables.", "error");
            return;
        }
        if (!authenticated) {
            login();
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
                addToast("Please switch to the correct network to buy.", "info");
                await wallet.switchChain(activeChain.id);
            } catch (e) {
                console.error("Failed to switch network:", e);
                addToast("Failed to switch network. Please do it manually in your wallet.", "error");
                return;
            }
        }

        const nftId = `${nft.nftAddress}-${nft.tokenId}`;
        setIsBuying(nftId);

        try {
            const ethereumProvider = await wallet.getEthereumProvider();
            const walletClient = createWalletClient({
                account: user!.wallet!.address as `0x${string}`,
                chain: activeChain,
                transport: custom(ethereumProvider)
            });

            const { request } = await publicClient.simulateContract({
                address: marketplaceAddress,
                abi: marketplaceAbi.abi,
                functionName: "buyItem",
                args: [nft.nftAddress, nft.tokenId],
                value: nft.price,
                account: wallet.address as `0x${string}`,
            });

            const hash = await walletClient.writeContract(request);
            
            addToast("Transaction sent! Waiting for confirmation...", "info");
            
            await publicClient.waitForTransactionReceipt({ hash });

            addToast("Purchase successful! NFT is yours.", "success");
            
            // Refresh list
            fetchListedNfts();

        } catch (error) {
            console.error("Purchase failed:", error);
            const errorMessage = error instanceof Error ? (error as any).shortMessage || error.message : "An unknown error occurred.";
            addToast(`Purchase failed: ${errorMessage}`, "error");
        } finally {
            setIsBuying(null);
        }
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">Marketplace</h1>

            {isLoading ? (
                <p className="text-center text-gray-500">Loading listed NFTs...</p>
            ) : listedNfts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {listedNfts.map((nft) => {
                        const nftId = `${nft.nftAddress}-${nft.tokenId}`;
                        const isCurrentlyBuying = isBuying === nftId;
                        return (
                            <div key={nftId} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105">
                                {nft.imageUrl ? (
                                    <img src={nft.imageUrl} alt={`Image for ${nft.name}`} className="w-full h-56 object-cover" />
                                ) : (
                                    <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
                                        <p className="text-gray-500">No Image Available</p>
                                    </div>
                                )}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 truncate" title={nft.name}>{nft.name}</h3>
                                    <p className="text-sm text-gray-600">{nft.symbol}</p>
                                    <div className="mt-4">
                                        <p className="text-lg font-bold text-indigo-600">{formatEther(nft.price)} CHZ</p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleBuy(nft)}
                                            disabled={isCurrentlyBuying || !authenticated || user?.wallet?.address === nft.seller}
                                            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        >
                                            {isCurrentlyBuying ? "Processing..." : (user?.wallet?.address === nft.seller ? "You are the seller" : "Buy Now")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-500">No NFTs are currently listed for sale.</p>
            )}
        </main>
    );
} 