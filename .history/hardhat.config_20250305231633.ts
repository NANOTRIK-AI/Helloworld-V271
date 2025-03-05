import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: []
      mining: {
        auto: true,
        interval: 0
      }
    },
    sepolia: { // Added Ethereum Sepolia network configuration
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    url: "https://api-sepolia.etherscan.io/api"
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  ethers: {
    target: "ethers-v6" // Updated to match our script
  },
  mocha: {
    timeout: 60000 // Set timeout to 60 seconds
  }
};

export default config;
