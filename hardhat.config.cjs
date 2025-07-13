require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env"});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800
      }
    }
  },
  networks: {
    spicy: {
      url: "http://127.0.0.1:8545", // replace with the local hardhat url
      accounts:
        process.env.OPERATOR_PRIVATE_KEY !== undefined
          ? [process.env.OPERATOR_PRIVATE_KEY]
          : [],
      chainId: 31337,
      gasPrice: 100000000000, // 100 gwei instead of 2500 gwei
      gas: 6000000, // Set gas limit
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
}; 