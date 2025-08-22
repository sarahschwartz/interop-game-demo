import { ethers, config } from 'hardhat';
import { GAME_CHAIN_1_CONTRACT_ADDRESS, GAME_CHAIN_2_CONTRACT_ADDRESS } from "../utils/deployedContracts"

const PRIVATE_KEY = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const networks = config.networks as any;
const providerChain2 = new ethers.JsonRpcProvider(networks.leaderboardChain.url);
const wallet = new ethers.Wallet(PRIVATE_KEY, providerChain2);

async function main() {
  const CONTRACT_NAME = 'GameLeaderboard';
  const approvedChainIds = [networks.gameChain1.chainId, networks.gameChain2.chainId];
  const approvedGameContracts = [GAME_CHAIN_1_CONTRACT_ADDRESS, GAME_CHAIN_2_CONTRACT_ADDRESS];
  const ARGS: any[] = [approvedChainIds, approvedGameContracts];
  console.log(`Deploying ${CONTRACT_NAME} contract to Game Leaderboard Chain`);
  const contract = await ethers.deployContract(CONTRACT_NAME, ARGS, wallet);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`${CONTRACT_NAME} deployed to ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });