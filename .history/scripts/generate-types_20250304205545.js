const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if artifacts directory exists
const artifactsDir = path.join(__dirname, '..', 'artifacts/contracts');
if (!fs.existsSync(artifactsDir)) {
  console.log('No artifacts found. Skipping type generation.');
  process.exit(0);
}
} catch (error) {
  console.error('Error generating TypeChain typings:', error);
  process.exit(1);
}
