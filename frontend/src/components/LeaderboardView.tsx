import { LeaderboardStats } from "./LeaderboardStats";
import { CheckIconWithText } from "./CheckIconWithText";
import { Status } from "./Status";
import { LEADERBOARD_ADDRESS, GREEN } from "../../utils/constants";
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

export function LeaderboardView({
  playerAddress,
}: {
  playerAddress: `0x${string}`;
}) {
  const [update, setUpdate] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [txHash, setTxHash] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isFinalized, setIsFinalized] = useState<boolean>(false);
  const [isProofReady, setIsProofReady] = useState<boolean>(false);
  const [isRootUpdated, setIsRootUpdated] = useState<boolean>(false);
  const {
    writeContract,
    data: proveHash,
    isSuccess
  } = useWriteContract();

  const { isSuccess: isConfirmed, isLoading: isConfirming } =
      useWaitForTransactionReceipt({ hash: proveHash });

  async function proveScore() {
    if (!score || !txHash) {
      alert("missing score or tx hash");
      return;
    }
    console.log("proving score..");
    setIsPending(true);
    const receipt = await checkIfTxIsFinalized(txHash);
    setIsFinalized(true);
    const logs = await getReceiptLogs(receipt);
    const proof = await getGatewayProof(logs);
    setIsProofReady(true);
    await waitForInteropRoot(logs);
    setIsRootUpdated(true);

    const args = await getProveScoreArgs(score, playerAddress, logs, proof);
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
      <CheckIconWithText color="#B3A5E5" text="Leaderboard contract detected" />
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
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "12px",
              justifyContent: "center",
            }}
          >
            <button className="buttonLarge" disabled={isPending} onClick={proveScore}>
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
              color={GREEN}
              text={isFinalized ? "Game Transaction Finalized" : "Game Transaction Finalizing"}
            />
          )}
          {isFinalized && (
            <Status
              isLoading={!isProofReady}
              color={GREEN}
              text={isProofReady ? "Message Proof Ready" : "Waiting for Message Proof"}
            />
          )}
          {isProofReady && (
            <Status
              isLoading={!isRootUpdated}
              color={GREEN}
              text={isRootUpdated ? "Interop Root Updated" : "Waiting for Interop Root"}
            />
          )}
          {isRootUpdated && (
            <Status
              isLoading={!isSuccess}
              color={GREEN}
              text={isSuccess ? "Proved on Leaderboard" : "Proving on Leaderboard"}
            />
          )}
          {isSuccess && (
            <Status
              isLoading={isConfirming}
              color={GREEN}
              text={isConfirming ? "Proof Transaction Finalizing" : "Proof Transaction Finalized"}
            />
          )}
          {isConfirmed && <button className="buttonSmall" onClick={handleReset}>Reset</button>}
        </div>
      )}
      <LeaderboardStats update={update} />
    </div>
  );
}

const styles = {
  input: { marginLeft: 4, padding: "4px", fontSize: "18px" },
};
