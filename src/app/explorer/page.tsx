"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { getActiveChain } from "@/lib/chiliz";
import tokenFactoryAbi from "@root/contracts/abi/TokenFactory.json";
import influencerNftAbi from "@root/artifacts/contracts/InfluencerNFT.sol/InfluencerNFT.json";
import Link from "next/link";
import { tokenBlacklist } from "@/lib/token-blacklist";
import { formatAddress } from "@/lib/utils";

const factoryAddress = formatAddress(process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS);

const activeChain = getActiveChain();
const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(),
});

interface NFTCollectionInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  imageUrl?: string;
}

export default function ExplorerPage() {
  const [collections, setCollections] = useState<NFTCollectionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const deployedCollectionAddresses = (await publicClient.readContract({
          address: factoryAddress!,
          abi: tokenFactoryAbi.abi,
          functionName: "getDeployedNFTCollections",
        })) as `0x${string}`[];

        const collectionDetailsPromises = deployedCollectionAddresses.map(async (collectionAddress) => {
            try {
                const [name, symbol, tokenURI] = await Promise.all([
                    publicClient.readContract({ address: collectionAddress, abi: influencerNftAbi.abi, functionName: 'name' }),
                    publicClient.readContract({ address: collectionAddress, abi: influencerNftAbi.abi, functionName: 'symbol' }),
                    publicClient.readContract({ address: collectionAddress, abi: influencerNftAbi.abi, functionName: 'tokenURI', args: [0] }),
                ]);

                let imageUrl;
                if (typeof tokenURI === 'string') {
                    const metadataResponse = await fetch(tokenURI);
                    if (metadataResponse.ok) {
                        const metadata = await metadataResponse.json();
                        imageUrl = metadata.image;
                    }
                }
                
                return { address: collectionAddress, name, symbol, imageUrl } as NFTCollectionInfo;
            } catch (e) {
                console.warn(`Could not fetch details for collection ${collectionAddress}. It might be an old contract or have a different interface.`);
                return null;
            }
        });

        const collectionsInfo = (await Promise.all(collectionDetailsPromises)).filter(c => c !== null) as NFTCollectionInfo[];
        
        const filteredCollections = collectionsInfo.filter(
            (collection) => !tokenBlacklist.includes(collection.address)
        );

        setCollections(filteredCollections.reverse());
      } catch (e) {
        console.error(e);
        setError("Failed to fetch collections. Make sure your environment variables are set correctly.");
      } finally {
        setIsLoading(false);
      }
    };

    if (factoryAddress) {
        fetchCollections();
    } else {
        setError("Token factory address is not configured.");
        setIsLoading(false);
    }
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
        NFT Collections Explorer
      </h1>

      {isLoading && <p className="text-center text-gray-500">Loading collections...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {collections.map((collection) => (
                <div key={collection.address} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105">
                    {collection.imageUrl ? (
                        <img src={collection.imageUrl} alt={`Image for ${collection.name}`} className="w-full h-56 object-cover" />
                    ) : (
                        <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
                            <p className="text-gray-500">No Image</p>
                        </div>
                    )}
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 truncate" title={collection.name}>{collection.name}</h3>
                        <p className="text-sm text-gray-600">{collection.symbol}</p>
                        <div className="mt-4">
                            <Link href={`${activeChain.blockExplorers?.default.url}/address/${collection.address}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 text-xs break-all">
                                View on Explorer
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
      {!isLoading && !error && collections.length === 0 && (
        <p className="text-center text-gray-500">No NFT collections found.</p>
      )}
    </main>
  );
} 