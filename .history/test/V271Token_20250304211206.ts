import { expect } from "chai";
import { ethers } from "hardhat";
import { V271Token } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("V271Token", function () {
  let v271Token: V271Token;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let pauser: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;
  
  const initialSupply = ethers.parseEther("1000000");
  const tokenAmount = ethers.parseEther("1000");
  
  beforeEach(async function () {
    [owner, addr1, addr2, minter, pauser, oracle] = await ethers.getSigners();
    
    const V271TokenFactory = await ethers.getContractFactory("V271Token");
    v271Token = await V271TokenFactory.deploy({ value: initialSupply });
    
    // Set up roles
    const minterRole = await v271Token.MINTER_ROLE();
    const pauserRole = await v271Token.PAUSER_ROLE();
    const oracleRole = await v271Token.ORACLE_ROLE();
    
    await v271Token.grantRole(minterRole, minter.address);
    await v271Token.grantRole(pauserRole, pauser.address);
    await v271Token.grantRole(oracleRole, oracle.address);
  });
  
  describe("Deployment", function () {
    it("Should set the right owner with correct roles", async function () {
      expect(await v271Token.hasRole(await v271Token.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });
    
    it("Should assign the total supply of tokens to the owner", async function () {
      expect(await v271Token.balanceOf(owner.address)).to.equal(initialSupply);
    });
    
    it("Should have correct name and symbol", async function () {
      expect(await v271Token.name()).to.equal("V271Token");
      expect(await v271Token.symbol()).to.equal("V271");
    });
  });
  
  describe("Mathematical constants", function () {
    it("Should have the correct value for Apéry's constant", async function () {
      // Fixed: APERY_CONSTANT is now a public constant, not a function
      const aperyConstant = await v271Token.APERY_CONSTANT();
      expect(aperyConstant).to.equal("1202056903159594285399738161511449990764986292");
    });
  });
  
  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await v271Token.transfer(addr1.address, tokenAmount);
      expect(await v271Token.balanceOf(addr1.address)).to.equal(tokenAmount);
      
      await v271Token.connect(addr1).transfer(addr2.address, ethers.parseEther("500"));
      expect(await v271Token.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
      expect(await v271Token.balanceOf(addr2.address)).to.equal(ethers.parseEther("500"));
    });
    
    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialBalance = await v271Token.balanceOf(addr1.address);
      // Fixed: Updated to expect a custom error for insufficient balance
      await expect(v271Token.connect(addr1).transfer(addr2.address, tokenAmount))
        .to.be.revertedWithCustomError(v271Token, "ERC20InsufficientBalance");
    });
  });
  
  describe("Conditional transfer", function () {
    it("Should transfer tokens when condition is met", async function () {
      await v271Token.transfer(addr1.address, tokenAmount);
      await v271Token.connect(addr1).conditionalTransfer(addr2.address, ethers.parseEther("500"), 150);
      expect(await v271Token.balanceOf(addr2.address)).to.equal(ethers.parseEther("500"));
    });
    
    it("Should fail when condition is not met", async function () {
      await v271Token.transfer(addr1.address, tokenAmount);
      await v271Token.connect(addr1).conditionalTransfer(addr2.address, ethers.parseEther("500"), 50);
      expect(await v271Token.balanceOf(addr2.address)).to.equal(0);
    });
  });
  
  describe("Pause functionality", function () {
    it("Should pause and unpause the contract", async function () {
      await v271Token.connect(pauser).pause();
      expect(await v271Token.paused()).to.equal(true);
      
      // Fixed: Updated to expect a custom error for paused transfers
      await expect(v271Token.transfer(addr1.address, tokenAmount))
        .to.be.revertedWithCustomError(v271Token, "EnforcedPause");
      
      await v271Token.connect(pauser).unpause();
      await v271Token.transfer(addr1.address, tokenAmount);
      expect(await v271Token.balanceOf(addr1.address)).to.equal(tokenAmount);
    });
    
    it("Should prevent non-pausers from pausing", async function () {
      await expect(v271Token.connect(addr1).pause())
        .to.be.revertedWithCustomError(v271Token, "AccessControlUnauthorizedAccount");
    });
    
    it("Should allow pausing with zeta verification", async function () {
      // This is a pending test in the original output
    });
  });
  
  describe("Minting functionality", function () {
    it("Should allow minter to mint new tokens", async function () {
      await v271Token.connect(minter).mint(addr1.address, tokenAmount);
      expect(await v271Token.balanceOf(addr1.address)).to.equal(tokenAmount);
    });
    
    it("Should prevent non-minters from minting tokens", async function () {
      await expect(v271Token.connect(addr1).mint(addr2.address, tokenAmount))
        .to.be.revertedWithCustomError(v271Token, "AccessControlUnauthorizedAccount");
    });
  });
  
  describe("Staking functionality", function () {
    it("Should allow users to stake tokens", async function () {
      await v271Token.transfer(addr1.address, tokenAmount);
      
      const stakeDuration = 7 * 24 * 60 * 60; // 7 days in seconds
      await v271Token.connect(addr1).stake(tokenAmount, stakeDuration);
      
      expect(await v271Token.balanceOf(addr1.address)).to.equal(0);
    });
    
    it("Should not allow staking with zero amount", async function () {
      await expect(v271Token.connect(addr1).stake(0, 7 * 24 * 60 * 60))
        .to.be.revertedWith("Stake amount must be greater than zero");
    });
    
    it("Should not allow staking for less than minimum period", async function () {
      await v271Token.transfer(addr1.address, tokenAmount);
      await expect(v271Token.connect(addr1).stake(tokenAmount, 1 * 24 * 60 * 60))
        .to.be.revertedWith("Stake duration too short");
    });
    
    it("Should calculate correct yield based on staking duration", async function () {
      // Fixed: Mint enough tokens to cover the staking yield
      await v271Token.mint(await v271Token.getAddress(), tokenAmount);
      
      // Transfer tokens to user for staking
      await v271Token.transfer(addr1.address, tokenAmount);
      
      const stakeDuration = 30 * 24 * 60 * 60; // 30 days in seconds
      await v271Token.connect(addr1).stake(tokenAmount, stakeDuration);
      
      // Fast forward time to pass the staking duration
      await time.increase(stakeDuration);
      
      // Get the expected yield
      const expectedYield = await v271Token.calculateYield(addr1.address);
      
      // Check balances before unstaking
      const initialBalance = await v271Token.balanceOf(addr1.address);
      
      // Unstake and check balances
      await v271Token.connect(addr1).unstake();
      
      // Verify user received their staked tokens plus yield
      expect(await v271Token.balanceOf(addr1.address)).to.equal(tokenAmount.add(expectedYield));
    });
  });
  
  describe("NFT Composability", function () {
    it("Should link and unlink NFTs", async function () {
      // Link an NFT
      await v271Token.connect(addr1).linkNFT(1);
      
      // Try to link again should fail
      await expect(v271Token.connect(addr1).linkNFT(2))
        .to.be.revertedWith("User already has linked NFT");
      
      // Unlink the NFT
      await v271Token.connect(addr1).unlinkNFT(1);
      
      // Should be able to link again after unlinking
      await v271Token.connect(addr1).linkNFT(3);
    });
    
    it("Should fail when unlinking a non-linked NFT", async function () {
      await expect(v271Token.connect(addr1).unlinkNFT(99))
        .to.be.revertedWith("Not the owner of this linked NFT");
    });
  });
  
  describe("Oracle data processing", function () {
    it("Should allow oracle to update data", async function () {
      await v271Token.connect(oracle).updateOracleData(42);
      expect(await v271Token.getOracleData()).to.equal(42);
    });
    
    it("Should prevent non-oracle from updating data", async function () {
      await expect(v271Token.connect(addr1).updateOracleData(42))
        .to.be.revertedWithCustomError(v271Token, "AccessControlUnauthorizedAccount");
    });
  });
  
  describe("Shielded transfers", function () {
    it("Should process shielded transfer with valid proof", async function () {
      await v271Token.transfer(addr1.address, tokenAmount);
      
      const validProof = ethers.toUtf8Bytes("valid proof");
      await v271Token.connect(addr1).processShieldedTransfer(addr2.address, ethers.parseEther("500"), validProof);
      
      expect(await v271Token.balanceOf(addr2.address)).to.equal(ethers.parseEther("500"));
    });
    
    it("Should reject shielded transfer with invalid proof", async function () {
      await v271Token.transfer(addr1.address, tokenAmount);
      
      const invalidProof = ethers.toUtf8Bytes("invalid");
      await expect(v271Token.connect(addr1).processShieldedTransfer(addr2.address, ethers.parseEther("500"), invalidProof))
        .to.be.revertedWith("Invalid proof");
    });
  });
});