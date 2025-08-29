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

export function GameView({
  playerAddress,
  chainId,
}: {
  playerAddress: `0x${string}`;
  chainId: number;
}) {
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

  const ClipboardIcon = () => {
  const [show, setShow] = useState(false);

  function copy(){
    if(hash) navigator.clipboard.writeText(hash);
    setShow(true);
    setTimeout(() => { setShow(false) }, 3000);
  }
  return (
  <>
  <div style={{ height: 20, width: 20, cursor: "pointer" }} onClick={copy}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z"
      />
    </svg>
  </div>
  <div id="toast" className={show ? "show" : ""}>Copied tx hash to clipboard</div>
  </>
)};

  return (
    <div className="card">
      <div>
        <p>Your High Score: {playerHighestScore}</p>
        <p>Game Chain High Score: {highestScore}</p>
      </div>
      <button
        className="buttonLarge"
        disabled={isPending}
        onClick={() => incrementScore()}
      >
        Increment Score
      </button>
      <div style={{ marginTop: "12px" }}>
        {isConfirming && <Spinner />}
        {isConfirmed && hash && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              alignItems: "center"
            }}
          >
            <ClipboardIcon />
            <p>
              Transaction hash: {hash.substring(0, 8)}...
              {hash.substring(hash.length - 6)}
            </p>
          </div>
        )}
      </div>
      
      <LeaderboardStats update={update} />
    </div>
  );
}
