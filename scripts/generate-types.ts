import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Ensure artifacts directory exists
if (!fs.existsSync("./artifacts/contracts")) {
  console.error("No artifacts found. Please compile your contracts first.");  
}