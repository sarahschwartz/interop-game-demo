import { LeaderboardStats } from "./LeaderboardStats";
import gameABI from "../../../contracts/artifacts/contracts/Game.sol/Game.json";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import Spinner from "./Spinner";
import { useEffect, useState } from "react";
import { getContractAddress } from "../../utils/wagmi";

export function GameView({ playerAddress, chainId }: { playerAddress: `0x${string}`, chainId: number }) {
  const [update, setUpdate] = useState<number>(0);
  const { writeContract, data: hash, isPending } = useWriteContract();

  const gameAddress = getContractAddress(chainId);

  const { data: playerHSData, refetch: refetchPlayerHS } = useReadContract({
    abi: gameABI.abi,
    address: gameAddress!,
    functionName: "scores",
    args: [playerAddress],
    chainId,
  });
  const { data: hsData, refetch: refetchGameHS } = useReadContract({
    abi: gameABI.abi,
    address: gameAddress!,
    functionName: "highestScore",
    chainId,
  });

  const highestScore = (hsData as bigint) ?? 0;
  const playerHighestScore = (playerHSData as bigint) ?? 0;

  function incrementScore() {
    console.log("incrementing score..");
    writeContract({
      abi: gameABI.abi,
      address: gameAddress!,
      functionName: "incrementScore",
      chainId,
    });
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    refetchPlayerHS();
    refetchGameHS();
    setUpdate((prev) => prev + 1);
  }, [isConfirmed]);

  return (
    <div className="card">
      <button className="buttonLarge" disabled={isPending} onClick={() => incrementScore()}>
        Increment Score
      </button>
      <div style={{ marginTop: "12px" }}>
        {isConfirming && <Spinner />}
        {isConfirmed && hash && (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => {
              navigator.clipboard.writeText(hash);
            }}
          >
            Transaction hash: {hash}
          </div>
        )}
      </div>
      <div>
        <h3>Your Stats</h3>
        <p>Your High Score: {playerHighestScore}</p>
        <p>Game High Score: {highestScore}</p>
      </div>
      <LeaderboardStats update={update} />
    </div>
  );
}
