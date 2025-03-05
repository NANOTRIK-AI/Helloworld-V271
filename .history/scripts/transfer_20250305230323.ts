import { ethers } from "hardhat";

async function transferTokens() {
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deployed();
  const [owner, addr1] = await ethers.getSigners();
  const recipientAddress = addr1.address; // Change this to your desired wallet address

  // Transfer tokens
  const transferTx = await token.transfer(recipientAddress, ethers.utils.parseEther("10"));
  await transferTx.wait();
  console.log("Tokens transferred successfully.");
}

transferTokens();
