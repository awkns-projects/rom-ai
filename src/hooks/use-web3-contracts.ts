'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { 
  CONTRACTS, 
  NFT_COLLECTION_ABI, 
  BONDING_TOKEN_ABI, 
  STAKING_POOL_ABI, 
  ERC20_ABI,
  ETH_ADDRESS 
} from '@/lib/web3/contracts';

// Web3 Provider Hook using Privy
export function useWeb3Provider() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    if (!ready) return;
    
    setIsConnecting(true);
    try {
      if (!authenticated) {
        await login();
        return;
      }

      // Get the first connected wallet
      const wallet = wallets?.[0];
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      // Get the Ethereum provider from the wallet
      const ethereumProvider = await wallet.getEthereumProvider();
      if (!ethereumProvider) {
        throw new Error('Failed to get Ethereum provider');
      }

      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Warn if not on Sepolia testnet
      if (chainId !== 11155111) {
        console.warn(`⚠️ Connected to chain ${chainId}, but contracts are deployed on Sepolia testnet (11155111)`);
        console.warn('Please switch to Sepolia testnet in your wallet');
      }

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setChainId(chainId);

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [ready, authenticated, login, wallets]);

  const disconnectWallet = useCallback(async () => {
    await logout();
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
  }, [logout]);

  const switchToSepolia = useCallback(async () => {
    try {
      // Get the first connected wallet from Privy
      const wallet = wallets?.[0];
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      // Try to switch the wallet to Sepolia
      try {
        await wallet.switchChain(11155111); // Sepolia chain ID
        
        // Update our provider state after switching
        const ethereumProvider = await wallet.getEthereumProvider();
        if (ethereumProvider) {
          const provider = new ethers.BrowserProvider(ethereumProvider);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
          setProvider(provider);
          
          // Update signer if we have an account
          if (account) {
            const signer = await provider.getSigner();
            setSigner(signer);
          }
        }
        
      } catch (switchError: any) {
        console.error('Wallet switch failed, trying manual approach:', switchError);
        
        // Fallback: Try the raw provider approach
        const ethereumProvider = await wallet.getEthereumProvider();
        if (!ethereumProvider) {
          throw new Error('No Ethereum provider available');
        }

        // Try to switch using wallet_switchEthereumChain
        try {
          await ethereumProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
          });
        } catch (rawSwitchError: any) {
          // This error code indicates that the chain has not been added
          if (rawSwitchError.code === 4902) {
            await ethereumProvider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7', // 11155111 in hex
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia Ether',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                },
              ],
            });
          } else {
            throw rawSwitchError;
          }
        }
        
        // Update provider state after manual switch
        const provider = new ethers.BrowserProvider(ethereumProvider);
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
        setProvider(provider);
        
        if (account) {
          const signer = await provider.getSigner();
          setSigner(signer);
        }
      }
      
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error);
      throw error;
    }
  }, [wallets, account]);

  // Auto-connect when Privy is ready and user is authenticated
  useEffect(() => {
    if (ready && authenticated && wallets?.length > 0 && !account) {
      connectWallet();
    }
  }, [ready, authenticated, wallets, account, connectWallet]);

  // Update account when wallets change
  useEffect(() => {
    if (authenticated && wallets?.length > 0) {
      const wallet = wallets[0];
      if (wallet.address !== account) {
        connectWallet();
      }
    }
  }, [authenticated, wallets, account, connectWallet]);

  return {
    provider,
    signer,
    account: account || user?.wallet?.address || null,
    chainId,
    isConnecting: isConnecting || !ready,
    connectWallet,
    disconnectWallet,
    authenticated,
    ready,
    switchToSepolia
  };
}

// Types for contract interactions
export interface CollectionInfo {
  creator: string;
  paymentToken: string;
  mintPrice: string;
  maxSupply: string;
  exists: boolean;
}

export interface TokenInfo {
  creator: string;
  nftCollection: string;
  reserveToken: string;
  maxSupply: string;
  mintRoyalty: number;
  burnRoyalty: number;
  exists: boolean;
}

export interface PoolInfo {
  creator: string;
  stakingToken: string;
  nftCollection: string;
  rewardToken: string;
  exists: boolean;
}

export interface BondStep {
  rangeTo: string;
  price: string;
}

// NFT Factory Hook
export function useNFTFactory() {
  const { provider, signer, account } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCollection = useCallback(async (
    name: string,
    symbol: string,
    baseURI: string,
    paymentToken: string,
    mintPrice: string,
    maxSupply: string
  ) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    // Check if contract address is configured
    if (!CONTRACTS.NFTFactory.address || CONTRACTS.NFTFactory.address === '') {
      throw new Error('NFT Factory contract address not configured. Please set NEXT_PUBLIC_NFT_FACTORY_ADDRESS in your .env.local file.');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(
        CONTRACTS.NFTFactory.address,
        CONTRACTS.NFTFactory.abi,
        signer
      );

      // Get creation fee
      const creationFee = await contract.creationFee();
      
      const tx = await contract.createCollection(
        name,
        symbol,
        baseURI,
        paymentToken === 'ETH' ? ETH_ADDRESS : paymentToken,
        ethers.parseEther(mintPrice),
        maxSupply,
        { value: creationFee }
      );

      const receipt = await tx.wait();
      
      // Extract collection address from event
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('CollectionCreated(address,address,string,string,string,address,uint256,uint256)')
      );
      
      const collectionAddress = event ? ethers.AbiCoder.defaultAbiCoder().decode(['address'], event.topics[1])[0] : null;
      
      return { tx, receipt, collectionAddress };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account]);

  const getCollectionInfo = useCallback(async (collectionAddress: string): Promise<CollectionInfo> => {
    if (!provider) throw new Error('Provider not available');
    
    const contract = new ethers.Contract(
      CONTRACTS.NFTFactory.address,
      CONTRACTS.NFTFactory.abi,
      provider
    );

    const info = await contract.collectionInfo(collectionAddress);
    return {
      creator: info[0],
      paymentToken: info[1],
      mintPrice: ethers.formatEther(info[2]),
      maxSupply: info[3].toString(),
      exists: info[4]
    };
  }, [provider]);

  const getCreationFee = useCallback(async () => {
    if (!provider) return '0';
    
    // Check if contract address is configured
    if (!CONTRACTS.NFTFactory.address || CONTRACTS.NFTFactory.address === '') {
      throw new Error('NFT Factory contract address not configured. Please set NEXT_PUBLIC_NFT_FACTORY_ADDRESS in your .env.local file.');
    }
    
    const contract = new ethers.Contract(
      CONTRACTS.NFTFactory.address,
      CONTRACTS.NFTFactory.abi,
      provider
    );

    const fee = await contract.creationFee();
    return ethers.formatEther(fee);
  }, [provider]);

  return {
    createCollection,
    getCollectionInfo,
    getCreationFee,
    loading,
    error
  };
}

// NFT Collection Hook
export function useNFTCollection(collectionAddress: string) {
  const { provider, signer, account } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mint = useCallback(async (to: string, amount: number) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(collectionAddress, NFT_COLLECTION_ABI, signer);
      
      // Get mint price and payment token
      const mintPrice = await contract.mintPrice();
      const paymentToken = await contract.paymentToken();
      const totalCost = mintPrice * BigInt(amount);
      
      let tx;
      if (paymentToken === ETH_ADDRESS) {
        tx = await contract.mint(to, amount, { value: totalCost });
      } else {
        // Handle ERC20 payment - need approval first
        const erc20Contract = new ethers.Contract(paymentToken, ERC20_ABI, signer);
        const allowance = await erc20Contract.allowance(account, collectionAddress);
        
        if (allowance < totalCost) {
          const approveTx = await erc20Contract.approve(collectionAddress, totalCost);
          await approveTx.wait();
        }
        
        tx = await contract.mint(to, amount);
      }

      const receipt = await tx.wait();
      return { tx, receipt };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account, collectionAddress]);

  const getCollectionDetails = useCallback(async () => {
    if (!provider) return null;
    
    const contract = new ethers.Contract(collectionAddress, NFT_COLLECTION_ABI, provider);
    
    const [name, symbol, creator, paymentToken, mintPrice, maxSupply, totalSupply, stakingPool] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.creator(),
      contract.paymentToken(),
      contract.mintPrice(),
      contract.maxSupply(),
      contract.totalSupply(),
      contract.stakingPool()
    ]);

    return {
      name,
      symbol,
      creator,
      paymentToken,
      mintPrice: ethers.formatEther(mintPrice),
      maxSupply: maxSupply.toString(),
      totalSupply: totalSupply.toString(),
      stakingPool
    };
  }, [provider, collectionAddress]);

  const setStakingPool = useCallback(async (stakingPoolAddress: string) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(collectionAddress, NFT_COLLECTION_ABI, signer);
    const tx = await contract.setStakingPool(stakingPoolAddress);
    return tx.wait();
  }, [signer, account, collectionAddress]);

  return {
    mint,
    getCollectionDetails,
    setStakingPool,
    loading,
    error
  };
}

// ERC20 Factory Hook
export function useERC20Factory() {
  const { provider, signer, account } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = useCallback(async (
    name: string,
    symbol: string,
    nftCollection: string,
    reserveToken: string,
    steps: BondStep[],
    mintRoyalty: number,
    burnRoyalty: number
  ) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(
        CONTRACTS.ERC20Factory.address,
        CONTRACTS.ERC20Factory.abi,
        signer
      );

      // Get creation fee
      const creationFee = await contract.creationFee();
      
      // Format steps for contract
      const formattedSteps = steps.map(step => ({
        rangeTo: ethers.parseEther(step.rangeTo),
        price: ethers.parseEther(step.price)
      }));
      
      const tx = await contract.createToken(
        name,
        symbol,
        nftCollection,
        reserveToken === 'ETH' ? ETH_ADDRESS : reserveToken,
        formattedSteps,
        mintRoyalty,
        burnRoyalty,
        { value: creationFee }
      );

      const receipt = await tx.wait();
      
      // Extract token address from event
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('TokenCreated(address,address,address,string,string,address,uint256,uint16,uint16)')
      );
      
      const tokenAddress = event ? ethers.AbiCoder.defaultAbiCoder().decode(['address'], event.topics[1])[0] : null;
      
      return { tx, receipt, tokenAddress };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account]);

  const getTokenInfo = useCallback(async (tokenAddress: string): Promise<TokenInfo> => {
    if (!provider) throw new Error('Provider not available');
    
    const contract = new ethers.Contract(
      CONTRACTS.ERC20Factory.address,
      CONTRACTS.ERC20Factory.abi,
      provider
    );

    const info = await contract.tokenInfo(tokenAddress);
    return {
      creator: info[0],
      nftCollection: info[1],
      reserveToken: info[2],
      maxSupply: ethers.formatEther(info[3]),
      mintRoyalty: info[4],
      burnRoyalty: info[5],
      exists: info[6]
    };
  }, [provider]);

  return {
    createToken,
    getTokenInfo,
    loading,
    error
  };
}

// Bonding Token Hook
export function useBondingToken(tokenAddress: string) {
  const { provider, signer, account } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mint = useCallback(async (tokensToMint: string, maxSlippage: number = 5) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(tokenAddress, BONDING_TOKEN_ABI, signer);
      
      // Calculate cost
      const cost = await contract.calculateBuyCost(ethers.parseEther(tokensToMint));
      const maxReserveAmount = cost + (cost * BigInt(maxSlippage)) / BigInt(100);
      
      const reserveToken = await contract.reserveToken();
      
      let tx;
      if (reserveToken === ETH_ADDRESS) {
        tx = await contract.mint(
          ethers.parseEther(tokensToMint),
          maxReserveAmount,
          account,
          { value: maxReserveAmount }
        );
      } else {
        // Handle ERC20 reserve token - need approval first
        const erc20Contract = new ethers.Contract(reserveToken, ERC20_ABI, signer);
        const allowance = await erc20Contract.allowance(account, tokenAddress);
        
        if (allowance < maxReserveAmount) {
          const approveTx = await erc20Contract.approve(tokenAddress, maxReserveAmount);
          await approveTx.wait();
        }
        
        tx = await contract.mint(
          ethers.parseEther(tokensToMint),
          maxReserveAmount,
          account
        );
      }

      const receipt = await tx.wait();
      return { tx, receipt };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account, tokenAddress]);

  const burn = useCallback(async (tokensToBurn: string, minSlippage: number = 5) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(tokenAddress, BONDING_TOKEN_ABI, signer);
      
      // Calculate refund
      const refund = await contract.calculateSellRefund(ethers.parseEther(tokensToBurn));
      const minRefund = refund - (refund * BigInt(minSlippage)) / BigInt(100);
      
      const tx = await contract.burn(
        ethers.parseEther(tokensToBurn),
        minRefund,
        account
      );

      const receipt = await tx.wait();
      return { tx, receipt };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account, tokenAddress]);

  const getTokenDetails = useCallback(async () => {
    if (!provider) return null;
    
    const contract = new ethers.Contract(tokenAddress, BONDING_TOKEN_ABI, provider);
    
    const [name, symbol, decimals, totalSupply, currentPrice, maxSupply, creator, nftCollection, reserveToken, reserveBalance] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.getCurrentPrice(),
      contract.getMaxSupply(),
      contract.creator(),
      contract.nftCollection(),
      contract.reserveToken(),
      contract.reserveBalance()
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatEther(totalSupply),
      currentPrice: ethers.formatEther(currentPrice),
      maxSupply: ethers.formatEther(maxSupply),
      creator,
      nftCollection,
      reserveToken,
      reserveBalance: ethers.formatEther(reserveBalance)
    };
  }, [provider, tokenAddress]);

  const calculateBuyCost = useCallback(async (tokensToMint: string) => {
    if (!provider) return '0';
    
    const contract = new ethers.Contract(tokenAddress, BONDING_TOKEN_ABI, provider);
    const cost = await contract.calculateBuyCost(ethers.parseEther(tokensToMint));
    return ethers.formatEther(cost);
  }, [provider, tokenAddress]);

  const calculateSellRefund = useCallback(async (tokensToBurn: string) => {
    if (!provider) return '0';
    
    const contract = new ethers.Contract(tokenAddress, BONDING_TOKEN_ABI, provider);
    const refund = await contract.calculateSellRefund(ethers.parseEther(tokensToBurn));
    return ethers.formatEther(refund);
  }, [provider, tokenAddress]);

  return {
    mint,
    burn,
    getTokenDetails,
    calculateBuyCost,
    calculateSellRefund,
    loading,
    error
  };
}

// Staking Factory Hook
export function useStakingFactory() {
  const { provider, signer, account } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPool = useCallback(async (stakingToken: string, rewardToken: string) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(
        CONTRACTS.StakingFactory.address,
        CONTRACTS.StakingFactory.abi,
        signer
      );

      // Get creation fee
      const creationFee = await contract.creationFee();
      
      const tx = await contract.createPool(
        stakingToken,
        rewardToken === 'ETH' ? ETH_ADDRESS : rewardToken,
        { value: creationFee }
      );

      const receipt = await tx.wait();
      
      // Extract pool address from event
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('PoolCreated(address,address,address,address,address)')
      );
      
      const poolAddress = event ? ethers.AbiCoder.defaultAbiCoder().decode(['address'], event.topics[1])[0] : null;
      
      return { tx, receipt, poolAddress };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account]);

  return {
    createPool,
    loading,
    error
  };
}

// Staking Pool Hook
export function useStakingPool(poolAddress: string) {
  const { provider, signer, account } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stake = useCallback(async (amount: string) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(poolAddress, STAKING_POOL_ABI, signer);
      const stakingToken = await contract.stakingToken();
      
      // Approve tokens first
      const tokenContract = new ethers.Contract(stakingToken, ERC20_ABI, signer);
      const allowance = await tokenContract.allowance(account, poolAddress);
      const amountWei = ethers.parseEther(amount);
      
      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(poolAddress, amountWei);
        await approveTx.wait();
      }
      
      const tx = await contract.stake(amountWei);
      const receipt = await tx.wait();
      return { tx, receipt };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account, poolAddress]);

  const unstake = useCallback(async (amount: string) => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(poolAddress, STAKING_POOL_ABI, signer);
    const tx = await contract.unstake(ethers.parseEther(amount));
    return tx.wait();
  }, [signer, account, poolAddress]);

  const claimRewards = useCallback(async () => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(poolAddress, STAKING_POOL_ABI, signer);
    const tx = await contract.claimRewards();
    return tx.wait();
  }, [signer, account, poolAddress]);

  const exit = useCallback(async () => {
    if (!signer || !account) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(poolAddress, STAKING_POOL_ABI, signer);
    const tx = await contract.exit();
    return tx.wait();
  }, [signer, account, poolAddress]);

  const getPoolDetails = useCallback(async () => {
    if (!provider || !account) return null;
    
    const contract = new ethers.Contract(poolAddress, STAKING_POOL_ABI, provider);
    
    const [stakingToken, nftCollection, rewardToken, totalStaked, stakedBalance, earned, totalRewards] = await Promise.all([
      contract.stakingToken(),
      contract.nftCollection(),
      contract.rewardToken(),
      contract.totalStaked(),
      contract.stakedBalance(account),
      contract.earned(account),
      contract.totalRewards()
    ]);

    return {
      stakingToken,
      nftCollection,
      rewardToken,
      totalStaked: ethers.formatEther(totalStaked),
      stakedBalance: ethers.formatEther(stakedBalance),
      earned: ethers.formatEther(earned),
      totalRewards: ethers.formatEther(totalRewards)
    };
  }, [provider, poolAddress, account]);

  return {
    stake,
    unstake,
    claimRewards,
    exit,
    getPoolDetails,
    loading,
    error
  };
} 