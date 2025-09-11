'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ExternalLink, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStakingFactory, useWeb3Provider } from '@/hooks/use-web3-contracts';
import { ETH_ADDRESS } from '@/lib/web3/contracts';

export function StakingFactoryComponent() {
  const { toast } = useToast();
  const { account } = useWeb3Provider();
  const { createPool, loading, error } = useStakingFactory();
  
  const [formData, setFormData] = useState({
    stakingToken: '',
    rewardToken: 'ETH'
  });
  
  const [createdPools, setCreatedPools] = useState<Array<{
    address: string;
    stakingToken: string;
    rewardToken: string;
    txHash: string;
  }>>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreatePool = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.stakingToken) {
      toast({
        title: 'Missing fields',
        description: 'Please provide the staking token address',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await createPool(
        formData.stakingToken,
        formData.rewardToken
      );

      if (result.poolAddress) {
        setCreatedPools(prev => [...prev, {
          address: result.poolAddress,
          stakingToken: formData.stakingToken,
          rewardToken: formData.rewardToken,
          txHash: result.tx.hash
        }]);

        toast({
          title: 'Pool Created!',
          description: 'Staking pool created successfully',
        });

        // Reset form
        setFormData({
          stakingToken: '',
          rewardToken: 'ETH'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Creation Failed',
        description: err.message || 'Failed to create staking pool',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staking Factory</h2>
          <p className="text-muted-foreground">Create staking pools for your bonding tokens</p>
        </div>
      </div>

      {account && (
        <Card>
          <CardHeader>
            <CardTitle>Create Staking Pool</CardTitle>
            <CardDescription>
              Deploy a new staking pool for a bonding token to earn rewards from NFT sales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stakingToken">Bonding Token Address *</Label>
              <Input
                id="stakingToken"
                placeholder="0x..."
                value={formData.stakingToken}
                onChange={(e) => handleInputChange('stakingToken', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The bonding token that users will stake in this pool
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rewardToken">Reward Token</Label>
              <Select
                value={formData.rewardToken}
                onValueChange={(value) => handleInputChange('rewardToken', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC (Custom)</SelectItem>
                  <SelectItem value="USDT">USDT (Custom)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The token that will be distributed as rewards to stakers
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How Staking Works</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Users stake their bonding tokens to earn rewards</li>
                <li>• Rewards come from NFT collection revenue</li>
                <li>• Pool creator must link this pool to their NFT collection</li>
                <li>• Stakers earn proportional to their stake amount</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={handleCreatePool}
              disabled={loading || !account}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Staking Pool
            </Button>
          </CardContent>
        </Card>
      )}

      {createdPools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Staking Pools</CardTitle>
            <CardDescription>Recently created staking pools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {createdPools.map((pool, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      <span className="font-medium">Staking Pool</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pool: {pool.address.slice(0, 8)}...{pool.address.slice(-6)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Staking: {pool.stakingToken.slice(0, 6)}...{pool.stakingToken.slice(-4)}
                      </span>
                      <span>
                        Rewards: {pool.rewardToken === 'ETH' ? 'ETH' : pool.rewardToken}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://etherscan.io/address/${pool.address}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(pool.address);
                        toast({
                          title: 'Copied!',
                          description: 'Pool address copied to clipboard',
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>After creating your staking pool</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div>
              <p className="font-medium">Link to NFT Collection</p>
              <p className="text-sm text-muted-foreground">
                Go to your NFT collection and set the staking pool address in the management section
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div>
              <p className="font-medium">Users Can Start Staking</p>
              <p className="text-sm text-muted-foreground">
                Token holders can now stake their bonding tokens to earn rewards from NFT sales
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div>
              <p className="font-medium">Rewards Distribution</p>
              <p className="text-sm text-muted-foreground">
                Revenue from NFT mints will automatically be distributed to stakers proportionally
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 