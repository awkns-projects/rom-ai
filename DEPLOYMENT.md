# Smart Contract Deployment Guide

This guide will help you deploy the smart contracts to Sepolia testnet.

## Prerequisites

1. **Node.js and npm/pnpm** - Make sure you have Node.js installed
2. **Ethereum Wallet** - You'll need a wallet with Sepolia ETH
3. **API Keys** - Alchemy and Etherscan API keys

## Setup Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Ethereum Private Key (for deploying contracts)
# Get this from your wallet (MetaMask -> Account Details -> Export Private Key)
# IMPORTANT: Never commit your actual private key to version control!
PRIVATE_KEY=your_ethereum_private_key_here

# Alchemy API Key (for Sepolia RPC access)
# Get this from https://dashboard.alchemy.com/
# Create a new app for Ethereum Sepolia network
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Etherscan API Key (for contract verification)
# Get this from https://etherscan.io/apis
# Required to verify contracts on Etherscan
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Getting API Keys

#### 1. Alchemy API Key
1. Go to [dashboard.alchemy.com](https://dashboard.alchemy.com/)
2. Sign up or log in
3. Click "Create new app"
4. Choose "Ethereum" and "Sepolia" network
5. Copy the API key from your app dashboard

#### 2. Etherscan API Key
1. Go to [etherscan.io/apis](https://etherscan.io/apis)
2. Sign up or log in
3. Go to "API Keys" section
4. Click "Add" to create a new API key
5. Copy the generated API key

#### 3. Private Key
1. Open MetaMask
2. Click on your account name
3. Go to "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. Copy the private key (starts with 0x)

**⚠️ SECURITY WARNING**: Never share your private key or commit it to version control!

## Get Sepolia ETH

You'll need Sepolia ETH to pay for deployment gas fees:

1. **Alchemy Faucet**: [sepoliafaucet.com](https://sepoliafaucet.com/)
2. **Chainlink Faucet**: [faucets.chain.link](https://faucets.chain.link/)
3. **QuickNode Faucet**: [faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

You'll need approximately 0.1-0.2 ETH for deployment.

## Deployment Steps

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Compile Contracts
```bash
pnpm run compile:contracts
```

### Step 3: Test Contracts (Optional)
```bash
pnpm run test:contracts
```

### Step 4: Deploy to Sepolia
```bash
pnpm run deploy:sepolia
```

This will deploy the following contracts:
- NFTCollection (implementation)
- BondingToken (implementation)
- BondingTokenETH (implementation)
- StakingPool (implementation)
- NFTFactory
- ERC20Factory
- StakingFactory

### Step 5: Verify Contracts on Etherscan
```bash
pnpm run verify:sepolia
```

This will verify all deployed contracts on Etherscan, making them publicly viewable and interactable.

## Deployment Output

After successful deployment, you'll find:

- `deployments/sepolia-deployment.json` - Complete deployment information
- `deployments/sepolia-addresses.json` - Contract addresses only

## Contract Addresses

After deployment, your contracts will be available at the addresses saved in `deployments/sepolia-addresses.json`. The structure will look like:

```json
{
  "nftImplementation": "0x...",
  "bondingImplementation": "0x...",
  "bondingETHImplementation": "0x...",
  "stakingImplementation": "0x...",
  "nftFactory": "0x...",
  "erc20Factory": "0x...",
  "stakingFactory": "0x..."
}
```

## Troubleshooting

### Common Issues

1. **"insufficient funds for intrinsic transaction cost"**
   - You need more Sepolia ETH in your wallet
   - Get more from the faucets listed above

2. **"nonce too high"**
   - Reset your MetaMask account: Settings -> Advanced -> Reset Account

3. **"UNPREDICTABLE_GAS_LIMIT"**
   - Your contract might have compilation errors
   - Run `pnpm run compile:contracts` to check for errors

4. **"Already Verified" during verification**
   - This is normal if contracts were already verified
   - The script will continue and mark them as verified

### Manual Verification

If automatic verification fails, you can verify contracts manually:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

For example:
```bash
npx hardhat verify --network sepolia 0x123... "arg1" "arg2" 123
```

## Next Steps

After deployment:

1. **Test your contracts** - Use the contract addresses to interact with your deployed contracts
2. **Update your frontend** - Update your dApp with the new contract addresses
3. **Set up monitoring** - Consider setting up monitoring for your contracts

## Contract Configuration

The deployment uses the following configuration:

- **NFT Creation Fee**: 0.01 ETH
- **ERC20 Creation Fee**: 0.01 ETH
- **Staking Creation Fee**: 0.01 ETH
- **NFT Protocol Fee**: 2.5%
- **Staking Protocol Fee**: 1.5%
- **Protocol Fee Recipient**: Deployer address

These can be modified in `src/web3/scripts/deploy-sepolia.js` before deployment.

## Support

If you encounter issues:

1. Check the [Hardhat documentation](https://hardhat.org/docs)
2. Review the deployment logs for specific error messages
3. Ensure all environment variables are correctly set
4. Verify you have sufficient Sepolia ETH

## Security Notes

- Never commit your `.env.local` file to version control
- Use a dedicated deployment wallet, not your main wallet
- Test thoroughly on Sepolia before mainnet deployment
- Consider using a multisig wallet for mainnet deployments 