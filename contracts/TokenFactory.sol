// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./InfluencerToken.sol";

contract TokenFactory {
    struct TokenInfo {
        address tokenAddress;
        address owner;
        uint64 createdAt;
        uint64 totalSupply;
        uint128 initialLiquidity;
    }

    mapping(uint256 => TokenInfo) public tokens;
    mapping(address => uint256[]) public userTokens;
    uint256 public nextTokenId;

    event TokenCreated(
        uint256 indexed tokenId,
        address indexed tokenAddress,
        address indexed owner,
        string name,
        string symbol,
        uint256 totalSupply
    );

    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageUrl,
        uint256 initialSupply,
        address owner
    ) external payable returns (uint256 tokenId) {
        require(bytes(name).length > 0 && bytes(symbol).length > 0, "Invalid name/symbol");
        require(initialSupply > 0, "Invalid supply");
        require(owner != address(0), "Invalid owner");
        require(msg.value > 0, "CHZ liquidity required");
        
        InfluencerToken newToken = new InfluencerToken(
            name,
            symbol,
            initialSupply,
            owner
        );
        
        // Note: L'imageUrl peut être définie plus tard par le propriétaire du token
        
        tokenId = nextTokenId++;
        tokens[tokenId] = TokenInfo({
            tokenAddress: address(newToken),
            owner: owner,
            createdAt: uint64(block.timestamp),
            totalSupply: uint64(initialSupply),
            initialLiquidity: uint128(msg.value)
        });
        
        userTokens[owner].push(tokenId);
        
        emit TokenCreated(tokenId, address(newToken), owner, name, symbol, initialSupply);
    }

    function getTokenInfo(uint256 tokenId) external view returns (TokenInfo memory) {
        return tokens[tokenId];
    }

    function getUserTokens(address user) external view returns (uint256[] memory) {
        return userTokens[user];
    }

    function getTokenAddress(uint256 tokenId) external view returns (address) {
        return tokens[tokenId].tokenAddress;
    }

    function getTotalTokens() external view returns (uint256) {
        return nextTokenId;
    }

    receive() external payable {}
} 