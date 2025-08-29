import "./App.css";
import { LeaderboardView } from "./components/LeaderboardView";
import { GameView } from "./components/GameView";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { injected } from "@wagmi/connectors";
import { wagmiConfig, leaderboardChain } from "../utils/wagmi";

function App() {
  const { connect } = useConnect();
  const { address, isConnected, chain } = useAccount();
  const { chains, switchChain } = useSwitchChain()
  const isOnSupportedChain = wagmiConfig.chains.some((c) => c.id === chain?.id);

  const SwitchChains = () => (
    <div style={{display: "flex", gap: "12px", justifyContent: "center"}}>
      {chains.map((c) => (
        <button className={chain?.id === c.id ? "buttonSmall activeNetwork" :"buttonSmall"} key={c.id} onClick={() => switchChain({ chainId: c.id })}>
          {c.name}
        </button>
      ))}
    </div>
  )

  return (
    <>
      {!isConnected || !address ? (
        <button className="buttonLarge" onClick={() => connect({ connector: injected() })}>
          Connect Wallet
        </button>
      ) : (
        <div>
           
          {!isOnSupportedChain || !chain ? (
            <>
            <div>Switch to a supported network</div>
            <SwitchChains/>
            </>
          ) : (
            <>
              <h1>ZKsync Interop Messages Demo</h1>
              <SwitchChains/>
              <h2>
                You are connected to {chain.name} ({chain.id})
              </h2>
              {chain.id === leaderboardChain.id ? (
                <LeaderboardView playerAddress={address} />
              ) : (
                <GameView playerAddress={address} chainId={chain.id} />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default App;
