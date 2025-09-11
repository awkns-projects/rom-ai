'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Coins, BarChart3, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBondingToken, useWeb3Provider } from '@/hooks/use-web3-contracts';
import { ETH_ADDRESS } from '@/lib/web3/contracts';

interface BondingTokenProps {
  tokenAddress: string;
}

export function BondingTokenComponent({ tokenAddress }: BondingTokenProps) {
  const { toast } = useToast();
  const { account } = useWeb3Provider();
  const { mint, burn, getTokenDetails, calculateBuyCost, calculateSellRefund, loading, error } = useBondingToken(tokenAddress);
  
  const [tokenData, setTokenData] = useState<any>(null);
  const [tradeData, setTradeData] = useState({
    buyAmount: '',
    sellAmount: '',
    slippage: 5
  });
  const [buyCost, setBuyCost] = useState('0');
  const [sellRefund, setSellRefund] = useState('0');
  const [userBalance, setUserBalance] = useState('0');

  const loadTokenData = async () => {
    try {
      const data = await getTokenDetails();
      setTokenData(data);
    } catch (err) {
      console.error('Failed to load token data:', err);
    }
  };

  const updateBuyCost = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setBuyCost('0');
      return;
    }
    try {
      const cost = await calculateBuyCost(amount);
      setBuyCost(cost);
    } catch (err) {
      setBuyCost('0');
    }
  };

  const updateSellRefund = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setSellRefund('0');
      return;
    }
    try {
      const refund = await calculateSellRefund(amount);
      setSellRefund(refund);
    } catch (err) {
      setSellRefund('0');
    }
  };

  useEffect(() => {
    if (tokenAddress && account) {
      loadTokenData();
    }
  }, [tokenAddress, account]);

  useEffect(() => {
    if (tradeData.buyAmount) {
      updateBuyCost(tradeData.buyAmount);
    }
  }, [tradeData.buyAmount]);

  useEffect(() => {
    if (tradeData.sellAmount) {
      updateSellRefund(tradeData.sellAmount);
    }
  }, [tradeData.sellAmount]);

  const handleBuy = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!tradeData.buyAmount || parseFloat(tradeData.buyAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount to buy',
        variant: 'destructive'
      });
      return;
    }

    try {
      await mint(tradeData.buyAmount, tradeData.slippage);
      toast({
        title: 'Purchase Successful!',
        description: `Bought ${tradeData.buyAmount} ${tokenData?.symbol || 'tokens'}`,
      });
      
      // Reset form and reload data
      setTradeData(prev => ({ ...prev, buyAmount: '' }));
      setBuyCost('0');
      await loadTokenData();
    } catch (err: any) {
      toast({
        title: 'Purchase Failed',
        description: err.message || 'Failed to buy tokens',
        variant: 'destructive'
      });
    }
  };

  const handleSell = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!tradeData.sellAmount || parseFloat(tradeData.sellAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount to sell',
        variant: 'destructive'
      });
      return;
    }

    try {
      await burn(tradeData.sellAmount, tradeData.slippage);
      toast({
        title: 'Sale Successful!',
        description: `Sold ${tradeData.sellAmount} ${tokenData?.symbol || 'tokens'}`,
      });
      
      // Reset form and reload data
      setTradeData(prev => ({ ...prev, sellAmount: '' }));
      setSellRefund('0');
      await loadTokenData();
    } catch (err: any) {
      toast({
        title: 'Sale Failed',
        description: err.message || 'Failed to sell tokens',
        variant: 'destructive'
      });
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(tokenAddress);
    toast({
      title: 'Copied!',
      description: 'Token address copied to clipboard',
    });
  };

  if (!tokenData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading token data...</span>
      </div>
    );
  }

  const supplyProgress = tokenData ? 
    (parseFloat(tokenData.totalSupply) / parseFloat(tokenData.maxSupply)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Token Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{tokenData.name}</h2>
            <Badge variant="secondary">{tokenData.symbol}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}</span>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://etherscan.io/address/${tokenAddress}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold">{parseFloat(tokenData.currentPrice).toFixed(8)} ETH</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Supply</p>
                <p className="text-2xl font-bold">{parseFloat(tokenData.totalSupply).toLocaleString()}</p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Max Supply</p>
                <p className="text-2xl font-bold">{parseFloat(tokenData.maxSupply).toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reserve Balance</p>
                <p className="text-2xl font-bold">{parseFloat(tokenData.reserveBalance).toFixed(4)} ETH</p>
              </div>
              <Badge variant="outline">
                {tokenData.reserveToken === ETH_ADDRESS ? 'ETH' : 'ERC20'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Interface */}
      <Tabs defaultValue="buy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buy">Buy Tokens</TabsTrigger>
          <TabsTrigger value="sell">Sell Tokens</TabsTrigger>
          <TabsTrigger value="info">Token Info</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Buy {tokenData.symbol}
              </CardTitle>
              <CardDescription>
                Purchase tokens using the bonding curve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buyAmount">Amount to Buy</Label>
                <Input
                  id="buyAmount"
                  type="number"
                  placeholder="1000"
                  value={tradeData.buyAmount}
                  onChange={(e) => setTradeData(prev => ({ ...prev, buyAmount: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Slippage Tolerance: {tradeData.slippage}%</Label>
                <Slider
                  value={[tradeData.slippage]}
                  onValueChange={(value) => setTradeData(prev => ({ ...prev, slippage: value[0] }))}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cost (excluding slippage):</span>
                  <span className="font-medium">{parseFloat(buyCost).toFixed(6)} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max cost (with {tradeData.slippage}% slippage):</span>
                  <span className="font-medium">
                    {(parseFloat(buyCost) * (1 + tradeData.slippage / 100)).toFixed(6)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per token:</span>
                  <span className="font-medium">
                    {tradeData.buyAmount && parseFloat(tradeData.buyAmount) > 0 
                      ? (parseFloat(buyCost) / parseFloat(tradeData.buyAmount)).toFixed(8)
                      : '0'
                    } ETH
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={handleBuy}
                disabled={loading || !account || !tradeData.buyAmount}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="mr-2 h-4 w-4" />
                )}
                Buy {tradeData.buyAmount || '0'} {tokenData.symbol}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Sell {tokenData.symbol}
              </CardTitle>
              <CardDescription>
                Sell tokens back to the bonding curve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sellAmount">Amount to Sell</Label>
                <Input
                  id="sellAmount"
                  type="number"
                  placeholder="1000"
                  value={tradeData.sellAmount}
                  onChange={(e) => setTradeData(prev => ({ ...prev, sellAmount: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Your balance: {userBalance} {tokenData.symbol}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Slippage Tolerance: {tradeData.slippage}%</Label>
                <Slider
                  value={[tradeData.slippage]}
                  onValueChange={(value) => setTradeData(prev => ({ ...prev, slippage: value[0] }))}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Refund (excluding slippage):</span>
                  <span className="font-medium">{parseFloat(sellRefund).toFixed(6)} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Min refund (with {tradeData.slippage}% slippage):</span>
                  <span className="font-medium">
                    {(parseFloat(sellRefund) * (1 - tradeData.slippage / 100)).toFixed(6)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per token:</span>
                  <span className="font-medium">
                    {tradeData.sellAmount && parseFloat(tradeData.sellAmount) > 0 
                      ? (parseFloat(sellRefund) / parseFloat(tradeData.sellAmount)).toFixed(8)
                      : '0'
                    } ETH
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSell}
                disabled={loading || !account || !tradeData.sellAmount}
                className="w-full"
                variant="destructive"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingDown className="mr-2 h-4 w-4" />
                )}
                Sell {tradeData.sellAmount || '0'} {tokenData.symbol}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Creator</p>
                  <p className="text-muted-foreground font-mono">
                    {tokenData.creator.slice(0, 8)}...{tokenData.creator.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">NFT Collection</p>
                  <p className="text-muted-foreground font-mono">
                    {tokenData.nftCollection.slice(0, 8)}...{tokenData.nftCollection.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Reserve Token</p>
                  <p className="text-muted-foreground">
                    {tokenData.reserveToken === ETH_ADDRESS ? 'ETH' : tokenData.reserveToken}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Supply Progress</p>
                  <p className="text-muted-foreground">
                    {supplyProgress.toFixed(2)}% of max supply
                  </p>
                </div>
                <div>
                  <p className="font-medium">Token Address</p>
                  <p className="text-muted-foreground font-mono">
                    {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Decimals</p>
                  <p className="text-muted-foreground">{tokenData.decimals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 