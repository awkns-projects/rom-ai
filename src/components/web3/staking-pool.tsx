'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Coins, Gift, TrendingUp, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStakingPool, useWeb3Provider } from '@/hooks/use-web3-contracts';
import { ETH_ADDRESS } from '@/lib/web3/contracts';

interface StakingPoolProps {
  poolAddress: string;
}

export function StakingPoolComponent({ poolAddress }: StakingPoolProps) {
  const { toast } = useToast();
  const { account } = useWeb3Provider();
  const { stake, unstake, claimRewards, exit, getPoolDetails, loading, error } = useStakingPool(poolAddress);
  
  const [poolData, setPoolData] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  const loadPoolData = async () => {
    try {
      const data = await getPoolDetails();
      setPoolData(data);
    } catch (err) {
      console.error('Failed to load pool data:', err);
    }
  };

  useEffect(() => {
    if (poolAddress && account) {
      loadPoolData();
      // Set up interval to refresh data every 30 seconds
      const interval = setInterval(loadPoolData, 30000);
      return () => clearInterval(interval);
    }
  }, [poolAddress, account]);

  const handleStake = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount to stake',
        variant: 'destructive'
      });
      return;
    }

    try {
      await stake(stakeAmount);
      toast({
        title: 'Stake Successful!',
        description: `Staked ${stakeAmount} tokens`,
      });
      
      setStakeAmount('');
      await loadPoolData();
    } catch (err: any) {
      toast({
        title: 'Stake Failed',
        description: err.message || 'Failed to stake tokens',
        variant: 'destructive'
      });
    }
  };

  const handleUnstake = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount to unstake',
        variant: 'destructive'
      });
      return;
    }

    try {
      await unstake(unstakeAmount);
      toast({
        title: 'Unstake Successful!',
        description: `Unstaked ${unstakeAmount} tokens`,
      });
      
      setUnstakeAmount('');
      await loadPoolData();
    } catch (err: any) {
      toast({
        title: 'Unstake Failed',
        description: err.message || 'Failed to unstake tokens',
        variant: 'destructive'
      });
    }
  };

  const handleClaimRewards = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    try {
      await claimRewards();
      toast({
        title: 'Rewards Claimed!',
        description: 'Successfully claimed your rewards',
      });
      
      await loadPoolData();
    } catch (err: any) {
      toast({
        title: 'Claim Failed',
        description: err.message || 'Failed to claim rewards',
        variant: 'destructive'
      });
    }
  };

  const handleExit = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    try {
      await exit();
      toast({
        title: 'Exit Successful!',
        description: 'Unstaked all tokens and claimed rewards',
      });
      
      await loadPoolData();
    } catch (err: any) {
      toast({
        title: 'Exit Failed',
        description: err.message || 'Failed to exit pool',
        variant: 'destructive'
      });
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(poolAddress);
    toast({
      title: 'Copied!',
      description: 'Pool address copied to clipboard',
    });
  };

  if (!poolData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading pool data...</span>
      </div>
    );
  }

  const stakingProgress = poolData.totalStaked && poolData.stakedBalance ? 
    (parseFloat(poolData.stakedBalance) / parseFloat(poolData.totalStaked)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Pool Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Staking Pool</h2>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{poolAddress.slice(0, 8)}...{poolAddress.slice(-6)}</span>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://etherscan.io/address/${poolAddress}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Stake</p>
                <p className="text-2xl font-bold">{parseFloat(poolData.stakedBalance).toLocaleString()}</p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staked</p>
                <p className="text-2xl font-bold">{parseFloat(poolData.totalStaked).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Rewards</p>
                <p className="text-2xl font-bold">{parseFloat(poolData.earned).toFixed(6)}</p>
              </div>
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Your Share</p>
              <Progress value={stakingProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stakingProgress.toFixed(2)}% of total stake
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staking Interface */}
      <Tabs defaultValue="stake" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="info">Pool Info</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Stake Tokens
              </CardTitle>
              <CardDescription>
                Stake your bonding tokens to earn rewards from NFT sales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stakeAmount">Amount to Stake</Label>
                <Input
                  id="stakeAmount"
                  type="number"
                  placeholder="1000"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={handleStake}
                disabled={loading || !account || !stakeAmount}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="mr-2 h-4 w-4" />
                )}
                Stake {stakeAmount || '0'} Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unstake" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Unstake Tokens
              </CardTitle>
              <CardDescription>
                Withdraw your staked tokens from the pool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unstakeAmount">Amount to Unstake</Label>
                <Input
                  id="unstakeAmount"
                  type="number"
                  placeholder="1000"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your staked balance: {parseFloat(poolData.stakedBalance).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setUnstakeAmount((parseFloat(poolData.stakedBalance) * 0.25).toString())}
                  size="sm"
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUnstakeAmount((parseFloat(poolData.stakedBalance) * 0.5).toString())}
                  size="sm"
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUnstakeAmount((parseFloat(poolData.stakedBalance) * 0.75).toString())}
                  size="sm"
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUnstakeAmount(poolData.stakedBalance)}
                  size="sm"
                >
                  Max
                </Button>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleUnstake}
                  disabled={loading || !account || !unstakeAmount}
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="mr-2 h-4 w-4" />
                  )}
                  Unstake
                </Button>
                <Button
                  onClick={handleExit}
                  disabled={loading || !account || parseFloat(poolData.stakedBalance) === 0}
                  variant="destructive"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Exit Pool
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Claim Rewards
              </CardTitle>
              <CardDescription>
                Claim your earned rewards from NFT sales revenue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-800">Pending Rewards</p>
                    <p className="text-2xl font-bold text-green-900">
                      {parseFloat(poolData.earned).toFixed(6)} {poolData.rewardToken === ETH_ADDRESS ? 'ETH' : 'Tokens'}
                    </p>
                  </div>
                  <Gift className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total Pool Rewards</p>
                  <p className="text-muted-foreground">
                    {parseFloat(poolData.totalRewards).toFixed(6)} {poolData.rewardToken === ETH_ADDRESS ? 'ETH' : 'Tokens'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Reward Token</p>
                  <p className="text-muted-foreground">
                    {poolData.rewardToken === ETH_ADDRESS ? 'ETH' : poolData.rewardToken}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={handleClaimRewards}
                disabled={loading || !account || parseFloat(poolData.earned) === 0}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="mr-2 h-4 w-4" />
                )}
                Claim {parseFloat(poolData.earned).toFixed(6)} Rewards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pool Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Staking Token</p>
                  <p className="text-muted-foreground font-mono">
                    {poolData.stakingToken.slice(0, 8)}...{poolData.stakingToken.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">NFT Collection</p>
                  <p className="text-muted-foreground font-mono">
                    {poolData.nftCollection.slice(0, 8)}...{poolData.nftCollection.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Reward Token</p>
                  <p className="text-muted-foreground">
                    {poolData.rewardToken === ETH_ADDRESS ? 'ETH' : poolData.rewardToken}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Pool Address</p>
                  <p className="text-muted-foreground font-mono">
                    {poolAddress.slice(0, 8)}...{poolAddress.slice(-6)}
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