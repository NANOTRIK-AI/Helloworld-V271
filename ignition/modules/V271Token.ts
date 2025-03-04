import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Ignition module for deploying V271Token
 * 
 * This module handles the deployment of the V271 token with its mathematical constants
 * based on the Riemann zeta function.
 */
export default buildModule("V271Token", (m) => {
  // Deploy the V271Token contract
  const v271Token = m.contract("V271Token");

  return { v271Token };
});