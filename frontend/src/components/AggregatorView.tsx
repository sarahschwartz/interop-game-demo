import { AggregatorStats } from "./AggregatorStatus";
import { CheckIconWithText } from "./CheckIconWithText";
import { Status } from "./Status";
import { GREEN } from "../../utils/constants"

export function AggregatorView() {
  return (
    <div className="card">
      <CheckIconWithText color="#B3A5E5" text="Aggregator contract detected" />
      <button style={{ border: "1px solid #6863D9" }}>Prove Score</button>
      <div>
        <h3>Status</h3>
        <Status color={GREEN} text="Transaction Finalized" />
        <Status color={GREEN} text="Message Proof Ready" />
        <Status isLoading color={GREEN} text="Interop Root Updated" />
      </div>
      <AggregatorStats />
    </div>
  );
}