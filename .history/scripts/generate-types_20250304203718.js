const { execSync } = require('child_process');

// Run TypeChain targeting Hardhat artifacts
console.log('Generating TypeChain typings...');
try {
  execSync(
    'npx typechain --target ethers-v6 --out-dir typechain-types "artifacts/contracts/**/*.json"', 
    { stdio: 'inherit' }
  );
  console.log('TypeChain typings generated successfully');
} catch (error) {
  console.error('Error generating TypeChain typings:', error);
  process.exit(1);
}
