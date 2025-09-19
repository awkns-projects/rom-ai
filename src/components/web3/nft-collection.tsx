'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Coins, Users, Settings, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNFTCollection, useWeb3Provider } from '@/hooks/use-web3-contracts';
import { ETH_ADDRESS } from '@/lib/web3/contracts';

interface NFTCollectionProps {
  collectionAddress: string;
}

export function NFTCollectionComponent({ collectionAddress }: NFTCollectionProps) {
  const { toast } = useToast();
  const { provider, account } = useWeb3Provider();
  const { mint, getCollectionDetails, setStakingPool, loading, error } = useNFTCollection(collectionAddress);
  
  const [collectionData, setCollectionData] = useState<any>(null);
  const [mintData, setMintData] = useState({
    recipient: '',
    amount: 1
  });
  const [stakingPoolAddress, setStakingPoolAddress] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const loadCollectionData = async () => {
    try {
      const data = await getCollectionDetails();
      setCollectionData(data);
      setIsOwner(account?.toLowerCase() === data?.creator?.toLowerCase());
      setMintData(prev => ({ ...prev, recipient: account || '' }));
    } catch (err) {
      console.error('Failed to load collection data:', err);
    }
  };

  useEffect(() => {
    if (provider && collectionAddress && account) {
      loadCollectionData();
    }
  }, [provider, collectionAddress, account]);

  const handleMint = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!mintData.recipient || mintData.amount <= 0) {
      toast({
        title: 'Invalid input',
        description: 'Please provide a valid recipient and amount',
        variant: 'destructive'
      });
      return;
    }

    try {
      await mint(mintData.recipient, mintData.amount);
      toast({
        title: 'Mint Successful!',
        description: `Minted ${mintData.amount} NFT(s) to ${mintData.recipient.slice(0, 8)}...`,
      });
      
      // Reload collection data to update supply
      await loadCollectionData();
    } catch (err: any) {
      toast({
        title: 'Mint Failed',
        description: err.message || 'Failed to mint NFTs',
        variant: 'destructive'
      });
    }
  };

  const handleSetStakingPool = async () => {
    if (!stakingPoolAddress) {
      toast({
        title: 'Invalid address',
        description: 'Please provide a valid staking pool address',
        variant: 'destructive'
      });
      return;
    }

    try {
      await setStakingPool(stakingPoolAddress);
      toast({
        title: 'Staking Pool Set!',
        description: 'Staking pool address updated successfully',
      });
      
      // Reload collection data
      await loadCollectionData();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Failed to set staking pool',
        variant: 'destructive'
      });
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(collectionAddress);
    toast({
      title: 'Copied!',
      description: 'Collection address copied to clipboard',
    });
  };

  if (!collectionData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading collection data...</span>
      </div>
    );
  }

  const mintProgress = collectionData ? 
    (parseInt(collectionData.totalSupply) / parseInt(collectionData.maxSupply)) * 100 : 0;
  
  const totalCost = collectionData ? 
    (parseFloat(collectionData.mintPrice) * mintData.amount).toFixed(4) : '0';

  return (
    <div className="space-y-6">
      {/* Collection Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{collectionData.name}</h2>
            <Badge variant="secondary">{collectionData.symbol}</Badge>
            {isOwner && <Badge variant="outline">Owner</Badge>}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{collectionAddress.slice(0, 8)}...{collectionAddress.slice(-6)}</span>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://etherscan.io/address/${collectionAddress}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Supply</p>
                <p className="text-2xl font-bold">{collectionData.totalSupply}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Max Supply</p>
                <p className="text-2xl font-bold">{collectionData.maxSupply}</p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mint Price</p>
                <p className="text-2xl font-bold">{collectionData.mintPrice} ETH</p>
              </div>
              <Badge variant="outline">
                {collectionData.paymentToken === ETH_ADDRESS ? 'ETH' : 'ERC20'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Mint Progress</p>
              <Progress value={mintProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {mintProgress.toFixed(1)}% minted
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="mint" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mint">Mint NFTs</TabsTrigger>
          {isOwner && <TabsTrigger value="manage">Manage</TabsTrigger>}
          <TabsTrigger value="info">Collection Info</TabsTrigger>
        </TabsList>

        <TabsContent value="mint" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mint NFTs</CardTitle>
              <CardDescription>
                Mint new NFTs from this collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={mintData.recipient}
                  onChange={(e) => setMintData(prev => ({ ...prev, recipient: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max="10"
                  value={mintData.amount}
                  onChange={(e) => setMintData(prev => ({ ...prev, amount: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Cost:</span>
                  <span className="font-medium">{totalCost} ETH</span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={handleMint}
                disabled={loading || !account}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="mr-2 h-4 w-4" />
                )}
                Mint {mintData.amount} NFT{mintData.amount > 1 ? 's' : ''}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Management</CardTitle>
                <CardDescription>
                  Manage your collection settings (owner only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stakingPool">Staking Pool Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stakingPool"
                      placeholder="0x..."
                      value={stakingPoolAddress}
                      onChange={(e) => setStakingPoolAddress(e.target.value)}
                    />
                    <Button onClick={handleSetStakingPool} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {collectionData.stakingPool && collectionData.stakingPool !== ETH_ADDRESS && (
                    <p className="text-xs text-muted-foreground">
                      Current: {collectionData.stakingPool.slice(0, 8)}...{collectionData.stakingPool.slice(-6)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Creator</p>
                  <p className="text-muted-foreground font-mono">
                    {collectionData.creator.slice(0, 8)}...{collectionData.creator.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Payment Token</p>
                  <p className="text-muted-foreground">
                    {collectionData.paymentToken === ETH_ADDRESS ? 'ETH' : collectionData.paymentToken}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Staking Pool</p>
                  <p className="text-muted-foreground font-mono">
                    {collectionData.stakingPool && collectionData.stakingPool !== ETH_ADDRESS 
                      ? `${collectionData.stakingPool.slice(0, 8)}...${collectionData.stakingPool.slice(-6)}`
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="font-medium">Collection Address</p>
                  <p className="text-muted-foreground font-mono">
                    {collectionAddress.slice(0, 8)}...{collectionAddress.slice(-6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 