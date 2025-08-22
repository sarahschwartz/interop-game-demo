import { useReadContract } from "wagmi";
import * as leaderboardABI from "../../../contracts/artifacts/contracts/GameLeaderboard.sol/GameLeaderboard.json";
import { LEADERBOARD_ADDRESS } from "../../utils/constants";
import { wagmiConfig, zkChain2 } from "../../utils/wagmi";
import { useEffect } from "react";

export function LeaderboardStats({ update }: { update: number}) {
  const { data: hsData, refetch: refetchHsData } = useReadContract({
    abi: leaderboardABI.abi,
    address: LEADERBOARD_ADDRESS,
    functionName: "highestScore",
    chainId: zkChain2.id,
  });
  const { data: winningData, refetch: refetchWinningData } = useReadContract({
    abi: leaderboardABI.abi,
    address: LEADERBOARD_ADDRESS,
    functionName: "winningChainId",
    chainId: zkChain2.id,
  });

  const highestScore = (hsData as bigint) ?? 0;
  const winningChainId = (winningData as bigint) ?? 0;

  const winningChainName =
    wagmiConfig.chains.find(
      (chain) => chain.id === parseInt(winningChainId.toString())
    )?.name ?? "Not found";

     useEffect(() => {
        refetchHsData();
        refetchWinningData();
      }, [update]);

  return (
    <div>
      <h3>Network Leaderboard</h3>
      <p>
        Winning Chain: {winningChainName} ({winningChainId})
      </p>
      <p>Highest Score: {highestScore}</p>
    </div>
  );
}
