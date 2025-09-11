const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Sepolia deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deployment configuration
  const config = {
    // Protocol fees and settings
    nftCreationFee: ethers.parseEther("0.01"), // 0.01 ETH
    erc20CreationFee: ethers.parseEther("0.01"), // 0.01 ETH
    stakingCreationFee: ethers.parseEther("0.01"), // 0.01 ETH
    protocolFeeRecipient: deployer.address,
    nftProtocolFee: 250, // 2.5%
    stakingProtocolFee: 150, // 1.5%
  };

  const deployedContracts = {};

  try {
    // Step 1: Deploy implementation contracts
    console.log("📋 Step 1: Deploying implementation contracts...");
    
    // Deploy NFTCollection implementation
    console.log("  Deploying NFTCollection implementation...");
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    const nftImplementation = await NFTCollection.deploy();
    await nftImplementation.waitForDeployment();
    const nftImplAddress = await nftImplementation.getAddress();
    console.log("  ✅ NFTCollection implementation:", nftImplAddress);
    deployedContracts.nftImplementation = nftImplAddress;

    // Deploy BondingToken implementation
    console.log("  Deploying BondingToken implementation...");
    const BondingToken = await ethers.getContractFactory("BondingToken");
    const bondingImplementation = await BondingToken.deploy();
    await bondingImplementation.waitForDeployment();
    const bondingImplAddress = await bondingImplementation.getAddress();
    console.log("  ✅ BondingToken implementation:", bondingImplAddress);
    deployedContracts.bondingImplementation = bondingImplAddress;

    // Deploy BondingTokenETH implementation
    console.log("  Deploying BondingTokenETH implementation...");
    const BondingTokenETH = await ethers.getContractFactory("BondingTokenETH");
    const bondingETHImplementation = await BondingTokenETH.deploy();
    await bondingETHImplementation.waitForDeployment();
    const bondingETHImplAddress = await bondingETHImplementation.getAddress();
    console.log("  ✅ BondingTokenETH implementation:", bondingETHImplAddress);
    deployedContracts.bondingETHImplementation = bondingETHImplAddress;

    // Deploy StakingPool implementation
    console.log("  Deploying StakingPool implementation...");
    const StakingPool = await ethers.getContractFactory("StakingPool");
    const stakingImplementation = await StakingPool.deploy();
    await stakingImplementation.waitForDeployment();
    const stakingImplAddress = await stakingImplementation.getAddress();
    console.log("  ✅ StakingPool implementation:", stakingImplAddress);
    deployedContracts.stakingImplementation = stakingImplAddress;

    console.log("✅ Step 1 completed: All implementation contracts deployed\n");

    // Step 2: Deploy factory contracts
    console.log("📋 Step 2: Deploying factory contracts...");

    // Deploy NFTFactory
    console.log("  Deploying NFTFactory...");
    const NFTFactory = await ethers.getContractFactory("NFTFactory");
    const nftFactory = await NFTFactory.deploy(
      nftImplAddress,
      config.nftCreationFee,
      config.protocolFeeRecipient,
      config.nftProtocolFee,
      deployer.address // owner
    );
    await nftFactory.waitForDeployment();
    const nftFactoryAddress = await nftFactory.getAddress();
    console.log("  ✅ NFTFactory:", nftFactoryAddress);
    deployedContracts.nftFactory = nftFactoryAddress;

    // Deploy ERC20Factory
    console.log("  Deploying ERC20Factory...");
    const ERC20Factory = await ethers.getContractFactory("ERC20Factory");
    const erc20Factory = await ERC20Factory.deploy(
      bondingImplAddress,
      deployer.address, // owner
      config.erc20CreationFee,
      config.protocolFeeRecipient
    );
    await erc20Factory.waitForDeployment();
    const erc20FactoryAddress = await erc20Factory.getAddress();
    console.log("  ✅ ERC20Factory:", erc20FactoryAddress);
    deployedContracts.erc20Factory = erc20FactoryAddress;

    // Deploy StakingFactory
    console.log("  Deploying StakingFactory...");
    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    const stakingFactory = await StakingFactory.deploy(
      stakingImplAddress,
      erc20FactoryAddress,
      config.stakingCreationFee,
      config.protocolFeeRecipient,
      config.stakingProtocolFee,
      deployer.address // owner
    );
    await stakingFactory.waitForDeployment();
    const stakingFactoryAddress = await stakingFactory.getAddress();
    console.log("  ✅ StakingFactory:", stakingFactoryAddress);
    deployedContracts.stakingFactory = stakingFactoryAddress;

    console.log("✅ Step 2 completed: All factory contracts deployed\n");

    // Step 3: Save deployment addresses
    console.log("📋 Step 3: Saving deployment information...");
    
    const deploymentInfo = {
      network: "sepolia",
      chainId: 11155111,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      gasUsed: "TBD", // Will be calculated if needed
      contracts: deployedContracts,
      config: {
        nftCreationFee: config.nftCreationFee.toString(),
        erc20CreationFee: config.erc20CreationFee.toString(),
        stakingCreationFee: config.stakingCreationFee.toString(),
        protocolFeeRecipient: config.protocolFeeRecipient,
        nftProtocolFee: config.nftProtocolFee,
        stakingProtocolFee: config.stakingProtocolFee,
      }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "..", "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info
    const deploymentFile = path.join(deploymentsDir, "sepolia-deployment.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("  ✅ Deployment info saved to:", deploymentFile);

    // Save addresses in a simple format for easy importing
    const addressesFile = path.join(deploymentsDir, "sepolia-addresses.json");
    fs.writeFileSync(addressesFile, JSON.stringify(deployedContracts, null, 2));
    console.log("  ✅ Contract addresses saved to:", addressesFile);

    console.log("✅ Step 3 completed: Deployment information saved\n");

    // Step 4: Verify deployment
    console.log("📋 Step 4: Verifying deployments...");
    
    for (const [contractName, address] of Object.entries(deployedContracts)) {
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        throw new Error(`❌ ${contractName} at ${address} has no code!`);
      }
      console.log(`  ✅ ${contractName} verified at ${address}`);
    }

    console.log("✅ Step 4 completed: All contracts verified\n");

    // Final summary
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log("📋 Deployed Contracts:");
    console.log("=".repeat(50));
    
    for (const [contractName, address] of Object.entries(deployedContracts)) {
      console.log(`${contractName.padEnd(25)}: ${address}`);
    }
    
    console.log("=".repeat(50));
    console.log(`💰 Total deployment cost: Check your wallet`);
    console.log(`🔗 Network: Sepolia (Chain ID: 11155111)`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`📁 Deployment info: ${deploymentFile}`);
    console.log("=".repeat(50));
    
    console.log("\n🔍 Next steps:");
    console.log("1. Verify contracts on Etherscan:");
    console.log("   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>");
    console.log("2. Test the deployed contracts");
    console.log("3. Update your frontend with the new contract addresses");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 