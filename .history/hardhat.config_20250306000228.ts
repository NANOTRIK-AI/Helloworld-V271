import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import "./tasks/erc721/mint"
import "./tasks/utils/accounts"
import "./tasks/utils/balance"
import "./tasks/utils/block-number"
import "./tasks/utils/send-eth"const config: HardhatUserConfig = {
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
      accounts: [
        {
          privateKey: "0x1c48003d21bab19690fe5620a8b54ac9be8f85d3b60959874c3bc89e2ee1552d",
          balance: "10000000000000000000000" // 10000 ETH
        }
      ],
      mining: {
        auto: true,
        interval: 0
      }
    },
    sepolia: { // Added Ethereum Sepolia network configuration
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    mainnet: { // Added Ethereum Mainnet network configuration
      chainId: 1,
      url: process.env.MAINNET_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "hardhat",
        chainId: 1337,
        urls: {
          apiURL: "http://127.0.0.1:5173",
          browserURL: "http://127.0.0.1:5173"
        }
      }
    ]
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
