// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InfluencerNFT is ERC721, ERC721URIStorage, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        string memory tokenURI,
        uint256 quantity
    ) ERC721(name, symbol) Ownable(initialOwner) {
        require(quantity > 0, "Quantity must be greater than zero");
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(initialOwner, i);
            _setTokenURI(i, tokenURI);
        }
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 