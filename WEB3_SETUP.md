# Web3 Dashboard Setup Guide

## Overview

The Web3 Dashboard provides a complete DeFi ecosystem with:
- NFT Factory for creating collections
- ERC20 Factory for launching bonding tokens
- Staking Factory for creating reward pools
- Trading interfaces for bonding curves
- Staking interfaces for earning rewards

## Prerequisites

1. **Privy Account**: Sign up at [privy.io](https://privy.io)
2. **Smart Contracts**: Deploy the factory contracts to your desired network
3. **Environment Variables**: Configure the required environment variables

## Environment Setup

### 1. Privy Configuration

Add to your `.env.local` file:

```bash
# Privy App ID (required)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Optional: Custom logo URL
NEXT_PUBLIC_LOGO_URL=https://your-domain.com/logo.png
```

### 2. Smart Contract Addresses

Add the deployed contract addresses to your environment:

```bash
# Factory Contract Addresses
NEXT_PUBLIC_NFT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_ERC20_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=0x...

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111  # Sepolia testnet
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

### 3. Getting Your Privy App ID

1. Go to [dashboard.privy.io](https://dashboard.privy.io)
2. Create a new app or select an existing one
3. Copy the App ID from the settings page
4. Add it to your `.env.local` file

## Smart Contract Deployment

If you haven't deployed the contracts yet, you can use the existing deployment scripts:

```bash
# Compile contracts
npm run compile:contracts

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia
```

## Features

### 1. NFT Factory
- Create NFT collections with custom pricing
- Support for ETH and ERC20 payments
- Configurable max supply and base URIs
- Revenue tracking for staking rewards

### 2. ERC20 Factory
- Launch bonding tokens with step-based curves
- Configurable royalty rates
- Automated market making
- Revenue sharing with NFT collections

### 3. Staking Factory
- Create staking pools for bonding tokens
- Link pools to NFT collections for rewards
- Automated reward distribution
- Support for various reward tokens

### 4. Trading Interface
- Buy/sell tokens on bonding curves
- Real-time price calculations
- Slippage protection
- Support for ETH and ERC20 reserve tokens

### 5. Staking Interface
- Stake bonding tokens to earn rewards
- Claim rewards from NFT sales revenue
- Unstake with flexible amounts
- Exit functionality (unstake all + claim)

## Usage Flow

1. **Sign In**: Users sign in with Privy (email or wallet)
2. **Create Collection**: Deploy an NFT collection via NFT Factory
3. **Launch Token**: Create a bonding token linked to the collection
4. **Create Pool**: Set up a staking pool for the bonding token
5. **Link Systems**: Connect the staking pool to the NFT collection
6. **Trade & Stake**: Users can trade tokens and stake for rewards

## Security Notes

- All transactions require user approval
- Smart contracts include reentrancy protection
- Proper access controls for admin functions
- Slippage protection for trading
- Emergency pause functionality (if implemented)

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure all environment variables are set correctly
3. Verify smart contract addresses are correct
4. Check network connectivity and wallet connection

## Development

To run locally:

```bash
npm run dev
```

Navigate to `/web3` to access the dashboard.

## Production Deployment

1. Set all environment variables in your deployment platform
2. Ensure Privy app is configured for your production domain
3. Deploy smart contracts to mainnet (if desired)
4. Update contract addresses in environment variables
5. Test all functionality before going live 