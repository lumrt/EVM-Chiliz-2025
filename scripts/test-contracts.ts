import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test des contrats déployés...");
  
  // Lire les adresses déployées
  const fs = require('fs');
  let deployedAddresses: any;
  
  try {
    const data = fs.readFileSync('contracts/deployed-addresses.json', 'utf8');
    deployedAddresses = JSON.parse(data);
  } catch (error) {
    console.error("❌ Impossible de lire les adresses déployées. Exécutez d'abord le déploiement.");
    process.exit(1);
  }
  
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const user1 = signers[1] || deployer; // Utiliser le deployer si pas d'autre signer
  const user2 = signers[2] || deployer; // Utiliser le deployer si pas d'autre signer
  
  console.log("👤 Testeur principal:", deployer.address);
  console.log("👤 Utilisateur 1:", user1.address);
  console.log("👤 Utilisateur 2:", user2.address);
  
  // Obtenir les instances des contrats
  const tokenFactory = await ethers.getContractAt("TokenFactory", deployedAddresses.tokenFactory);
  const swapRouter = await ethers.getContractAt("SwapRouter", deployedAddresses.swapRouter);
  
  try {
    // Test 1: Créer un token
    console.log("\n🔧 Test 1: Création d'un token...");
    const createTx = await tokenFactory.connect(user1).createToken(
      "TestToken",
      "TEST",
      "https://example.com/test.png",
      ethers.parseEther("1000000"), // 1M tokens
      user1.address,
      { value: ethers.parseEther("1") } // 1 CHZ
    );
    
    const receipt = await createTx.wait();
    const tokenId = 0; // Premier token
    
    console.log("✅ Token créé avec l'ID:", tokenId);
    
    // Obtenir l'adresse du token
    const tokenAddress = await tokenFactory.getTokenAddress(tokenId);
    console.log("📍 Adresse du token:", tokenAddress);
    
    // Test 2: Vérifier les informations du token
    console.log("\n🔍 Test 2: Vérification des informations du token...");
    const tokenInfo = await tokenFactory.getTokenInfo(tokenId);
    console.log("📊 Token Info:", {
      tokenAddress: tokenInfo.tokenAddress,
      owner: tokenInfo.owner,
      totalSupply: ethers.formatEther(tokenInfo.totalSupply),
      createdAt: new Date(Number(tokenInfo.createdAt) * 1000).toLocaleString()
    });
    
    // Test 3: Créer un pool de liquidité
    console.log("\n🏊 Test 3: Création d'un pool de liquidité...");
    const token = await ethers.getContractAt("InfluencerToken", tokenAddress);
    
    // Approuver le SwapRouter à dépenser les tokens
    await token.connect(user1).approve(swapRouter.target, ethers.parseEther("100000"));
    
    // Créer le pool
    const createPoolTx = await swapRouter.connect(user1).createPool(
      tokenAddress,
      ethers.parseEther("100000"), // 100K tokens
      { value: ethers.parseEther("10") } // 10 CHZ
    );
    
    await createPoolTx.wait();
    console.log("✅ Pool de liquidité créé");
    
    // Test 4: Vérifier les informations du pool
    console.log("\n🔍 Test 4: Vérification des informations du pool...");
    const poolInfo = await swapRouter.getPoolInfo(tokenAddress);
    console.log("🏊 Pool Info:", {
      tokenReserves: ethers.formatEther(poolInfo.tokenReserves),
      chzReserves: ethers.formatEther(poolInfo.chzReserves)
    });
    
    // Test 5: Effectuer un swap CHZ → Token
    console.log("\n🔄 Test 5: Swap CHZ → Token...");
    const swapAmount = ethers.parseEther("1"); // 1 CHZ
    const expectedTokens = await swapRouter.getTokenAmountForChz(tokenAddress, swapAmount);
    
    console.log("💰 Montant CHZ à échanger:", ethers.formatEther(swapAmount));
    console.log("🎯 Tokens attendus:", ethers.formatEther(expectedTokens));
    
    const swapTx = await swapRouter.connect(user2).swapChzToToken(tokenAddress, {
      value: swapAmount
    });
    await swapTx.wait();
    
    const user2TokenBalance = await token.balanceOf(user2.address);
    console.log("✅ Tokens reçus par user2:", ethers.formatEther(user2TokenBalance));
    
    // Test 6: Effectuer un swap Token → CHZ
    console.log("\n🔄 Test 6: Swap Token → CHZ...");
    const tokenSwapAmount = ethers.parseEther("5000"); // 5K tokens
    const expectedChz = await swapRouter.getChzAmountForToken(tokenAddress, tokenSwapAmount);
    
    console.log("🎯 Tokens à échanger:", ethers.formatEther(tokenSwapAmount));
    console.log("💰 CHZ attendus:", ethers.formatEther(expectedChz));
    
    // Approuver le SwapRouter
    await token.connect(user2).approve(swapRouter.target, tokenSwapAmount);
    
    const user2ChzBefore = await user2.provider.getBalance(user2.address);
    
    const swapTx2 = await swapRouter.connect(user2).swapTokenToChz(tokenAddress, tokenSwapAmount);
    await swapTx2.wait();
    
    const user2ChzAfter = await user2.provider.getBalance(user2.address);
    const chzReceived = user2ChzAfter - user2ChzBefore;
    
    console.log("✅ CHZ reçus (net):", ethers.formatEther(chzReceived));
    
    // Test 7: État final du pool
    console.log("\n📊 Test 7: État final du pool...");
    const finalPoolInfo = await swapRouter.getPoolInfo(tokenAddress);
    console.log("🏊 Pool final:", {
      tokenReserves: ethers.formatEther(finalPoolInfo.tokenReserves),
      chzReserves: ethers.formatEther(finalPoolInfo.chzReserves)
    });
    
    // Test 8: Vérifier les tokens utilisateur
    console.log("\n👥 Test 8: Tokens des utilisateurs...");
    const user1Tokens = await tokenFactory.getUserTokens(user1.address);
    console.log("📝 Tokens créés par user1:", user1Tokens.map(id => id.toString()));
    
    const totalTokens = await tokenFactory.getTotalTokens();
    console.log("📊 Total tokens dans le système:", totalTokens.toString());
    
    console.log("\n🎉 Tous les tests ont réussi!");
    console.log("✅ Les contrats fonctionnent correctement");
    
  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Erreur fatale lors des tests:", error);
    process.exit(1);
  }); 