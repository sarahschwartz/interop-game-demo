// Script that deploys a given contract to a network
import { ethers, network } from 'hardhat';

// deployed at 0xb10328346213d9e83d7657e290a221B60743e6A5

const PRIVATE_KEY = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const CHAIN2_RPC = "http://localhost:3450";
const providerChain2 = new ethers.JsonRpcProvider(CHAIN2_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, providerChain2);

async function main() {
  const CONTRACT_NAME = 'GameAggregator';
  const ARGS: any[] = [];
  console.log(`Deploying ${CONTRACT_NAME} contract to ${network.name}`);
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