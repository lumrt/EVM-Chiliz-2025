// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IInfluencerToken {
    function owner() external view returns (address);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract SwapRouter is Ownable, ReentrancyGuard {
    struct Pool {
        uint128 tokenReserves;
        uint128 chzReserves;
    }

    mapping(address => Pool) public pools;
    mapping(address => bool) public supportedTokens;
    
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public feeRate = 30; // 0.3%
    
    event PoolCreated(address indexed token, uint256 tokenAmount, uint256 chzAmount);
    event SwapExecuted(
        address indexed user,
        address indexed token,
        uint256 chzAmount,
        uint256 tokenAmount,
        bool isChzToToken
    );
    event LiquidityAdded(address indexed token, uint256 tokenAmount, uint256 chzAmount);
    event LiquidityRemoved(address indexed token, uint256 tokenAmount, uint256 chzAmount);

    constructor() Ownable(msg.sender) {}

    function createPool(
        address tokenAddress,
        uint256 tokenAmount
    ) external payable nonReentrant {
        require(tokenAddress != address(0), "Invalid token");
        require(msg.value > 0, "CHZ required");
        require(tokenAmount > 0, "Token amount required");
        require(!supportedTokens[tokenAddress], "Pool exists");

        IInfluencerToken token = IInfluencerToken(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Transfer failed");

        pools[tokenAddress] = Pool({
            tokenReserves: uint128(tokenAmount),
            chzReserves: uint128(msg.value)
        });

        supportedTokens[tokenAddress] = true;
        emit PoolCreated(tokenAddress, tokenAmount, msg.value);
    }

    function swapChzToToken(address tokenAddress) external payable nonReentrant {
        require(msg.value > 0, "CHZ required");
        require(supportedTokens[tokenAddress], "Pool not found");

        Pool storage pool = pools[tokenAddress];
        uint256 tokenAmount = getTokenAmountForChz(tokenAddress, msg.value);
        require(tokenAmount > 0, "Invalid swap amount");
        require(pool.tokenReserves >= tokenAmount, "Insufficient token liquidity");

        uint256 feeAmount = (msg.value * feeRate) / FEE_DENOMINATOR;
        uint256 chzAmountAfterFee = msg.value - feeAmount;

        pool.chzReserves += uint128(chzAmountAfterFee);
        pool.tokenReserves -= uint128(tokenAmount);

        IInfluencerToken token = IInfluencerToken(tokenAddress);
        require(token.transfer(msg.sender, tokenAmount), "Transfer failed");

        emit SwapExecuted(msg.sender, tokenAddress, msg.value, tokenAmount, true);
    }

    function swapTokenToChz(address tokenAddress, uint256 tokenAmount) external nonReentrant {
        require(tokenAmount > 0, "Token amount required");
        require(supportedTokens[tokenAddress], "Pool not found");

        Pool storage pool = pools[tokenAddress];
        uint256 chzAmount = getChzAmountForToken(tokenAddress, tokenAmount);
        require(chzAmount > 0, "Invalid swap amount");
        require(pool.chzReserves >= chzAmount, "Insufficient CHZ liquidity");

        uint256 feeAmount = (chzAmount * feeRate) / FEE_DENOMINATOR;
        uint256 chzAmountAfterFee = chzAmount - feeAmount;

        IInfluencerToken token = IInfluencerToken(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Transfer failed");

        pool.tokenReserves += uint128(tokenAmount);
        pool.chzReserves -= uint128(chzAmount);

        payable(msg.sender).transfer(chzAmountAfterFee);
        emit SwapExecuted(msg.sender, tokenAddress, chzAmountAfterFee, tokenAmount, false);
    }

    function addLiquidity(address tokenAddress, uint256 tokenAmount) external payable nonReentrant {
        require(supportedTokens[tokenAddress], "Pool not found");
        require(msg.value > 0 && tokenAmount > 0, "Invalid amounts");

        Pool storage pool = pools[tokenAddress];
        
        // Vérifier le ratio de liquidité
        uint256 requiredTokenAmount = (msg.value * pool.tokenReserves) / pool.chzReserves;
        require(tokenAmount >= requiredTokenAmount, "Insufficient token amount");

        IInfluencerToken token = IInfluencerToken(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Transfer failed");

        pool.tokenReserves += uint128(tokenAmount);
        pool.chzReserves += uint128(msg.value);

        emit LiquidityAdded(tokenAddress, tokenAmount, msg.value);
    }

    function getTokenAmountForChz(address tokenAddress, uint256 chzAmount) public view returns (uint256) {
        Pool memory pool = pools[tokenAddress];
        if (pool.chzReserves == 0 || pool.tokenReserves == 0) return 0;

        uint256 chzAmountAfterFee = chzAmount - (chzAmount * feeRate) / FEE_DENOMINATOR;
        return (chzAmountAfterFee * pool.tokenReserves) / (pool.chzReserves + chzAmountAfterFee);
    }

    function getChzAmountForToken(address tokenAddress, uint256 tokenAmount) public view returns (uint256) {
        Pool memory pool = pools[tokenAddress];
        if (pool.tokenReserves == 0 || pool.chzReserves == 0) return 0;

        return (tokenAmount * pool.chzReserves) / (pool.tokenReserves + tokenAmount);
    }

    function getPoolInfo(address tokenAddress) external view returns (Pool memory) {
        return pools[tokenAddress];
    }

    function setFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 1000, "Fee too high"); // Max 10%
        feeRate = newFeeRate;
    }

    function withdrawFees(address payable to, uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        to.transfer(amount);
    }

    receive() external payable {}
} 