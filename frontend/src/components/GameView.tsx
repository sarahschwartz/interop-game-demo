import { GAME_ADDRESS, GREEN } from "../../utils/constants";
import { AggregatorStats } from "./AggregatorStatus";
import { CheckIconWithText } from "./CheckIconWithText";
import gameABI from "../../../contracts/artifacts/contracts/Game.sol/Game.json";
import { zkChain1 } from "../../utils/wagmi";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import Spinner from "./Spinner";
import { useEffect, useState } from "react";

export function GameView({ playerAddress }: { playerAddress: `0x${string}` }) {
  const [update, setUpdate] = useState<number>(0);
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { data: playerHSData, refetch: refetchPlayerHS } = useReadContract({
    abi: gameABI.abi,
    address: GAME_ADDRESS,
    functionName: "scores",
    args: [playerAddress],
    chainId: zkChain1.id,
  });
  const { data: hsData, refetch: refetchGameHS } = useReadContract({
    abi: gameABI.abi,
    address: GAME_ADDRESS,
    functionName: "highestScore",
    chainId: zkChain1.id,
  });

  const highestScore = (hsData as bigint) ?? 0;
  const playerHighestScore = (playerHSData as bigint) ?? 0;

  function incrementScore() {
    console.log("incrementing score..");
    writeContract({
      abi: gameABI.abi,
      address: GAME_ADDRESS,
      functionName: "incrementScore",
      chainId: zkChain1.id,
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
      <CheckIconWithText color={GREEN} text="Game contract detected" />
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
      <AggregatorStats update={update} />
    </div>
  );
}
