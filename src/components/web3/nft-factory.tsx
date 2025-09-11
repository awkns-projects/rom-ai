'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Wallet, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNFTFactory, useWeb3Provider } from '@/hooks/use-web3-contracts';
import { ETH_ADDRESS } from '@/lib/web3/contracts';

export function NFTFactoryComponent() {
  const { toast } = useToast();
  const { account, connectWallet, isConnecting } = useWeb3Provider();
  const { createCollection, getCreationFee, loading, error } = useNFTFactory();
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    baseURI: '',
    paymentToken: 'ETH',
    mintPrice: '',
    maxSupply: ''
  });
  const [creationFee, setCreationFee] = useState<string>('0');
  const [createdCollections, setCreatedCollections] = useState<Array<{
    address: string;
    name: string;
    symbol: string;
    txHash: string;
  }>>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadCreationFee = async () => {
    try {
      const fee = await getCreationFee();
      setCreationFee(fee);
    } catch (err) {
      console.error('Failed to load creation fee:', err);
    }
  };

  const handleCreateCollection = async () => {
    if (!account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.name || !formData.symbol || !formData.mintPrice || !formData.maxSupply) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await createCollection(
        formData.name,
        formData.symbol,
        formData.baseURI || `https://api.example.com/metadata/${formData.symbol.toLowerCase()}/`,
        formData.paymentToken,
        formData.mintPrice,
        formData.maxSupply
      );

      if (result.collectionAddress) {
        setCreatedCollections(prev => [...prev, {
          address: result.collectionAddress,
          name: formData.name,
          symbol: formData.symbol,
          txHash: result.tx.hash
        }]);

        toast({
          title: 'Collection Created!',
          description: `${formData.name} created successfully`,
        });

        // Reset form
        setFormData({
          name: '',
          symbol: '',
          baseURI: '',
          paymentToken: 'ETH',
          mintPrice: '',
          maxSupply: ''
        });
      }
    } catch (err: any) {
      toast({
        title: 'Creation Failed',
        description: err.message || 'Failed to create collection',
        variant: 'destructive'
      });
    }
  };

  // Load creation fee on mount and when account changes
  useEffect(() => {
    if (account) {
      loadCreationFee();
    }
  }, [account]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NFT Factory</h2>
          <p className="text-muted-foreground">Create your own NFT collections</p>
        </div>
        {!account ? (
          <Button onClick={connectWallet} disabled={isConnecting}>
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Connect Wallet
          </Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1">
            {account.slice(0, 6)}...{account.slice(-4)}
          </Badge>
        )}
      </div>

      {account && (
        <Card>
          <CardHeader>
            <CardTitle>Create NFT Collection</CardTitle>
            <CardDescription>
              Deploy a new NFT collection with custom settings
              {creationFee !== '0' && (
                <span className="block mt-1 text-sm">
                  Creation fee: {creationFee} ETH
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  placeholder="My NFT Collection"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="MNC"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseURI">Base URI (optional)</Label>
              <Textarea
                id="baseURI"
                placeholder="https://api.example.com/metadata/"
                value={formData.baseURI}
                onChange={(e) => handleInputChange('baseURI', e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use a default pattern based on your symbol
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentToken">Payment Token</Label>
                <Select
                  value={formData.paymentToken}
                  onValueChange={(value) => handleInputChange('paymentToken', value)}
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
                <Label htmlFor="mintPrice">Mint Price * (ETH)</Label>
                <Input
                  id="mintPrice"
                  type="number"
                  step="0.001"
                  placeholder="0.01"
                  value={formData.mintPrice}
                  onChange={(e) => handleInputChange('mintPrice', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSupply">Max Supply *</Label>
                <Input
                  id="maxSupply"
                  type="number"
                  placeholder="10000"
                  value={formData.maxSupply}
                  onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={handleCreateCollection}
              disabled={loading || !account}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Collection
            </Button>
          </CardContent>
        </Card>
      )}

      {createdCollections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Collections</CardTitle>
            <CardDescription>Recently created NFT collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {createdCollections.map((collection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{collection.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {collection.symbol} • {collection.address.slice(0, 8)}...{collection.address.slice(-6)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://etherscan.io/address/${collection.address}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(collection.address);
                        toast({
                          title: 'Copied!',
                          description: 'Collection address copied to clipboard',
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