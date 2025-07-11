// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./InfluencerToken.sol";

contract TokenFactory {
    address[] public deployedTokens;

    event TokenCreated(
        address indexed tokenAddress,
        address indexed owner,
        string name,
        string symbol
    );

    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) public returns (address) {
        InfluencerToken newToken = new InfluencerToken(
            name,
            symbol,
            initialSupply,
            owner
        );
        deployedTokens.push(address(newToken));
        emit TokenCreated(address(newToken), owner, name, symbol);
        return address(newToken);
    }

    function getDeployedTokens() public view returns (address[] memory) {
        return deployedTokens;
    }
} 