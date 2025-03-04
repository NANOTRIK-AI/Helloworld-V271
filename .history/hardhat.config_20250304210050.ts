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
          optimizer: {,
            enabled: true,,
            runs: 200,,
          },
        },
      },
      // Any existing compiler configurations would remain here
    ],
  },,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",,
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6", // Updated to match our script
  }
};

export default config;
