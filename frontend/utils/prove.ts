import { Provider, types, utils, Contract, Wallet } from "zksync-ethers";
import { ethers, JsonRpcProvider } from "ethers";
import { GATEWAY_RPC } from "./constants";
import { leaderboardChain } from "./wagmi";

export async function checkIfTxIsFinalized(txHash: string, provider: Provider) {
  const receipt = await (await provider.getTransaction(txHash)).waitFinalize();
  console.log("got tx receipt");
  return receipt;
}

export async function getReceiptLogs(receipt: types.TransactionReceipt, gameAddress: `0x${string}`) {
  if (receipt.l1BatchNumber === null || receipt.l1BatchTxIndex === null)
    throw new Error(
      "Could not find l1BatchNumber or l1BatchTxIndex in receipt"
    );
  // Find the exact interop log: sender=0x…8008, key=pad32(EOA), value=keccak(message)
  const paddedAddress = ethers.zeroPadValue(gameAddress!, 32);
  const l2ToL1LogIndex = await getLogs(receipt, paddedAddress);
  const logs = receipt.l2ToL1Logs[l2ToL1LogIndex];
  return logs;
}

export async function getGatewayProof(
  logs: types.L2ToL1Log,
  provider: Provider
) {
  // fetch the gw proof
  const gwProof: string[] = await getGwProof(
    provider,
    logs.transactionHash,
    logs.logIndex
  );
  console.log("gw proof ready");
  return gwProof;
}

export async function waitForInteropRoot(
  logs: types.L2ToL1Log,
  provider: Provider
) {
  const gw = new ethers.JsonRpcProvider(GATEWAY_RPC);

  // wait for the interop root to update
  const gwBlock = await getGwBlockForBatch(
    BigInt(logs.l1BatchNumber),
    provider,
    gw
  );
  const chainId = (await gw.getNetwork()).chainId;
  await waitForGatewayInteropRoot(chainId, gwBlock);
  console.log("interop root is updated");
}

export async function getProveScoreArgs(
  score: number,
  playerAddress: `0x${string}`,
  logs: types.L2ToL1Log,
  gwProof: string[],
  chainId: number,
  gameAddress: `0x${string}`
) {
  const message = ethers.solidityPacked(
    ["address", "uint256"],
    [playerAddress, score]
  );

  return [
    chainId,
    logs.l1BatchNumber,
    logs.transactionIndex,
    {
      txNumberInBatch: logs.transactionIndex,
      sender: gameAddress,
      data: message,
    },
    gwProof,
  ];
}

async function getLogs(
  receipt: types.TransactionReceipt,
  paddedAddress: string
) {
  let tries = 0;
  let l2ToL1LogIndex;

  while (tries < 3) {
    l2ToL1LogIndex = receipt.l2ToL1Logs.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// wait for the interop root to update on chain 2
export async function waitForGatewayInteropRoot(
  GW_CHAIN_ID: bigint,
  gwBlock: bigint,
  timeoutMs = 120_000
): Promise<string> {
  const PRIVATE_KEY =
    "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
  const providerChain2 = new Provider(leaderboardChain.rpcUrls.default.http[0]);
  const walletChain2 = new Wallet(PRIVATE_KEY, providerChain2);
  // fetch the interop root from destiination chain
  const INTEROP_ROOT_STORAGE = "0x0000000000000000000000000000000000010008";
  const InteropRootStorage = new Contract(
    INTEROP_ROOT_STORAGE,
    ["function interopRoots(uint256,uint256) view returns (bytes32)"],
    walletChain2
  );

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const root: string = await InteropRootStorage.interopRoots(
      GW_CHAIN_ID,
      gwBlock
    );
    if (root && root !== "0x" + "0".repeat(64)) return root;
    // send tx just to get chain2 to seal batch
    const t = await walletChain2.sendTransaction({
      to: walletChain2.address,
      value: BigInt(1),
    });
    await (await walletChain2.provider.getTransaction(t.hash)).waitFinalize();
  }
  throw new Error(
    `Chain2 did not import interop root for (${GW_CHAIN_ID}, ${gwBlock}) in time`
  );
}
