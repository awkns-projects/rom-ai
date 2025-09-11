const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Starting contract verification on Etherscan...\n");

  // Load deployment addresses
  const deploymentsDir = path.join(__dirname, "..", "..", "..", "deployments");
  const addressesFile = path.join(deploymentsDir, "sepolia-addresses.json");
  const deploymentFile = path.join(deploymentsDir, "sepolia-deployment.json");

  if (!fs.existsSync(addressesFile)) {
    console.error("❌ Deployment addresses file not found:", addressesFile);
    console.log("Please run the deployment script first: pnpm run deploy:sepolia");
    process.exit(1);
  }

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment info file not found:", deploymentFile);
    console.log("Please run the deployment script first: pnpm run deploy:sepolia");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

  console.log("📋 Loaded deployment addresses:");
  for (const [name, address] of Object.entries(addresses)) {
    console.log(`  ${name}: ${address}`);
  }
  console.log("");

  const config = deploymentInfo.config;
  const deployerAddress = deploymentInfo.deployer;

  try {
    // Verify implementation contracts (no constructor arguments)
    console.log("🔍 Verifying implementation contracts...");

    const implementations = [
      { name: "NFTCollection", address: addresses.nftImplementation },
      { name: "BondingToken", address: addresses.bondingImplementation },
      { name: "BondingTokenETH", address: addresses.bondingETHImplementation },
      { name: "StakingPool", address: addresses.stakingImplementation },
    ];

    for (const impl of implementations) {
      console.log(`  Verifying ${impl.name}...`);
      try {
        await run("verify:verify", {
          address: impl.address,
          constructorArguments: [],
        });
        console.log(`  ✅ ${impl.name} verified successfully`);
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log(`  ✅ ${impl.name} already verified`);
        } else {
          console.error(`  ❌ Failed to verify ${impl.name}:`, error.message);
        }
      }
    }

    console.log("✅ Implementation contracts verification completed\n");

    // Verify factory contracts (with constructor arguments)
    console.log("🔍 Verifying factory contracts...");

    // Verify NFTFactory
    console.log("  Verifying NFTFactory...");
    try {
      await run("verify:verify", {
        address: addresses.nftFactory,
        constructorArguments: [
          addresses.nftImplementation,
          config.nftCreationFee,
          config.protocolFeeRecipient,
          parseInt(config.nftProtocolFee),
          deployerAddress
        ],
      });
      console.log("  ✅ NFTFactory verified successfully");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("  ✅ NFTFactory already verified");
      } else {
        console.error("  ❌ Failed to verify NFTFactory:", error.message);
      }
    }

    // Verify ERC20Factory
    console.log("  Verifying ERC20Factory...");
    try {
      await run("verify:verify", {
        address: addresses.erc20Factory,
        constructorArguments: [
          addresses.bondingImplementation,
          deployerAddress,
          config.erc20CreationFee,
          config.protocolFeeRecipient
        ],
      });
      console.log("  ✅ ERC20Factory verified successfully");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("  ✅ ERC20Factory already verified");
      } else {
        console.error("  ❌ Failed to verify ERC20Factory:", error.message);
      }
    }

    // Verify StakingFactory
    console.log("  Verifying StakingFactory...");
    try {
      await run("verify:verify", {
        address: addresses.stakingFactory,
        constructorArguments: [
          addresses.stakingImplementation,
          addresses.erc20Factory,
          config.stakingCreationFee,
          config.protocolFeeRecipient,
          parseInt(config.stakingProtocolFee),
          deployerAddress
        ],
      });
      console.log("  ✅ StakingFactory verified successfully");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("  ✅ StakingFactory already verified");
      } else {
        console.error("  ❌ Failed to verify StakingFactory:", error.message);
      }
    }

    console.log("✅ Factory contracts verification completed\n");

    // Final summary
    console.log("🎉 CONTRACT VERIFICATION COMPLETED!");
    console.log("=".repeat(50));
    console.log("🔗 View your contracts on Etherscan:");
    console.log("=".repeat(50));
    
    for (const [name, address] of Object.entries(addresses)) {
      console.log(`${name.padEnd(25)}: https://sepolia.etherscan.io/address/${address}`);
    }
    
    console.log("=".repeat(50));
    console.log("✅ All contracts are now verified and publicly viewable!");

  } catch (error) {
    console.error("❌ Verification process failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 