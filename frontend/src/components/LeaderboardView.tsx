import { LeaderboardStats } from "./LeaderboardStats";
import { Status } from "./Status";
import { LEADERBOARD_ADDRESS } from "../../utils/constants";
import { useEffect, useState } from "react";
import * as leaderboardABI from "../../../contracts/artifacts/contracts/GameLeaderboard.sol/GameLeaderboard.json";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  checkIfTxIsFinalized,
  getGatewayProof,
  getProveScoreArgs,
  getReceiptLogs,
  waitForInteropRoot,
} from "../../utils/prove";
import {
  gameChain1,
  gameChain2,
  getChainInfo,
  getContractAddress,
} from "../../utils/wagmi";
import { Provider } from "zksync-ethers";

export function LeaderboardView({
  playerAddress,
}: {
  playerAddress: `0x${string}`;
}) {
  const [update, setUpdate] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [chainId, setChainId] = useState<number>(gameChain1.id);
  const [txHash, setTxHash] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isFinalized, setIsFinalized] = useState<boolean>(false);
  const [isProofReady, setIsProofReady] = useState<boolean>(false);
  const [isRootUpdated, setIsRootUpdated] = useState<boolean>(false);
  const { writeContract, data: proveHash, isSuccess } = useWriteContract();

  const { isSuccess: isConfirmed, isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash: proveHash });

  async function proveScore() {
    if (!score || !txHash || !chainId) {
      alert("missing score or tx hash");
      return;
    }
    const chain = getChainInfo(chainId);
    const gameAddress = getContractAddress(chainId);
    if (!chain || !gameAddress) {
      alert("Game chain not supported");
      return;
    }
    setIsPending(true);
    const provider = new Provider(chain.rpcUrls.default.http[0]);
    const receipt = await checkIfTxIsFinalized(txHash, provider);
    setIsFinalized(true);
    const logs = await getReceiptLogs(receipt, gameAddress);
    const proof = await getGatewayProof(logs, provider);
    setIsProofReady(true);
    await waitForInteropRoot(logs, provider);
    setIsRootUpdated(true);

    const args = await getProveScoreArgs(
      score,
      playerAddress,
      logs,
      proof,
      chainId,
      gameAddress
    );
    writeContract({
      abi: leaderboardABI.abi,
      address: LEADERBOARD_ADDRESS,
      functionName: "proveScore",
      args,
    });
  }

  function handleScore(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) return;
    setScore(parseInt(e.target.value));
  }

  function handleReset() {
    setIsPending(false);
    setIsFinalized(false);
    setIsProofReady(false);
    setIsRootUpdated(false);
    setScore(0);
    setTxHash("");
  }

  useEffect(() => {
    setUpdate((prev) => prev + 1);
  }, [isConfirmed]);

  return (
    <div className="card">
      {!isPending ? (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <label>Tx Hash:</label>
            <input
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              style={{ ...styles.input, width: "100%" }}
              type="text"
              value={txHash}
            />
            <label>Score:</label>
            <input
              onChange={handleScore}
              placeholder="0"
              style={{ ...styles.input, width: "60px" }}
              type="number"
              value={score}
            />
            <label>Game Chain:</label>
            <select
              id="selectedGameChain"
              name="selectedGameChain"
              style={{ ...styles.input, width: 160 }}
              onChange={(e) => setChainId(Number(e.target.value))}
            >
              <option value={gameChain1.id}>{gameChain1.name}</option>
              <option value={gameChain2.id}>{gameChain2.name}</option>
            </select>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "12px",
              justifyContent: "center",
            }}
          >
            <button
              className="buttonLarge"
              disabled={isPending}
              onClick={proveScore}
            >
              ProveScore
            </button>
          </div>
        </>
      ) : (
        <div>
          <h3>Status</h3>
          {isPending && (
            <Status
              isLoading={!isFinalized}
              text={
                isFinalized
                  ? "Game Transaction Finalized"
                  : "Game Transaction Finalizing"
              }
            />
          )}
          {isFinalized && (
            <Status
              isLoading={!isProofReady}
              text={
                isProofReady
                  ? "Message Proof Ready"
                  : "Waiting for Message Proof"
              }
            />
          )}
          {isProofReady && (
            <Status
              isLoading={!isRootUpdated}
              text={
                isRootUpdated
                  ? "Interop Root Updated"
                  : "Waiting for Interop Root"
              }
            />
          )}
          {isRootUpdated && (
            <Status
              isLoading={!isSuccess}
              text={
                isSuccess ? "Proved on Leaderboard" : "Proving on Leaderboard"
              }
            />
          )}
          {isSuccess && (
            <Status
              isLoading={isConfirming}
              text={
                isConfirming
                  ? "Proof Transaction Finalizing"
                  : "Proof Transaction Finalized"
              }
            />
          )}
          {isConfirmed && (
            <button className="buttonSmall" onClick={handleReset}>
              Reset
            </button>
          )}
        </div>
      )}
      <LeaderboardStats update={update} />
    </div>
  );
}

const styles = {
  input: { marginLeft: 4, padding: "4px", fontSize: "18px" },
};
