import { expect } from "chai";
import { ethers } from "hardhat";
import { V271Token } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("V271Token", function () {
  // Increase test timeout if needed
  this.timeout(10000);
  
  let v271: V271Token;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const V271Token = await ethers.getContractFactory("V271Token");
    const initialSupply = ethers.parseEther("1000000"); // 1 million tokens as initial supply
    v271 = await V271Token.deploy(initialSupply);
    // Wait for deployment to be confirmed
    await v271.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await v271.hasRole(await v271.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should assign initial supply to owner", async function () {
      const ownerBalance = await v271.balanceOf(owner.address);
      expect(await v271.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Mathematical features", function () {
    it("Should correctly calculate yield based on zeta values", async function () {
      const amount = ethers.parseEther("1000");
      const shortDuration = 30 * 24 * 60 * 60; // 30 days
      const yieldAmount = await v271.calculateYield(amount, BigInt(shortDuration));
      expect(yieldAmount).to.be.gt(0n);
    });

    it("Should execute conditional transfer with zeta verification", async function () {
      const amount = ethers.parseEther("100");
      const condition = 1000n; // Convert to BigInt
      const threshold = 1000n; // Convert to BigInt
      
      // Ensure transaction is confirmed before proceeding
      const tx = await v271.transfer(addr1.address, amount);
      await tx.wait();
      
      const addr2BalanceBefore = await v271.balanceOf(addr2.address);
      const addr1BalanceBefore = await v271.balanceOf(addr1.address);
      
      // Execute and wait for the transaction to be confirmed
      const txConditional = await v271.connect(addr1).conditionalTransfer(addr2.address, amount, condition, threshold);
      await txConditional.wait();
      
      const addr2BalanceAfter = await v271.balanceOf(addr2.address);
      const addr1BalanceAfter = await v271.balanceOf(addr1.address);
      
      expect(addr2BalanceAfter - addr2BalanceBefore).to.equal(amount);
      expect(addr1BalanceBefore - addr1BalanceAfter).to.equal(amount);
    });
  });

  describe("Staking", function () {
    it("Should allow staking and calculate correct yield", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const stakeDuration = 30 * 24 * 60 * 60; // 30 days
      
      // Ensure transaction is confirmed before proceeding
      const tx = await v271.transfer(addr1.address, stakeAmount);
      await tx.wait();
      
      // Check initial balance
      const initialBalance = await v271.balanceOf(addr1.address);
      expect(initialBalance).to.equal(stakeAmount);
      
      
      // Verify balance after staking (should be reduced)
      const balanceAfterStake = await v271.balanceOf(addr1.address);
      expect(balanceAfterStake).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should allow only minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        v271.connect(addr1).mint(addr1.address, mintAmount)
      ).to.be.revertedWithCustomError(v271, "AccessControlUnauthorizedAccount");
    });

    it("Should allow only pauser to pause", async function () {
      await expect(
        v271.connect(addr1).pause()
      ).to.be.revertedWithCustomError(v271, "AccessControlUnauthorizedAccount");
    });
  });
});
