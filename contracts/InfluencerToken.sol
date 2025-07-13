// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InfluencerToken is ERC20, Ownable {
    // Packed struct pour optimiser le storage
    struct TokenData {
        uint128 maxSupply;
        uint128 createdAt;
    }
    
    TokenData public tokenData;
    
    // Events pour réduire le storage
    event TokenCreated(string indexed name, string indexed symbol, uint256 maxSupply);
    event ImageUrlSet(string imageUrl);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(initialSupply <= type(uint128).max, "Supply too large");
        
        tokenData = TokenData({
            maxSupply: uint128(initialSupply),
            createdAt: uint128(block.timestamp)
        });
        
        _mint(initialOwner, initialSupply);
        emit TokenCreated(name, symbol, initialSupply);
    }

    function setImageUrl(string calldata _imageUrl) external onlyOwner {
        emit ImageUrlSet(_imageUrl);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= tokenData.maxSupply, "Exceeds max supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);
    }

    // Fonction getter optimisée
    function getTokenData() external view returns (uint256 maxSupply, uint256 createdAt) {
        return (tokenData.maxSupply, tokenData.createdAt);
    }
} 