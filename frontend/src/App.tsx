import "./App.css";
import { LeaderboardView } from "./components/LeaderboardView";
import { GameView } from "./components/GameView";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { injected } from "@wagmi/connectors";
import { wagmiConfig, zkChain2 } from "../utils/wagmi";

function App() {
  const { connect } = useConnect();
  const { address, isConnected, chain } = useAccount();
  const { chains, switchChain } = useSwitchChain()
  const isOnSupportedChain = wagmiConfig.chains.some((c) => c.id === chain?.id);

  const SwitchChains = () => (
    <div style={{display: "flex", gap: "12px", justifyContent: "center"}}>
      {chains.map((chain) => (
        <button className="buttonSmall" key={chain.id} onClick={() => switchChain({ chainId: chain.id })}>
          {chain.name}
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
           
          {!isOnSupportedChain ? (
            <>
            <div>Switch to a supported network</div>
            <SwitchChains/>
            </>
          ) : (
            <>
              <h1>ZKsync Interop Messages Demo</h1>
              <h2>
                You are connected to {chain?.name} ({chain?.id})
              </h2>
              <SwitchChains/>
              {chain?.id === zkChain2.id ? (
                <LeaderboardView playerAddress={address} />
              ) : (
                <GameView playerAddress={address} />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default App;
