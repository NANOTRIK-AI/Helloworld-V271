const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if artifacts directory exists
const artifactsDir = path.join(__dirname, '..', 'artifacts/contracts');
if (!fs.existsSync(artifactsDir)) {
  console.log('No artifacts found. Skipping type generation.');
  process.exit(0);
}

// Run TypeChain
console.log('Generating TypeChain types...');
try {
  execSync('npx typechain --target ethers-v6 --out-dir typechain-types "artifacts/!(build-info)/**/!(*.dbg*)*.json"', { 
    stdio: 'inherit' 
  });
  console.log('TypeChain types generated successfully');
} catch (error) {
  console.error('Error generating TypeChain types:', error.message);
  process.exit(1);
}
