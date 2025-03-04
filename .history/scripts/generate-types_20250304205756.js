const { runTypeChain, glob } = require('typechain');
const path = require('path');

async function main() {
  const cwd = process.cwd();
  const artifactsDir = path.join(cwd, 'artifacts/contracts');
  
  const allFiles = glob(cwd, [
    `${artifactsDir}/**/*.json`,
  ]);

  await runTypeChain({
    cwd,
    filesToProcess: allFiles,
    allFiles,
    outDir: path.join(cwd, 'typechain'),
    target: 'ethers-v6',
  });

  console.log('TypeChain artifacts generated successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
