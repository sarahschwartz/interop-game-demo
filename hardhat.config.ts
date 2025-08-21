import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    gameChain: {
      url: "http://localhost:3050",
    },
    aggregatorChain: {
      url: "http://localhost:3450",
    },
  }
};

export default config;
