import { ethers, config } from "hardhat";
import { Provider, utils, Wallet, types } from "zksync-ethers";
import { getGwBlockForBatch, waitForGatewayInteropRoot } from '../utils/interop-utils'
import { Game, GameAggregator } from "../typechain-types";

const PRIVATE_KEY = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";

const GAME_ADDRESS = "0x108bD5e0cd98eBD83C2131A19dD895B7e54761cf";
const AGGREGATOR_ADDRESS = "0x98Cf1bc237B4817306E7f44C9207042d88593c40";

const networks = config.networks as any;
const CHAIN1_RPC = networks.gameChain.url; // era
const CHAIN2_RPC = networks.aggregatorChain.url; // zk_chain_2
const GW_RPC     = networks.gateway.url; // gateway
const GW_CHAIN_ID = BigInt(networks.gateway.chainId);

async function main() {
  // Chain 1
  const providerChain1 = new Provider(CHAIN1_RPC);
  const providerl1 = new Provider(networks.l1.url);
  const walletChain1 = new Wallet(PRIVATE_KEY, providerChain1, providerl1);

  // Chain 2
  const providerChain2 = new Provider(CHAIN2_RPC);
  const walletChain2 = new Wallet(PRIVATE_KEY, providerChain2, providerl1);

  // ZKsync Gateway
  const gw = new ethers.JsonRpcProvider(GW_RPC);

  const game: Game  = await ethers.getContractAt("Game", GAME_ADDRESS, walletChain1);
  // to get over 20 min score max
  await getInitialHighScore(game); 

  const iScore = await game.highestScore();
  console.log('score', iScore);

  const tx = await game.incrementScore();

  console.log("waiting for receipt...");
  const receipt = await (await walletChain1.provider.getTransaction(tx.hash)).waitFinalize();
  console.log("got tx receipt");
  if(receipt.l1BatchNumber === null || receipt.l1BatchTxIndex === null) throw new Error("Could not find l1BatchNumber or l1BatchTxIndex in receipt");

  // Find the exact interop log: sender=0x…8008, key=pad32(EOA), value=keccak(message)
  const paddedAddress = ethers.zeroPadValue(GAME_ADDRESS, 32);
  const l2ToL1LogIndex = await getLogs(receipt, paddedAddress);
  const logs = receipt.l2ToL1Logs[l2ToL1LogIndex];

  // fetch the gw proof
  const gwProof: string[] = await getGwProof(walletChain1.provider, logs.transactionHash, logs.logIndex);
  console.log("gw proof ready");

  // wait for the interop root to update
  const gwBlock = await getGwBlockForBatch(BigInt(logs.l1BatchNumber), walletChain1.provider, gw);
  await waitForGatewayInteropRoot(GW_CHAIN_ID, walletChain2, gwBlock);
  console.log('interop root is updated');


  const score = await waitForScoreToIncrement(iScore, game);
  console.log('score', score);

  const message = ethers.solidityPacked(
  ["address", "uint256"],
  [walletChain1.address, score]
);

  // verify the score in the game aggregator chain
  const aggregator: GameAggregator  = await ethers.getContractAt("GameAggregator", AGGREGATOR_ADDRESS, walletChain2);
  const srcChainId = (await walletChain1.provider.getNetwork()).chainId;
  await aggregator.proveScore(
    srcChainId,
    logs.l1BatchNumber,
    logs.transactionIndex,
    { txNumberInBatch: logs.transactionIndex, sender: GAME_ADDRESS, data: message },
    gwProof
  );
  console.log("score is verified on aggregator");

  await utils.sleep(3_000);

  const aggregatorHighScore = await aggregator.highestScore();
  console.log("Aggregator high score:", aggregatorHighScore);
  const winningChainId = await aggregator.winningChainId();
  console.log("Winning chain ID:", winningChainId);
}

async function waitForScoreToIncrement(initialScore: bigint, game: Game){
  let score = initialScore;
  while(score === initialScore){
    score = await game.highestScore();
    await utils.sleep(1_000);
  }
  return score;
}

async function getLogs(receipt: types.TransactionReceipt, paddedAddress: string){
  let tries = 0;
  let l2ToL1LogIndex;

  while(tries < 3){
    l2ToL1LogIndex = receipt.l2ToL1Logs.findIndex((log: any) =>
        log.sender.toLowerCase() === utils.L1_MESSENGER_ADDRESS.toLowerCase() &&
        log.key.toLowerCase()    === paddedAddress.toLowerCase()
      );
      if (l2ToL1LogIndex >= 0){
        console.log("got l2ToL1LogIndex");
        return l2ToL1LogIndex;
      }
      tries = tries + 1;
      await utils.sleep(1_000);
  }
  throw new Error("Could not find our interop log in receipt.l2ToL1Logs");
  
}
async function getGwProof(providerChain1: Provider, txHash: string, l2ToL1LogIndex: number){
  let tries = 0;
  let gwProofResp;

  while(tries < 3){
  gwProofResp = await providerChain1.send("zks_getL2ToL1LogProof", [
    txHash,
    l2ToL1LogIndex,
    "proof_based_gw",
  ]);
  if (gwProofResp?.proof){
    return gwProofResp?.proof;
  }
    tries = tries + 1;
    await utils.sleep(1_000);
  }
  throw new Error("Gateway proof not ready yet");
}


async function getInitialHighScore(game: Game){
  let highScore: bigint = 20n;
  while(highScore < 21n){
    await game.incrementScore();
    highScore = await game.highestScore();
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
