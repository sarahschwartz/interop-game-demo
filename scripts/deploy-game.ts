// Script that deploys a given contract to a network
import { ethers, network } from 'hardhat';

// deployed at 0x98Cf1bc237B4817306E7f44C9207042d88593c40
// deployed at 0x5F60Cc6afB0278002D890920211082752f52C8EC

const PRIVATE_KEY = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const CHAIN1_RPC = "http://localhost:3050";
const providerChain1 = new ethers.JsonRpcProvider(CHAIN1_RPC);
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