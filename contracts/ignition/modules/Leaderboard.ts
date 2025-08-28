import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GAME_CHAIN_1_CONTRACT_ADDRESS = process.env.GAME_CHAIN_1_CONTRACT_ADDRESS as `0x${string}`;
const GAME_CHAIN_2_CONTRACT_ADDRESS = process.env.GAME_CHAIN_2_CONTRACT_ADDRESS as `0x${string}`;

const GAME_CHAIN_1_ID = "5328";
const GAME_CHAIN_2_ID = "9313";

export default buildModule("GameLeaderboardModule", (m) => {
  const approvedChainIds = [GAME_CHAIN_1_ID, GAME_CHAIN_2_ID];
  const approvedGameContracts = [GAME_CHAIN_1_CONTRACT_ADDRESS, GAME_CHAIN_2_CONTRACT_ADDRESS];
  console.log("Approved game contracts:", approvedGameContracts)
  const counter = m.contract("GameLeaderboard", [approvedChainIds, approvedGameContracts]);

  return { counter };
});
