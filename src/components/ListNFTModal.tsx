"use client";

import { useState } from "react";
import { parseEther } from "viem";

interface ListNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (price: bigint) => void;
  nftName: string;
  isListing: boolean;
}

export default function ListNFTModal({ isOpen, onClose, onSubmit, nftName, isListing }: ListNFTModalProps) {
  const [price, setPrice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) {
      // You can add a toast here for better UX
      alert("Please enter a valid price.");
      return;
    }
    onSubmit(parseEther(price));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isListing}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-gray-900">List {`"`}{nftName}{`"`} for Sale</h2>
        <p className="mt-2 text-sm text-gray-600">
          Set a price in CHZ for your NFT collection. The platform will take a small fee upon sale.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (CHZ)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                name="price"
                id="price"
                className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">CHZ</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isListing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isListing || !price}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isListing ? "Listing..." : "List Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 