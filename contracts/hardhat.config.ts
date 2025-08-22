import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
  // If running locally with ZKsync Stack:
  // Verify the RPC endpoints in zksync-era/chains/<CHAIN>/configs/general.yaml
    leaderboardChain: {
      url: "http://localhost:3050",
    },
    gameChain1: {
      url: "http://localhost:3150",
      // Verify this value in zksync-era/chains/<CHAIN>/ZkStack.yaml
      chainId: 5328,
    },
    gameChain2: {
      url: "http://localhost:3250",
      chainId: 9313,
    },
    gateway: {
      url: "http://localhost:3350",
      // Verify this value in zksync-era/chains/gateway/ZkStack.yaml
      chainId: 506,
    },
    l1: {
      url: "http://localhost:8545",
    },
  }
};

export default config;
