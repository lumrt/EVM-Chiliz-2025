const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("Could not get deployer from Hardhat");
  }

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy Marketplace contract
  const platformFeePercent = 250; // 2.5%
  const feeRecipient = deployer.address;
  
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(platformFeePercent, feeRecipient);

  await marketplace.waitForDeployment();

  const contractAddress = await marketplace.getAddress();
  console.log(`Marketplace deployed to: ${contractAddress}`);
  console.log(`Platform fee: ${platformFeePercent / 100}%`);
  console.log(`Fee recipient: ${feeRecipient}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 