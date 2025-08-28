import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GameModule", (m) => {
  const counter = m.contract("Game");

  return { counter };
});
