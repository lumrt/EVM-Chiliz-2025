const hre = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main() {
  const factoryAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS is not set in .env.local");
  }

  console.log(`Querying TokenFactory at: ${factoryAddress}`);

  const tokenFactory = await hre.ethers.getContractAt("TokenFactory", factoryAddress);
  const deployedCollections = await tokenFactory.getDeployedNFTCollections();

  if (deployedCollections.length === 0) {
    console.log("No NFT collections have been deployed yet.");
    return;
  }

  const lastCollectionAddress = deployedCollections[deployedCollections.length - 1];
  
  console.log("----------------------------------------------------------------");
  console.log("Last deployed NFT collection address to blacklist:");
  console.log(lastCollectionAddress);
  console.log("----------------------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 