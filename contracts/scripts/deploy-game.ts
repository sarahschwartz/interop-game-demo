import { ethers, config, network } from 'hardhat';

const PRIVATE_KEY = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const gameChain = network.name === "gameChain1" ? config.networks.gameChain1 : config.networks.gameChain2 as any;
const providerChain1 = new ethers.JsonRpcProvider(gameChain.url);
const wallet = new ethers.Wallet(PRIVATE_KEY, providerChain1);

async function main() {
  const CONTRACT_NAME = 'Game';
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