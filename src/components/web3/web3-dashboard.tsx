'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  Factory, 
  Coins, 
  TrendingUp, 
  Gift, 
  Settings,
  Plus,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWeb3Provider } from '@/hooks/use-web3-contracts';

// Import all Web3 components
import { NFTFactoryComponent } from './nft-factory';
import { NFTCollectionComponent } from './nft-collection';
import { ERC20FactoryComponent } from './erc20-factory';
import { BondingTokenComponent } from './bonding-token';
import { StakingFactoryComponent } from './staking-factory';
import { StakingPoolComponent } from './staking-pool';

export function Web3Dashboard() {
  const { toast } = useToast();
  const { account, connectWallet, disconnectWallet, isConnecting, chainId, authenticated, ready, switchToSepolia } = useWeb3Provider();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [contractAddresses, setContractAddresses] = useState({
    collection: '',
    token: '',
    pool: ''
  });
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const handleAddressInput = (type: string, address: string) => {
    setContractAddresses(prev => ({ ...prev, [type]: address }));
  };

  const isValidAddress = (address: string) => {
    return address.length === 42 && address.startsWith('0x');
  };

  const isCorrectChain = chainId === 11155111; // Sepolia testnet
  
  const handleSwitchToSepolia = async () => {
    setIsSwitchingChain(true);
    try {
      await switchToSepolia();
      toast({
        title: "Network Switched",
        description: "Successfully switched to Sepolia testnet",
      });
    } catch (error: any) {
      toast({
        title: "Network Switch Failed", 
        description: error.message || "Failed to switch to Sepolia testnet",
        variant: "destructive",
      });
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const getChainName = (chainId: number | null) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 11155111: return 'Sepolia Testnet';
      case 8453: return 'Base Mainnet';
      case 137: return 'Polygon';
      case 31337: return 'Hardhat Local';
      default: return `Chain ${chainId}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Web3 Dashboard</h1>
            <p className="text-muted-foreground">
              Complete DeFi ecosystem for NFTs, bonding tokens, and staking
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {chainId && (
              <div className="flex items-center gap-2">
                <Badge variant={isCorrectChain ? "default" : "destructive"}>
                  {getChainName(chainId)}
                </Badge>
                {!isCorrectChain && authenticated && (
                  <Button
                    onClick={handleSwitchToSepolia}
                    disabled={isSwitchingChain}
                    variant="outline"
                    size="sm"
                  >
                    {isSwitchingChain ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Switching...
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Switch to Sepolia
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {!authenticated ? (
              <Button onClick={connectWallet} disabled={isConnecting || !ready}>
                {isConnecting || !ready ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {!ready ? 'Loading...' : 'Connecting...'}
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="px-3 py-1">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </Badge>
                <Button variant="outline" size="sm" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Wrong Chain Warning Banner */}
        {authenticated && chainId && !isCorrectChain && (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Settings className="h-5 w-5" />
                Wrong Network Detected
              </CardTitle>
              <CardDescription>
                You're connected to {getChainName(chainId)}, but this app requires Sepolia Testnet.
                Please switch networks to use the Web3 features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSwitchToSepolia}
                disabled={isSwitchingChain}
                className="w-full"
              >
                {isSwitchingChain ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Switching to Sepolia...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Switch to Sepolia Testnet
                  </>
                )}
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Manual Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open your wallet (MetaMask, etc.)</li>
                  <li>Click the network dropdown</li>
                  <li>Select "Sepolia test network"</li>
                  <li>If not available, add manually:</li>
                </ol>
                <div className="bg-muted p-3 rounded text-xs font-mono space-y-1">
                  <div><strong>Network Name:</strong> Sepolia</div>
                  <div><strong>Chain ID:</strong> 11155111</div>
                  <div><strong>RPC URL:</strong> https://sepolia.infura.io/v3/</div>
                  <div><strong>Currency:</strong> ETH</div>
                  <div><strong>Explorer:</strong> https://sepolia.etherscan.io</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

{!ready ? (
          /* Loading Screen */
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Loading...</CardTitle>
              <CardDescription className="text-lg">
                Initializing Web3 Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto" />
            </CardContent>
          </Card>
        ) : !authenticated ? (
          /* Welcome Screen */
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to the Web3 Ecosystem</CardTitle>
              <CardDescription className="text-lg">
                Sign in to access all DeFi features
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Factory className="h-12 w-12 mx-auto text-blue-600" />
                  <h3 className="font-semibold">NFT Collections</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and manage NFT collections with custom pricing
                  </p>
                </div>
                <div className="space-y-2">
                  <TrendingUp className="h-12 w-12 mx-auto text-green-600" />
                  <h3 className="font-semibold">Bonding Tokens</h3>
                  <p className="text-sm text-muted-foreground">
                    Launch tokens with bonding curves and automated market making
                  </p>
                </div>
                <div className="space-y-2">
                  <Gift className="h-12 w-12 mx-auto text-purple-600" />
                  <h3 className="font-semibold">Staking Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Stake tokens to earn rewards from NFT sales revenue
                  </p>
                </div>
              </div>
              
              <Button onClick={connectWallet} size="lg" disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    Sign In with Privy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Main Dashboard */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="nft-factory">NFT Factory</TabsTrigger>
              <TabsTrigger value="nft-collection">Collections</TabsTrigger>
              <TabsTrigger value="token-factory">Token Factory</TabsTrigger>
              <TabsTrigger value="bonding-token">Trading</TabsTrigger>
              <TabsTrigger value="staking-factory">Staking Factory</TabsTrigger>
              <TabsTrigger value="staking-pool">Staking</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Factory className="h-5 w-5" />
                      NFT Factory
                    </CardTitle>
                    <CardDescription>
                      Create NFT collections with custom pricing and payment tokens
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setActiveTab('nft-factory')}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Collection
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      Token Factory
                    </CardTitle>
                    <CardDescription>
                      Launch bonding tokens with automated bonding curves
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setActiveTab('token-factory')}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Token
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Staking Factory
                    </CardTitle>
                    <CardDescription>
                      Create staking pools for bonding tokens to earn NFT revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setActiveTab('staking-factory')}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Pool
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Quick Access
                  </CardTitle>
                  <CardDescription>
                    Enter contract addresses to quickly access specific contracts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collection-address">NFT Collection Address</Label>
                      <div className="flex gap-2">
                        <Input
                          id="collection-address"
                          placeholder="0x..."
                          value={contractAddresses.collection}
                          onChange={(e) => handleAddressInput('collection', e.target.value)}
                        />
                        <Button
                          onClick={() => setActiveTab('nft-collection')}
                          disabled={!isValidAddress(contractAddresses.collection)}
                          size="sm"
                        >
                          View
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="token-address">Bonding Token Address</Label>
                      <div className="flex gap-2">
                        <Input
                          id="token-address"
                          placeholder="0x..."
                          value={contractAddresses.token}
                          onChange={(e) => handleAddressInput('token', e.target.value)}
                        />
                        <Button
                          onClick={() => setActiveTab('bonding-token')}
                          disabled={!isValidAddress(contractAddresses.token)}
                          size="sm"
                        >
                          Trade
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pool-address">Staking Pool Address</Label>
                      <div className="flex gap-2">
                        <Input
                          id="pool-address"
                          placeholder="0x..."
                          value={contractAddresses.pool}
                          onChange={(e) => handleAddressInput('pool', e.target.value)}
                        />
                        <Button
                          onClick={() => setActiveTab('staking-pool')}
                          disabled={!isValidAddress(contractAddresses.pool)}
                          size="sm"
                        >
                          Stake
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>
                    Complete DeFi ecosystem workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center space-y-2">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">1</Badge>
                      <h4 className="font-medium">Create NFTs</h4>
                      <p className="text-xs text-muted-foreground">
                        Deploy NFT collections with custom pricing
                      </p>
                    </div>
                    <div className="text-center space-y-2">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">2</Badge>
                      <h4 className="font-medium">Launch Tokens</h4>
                      <p className="text-xs text-muted-foreground">
                        Create bonding tokens with automated curves
                      </p>
                    </div>
                    <div className="text-center space-y-2">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">3</Badge>
                      <h4 className="font-medium">Enable Staking</h4>
                      <p className="text-xs text-muted-foreground">
                        Create staking pools for token holders
                      </p>
                    </div>
                    <div className="text-center space-y-2">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">4</Badge>
                      <h4 className="font-medium">Earn Rewards</h4>
                      <p className="text-xs text-muted-foreground">
                        Stakers earn from NFT sales revenue
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nft-factory">
              <NFTFactoryComponent />
            </TabsContent>

            <TabsContent value="nft-collection">
              {isValidAddress(contractAddresses.collection) ? (
                <NFTCollectionComponent collectionAddress={contractAddresses.collection} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>NFT Collection Manager</CardTitle>
                    <CardDescription>
                      Enter an NFT collection address to manage it
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="collection-input">NFT Collection Address</Label>
                      <Input
                        id="collection-input"
                        placeholder="0x..."
                        value={contractAddresses.collection}
                        onChange={(e) => handleAddressInput('collection', e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can find collection addresses from the NFT Factory tab after creating them.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="token-factory">
              <ERC20FactoryComponent />
            </TabsContent>

            <TabsContent value="bonding-token">
              {isValidAddress(contractAddresses.token) ? (
                <BondingTokenComponent tokenAddress={contractAddresses.token} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Bonding Token Trading</CardTitle>
                    <CardDescription>
                      Enter a bonding token address to start trading
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token-input">Bonding Token Address</Label>
                      <Input
                        id="token-input"
                        placeholder="0x..."
                        value={contractAddresses.token}
                        onChange={(e) => handleAddressInput('token', e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can find token addresses from the Token Factory tab after creating them.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="staking-factory">
              <StakingFactoryComponent />
            </TabsContent>

            <TabsContent value="staking-pool">
              {isValidAddress(contractAddresses.pool) ? (
                <StakingPoolComponent poolAddress={contractAddresses.pool} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Staking Pool Interface</CardTitle>
                    <CardDescription>
                      Enter a staking pool address to start staking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pool-input">Staking Pool Address</Label>
                      <Input
                        id="pool-input"
                        placeholder="0x..."
                        value={contractAddresses.pool}
                        onChange={(e) => handleAddressInput('pool', e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can find pool addresses from the Staking Factory tab after creating them.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
} 