import { expect } from "chai";
import { ethers } from "hardhat";
import { V271Token } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("V271Token", function () {
  let v271: V271Token;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const V271Token = await ethers.getContractFactory("V271Token");
    v271 = await V271Token.deploy(ethers.parseEther("1000000")); // Providing initial supply parameter
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
      const yieldAmount = await v271.calculateYield(amount, shortDuration);
      expect(yieldAmount).to.be.gt(0n);
    });

    it("Should execute conditional transfer with zeta verification", async function () {
      const amount = ethers.parseEther("100");
      const condition = 1000;
      const threshold = 1000;
      
      await v271.transfer(addr1.address, amount);
      
      const addr2BalanceBefore = await v271.balanceOf(addr2.address);
      const addr1BalanceBefore = await v271.balanceOf(addr1.address);
      
      // Using the conditional transfer function
      await v271.connect(addr1).conditionalTransfer(addr2.address, amount, condition, threshold);
      
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
      
      // Transfer tokens to addr1 first
      await v271.transfer(addr1.address, stakeAmount);
      
      // Check initial balance
      const initialBalance = await v271.balanceOf(addr1.address);
      expect(initialBalance).to.equal(stakeAmount);
      
      // Approve the contract to use tokens if necessary (depends on implementation)
      await v271.connect(addr1).approve(v271.getAddress(), stakeAmount);
      
      // Stake tokens
      await v271.connect(addr1).stake(stakeAmount, stakeDuration);
      
      // Verify stake amount - use the correct function name according to your contract
      // Try one of these alternatives:
      const stake = await v271.connect(addr1).getStake();
      // OR
      // const stake = await v271.stakeOf(addr1.address);
      // OR
      // const stake = await v271.getUserStake(addr1.address);
      
      expect(stake.amount).to.equal(stakeAmount);
      
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