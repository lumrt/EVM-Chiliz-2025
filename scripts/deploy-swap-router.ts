import { ethers } from "hardhat";

async function main() {
  console.log("Démarrage du déploiement de SwapRouter...");
  
  // Obtenir le signataire (déployeur)
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);
  
  // Vérifier le solde
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Solde du compte:", ethers.formatEther(balance), "CHZ");
  
  // Déployer SwapRouter
  const SwapRouter = await ethers.getContractFactory("SwapRouter");
  const swapRouter = await SwapRouter.deploy();
  await swapRouter.waitForDeployment();
  
  const routerAddress = await swapRouter.getAddress();
  console.log("SwapRouter déployé à l'adresse:", routerAddress);
  
  // Lire les adresses existantes ou créer un nouveau fichier
  const fs = require('fs');
  let deployedAddresses: any = {};
  
  try {
    const existingData = fs.readFileSync('contracts/deployed-addresses.json', 'utf8');
    deployedAddresses = JSON.parse(existingData);
  } catch (error) {
    console.log("Aucun fichier d'adresses existant trouvé, création d'un nouveau...");
  }
  
  // Ajouter l'adresse du SwapRouter
  deployedAddresses.swapRouter = routerAddress;
  deployedAddresses.network = "spicy";
  deployedAddresses.deployer = deployer.address;
  deployedAddresses.timestamp = new Date().toISOString();
  
  fs.writeFileSync(
    'contracts/deployed-addresses.json',
    JSON.stringify(deployedAddresses, null, 2)
  );
  
  console.log("Adresses sauvegardées dans contracts/deployed-addresses.json");
  
  // Vérifier le déploiement
  const feeRate = await swapRouter.feeRate();
  console.log("Taux de frais configuré:", feeRate.toString(), "/ 10000");
  
  console.log("SwapRouter déployé avec succès!");
  console.log("\nProchaines étapes:");
  console.log("1. Mettre à jour vos variables d'environnement avec:");
  console.log(`   NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=${routerAddress}`);
  console.log("2. Créer des pools de liquidité pour les tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur lors du déploiement:", error);
    process.exit(1);
  }); 