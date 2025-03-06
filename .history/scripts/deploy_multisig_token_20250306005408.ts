import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment with multisig support...");

  // Get signers for the multisig wallet
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  // Define multisig wallet parameters
  // Add your owner addresses here (including deployer)
  const owners = [
    deployer.address,
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Example address 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"  // Example address 2
  ];
  
  const requiredConfirmations = 2; // Number of signatures required
  
  // Deploy MultisigWallet
  console.log("Deploying MultisigWallet...");
  const MultisigWallet = await ethers.getContractFactory("MultisigWallet");
  const multisigWallet = await MultisigWallet.deploy(owners, requiredConfirmations);
  await multisigWallet.waitForDeployment();

  const multisigAddress = await multisigWallet.getAddress();
  console.log(`MultisigWallet deployed to: ${multisigAddress}`);

  // Deploy ERC20TokenV271 with multisig as owner
  console.log("Deploying ERC20TokenV271...");
  const ERC20TokenV271 = await ethers.getContractFactory("ERC20TokenV271");
  
  // Token parameters
  const name = "Token V271";
  const symbol = "V271";
  const decimals = 18;
  const initialSupply = 1000000; // 1 million tokens
  const description = "ERC20 Token V271 with multisig governance";

  // Deploy with multisig wallet as the owner
  const token = await ERC20TokenV271.deploy(
    name,
    symbol,
    decimals,
    initialSupply,
    description,
    multisigAddress // Set the multisig wallet as the initial owner
  );

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`ERC20TokenV271 deployed to: ${tokenAddress}`);
  
  console.log("\nDeployment Summary:");
  console.log(`MultisigWallet: ${multisigAddress}`);
  console.log(`ERC20TokenV271: ${tokenAddress}`);
  console.log(`Token Owner (MultisigWallet): ${multisigAddress}`);
  console.log(`Required Confirmations: ${requiredConfirmations}`);
  console.log(`Total Owners: ${owners.length}`);
  console.log("Owners:");
  owners.forEach((owner, index) => {
    console.log(`  ${index + 1}. ${owner}`);
  });
}

// We recommend this pattern to be able to use async/await everywhere
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
