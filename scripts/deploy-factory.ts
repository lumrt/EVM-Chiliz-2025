import { ethers } from "hardhat";

async function main() {
  console.log("Démarrage du déploiement de TokenFactory...");
  
  // Obtenir le signataire (déployeur)
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);
  
  // Vérifier le solde
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Solde du compte:", ethers.formatEther(balance), "CHZ");
  
  // Déployer TokenFactory
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();
  
  const factoryAddress = await tokenFactory.getAddress();
  console.log("TokenFactory déployé à l'adresse:", factoryAddress);
  
  // Enregistrer l'adresse dans un fichier pour usage ultérieur
  const fs = require('fs');
  const deployedAddresses = {
    tokenFactory: factoryAddress,
    network: "spicy",
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'contracts/deployed-addresses.json',
    JSON.stringify(deployedAddresses, null, 2)
  );
  
  console.log("Adresses sauvegardées dans contracts/deployed-addresses.json");
  
  // Vérifier le déploiement
  const totalTokens = await tokenFactory.getTotalTokens();
  console.log("Nombre total de tokens créés:", totalTokens.toString());
  
  console.log("TokenFactory déployé avec succès!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur lors du déploiement:", error);
    process.exit(1);
  }); 