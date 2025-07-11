import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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
  },
};

export default config; 