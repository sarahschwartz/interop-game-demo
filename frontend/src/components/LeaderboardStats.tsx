import { useReadContract } from "wagmi";
import * as leaderboardABI from "../../../contracts/artifacts/contracts/GameLeaderboard.sol/GameLeaderboard.json";
import { LEADERBOARD_ADDRESS } from "../../utils/constants";
import { wagmiConfig, leaderboardChain } from "../../utils/wagmi";
import React, { useEffect } from "react";

export function LeaderboardStats({ update }: { update: number }) {
  const { data: hsData, refetch: refetchHsData } = useReadContract({
    abi: leaderboardABI.abi,
    address: LEADERBOARD_ADDRESS,
    functionName: "highestScore",
    chainId: leaderboardChain.id,
  });
  const { data: winningData, refetch: refetchWinningData } = useReadContract({
    abi: leaderboardABI.abi,
    address: LEADERBOARD_ADDRESS,
    functionName: "winningChainId",
    chainId: leaderboardChain.id,
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
    <div style={styles.stats}>
      <div>
        <h3 style={styles.heading}>🏆 Leaderboard Chain 🏆</h3>
        <div style={styles.subheading}>
          (Only high scores proved on the leaderboard chain will show here)
        </div>
      </div>
      <p>
        🥇 Winning Chain: {winningChainName} ({winningChainId})
      </p>
      <p>🧡 Highest Score: {highestScore}</p>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  stats: {
    border: "2px solid #ff735e",
    backgroundColor: "#fbecc6ff",
    borderRadius: "8px",
    marginTop: "24px",
  },
  heading: {
    marginTop: "1em"
  },
  subheading: {
    color: "#ff735e",
  },
};
