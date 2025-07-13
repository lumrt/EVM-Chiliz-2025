// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;
    
    // Fee percentage (e.g., 250 = 2.5%)
    uint256 public platformFeePercent;
    address payable public feeRecipient;

    event ItemListed(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event ItemSold(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address seller,
        address indexed buyer,
        uint256 price
    );
    event ListingCancelled(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address seller
    );
     event PlatformFeeUpdated(uint256 newFeePercent);
    event FeeRecipientUpdated(address newRecipient);


    constructor(uint256 _platformFeePercent, address payable _feeRecipient) {
        platformFeePercent = _platformFeePercent;
        feeRecipient = _feeRecipient;
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Marketplace: price must be greater than 0");
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Marketplace: you must own the NFT");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Marketplace: contract not approved to manage this NFT");

        listings[nftAddress][tokenId] = Listing(msg.sender, price);
        emit ItemListed(nftAddress, tokenId, msg.sender, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.price > 0, "Marketplace: item not listed for sale");
        
        uint256 totalAmount = listing.price;
        require(msg.value >= totalAmount, "Marketplace: not enough funds sent");

        // Calculate platform fee
        uint256 fee = (totalAmount * platformFeePercent) / 10000;
        uint256 sellerProceeds = totalAmount - fee;
        
        // Clear listing before transfers to prevent re-entrancy
        delete listings[nftAddress][tokenId];

        // Transfer funds
        if (fee > 0) {
            (bool successFee, ) = feeRecipient.call{value: fee}("");
            require(successFee, "Marketplace: fee transfer failed");
        }
        
        (bool successSeller, ) = listing.seller.call{value: sellerProceeds}("");
        require(successSeller, "Marketplace: seller payment failed");
        
        // Transfer NFT to buyer
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Refund any excess payment
        if (msg.value > totalAmount) {
            (bool successRefund, ) = msg.sender.call{value: msg.value - totalAmount}("");
            require(successRefund, "Marketplace: refund failed");
        }

        emit ItemSold(nftAddress, tokenId, listing.seller, msg.sender, listing.price);
    }

    function cancelListing(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.seller == msg.sender, "Marketplace: you are not the seller");
        
        delete listings[nftAddress][tokenId];
        
        emit ListingCancelled(nftAddress, tokenId, msg.sender);
    }

    function updateListingPrice(address nftAddress, uint256 tokenId, uint256 newPrice) external nonReentrant {
        Listing storage listing = listings[nftAddress][tokenId];
        require(listing.seller == msg.sender, "Marketplace: you are not the seller");
        require(newPrice > 0, "Marketplace: price must be positive");

        listing.price = newPrice;
        // Optionally emit an event here
    }

    function setPlatformFee(uint256 _newFeePercent) external {
        // Here you might want to add an ownership check
        require(msg.sender == feeRecipient, "Only fee recipient can change fee");
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(_newFeePercent);
    }

    function setFeeRecipient(address payable _newRecipient) external {
        require(msg.sender == feeRecipient, "Only fee recipient can change recipient");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }
} 