import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const localnodePrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    chilizSpicy: {
      url: "https://spicy-rpc.chiliz.com/",
      accounts:
        process.env.OPERATOR_PRIVATE_KEY !== undefined
          ? [process.env.OPERATOR_PRIVATE_KEY]
          : [],
      chainId: 88882,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [localnodePrivateKey],
    }
  },
};

export default config; 