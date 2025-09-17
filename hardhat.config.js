require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });

const SEPOLIA_PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "demo";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./src/web3/contracts",
    tests: "./src/web3/test",
    cache: "./src/web3/cache",
    artifacts: "./src/web3/artifacts"
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // sepolia: {
    //   url: ALCHEMY_API_KEY && ALCHEMY_API_KEY !== "demo" 
    //     ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    //     : "https://sepolia.infura.io/v3/",  // Fallback to public endpoint
    //   accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
    //   chainId: 11155111,
    //   gasPrice: 20000000000, // 20 gwei
    // },
    sepolia: {
      url:  "https://ethereum-sepolia-public.nodies.app",  // Fallback to public endpoint
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 20000000000, // 20 gwei
    },
    // Alternative Sepolia endpoints
    sepoliaPublic: {
      url: "https://rpc.sepolia.org",
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 25000000000, // 25 gwei for public RPC
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  // etherscan: {
  //   apiKey: ETHERSCAN_API_KEY,
  // },
  mocha: {
    timeout: 300000, // 5 minutes
  },
}; 