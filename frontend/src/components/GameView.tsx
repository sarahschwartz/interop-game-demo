import { GREEN } from "../../utils/constants";
import { AggregatorStats } from "./AggregatorStatus";
import { CheckIconWithText } from "./CheckIconWithText";

export function GameView() {
  return (
    <div className="card">
      <CheckIconWithText color={GREEN} text="Game contract detected" />
      <button>Increment Score</button>
      <div>
        <h3>Your Stats</h3>
        <p>Your High Score: 42</p>
        <p>Game High Score: 420</p>
      </div>
      <AggregatorStats />
    </div>
  );
}