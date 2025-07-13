import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Test simple pour diagnostiquer le problème...");
  
  const fs = require('fs');
  let deployedAddresses: any;
  
  try {
    const data = fs.readFileSync('contracts/deployed-addresses.json', 'utf8');
    deployedAddresses = JSON.parse(data);
  } catch (error) {
    console.error("❌ Impossible de lire les adresses déployées.");
    process.exit(1);
  }
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Compte de test:", deployer.address);
  
  console.log("📍 Adresses des contrats:");
  console.log("- TokenFactory:", deployedAddresses.tokenFactory);
  console.log("- SwapRouter:", deployedAddresses.swapRouter);
  
  // Test direct de la fonction createToken avec des paramètres simples
  const tokenFactory = await ethers.getContractAt("TokenFactory", deployedAddresses.tokenFactory);
  
  try {
    console.log("\n🧪 Test de création de token...");
    
    // Paramètres simplifiés
    const tokenName = "TestToken";
    const tokenSymbol = "TEST";
    const imageUrl = "";
    const initialSupply = ethers.parseEther("1000");
    const owner = deployer.address;
    const liquidityValue = ethers.parseEther("1");
    
    console.log("📋 Paramètres:");
    console.log("- Nom:", tokenName);
    console.log("- Symbole:", tokenSymbol);
    console.log("- Supply:", ethers.formatEther(initialSupply));
    console.log("- Owner:", owner);
    console.log("- Liquidité:", ethers.formatEther(liquidityValue), "CHZ");
    
    // Estimer le gas d'abord
    console.log("\n⛽ Estimation du gas...");
    const gasEstimate = await tokenFactory.createToken.estimateGas(
      tokenName,
      tokenSymbol,
      imageUrl,
      initialSupply,
      owner,
      { value: liquidityValue }
    );
    console.log("⛽ Gas estimé:", gasEstimate.toString());
    
    // Exécuter la transaction
    console.log("\n🚀 Exécution de la transaction...");
    const tx = await tokenFactory.createToken(
      tokenName,
      tokenSymbol,
      imageUrl,
      initialSupply,
      owner,
      { value: liquidityValue, gasLimit: gasEstimate * 2n }
    );
    
    console.log("📝 Hash de transaction:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmée!");
    
  } catch (error: any) {
    console.error("\n❌ Erreur détaillée:", error);
    
    // Essayer de décoder l'erreur
    if (error.data) {
      console.log("🔍 Data de l'erreur:", error.data);
    }
    
    // Tester le contrat InfluencerToken directement
    console.log("\n🧪 Test de déploiement direct d'InfluencerToken...");
    try {
      const InfluencerToken = await ethers.getContractFactory("InfluencerToken");
      const token = await InfluencerToken.deploy(
        "DirectTest",
        "DIRECT",
        ethers.parseEther("1000"),
        deployer.address
      );
      await token.waitForDeployment();
      console.log("✅ InfluencerToken déployé directement à:", await token.getAddress());
    } catch (directError) {
      console.error("❌ Erreur lors du déploiement direct:", directError);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  }); 