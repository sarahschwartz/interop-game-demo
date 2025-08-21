import "./App.css";
import { AggregatorView } from "./components/AggregatorView";
import { GameView } from "./components/GameView";

function App() {
  return (
    <>
      <h1>ZKsync Interop Messages Demo</h1>
      <h2>You are connected to Era (Chain 123)</h2>
      <GameView />
      <AggregatorView />
    </>
  );
}


export default App;
