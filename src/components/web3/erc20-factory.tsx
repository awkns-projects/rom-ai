'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, TrendingUp, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useERC20Factory, useWeb3Provider, type BondStep } from '@/hooks/use-web3-contracts';
import { ETH_ADDRESS } from '@/lib/web3/contracts';

export function ERC20FactoryComponent() {
  const { toast } = useToast();
  const { account } = useWeb3Provider();
  const { createToken, loading, error } = useERC20Factory();
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    nftCollection: '',
    reserveToken: 'ETH',
    mintRoyalty: 250, // 2.5%
    burnRoyalty: 250  // 2.5%
  });
  
  const [bondingSteps, setBondingSteps] = useState<BondStep[]>([
    { rangeTo: '1000000', price: '0.000001' },
    { rangeTo: '10000000', price: '0.00001' },
    { rangeTo: '100000000', price: '0.0001' }
  ]);
  
  const [createdTokens, setCreatedTokens] = useState<Array<{
    address: string;
    name: string;
    symbol: string;
    txHash: string;
  }>>([]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addBondingStep = () => {
    setBondingSteps(prev => [...prev, { rangeTo: '', price: '' }]);
  };

  const removeBondingStep = (index: number) => {
    if (bondingSteps.length > 1) {
      setBondingSteps(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateBondingStep = (index: number, field: 'rangeTo' | 'price', value: string) => {
    setBondingSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ));
  };

  const validateBondingSteps = () => {
    for (let i = 0; i < bondingSteps.length; i++) {
      const step = bondingSteps[i];
      if (!step.rangeTo || !step.price || parseFloat(step.rangeTo) <= 0 || parseFloat(step.price) <= 0) {
        return false;
      }
      if (i > 0 && parseFloat(step.rangeTo) <= parseFloat(bondingSteps[i - 1].rangeTo)) {
        return false;
      }
    }
    return true;
  };

  const handleCreateToken = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.name || !formData.symbol || !formData.nftCollection) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (!validateBondingSteps()) {
      toast({
        title: 'Invalid bonding curve',
        description: 'Please ensure all steps have valid values and supply increases',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await createToken(
        formData.name,
        formData.symbol,
        formData.nftCollection,
        formData.reserveToken,
        bondingSteps,
        formData.mintRoyalty,
        formData.burnRoyalty
      );

      if (result.tokenAddress) {
        setCreatedTokens(prev => [...prev, {
          address: result.tokenAddress,
          name: formData.name,
          symbol: formData.symbol,
          txHash: result.tx.hash
        }]);

        toast({
          title: 'Token Created!',
          description: `${formData.name} created successfully`,
        });

        // Reset form
        setFormData({
          name: '',
          symbol: '',
          nftCollection: '',
          reserveToken: 'ETH',
          mintRoyalty: 250,
          burnRoyalty: 250
        });
        setBondingSteps([
          { rangeTo: '1000000', price: '0.000001' },
          { rangeTo: '10000000', price: '0.00001' },
          { rangeTo: '100000000', price: '0.0001' }
        ]);
      }
    } catch (err: any) {
      toast({
        title: 'Creation Failed',
        description: err.message || 'Failed to create token',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ERC20 Factory</h2>
          <p className="text-muted-foreground">Create bonding tokens with custom curves</p>
        </div>
      </div>

      {account && (
        <Card>
          <CardHeader>
            <CardTitle>Create Bonding Token</CardTitle>
            <CardDescription>
              Deploy a new ERC20 token with a bonding curve mechanism
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenName">Token Name *</Label>
                <Input
                  id="tokenName"
                  placeholder="My Bonding Token"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol">Symbol *</Label>
                <Input
                  id="tokenSymbol"
                  placeholder="MBT"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nftCollection">NFT Collection Address *</Label>
              <Input
                id="nftCollection"
                placeholder="0x..."
                value={formData.nftCollection}
                onChange={(e) => handleInputChange('nftCollection', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The NFT collection that will receive revenue from this token
              </p>
            </div>

            {/* Reserve Token & Royalties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reserveToken">Reserve Token</Label>
                <Select
                  value={formData.reserveToken}
                  onValueChange={(value) => handleInputChange('reserveToken', value)}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="mintRoyalty">Mint Royalty (bps)</Label>
                <Input
                  id="mintRoyalty"
                  type="number"
                  min="0"
                  max="5000"
                  value={formData.mintRoyalty}
                  onChange={(e) => handleInputChange('mintRoyalty', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.mintRoyalty / 100).toFixed(2)}% fee on mints
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="burnRoyalty">Burn Royalty (bps)</Label>
                <Input
                  id="burnRoyalty"
                  type="number"
                  min="0"
                  max="5000"
                  value={formData.burnRoyalty}
                  onChange={(e) => handleInputChange('burnRoyalty', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.burnRoyalty / 100).toFixed(2)}% fee on burns
                </p>
              </div>
            </div>

            {/* Bonding Curve Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Bonding Curve Steps</h3>
                  <p className="text-sm text-muted-foreground">
                    Define price tiers based on supply milestones
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBondingStep}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
              </div>

              <div className="space-y-3">
                {bondingSteps.map((step, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="shrink-0">
                        Step {index + 1}
                      </Badge>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        <div className="space-y-1">
                          <Label className="text-xs">Range To (Supply Threshold)</Label>
                          <Input
                            placeholder="1000000"
                            value={step.rangeTo}
                            onChange={(e) => updateBondingStep(index, 'rangeTo', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Price (ETH)</Label>
                          <Input
                            placeholder="0.000001"
                            value={step.price}
                            onChange={(e) => updateBondingStep(index, 'price', e.target.value)}
                          />
                        </div>
                      </div>
                      {bondingSteps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBondingStep(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Curve Preview</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Price increases as supply reaches each threshold. 
                  Max supply: {bondingSteps.length > 0 ? bondingSteps[bondingSteps.length - 1].rangeTo : '0'} tokens
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={handleCreateToken}
              disabled={loading || !account}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Bonding Token
            </Button>
          </CardContent>
        </Card>
      )}

      {createdTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Bonding Tokens</CardTitle>
            <CardDescription>Recently created bonding tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {createdTokens.map((token, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{token.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {token.symbol} • {token.address.slice(0, 8)}...{token.address.slice(-6)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://etherscan.io/address/${token.address}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(token.address);
                        toast({
                          title: 'Copied!',
                          description: 'Token address copied to clipboard',
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
    </div>
  );
} 