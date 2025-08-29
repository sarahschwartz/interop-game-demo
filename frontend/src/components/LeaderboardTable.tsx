import { useEffect, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { leaderboardChain, wagmiConfig } from "../../utils/wagmi";
import * as leaderboardABI from "../../../contracts/artifacts/contracts/GameLeaderboard.sol/GameLeaderboard.json";
import { LEADERBOARD_ADDRESS } from "../../utils/constants";
import type { Abi } from "viem";

export function LeaderboardTable({ update }: { update: number }) {
  const chains = wagmiConfig.chains.filter(c => c.name !== "Leaderboard Chain");
  const { data, refetch } = useReadContracts({
    allowFailure: true,
    contracts: chains.map((c) => ({
      abi: leaderboardABI.abi as Abi,
      address: LEADERBOARD_ADDRESS as `0x${string}`,
      functionName: "highestScores",
      chainId: leaderboardChain.id,
      args: [c.id],
    }))
  });

  useEffect(() => { refetch(); }, [update, refetch]);

  const rows = useMemo(() => {
    if (!data) return [];
    return chains.map((c, i) => {
      const r = data[i];
      const [score, player] =
        r && r.status === "success"
          ? (r.result as readonly [bigint, string])
          : [0n, "-"] as const;

      return { id: c.id, name: c.name, score, player };
    })
    .sort((a, b) => (a.score === b.score ? a.id - b.id : a.score > b.score ? -1 : 1));
  }, [chains, data]);

  return (
    <table style={{
    margin: '0 auto 12px auto',
  }}>
      <thead>
        <tr>
          <th>Chain Name</th>
          <th>High Score</th>
          <th>Player Address</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ id, name, score, player }) => (
          <tr key={id}>
            <td>{name}</td>
            <td>{score.toString()}</td>
            <td>{player.slice(0, 8)}...{player.slice(-6)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
