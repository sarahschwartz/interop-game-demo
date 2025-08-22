import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
  // If running locally with ZKsync Stack:
  // Verify the RPC endpoints in zksync-era/chains/<CHAIN>/configs/general.yaml
    gameChain1: {
      url: "http://localhost:3650",
      // Verify this value in zksync-era/chains/<CHAIN>/ZkStack.yaml
      chainId: 62348,
    },
    gameChain2: {
      url: "http://localhost:3750",
      chainId: 62348,
    },
    leaderboardChain: {
      url: "http://localhost:3450",
    },
    gateway: {
      url: "http://localhost:3250",
      // Verify this value in zksync-era/chains/gateway/ZkStack.yaml
      chainId: 506,
    },
    l1: {
      url: "http://localhost:8545",
    },
  }
};

export default config;
