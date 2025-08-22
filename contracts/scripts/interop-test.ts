import { ethers, config } from "hardhat";
import { Provider, utils, Wallet, types } from "zksync-ethers";
import {
  getGwBlockForBatch,
  waitForGatewayInteropRoot,
} from "../utils/interop-utils";
import { Game, GameLeaderboard } from "../typechain-types";
import { GAME_CHAIN_1_CONTRACT_ADDRESS, GAME_CHAIN_2_CONTRACT_ADDRESS } from "../utils/deployedContracts"

const PRIVATE_KEY =
  "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";

const LEADERBOARD_ADDRESS = "0xf10A110E59a22b444c669C83b02f0E6d945b2b69";

const networks = config.networks as any;
const GAME_CHAIN_1_RPC = networks.gameChain1.url;
const GAME_CHAIN_2_RPC = networks.gameChain2.url;
const LEADERBOARD_CHAIN_RPC = networks.leaderboardChain.url;
const GW_RPC = networks.gateway.url; // gateway
const GW_CHAIN_ID = BigInt(networks.gateway.chainId);
const providerl1 = new Provider(networks.l1.url);

// Game Chain 1
const providerChain1 = new Provider(GAME_CHAIN_1_RPC);
const walletChain1 = new Wallet(PRIVATE_KEY, providerChain1, providerl1);

// Game Chain 1
const providerChain2 = new Provider(GAME_CHAIN_2_RPC);
const walletChain2 = new Wallet(PRIVATE_KEY, providerChain2, providerl1);

// Leaderboard
const providerLeaderbaord = new Provider(LEADERBOARD_CHAIN_RPC);
const walletLeaderboard = new Wallet(PRIVATE_KEY, providerLeaderbaord, providerl1);

// ZKsync Gateway
const gw = new ethers.JsonRpcProvider(GW_RPC);

async function main() {
  await testGameChain(GAME_CHAIN_1_CONTRACT_ADDRESS, walletChain1);

  await testGameChain(GAME_CHAIN_2_CONTRACT_ADDRESS, walletChain2, true)
}

async function testGameChain(gameAddress: `0x${string}`, wallet: Wallet, getHigherScore = false){
    const game: Game = await ethers.getContractAt(
    "Game",
    gameAddress,
    wallet
  );

    // to get over 20 min score max
  await getInitialHighScore(game, getHigherScore);

  const iScore = await game.highestScore();
  console.log("inital game high score", iScore);

  const tx = await game.incrementScore();

  console.log("waiting for receipt...");
  const receipt = await (
    await wallet.provider.getTransaction(tx.hash)
  ).waitFinalize();
  console.log("got tx receipt");
  if (receipt.l1BatchNumber === null || receipt.l1BatchTxIndex === null)
    throw new Error(
      "Could not find l1BatchNumber or l1BatchTxIndex in receipt"
    );

  // Find the exact interop log: sender=0x…8008, key=pad32(EOA), value=keccak(message)
  const paddedAddress = ethers.zeroPadValue(gameAddress, 32);
  const l2ToL1LogIndex = await getLogs(receipt, paddedAddress);
  const logs = receipt.l2ToL1Logs[l2ToL1LogIndex];

  // fetch the gw proof
  const gwProof: string[] = await getGwProof(
    wallet.provider,
    logs.transactionHash,
    logs.logIndex
  );
  console.log("gw proof ready");

  // wait for the interop root to update
  const gwBlock = await getGwBlockForBatch(
    BigInt(logs.l1BatchNumber),
    wallet.provider,
    gw
  );
  await waitForGatewayInteropRoot(GW_CHAIN_ID, walletLeaderboard, gwBlock);
  console.log("interop root is updated");

  const score = await waitForScoreToIncrement(iScore, game);
  console.log("new game high score", score);

  const message = ethers.solidityPacked(
    ["address", "uint256"],
    [wallet.address, score]
  );

  // verify the score in the game leaderboard chain
  const leaderboard: GameLeaderboard = await ethers.getContractAt(
    "GameLeaderboard",
    LEADERBOARD_ADDRESS,
    walletLeaderboard
  );
  const srcChainId = (await wallet.provider.getNetwork()).chainId;
  await leaderboard.proveScore(
    srcChainId,
    logs.l1BatchNumber,
    logs.transactionIndex,
    {
      txNumberInBatch: logs.transactionIndex,
      sender: gameAddress,
      data: message,
    },
    gwProof
  );
  console.log("score is verified on leaderboard");

  await utils.sleep(3_000);

  const leaderboardHighScore = await leaderboard.highestScore();
  console.log("Leaderboard high score:", leaderboardHighScore);
  const winningChainId = await leaderboard.winningChainId();
  console.log("Winning chain ID:", winningChainId);
}

async function waitForScoreToIncrement(initialScore: bigint, game: Game) {
  let score = initialScore;
  while (score === initialScore) {
    score = await game.highestScore();
    await utils.sleep(1_000);
  }
  return score;
}

async function getLogs(
  receipt: types.TransactionReceipt,
  paddedAddress: string
) {
  let tries = 0;
  let l2ToL1LogIndex;

  while (tries < 3) {
    l2ToL1LogIndex = receipt.l2ToL1Logs.findIndex(
      (log: any) =>
        log.sender.toLowerCase() === utils.L1_MESSENGER_ADDRESS.toLowerCase() &&
        log.key.toLowerCase() === paddedAddress.toLowerCase()
    );
    if (l2ToL1LogIndex >= 0) {
      console.log("got l2ToL1LogIndex");
      return l2ToL1LogIndex;
    }
    tries = tries + 1;
    await utils.sleep(1_000);
  }
  throw new Error("Could not find our interop log in receipt.l2ToL1Logs");
}
async function getGwProof(
  providerChain1: Provider,
  txHash: string,
  l2ToL1LogIndex: number
) {
  let tries = 0;
  let gwProofResp;

  while (tries < 3) {
    gwProofResp = await providerChain1.send("zks_getL2ToL1LogProof", [
      txHash,
      l2ToL1LogIndex,
      "proof_based_gw",
    ]);
    if (gwProofResp?.proof) {
      return gwProofResp?.proof;
    }
    tries = tries + 1;
    await utils.sleep(1_000);
  }
  throw new Error("Gateway proof not ready yet");
}

async function getInitialHighScore(game: Game, getHigherScore = false) {
  let highScore: bigint = 20n;
  const targetScore = getHigherScore ? 30n : 21n;
  while (highScore < targetScore) {
    await game.incrementScore();
    await utils.sleep(1_000);
    highScore = await game.highestScore();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
