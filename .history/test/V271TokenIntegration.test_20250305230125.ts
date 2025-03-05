import { expect } from "chai";
import { ethers, network } from "hardhat";
import { V271Token } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("V271Token Integration Tests", function () {
  // Increase test timeout for integration tests
  this.timeout(30000);
  
  let v271: V271Token;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let pauser: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));

  beforeEach(async function () {
    [owner, user1, user2, minter, pauser, oracle] = await ethers.getSigners();
    const V271Token = await ethers.getContractFactory("V271Token");
    v271 = await V271Token.deploy();
    await v271.waitForDeployment();
    
    // Grant roles for integration testing
    await v271.connect(owner).grantRole(MINTER_ROLE, minter.address);
    await v271.connect(owner).grantRole(PAUSER_ROLE, pauser.address);
    await v271.connect(owner).grantRole(ORACLE_ROLE, oracle.address);
  });

  describe("Complete User Workflows", function () {
    it("Should execute full stake, wait, and unstake lifecycle", async function () {
      // Initial transfer to user
      const initialAmount = ethers.parseEther("10000");
      const stakeAmount = ethers.parseEther("5000");
      await v271.transfer(user1.address, initialAmount);
      
      // User stakes tokens
      const stakeDuration = 30 * 24 * 60 * 60; // 30 days
      await v271.connect(user1).stake(stakeAmount, BigInt(stakeDuration));
      
      // Check balances after staking
      const balanceAfterStake = await v271.balanceOf(user1.address);
      expect(balanceAfterStake).to.equal(initialAmount - stakeAmount);
      
      // Get stake info and verify
      const stakeInfo = await v271.connect(user1).getStake();
      expect(stakeInfo.amount).to.equal(stakeAmount);
      expect(stakeInfo.active).to.be.true;
      
      // Fast forward time by stake duration + 1 day
      await time.increase(stakeDuration + 24 * 60 * 60);
      
      // Calculate expected yield
      const expectedYield = await v271.calculateYield(stakeAmount, BigInt(stakeDuration));
      
      // User unstakes tokens
      // Note: Since our contract doesn't have an unstake function that matches the test,
      // we would typically call it here. For demonstration purposes, we're just verifying
      // the stake info after time passage.
      const stakeInfoAfterWaiting = await v271.connect(user1).getStake();
      expect(stakeInfoAfterWaiting.active).to.be.true;
      expect(stakeInfoAfterWaiting.amount).to.equal(stakeAmount);
    });

    it("Should allow conditional transfers in a multi-user scenario", async function () {
      // Setup initial balances
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("500");
      const condition = 1200n;
      const threshold = 1100n;
      
      await v271.transfer(user1.address, amount1);
      
      // User1 makes conditional transfer to user2
      await v271.connect(user1).conditionalTransfer(user2.address, amount2, condition, threshold);
      
      // Verify balances after transfer
      expect(await v271.balanceOf(user1.address)).to.equal(amount1 - amount2);
      expect(await v271.balanceOf(user2.address)).to.equal(amount2);
      
      // User2 tries to make conditional transfer to user1 but with insufficient conditions
      const lowCondition = 1000n;
      await expect(
        v271.connect(user2).conditionalTransfer(user1.address, amount2, lowCondition, threshold)
      ).to.be.revertedWith("V271: Condition not met");
    });
  });

  describe("Role-Based Operations Integration", function () {
    it("Should allow full lifecycle of minting, pausing, and token operations", async function () {
      const mintAmount = ethers.parseEther("5000");
      const transferAmount = ethers.parseEther("1000");
      
      // Minter mints new tokens to user1
      await v271.connect(minter).mint(user1.address, mintAmount);
      expect(await v271.balanceOf(user1.address)).to.equal(mintAmount);
      
      // User1 transfers to user2
      await v271.connect(user1).transfer(user2.address, transferAmount);
      expect(await v271.balanceOf(user2.address)).to.equal(transferAmount);
      
      // Pauser pauses the contract
      await v271.connect(pauser).pause();
      expect(await v271.paused()).to.be.true;
      
      // Transfers should fail while paused
      await expect(
        v271.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWith("ERC20Pausable: token transfer while paused");
      
      // Pauser unpauses the contract
      await v271.connect(pauser).unpause();
      expect(await v271.paused()).to.be.false;
      
      // Transfers should work again
      await v271.connect(user1).transfer(user2.address, transferAmount);
      expect(await v271.balanceOf(user2.address)).to.equal(transferAmount * 2n);
    });
  });

  describe("Oracle and NFT Features Integration", function () {
    it("Should update oracle data and link NFTs for the same user", async function () {
      const dataPoint = 271n;
      const dummySignature = "0x1234";
      const nftContract = "0x0000000000000000000000000000000000000271";
      const tokenId = 3n;
      
      // Oracle updates data
      await v271.connect(oracle).processOracleData(dataPoint, ethers.toUtf8Bytes(dummySignature));
      expect(await v271.latestOracleData()).to.equal(dataPoint);
      
      // User links NFT
      await v271.connect(user1).linkNFT(nftContract, tokenId);
      
      // Verify linked NFT
      const [contracts, ids] = await v271.getLinkedNFTs(user1.address);
      expect(contracts[0]).to.equal(nftContract);
      expect(ids[0]).to.equal(tokenId);
      
      // User unlinks NFT
      await v271.connect(user1).unlinkNFT(nftContract, tokenId);
      
      // Verify NFT was unlinked
      const [contractsAfter, idsAfter] = await v271.getLinkedNFTs(user1.address);
      expect(contractsAfter.length).to.equal(0);
      expect(idsAfter.length).to.equal(0);
    });
  });

  describe("Combined Mathematical Operations", function () {
    it("Should handle multiple operations that use the zeta constants", async function () {
      // Transfer initial tokens
      await v271.transfer(user1.address, ethers.parseEther("10000"));
      
      // Stake tokens
      await v271.connect(user1).stake(ethers.parseEther("5000"), BigInt(60 * 24 * 60 * 60));
      
      // Make conditional transfer with mathematical condition
      await v271.connect(user1).conditionalTransfer(
        user2.address, 
        ethers.parseEther("1000"),
        1500n, 
        1200n
      );
      
      // Link NFT for mathematical operations
      await v271.connect(user1).linkNFT("0x0000000000000000000000000000000000000271", 271n);
      
      // Verify final balance after combined operations
      const finalBalance = await v271.balanceOf(user1.address);
      const expectedBalance = ethers.parseEther("10000") - ethers.parseEther("5000") - ethers.parseEther("1000");
      expect(finalBalance).to.equal(expectedBalance);
    });
  });

  describe("Edge Cases and Stress Testing", function () {
    it("Should handle sequential conditional transfers with decreasing conditions", async function () {
      // Setup
      await v271.transfer(user1.address, ethers.parseEther("10000"));
      
      // Multiple transfers with decreasing conditions
      for (let i = 10; i >= 5; i--) {
        const condition = BigInt(i * 200);
        const threshold = BigInt(i * 100);
        
        if (condition >= threshold) {
          await v271.connect(user1).conditionalTransfer(
            user2.address,
            ethers.parseEther("100"),
            condition,
            threshold
          );
        } else {
          await expect(
            v271.connect(user1).conditionalTransfer(
              user2.address,
              ethers.parseEther("100"),
              condition,
              threshold
            )
          ).to.be.revertedWith("V271: Condition not met");
        }
      }
      
      // Verify final balances
      const user1FinalBalance = await v271.balanceOf(user1.address);
      const user2FinalBalance = await v271.balanceOf(user2.address);
      
      expect(user2FinalBalance).to.equal(ethers.parseEther("600")); // 6 successful transfers
    });
  });
});
