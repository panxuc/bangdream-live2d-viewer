// scripts/link-local.js
const { execSync } = require("child_process");

try {
  console.log("Linking local package: pixi-live2d-display");
  execSync("yarn link", { cwd: "./pixi-live2d-display", stdio: "inherit" });
  execSync("yarn link pixi-live2d-display", { stdio: "inherit" });
} catch (error) {
  console.error("Linking failed:", error);
  process.exit(1);
}
