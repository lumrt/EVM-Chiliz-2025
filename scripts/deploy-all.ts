import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Démarrage du déploiement de tous les contrats...");
  
  // Obtenir le signataire (déployeur)
  const [deployer] = await ethers.getSigners();
  console.log("📋 Déploiement avec le compte:", deployer.address);
  
  // Vérifier le solde
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Solde du compte:", ethers.formatEther(balance), "CHZ");
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Solde faible, assurez-vous d'avoir assez de CHZ pour le déploiement");
  }
  
  const deployedAddresses: any = {
    network: "spicy",
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  try {
    // 1. Déployer TokenFactory
    console.log("\n📦 Déploiement de TokenFactory...");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy();
    await tokenFactory.waitForDeployment();
    
    const factoryAddress = await tokenFactory.getAddress();
    deployedAddresses.tokenFactory = factoryAddress;
    console.log("✅ TokenFactory déployé à:", factoryAddress);
    
    // 2. Déployer SwapRouter
    console.log("\n🔄 Déploiement de SwapRouter...");
    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    const swapRouter = await SwapRouter.deploy();
    await swapRouter.waitForDeployment();
    
    const routerAddress = await swapRouter.getAddress();
    deployedAddresses.swapRouter = routerAddress;
    console.log("✅ SwapRouter déployé à:", routerAddress);
    
    // 3. Sauvegarder les adresses
    const fs = require('fs');
    fs.writeFileSync(
      'contracts/deployed-addresses.json',
      JSON.stringify(deployedAddresses, null, 2)
    );
    
    console.log("\n📄 Adresses sauvegardées dans contracts/deployed-addresses.json");
    
    // 4. Vérifier les déploiements
    console.log("\n🔍 Vérification des déploiements...");
    const totalTokens = await tokenFactory.getTotalTokens();
    const feeRate = await swapRouter.feeRate();
    
    console.log("📊 Nombre total de tokens créés:", totalTokens.toString());
    console.log("💸 Taux de frais du SwapRouter:", feeRate.toString(), "/ 10000");
    
    // 5. Calculer les coûts de déploiement
    const finalBalance = await deployer.provider.getBalance(deployer.address);
    const deploymentCost = balance - finalBalance;
    
    console.log("\n💰 Coût total du déploiement:", ethers.formatEther(deploymentCost), "CHZ");
    
    // 6. Instructions pour l'usage
    console.log("\n🎉 Déploiement terminé avec succès!");
    console.log("\n📋 Prochaines étapes:");
    console.log("1. Mettre à jour vos variables d'environnement:");
    console.log(`   NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=${factoryAddress}`);
    console.log(`   NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=${routerAddress}`);
    console.log("\n2. Utilisation des contrats:");
    console.log("   - TokenFactory: Créer de nouveaux tokens");
    console.log("   - SwapRouter: Créer des pools et échanger des tokens");
    console.log("\n3. Vérifier les contrats sur l'explorateur:");
    console.log(`   npx hardhat verify --network spicy ${factoryAddress}`);
    console.log(`   npx hardhat verify --network spicy ${routerAddress}`);
    
  } catch (error) {
    console.error("❌ Erreur lors du déploiement:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  }); 