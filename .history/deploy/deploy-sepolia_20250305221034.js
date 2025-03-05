const hre = require("hardhat");


async function main() {
    
  // Get contract factory for V271Token
  const V271Token = await hre.ethers.getContractFactory("V271Token");
  console.log("Deploying V271Token...");

  // Deploy the contract
  const token = await V271Token.deploy();
  await token.deployed();

  console.log("V271Token deployed to:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
