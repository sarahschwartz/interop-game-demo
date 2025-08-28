import { JsonRpcProvider } from "ethers";
import hre from "hardhat";
import { type HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import { Provider, utils, Wallet, types } from "zksync-ethers";
import { Game, GameLeaderboard } from "../types/ethers-contracts/index.js";

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const GAME_CHAIN_1_RPC = process.env.GAME_CHAIN_1_RPC_URL;
const GAME_CHAIN_2_RPC = process.env.GAME_CHAIN_2_RPC_URL;
const LEADERBOARD_CHAIN_RPC = process.env.LEADERBOARD_RPC_URL;
const GW_RPC = process.env.GATEWAY_RPC_URL;
const L1_RPC = process.env.L1_RPC_URL;
const GAME_CHAIN_1_CONTRACT_ADDRESS = process.env.GAME_CHAIN_1_CONTRACT_ADDRESS as `0x${string}`;
const GAME_CHAIN_2_CONTRACT_ADDRESS = process.env.GAME_CHAIN_2_CONTRACT_ADDRESS as `0x${string}`;
const LEADERBOARD_CONTRACT_ADDRESS = process.env.LEADERBOARD_CONTRACT_ADDRESS as `0x${string}`;

let ethers: HardhatEthers;

async function main() {
  if (
    !PRIVATE_KEY ||
    !GAME_CHAIN_1_RPC ||
    !GAME_CHAIN_2_RPC ||
    !LEADERBOARD_CHAIN_RPC ||
    !GW_RPC ||
    !L1_RPC ||
    !GAME_CHAIN_1_CONTRACT_ADDRESS ||
    !GAME_CHAIN_2_CONTRACT_ADDRESS ||
    !LEADERBOARD_CONTRACT_ADDRESS
  ) {
    throw new Error("Missing env variable");
  }

  const connection = await hre.network.connect();
  ethers = connection.ethers;

  const { walletChain1, walletChain2, walletLeaderboard } = getWallets();

  await testGameChain(
    GAME_CHAIN_1_CONTRACT_ADDRESS,
    walletLeaderboard,
    walletChain1
  );

  await testGameChain(
    GAME_CHAIN_2_CONTRACT_ADDRESS,
    walletLeaderboard,
    walletChain2
  );
}

async function testGameChain(
  gameAddress: `0x${string}`,
  walletLeaderboard: Wallet,
  wallet: Wallet
) {
  const game: Game = await ethers.getContractAt(
    "Game",
    gameAddress,
    wallet as any
  );

  // verify the score in the game leaderboard chain
  const leaderboard: GameLeaderboard = await ethers.getContractAt(
    "GameLeaderboard",
    LEADERBOARD_CONTRACT_ADDRESS,
    walletLeaderboard as any
  );

  // to get over 20 min score max
  await getInitialHighScore(game, leaderboard);

  const iScore = await game.highestScore();
  console.log("Inital game high score", iScore);

  const tx = await game.incrementScore();

  console.log("Waiting for receipt...");
  const receipt = await (
    await wallet.provider.getTransaction(tx.hash)
  ).waitFinalize();
  console.log("Got tx receipt");
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
  console.log("Gateway proof ready");

  // ZKsync Gateway
  const gw = new ethers.JsonRpcProvider(GW_RPC);

  // wait for the interop root to update
  const gwBlock = await getGwBlockForBatch(
    BigInt(logs.l1BatchNumber),
    wallet.provider,
    gw
  );
  await waitForGatewayInteropRoot(gw, walletLeaderboard, gwBlock);
  console.log("Interop root is updated");

  const score = await waitForScoreToIncrement(iScore, game);
  console.log("New game high score", score);

  const message = ethers.solidityPacked(
    ["address", "uint256"],
    [wallet.address, score]
  );

  const srcChainId = (await wallet.provider.getNetwork()).chainId;
  const result = await leaderboard.checkVerifyScore(
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

  if (!result) {
    console.log("😢 Message not verified");
    return;
  }

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
  console.log("Score is verified on leaderboard");

  await utils.sleep(3_000);

  const leaderboardHighScore = await leaderboard.highestScore();
  console.log("Leaderboard high score:", leaderboardHighScore);
  const winningChainId = await leaderboard.winningChainId();
  console.log("Winning chain ID:", winningChainId);
}

function getWallets() {
  const providerl1 = new Provider(L1_RPC);

  // Game Chain 1
  const providerChain1 = new Provider(GAME_CHAIN_1_RPC);
  const walletChain1 = new Wallet(PRIVATE_KEY!, providerChain1, providerl1);

  // Game Chain 1
  const providerChain2 = new Provider(GAME_CHAIN_2_RPC);
  const walletChain2 = new Wallet(PRIVATE_KEY!, providerChain2, providerl1);

  // Leaderboard wallet
  const providerLeaderbaord = new Provider(LEADERBOARD_CHAIN_RPC);
  const walletLeaderboard = new Wallet(
    PRIVATE_KEY!,
    providerLeaderbaord,
    providerl1
  );

  return { walletChain1, walletChain2, walletLeaderboard };
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
    await utils.sleep(3_000);
  }
  throw new Error("Gateway proof not ready yet");
}

async function getInitialHighScore(game: Game, leaderboard: GameLeaderboard) {
  let highScore: bigint = 20n;
  let targetScore = 21n;
  const lastLeaderboardHighScore = await leaderboard.highestScore();
  if (lastLeaderboardHighScore >= targetScore)
    targetScore = lastLeaderboardHighScore + 1n;
  while (highScore < targetScore) {
    await game.incrementScore();
    await utils.sleep(1_000);
    highScore = await game.highestScore();
  }
}

// fetch gateway block number from executeTxHash
export async function getGwBlockForBatch(
  batch: bigint,
  provider: Provider,
  gw: JsonRpcProvider
): Promise<bigint> {
  while (true) {
    const details = await provider.send("zks_getL1BatchDetails", [
      Number(batch),
    ]);
    const execTx: string | null =
      details?.executeTxHash &&
      details.executeTxHash !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
        ? details.executeTxHash
        : null;
    if (execTx) {
      const gwRcpt = await gw.getTransactionReceipt(execTx);
      if (gwRcpt?.blockNumber !== undefined) return BigInt(gwRcpt.blockNumber);
    }
    await utils.sleep(1000);
  }
}

// wait for the interop root to update on leaderboard chain
export async function waitForGatewayInteropRoot(
  gwProvider: JsonRpcProvider,
  walletLeaderboard: Wallet,
  gwBlock: bigint,
  timeoutMs = 120_000
): Promise<string> {
  const GW_CHAIN_ID = (await gwProvider.getNetwork()).chainId;
  // fetch the interop root from the leaderboard chain
  const INTEROP_ROOT_STORAGE = "0x0000000000000000000000000000000000010008";
  const InteropRootStorage = new ethers.Contract(
    INTEROP_ROOT_STORAGE,
    ["function interopRoots(uint256,uint256) view returns (bytes32)"],
    walletLeaderboard as any
  );

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const root: string = await InteropRootStorage.interopRoots(
      GW_CHAIN_ID,
      gwBlock
    );
    if (root && root !== "0x" + "0".repeat(64)) return root;
    // send tx just to get leaderboard chain to seal batch
    const t = await walletLeaderboard.sendTransaction({
      to: walletLeaderboard.address,
      value: BigInt(1),
    });
    await (
      await walletLeaderboard.provider.getTransaction(t.hash)
    ).waitFinalize();
  }
  throw new Error(`Leaderboard chain did not import interop root in time`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
