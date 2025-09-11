'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAgents } from '@/hooks/use-agents';
import { CompositeUnicorn } from '@/components/composite-unicorn';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coins, CreditCard, Clock, Database, Zap, CheckCircle, TrendingUp, Users, DollarSign, Target } from 'lucide-react';

interface AgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AgentPage({ params }: AgentPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { agents, isLoading, loadMore, hasMore } = useAgents({ limit: 50 }); // Load more agents initially
  const [agent, setAgent] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'license' | 'token' | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Mock pricing and verification data - in real app this would come from the database
  const getAgentPricing = (agentId: string) => {
    const baseLicenseFee = Math.floor(Math.random() * 50) + 10; // $10-60
    const hasTokenPrice = Math.random() > 0.3; // 70% chance of having token price
    const tokenPrice = hasTokenPrice ? Math.floor(Math.random() * 20) + 5 : undefined; // $5-25
    
    // Different crypto currencies for minting
    const cryptoOptions = ['ETH', 'PEPE', 'AAVE', 'USDC', 'WBTC', 'LINK', 'UNI'];
    const licenseCrypto = cryptoOptions[Math.floor(Math.random() * cryptoOptions.length)];
    const tokenCrypto = hasTokenPrice ? cryptoOptions[Math.floor(Math.random() * cryptoOptions.length)] : undefined;
    
    return {
      licenseFee: baseLicenseFee,
      licenseCrypto,
      tokenPrice,
      tokenCrypto,
      isVerified: Math.random() > 0.6 // 40% chance of being verified
    };
  };

  // Mock token analytics data
  const getTokenAnalytics = (agentId: string) => {
    // Generate mock price history (30 days)
    const priceHistory = [];
    let basePrice = Math.random() * 10 + 5; // $5-15 starting price
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const volatility = (Math.random() - 0.5) * 0.4; // ±20% daily change
      basePrice = Math.max(0.1, basePrice * (1 + volatility));
      priceHistory.push({
        date: date.toISOString().split('T')[0],
        price: basePrice,
        volume: Math.random() * 100000 + 10000
      });
    }

    return {
      currentPrice: basePrice,
      priceChange24h: (Math.random() - 0.5) * 20, // ±10% change
      holders: Math.floor(Math.random() * 5000) + 500, // 500-5500 holders
      stakers: Math.floor(Math.random() * 2000) + 100, // 100-2100 stakers
      totalStaked: Math.random() * 1000000 + 100000, // $100k-1.1M staked
      revenueToDistribute: Math.random() * 50000 + 5000, // $5k-55k revenue
      stakingAPY: Math.random() * 25 + 5, // 5-30% APY
      priceHistory
    };
  };

  useEffect(() => {
    if (agents && resolvedParams.id) {
      const foundAgent = agents.find(a => a.chatId === resolvedParams.id);
      setAgent(foundAgent);
    }
  }, [agents, resolvedParams.id]);

  // If agent is not found but we're not loading, try to load more
  useEffect(() => {
    const searchForAgent = async () => {
      if (!isLoading && !agent && resolvedParams.id && agents && agents.length > 0 && hasMore && !isSearching) {
        console.log('Agent not found in current batch, loading more...', {
          searchingFor: resolvedParams.id,
          currentBatchSize: agents.length,
          hasMore
        });
        
        setIsSearching(true);
        try {
          await loadMore();
        } catch (error) {
          console.error('Failed to load more agents:', error);
        } finally {
          setIsSearching(false);
        }
      }
    };

    searchForAgent();
  }, [isLoading, agent, resolvedParams.id, agents, hasMore, loadMore, isSearching]);

  const handleMintLicense = async () => {
    setIsProcessing(true);
    setProcessingType('license');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, this would call the minting API
      console.log('Minting license for agent:', resolvedParams.id);
      
      // Show success message or redirect
      alert('License minted successfully!');
    } catch (error) {
      console.error('Failed to mint license:', error);
      alert('Failed to mint license. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  const handleBuyTokens = async () => {
    setIsProcessing(true);
    setProcessingType('token');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, this would call the token purchase API
      console.log('Buying tokens for agent:', resolvedParams.id);
      
      // Show success message or redirect
      alert('Tokens purchased successfully!');
    } catch (error) {
      console.error('Failed to buy tokens:', error);
      alert('Failed to buy tokens. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  const renderAgentAvatar = (size = 200) => {
    const avatar = agent?.agentData?.avatar;
    
    if (avatar?.type === 'rom-unicorn' && avatar.unicornParts) {
      return (
        <div className="rounded-xl overflow-hidden">
          <CompositeUnicorn
            parts={avatar.unicornParts}
            size={size}
          />
        </div>
      );
    } else if (avatar?.type === 'custom' && avatar.customType === 'upload' && avatar.uploadedImage) {
      return (
        <Image
          src={avatar.uploadedImage}
          alt={agent.agentData?.name || agent.title}
          width={size}
          height={size}
          className="rounded-xl object-cover"
        />
      );
    } else if (avatar?.type === 'custom' && avatar.customType === 'wallet' && avatar.selectedNFT) {
      return (
        <Image
          src={avatar.selectedNFT}
          alt={agent.agentData?.name || agent.title}
          width={size}
          height={size}
          className="rounded-xl object-cover"
        />
      );
    } else {
      return (
        <div className="w-full h-full bg-gray-700/50 rounded-xl flex items-center justify-center">
          <span className="text-8xl text-gray-400">🤖</span>
        </div>
      );
    }
  };

  const getThemeColors = (theme?: string) => {
    switch (theme) {
      case 'blue': return { 
        border: 'border-blue-500/30', 
        bg: 'bg-blue-950/20', 
        accent: 'text-blue-400',
        gradient: 'from-blue-500 to-cyan-400'
      };
      case 'purple': return { 
        border: 'border-purple-500/30', 
        bg: 'bg-purple-950/20', 
        accent: 'text-purple-400',
        gradient: 'from-purple-500 to-pink-400'
      };
      case 'red': return { 
        border: 'border-red-500/30', 
        bg: 'bg-red-950/20', 
        accent: 'text-red-400',
        gradient: 'from-red-500 to-pink-400'
      };
      case 'yellow': return { 
        border: 'border-yellow-500/30', 
        bg: 'bg-yellow-950/20', 
        accent: 'text-yellow-400',
        gradient: 'from-yellow-400 to-green-500'
      };
      case 'pink': return { 
        border: 'border-pink-500/30', 
        bg: 'bg-pink-950/20', 
        accent: 'text-pink-400',
        gradient: 'from-pink-500 to-cyan-400'
      };
      case 'green':
      default: return { 
        border: 'border-green-500/30', 
        bg: 'bg-green-950/20', 
        accent: 'text-green-400',
        gradient: 'from-green-500 to-lime-400'
      };
    }
  };

  if (isLoading || isSearching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-green-300 font-mono">
            {isSearching ? "Searching for agent..." : "Loading agent..."}
          </p>
        </div>
      </div>
    );
  }

  // Only show "not found" if we've finished loading and searching, and there are no more agents to load
  if (!agent && !isLoading && !isSearching && !hasMore) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl">❌</div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-red-100 font-mono">Agent Not Found</h2>
            <p className="text-red-300/80 font-mono text-sm">The requested agent could not be found</p>
            <Button 
              onClick={() => router.push('/agents/explore')}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if we don't have the agent yet but we're still loading or searching
  if (!agent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-green-300 font-mono">Loading agent...</p>
        </div>
      </div>
    );
  }

  const agentName = agent.agentData?.name || agent.title;
  const description = agent.agentData?.description || 'AI Agent ready to assist you';
  const domain = agent.agentData?.domain || 'General';
  const themeColors = getThemeColors(agent.agentData?.theme);
  const pricing = getAgentPricing(agent.chatId);
  const analytics = pricing.tokenPrice ? getTokenAnalytics(agent.chatId) : null;

  // Interactive chart component
  const TokenChart = ({ data }: { data: any[] }) => {
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; date: string } | null>(null);
    const maxPrice = Math.max(...data.map(d => d.price));
    const minPrice = Math.min(...data.map(d => d.price));
    const priceRange = maxPrice - minPrice;
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Convert mouse position to data point
      const dataIndex = Math.round((x / rect.width) * (data.length - 1));
      if (dataIndex >= 0 && dataIndex < data.length) {
        const point = data[dataIndex];
        const chartX = (dataIndex / (data.length - 1)) * 300;
        const chartY = 160 - ((point.price - minPrice) / priceRange) * 160;
        
        setHoveredPoint({
          x: chartX,
          y: chartY,
          price: point.price,
          date: new Date(point.date).toLocaleDateString()
        });
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
    };
    
    return (
      <div 
        className="h-40 w-full relative cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg className="w-full h-full" viewBox="0 0 300 160">
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 40}
              x2="300"
              y2={i * 40}
              stroke="#374151"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}
          
          {/* Fill area */}
          <path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 300;
              const y = 160 - ((point.price - minPrice) / priceRange) * 160;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' L 300 160 L 0 160 Z'}
            fill="url(#priceGradient)"
          />
          
          {/* Price line */}
          <path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 300;
              const y = 160 - ((point.price - minPrice) / priceRange) * 160;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
          />
          
          {/* Hover indicator */}
          {hoveredPoint && (
            <>
              {/* Vertical line */}
              <line
                x1={hoveredPoint.x}
                y1="0"
                x2={hoveredPoint.x}
                y2="160"
                stroke="#22c55e"
                strokeWidth="1"
                opacity="0.5"
                strokeDasharray="2,2"
              />
              {/* Hover point */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4"
                fill="#22c55e"
                stroke="#000"
                strokeWidth="2"
              />
            </>
          )}
        </svg>
        
        {/* Price labels */}
        <div className="absolute top-0 right-0 text-xs text-gray-400 font-mono">
          ${maxPrice.toFixed(2)}
        </div>
        <div className="absolute bottom-0 right-0 text-xs text-gray-400 font-mono">
          ${minPrice.toFixed(2)}
        </div>
        
        {/* Hover tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute z-10 bg-black/90 backdrop-blur-sm border border-green-500/30 rounded-lg p-3 pointer-events-none"
            style={{
              left: `${(hoveredPoint.x / 300) * 100}%`,
              top: `${(hoveredPoint.y / 160) * 100}%`,
              transform: hoveredPoint.x > 200 ? 'translate(-100%, -120%)' : 'translate(10px, -120%)'
            }}
          >
            <div className="text-sm font-mono text-green-400 font-bold">
              ${hoveredPoint.price.toFixed(2)}
            </div>
            <div className="text-xs font-mono text-gray-400">
              {hoveredPoint.date}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Back Button */}
          <div>
            <Button 
              onClick={() => router.push('/agents/explore')}
              variant="ghost"
              className="text-gray-400 hover:text-gray-200 font-mono"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Button>
          </div>

          {/* Agent Header */}
          <div className="relative bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl p-8 backdrop-blur-sm shadow-xl shadow-black/20">
            {/* Verification Badge */}
            {pricing.isVerified && (
              <div className="absolute top-4 right-4 z-10">
                <div className="relative">
                  <CheckCircle className="w-8 h-8 text-blue-400 bg-black rounded-full" />
                  <div className="absolute inset-0 w-8 h-8 bg-blue-400/20 rounded-full animate-ping"></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Agent Avatar */}
              <div className="flex justify-center">
                <div className="w-[200px] h-[200px]">
                  {renderAgentAvatar(200)}
                </div>
              </div>

              {/* Agent Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-100 font-mono mb-2">
                    {agentName}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`${themeColors.bg} ${themeColors.border} ${themeColors.accent} font-mono`}>
                      {domain.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      ID: {agent.chatId.slice(0, 8)}...
                    </Badge>
                  </div>
                  <p className="text-gray-300 font-mono text-lg leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Pricing & Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* License Fee */}
                  <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-green-500/5 ring-1 ring-green-500/10">
                    <div className="flex items-center gap-3 mb-4">
                      <CreditCard className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-bold text-gray-100 font-mono">License Fee</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-green-400 font-mono">
                          ${pricing.licenseFee.toFixed(2)} USD
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          Pay with {pricing.licenseCrypto}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 font-mono">
                        One-time fee to mint agent license
                      </p>
                      <Button
                        onClick={handleMintLicense}
                        disabled={isProcessing}
                        className={`w-full bg-gradient-to-r ${themeColors.gradient} text-black font-mono font-medium hover:opacity-90 transition-opacity`}
                      >
                        {isProcessing && processingType === 'license' ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div>
                            Minting...
                          </div>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Mint License
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Token Price */}
                  {pricing.tokenPrice && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Coins className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-gray-100 font-mono">Token Price</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-blue-400 font-mono">
                            ${pricing.tokenPrice.toFixed(2)} USD
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            Pay with {pricing.tokenCrypto}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 font-mono">
                          Per token for agent interactions
                        </p>
                        <Button
                          onClick={handleBuyTokens}
                          disabled={isProcessing}
                          variant="outline"
                          className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-950/20 font-mono"
                        >
                          {isProcessing && processingType === 'token' ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                              Buying...
                            </div>
                          ) : (
                            <>
                              <Coins className="w-4 h-4 mr-2" />
                              Buy Tokens
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Token Analytics */}
          {analytics && (
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-2xl p-8 backdrop-blur-sm shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/10">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-100 font-mono">Token Analytics</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Price Chart */}
                <div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-100 font-mono mb-4">Price History (30 Days)</h3>
                      <div className="flex items-center gap-6">
                        <div className="text-3xl font-bold text-blue-400 font-mono">
                          ${analytics.currentPrice.toFixed(2)}
                        </div>
                        <div className={`text-lg font-mono px-3 py-1 rounded-full ${analytics.priceChange24h >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                          {analytics.priceChange24h >= 0 ? '+' : ''}{analytics.priceChange24h.toFixed(2)}% (24h)
                        </div>
                      </div>
                    </div>
                    
                    <TokenChart data={analytics.priceHistory} />
                    
                    {/* Additional chart info */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-4 text-sm font-mono mb-4">
                        <div>
                          <span className="text-gray-400">Volume (24h):</span>
                          <span className="text-gray-200 ml-2">${(analytics.priceHistory[analytics.priceHistory.length - 1]?.volume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Market Cap:</span>
                          <span className="text-gray-200 ml-2">${((analytics.currentPrice * analytics.holders * 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                      
                      {/* Price range indicators */}
                      <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">30D LOW</div>
                          <div className="text-red-400 font-bold">
                            ${Math.min(...analytics.priceHistory.map(p => p.price)).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">30D HIGH</div>
                          <div className="text-green-400 font-bold">
                            ${Math.max(...analytics.priceHistory.map(p => p.price)).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">AVG VOLUME</div>
                          <div className="text-blue-400 font-bold">
                            ${(analytics.priceHistory.reduce((sum, p) => sum + p.volume, 0) / analytics.priceHistory.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {/* Holders */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-100 font-mono">HOLDERS</h4>
                        <div className="text-2xl font-bold text-cyan-400 font-mono">
                          {analytics.holders.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stakers */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-100 font-mono">STAKERS</h4>
                        <div className="text-2xl font-bold text-purple-400 font-mono">
                          {analytics.stakers.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      APY: {analytics.stakingAPY.toFixed(1)}%
                    </div>
                  </div>

                  {/* Total Staked */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-100 font-mono">STAKED VALUE</h4>
                        <div className="text-2xl font-bold text-yellow-400 font-mono">
                          ${analytics.totalStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue to Distribute */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-100 font-mono">PENDING REWARDS</h4>
                        <div className="text-2xl font-bold text-green-400 font-mono">
                          ${analytics.revenueToDistribute.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      Ready for distribution
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agent Capabilities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Models */}
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-purple-500/5 ring-1 ring-purple-500/10">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-gray-100 font-mono">Data Models</h2>
              </div>
              
              {agent.agentData?.models && agent.agentData.models.length > 0 ? (
                                  <div className="space-y-4">
                    {agent.agentData.models.slice(0, 3).map((model: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-lg p-4 shadow-md shadow-black/20 hover:shadow-lg hover:shadow-purple-500/10 transition-shadow duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        {model.emoji && <span className="text-lg">{model.emoji}</span>}
                        <h3 className="font-bold text-gray-100 font-mono">
                          {model.title || model.name}
                        </h3>
                      </div>
                      {model.description && (
                        <p className="text-sm text-gray-400 font-mono">
                          {model.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {model.fields?.length || 0} fields
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {agent.agentData.models.length > 3 && (
                    <p className="text-sm text-gray-400 font-mono text-center">
                      +{agent.agentData.models.length - 3} more models
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 font-mono">No data models configured</p>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-yellow-500/5 ring-1 ring-yellow-500/10">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold text-gray-100 font-mono">Actions</h2>
              </div>
              
              {agent.agentData?.actions && agent.agentData.actions.length > 0 ? (
                <div className="space-y-4">
                  {agent.agentData.actions.slice(0, 3).map((action: any, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-lg p-4 shadow-md shadow-black/20 hover:shadow-lg hover:shadow-yellow-500/10 transition-shadow duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-100 font-mono">
                          {action.name}
                        </h3>
                      </div>
                      {action.description && (
                        <p className="text-sm text-gray-400 font-mono">
                          {action.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {action.steps?.length || 0} steps
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {agent.agentData.actions.length > 3 && (
                    <p className="text-sm text-gray-400 font-mono text-center">
                      +{agent.agentData.actions.length - 3} more actions
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 font-mono">No actions configured</p>
              )}
            </div>
          </div>

          {/* Schedules */}
          {agent.agentData?.schedules && agent.agentData.schedules.length > 0 && (
            <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/10">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-gray-100 font-mono">Scheduled Tasks</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agent.agentData.schedules.map((schedule: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-lg p-4 shadow-md shadow-black/20 hover:shadow-lg hover:shadow-cyan-500/10 transition-shadow duration-300">
                    <h3 className="font-bold text-gray-100 font-mono mb-2">
                      {schedule.name}
                    </h3>
                    {schedule.description && (
                      <p className="text-sm text-gray-400 font-mono mb-2">
                        {schedule.description}
                      </p>
                    )}
                    <Badge variant="outline" className="text-xs font-mono">
                      {schedule.frequency || 'Custom'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-black/10 ring-1 ring-gray-500/10">
            <h2 className="text-xl font-bold text-gray-100 font-mono mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-mono">
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="text-gray-200 ml-2">
                  {agent.agentData?.createdAt 
                    ? new Date(agent.agentData.createdAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-400">Version:</span>
                <span className="text-gray-200 ml-2">
                  {agent.agentData?.metadata?.version || '1.0.0'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 ml-2">
                  {agent.agentData?.deployment?.status || 'Active'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Agent ID:</span>
                <span className="text-gray-200 ml-2 break-all">
                  {agent.chatId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 