// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./InfluencerNFT.sol";

contract TokenFactory {
    address[] public deployedNFTCollections;

    event NFTCollectionCreated(
        address indexed nftAddress,
        address indexed owner,
        string name,
        string symbol
    );

    function createNFT(
        string memory name,
        string memory symbol,
        address owner,
        string memory tokenURI,
        uint256 quantity
    ) public returns (address) {
        InfluencerNFT newNFT = new InfluencerNFT(
            name,
            symbol,
            owner,
            tokenURI,
            quantity
        );
        deployedNFTCollections.push(address(newNFT));
        emit NFTCollectionCreated(address(newNFT), owner, name, symbol);
        return address(newNFT);
    }

    function getDeployedNFTCollections() public view returns (address[] memory) {
        return deployedNFTCollections;
    }
} 