import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  ignition: {
    requiredConfirmations: 1
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.L1_RPC_URL!,
     accounts: [process.env.WALLET_PRIVATE_KEY!],
    },
    leaderboardChain: {
      type: "http",
      url: process.env.LEADERBOARD_RPC_URL!,
      chainType: "generic",
      accounts: [process.env.WALLET_PRIVATE_KEY!],
    },
    gameChain1: {
      type: "http",
      url: process.env.GAME_CHAIN_1_RPC_URL!,
      chainType: "generic",
      accounts: [process.env.WALLET_PRIVATE_KEY!],
    },
    gameChain2: {
      type: "http",
      url: process.env.GAME_CHAIN_2_RPC_URL!,
      chainType: "generic",
      accounts: [process.env.WALLET_PRIVATE_KEY!],
    },
    gateway: {
      type: "http",
      url: process.env.GATEWAY_RPC_URL!,
      chainType: "generic",
      accounts: [process.env.WALLET_PRIVATE_KEY!],
    },
  },
};

export default config;
