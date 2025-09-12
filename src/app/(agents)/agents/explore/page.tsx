'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAgents } from '@/hooks/use-agents';
import { CompositeUnicorn } from '@/components/composite-unicorn';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';

interface AgentCardProps {
  agent: {
    chatId: string;
    title: string;
    agentData?: {
      name?: string;
      description?: string;
      domain?: string;
      theme?: string;
      avatar?: {
        type: 'rom-unicorn' | 'custom';
        unicornParts?: {
          body: string;
          hair: string;
          eyes: string;
          mouth: string;
          accessory: string;
        };
        customType?: 'upload' | 'wallet';
        uploadedImage?: string;
        selectedNFT?: string;
      };
    };
  };
  licenseFee: number;
  licenseCrypto: string;
  tokenPrice?: number;
  tokenCrypto?: string;
  isVerified: boolean;
  onSelect: (agentId: string) => void;
}

function AgentCard({ agent, licenseFee, licenseCrypto, tokenPrice, tokenCrypto, isVerified, onSelect }: AgentCardProps) {
  const agentName = agent.agentData?.name || agent.title;
  const description = agent.agentData?.description || 'AI Agent ready to assist you';
  const domain = agent.agentData?.domain || 'General';
  
  const renderAgentAvatar = (size = 80) => {
    const avatar = agent.agentData?.avatar;
    
    if (avatar?.type === 'rom-unicorn' && avatar.unicornParts) {
      return (
        <div className="rounded-lg overflow-hidden">
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
          alt={agentName}
          width={size}
          height={size}
          className="rounded-lg object-cover"
        />
      );
    } else if (avatar?.type === 'custom' && avatar.customType === 'wallet' && avatar.selectedNFT) {
      return (
        <Image
          src={avatar.selectedNFT}
          alt={agentName}
          width={size}
          height={size}
          className="rounded-lg object-cover"
        />
      );
    } else {
      return <span className="text-4xl text-gray-400">🤖</span>;
    }
  };

  const getThemeColors = (theme?: string) => {
    switch (theme) {
      case 'blue': return { border: 'border-blue-500/30', bg: 'bg-blue-950/20', accent: 'text-blue-400' };
      case 'purple': return { border: 'border-purple-500/30', bg: 'bg-purple-950/20', accent: 'text-purple-400' };
      case 'red': return { border: 'border-red-500/30', bg: 'bg-red-950/20', accent: 'text-red-400' };
      case 'yellow': return { border: 'border-yellow-500/30', bg: 'bg-yellow-950/20', accent: 'text-yellow-400' };
      case 'pink': return { border: 'border-pink-500/30', bg: 'bg-pink-950/20', accent: 'text-pink-400' };
      case 'green':
      default: return { border: 'border-green-500/30', bg: 'bg-green-950/20', accent: 'text-green-400' };
    }
  };

  const themeColors = getThemeColors(agent.agentData?.theme);

  return (
    <button
      onClick={() => onSelect(agent.chatId)}
      className={`
        relative p-6 rounded-xl transition-all duration-200 text-left w-full
        bg-gray-800/50 border-2 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600
        hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/10
        ${themeColors.bg} ${themeColors.border}
      `}
    >
      {/* Verification Badge */}
      {isVerified && (
        <div className="absolute top-3 right-3 z-10">
          <div className="relative">
            <CheckCircle className="w-6 h-6 text-blue-400 bg-black rounded-full" />
            <div className="absolute inset-0 w-6 h-6 bg-blue-400/20 rounded-full animate-ping"></div>
          </div>
        </div>
      )}

      {/* Agent Avatar */}
      <div className="w-full aspect-square bg-gray-700/50 rounded-lg flex items-center justify-center overflow-hidden mb-4 max-w-[100px] mx-auto">
        {renderAgentAvatar(80)}
      </div>

      {/* Agent Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-gray-100 font-mono line-clamp-1 text-center mb-1">
            {agentName}
          </h3>
          <p className={`text-sm font-mono ${themeColors.accent} text-center`}>
            {domain.toUpperCase()}
          </p>
        </div>

        <p className="text-sm text-gray-300 line-clamp-2 font-mono">
          {description}
        </p>

        {/* Pricing */}
        <div className="space-y-2 pt-2 border-t border-gray-600/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-mono">LICENSE FEE</span>
            <div className="text-right">
              <span className="text-sm font-bold text-green-400 font-mono">
                ${licenseFee.toFixed(2)}
              </span>
            </div>
          </div>
          
          {tokenPrice && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-mono">TOKEN PRICE</span>
              <div className="text-right">
                <span className="text-sm font-bold text-blue-400 font-mono">
                  ${tokenPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Hint */}
        <div className="pt-2">
          <div className="text-xs text-gray-500 font-mono text-center">
            Click to mint license or buy tokens
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const { agents, isLoading, error } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  // Mock pricing and verification data - in real app this would come from the database
  const getAgentPricing = (agentId: string) => {
    // All agents have a license fee, some also have token prices
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

  const handleAgentSelect = (agentId: string) => {
    // Navigate to agent page for minting/buying
    router.push(`/agents/explore/${agentId}`);
  };

  // Filter agents based on search and domain
  const filteredAgents = agents?.filter(agent => {
    const matchesSearch = searchQuery === '' || 
      agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agentData?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agentData?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDomain = selectedDomain === 'all' || 
      agent.agentData?.domain?.toLowerCase() === selectedDomain.toLowerCase();
    
    return matchesSearch && matchesDomain;
  }) || [];

  // Get unique domains for filter
  const availableDomains = Array.from(new Set(
    agents?.map(agent => agent.agentData?.domain || 'General') || []
  ));

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl">⚠️</div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-red-100 font-mono">Error Loading Agents</h2>
            <p className="text-red-300/80 font-mono text-sm">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-green-100 font-mono">Explore AI Agents</h1>
            <p className="text-green-300/80 font-mono text-lg">
              Discover and mint licenses for AI agents in the marketplace
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl p-6 backdrop-blur-sm shadow-xl shadow-black/20 ring-1 ring-gray-500/10">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 font-mono text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>

              {/* Domain Filter Tags */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-mono">Filter by Domain:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDomain('all')}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all duration-200 ${
                      selectedDomain === 'all'
                        ? 'bg-green-500 text-black font-bold'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-gray-100'
                    }`}
                  >
                    All Domains
                  </button>
                  {availableDomains.map(domain => (
                    <button
                      key={domain}
                      onClick={() => setSelectedDomain(domain.toLowerCase())}
                      className={`px-3 py-1 rounded-full text-xs font-mono transition-all duration-200 ${
                        selectedDomain === domain.toLowerCase()
                          ? 'bg-green-500 text-black font-bold'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-gray-100'
                      }`}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Agent Grid */}
          <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl p-6 backdrop-blur-sm shadow-xl shadow-black/20 ring-1 ring-gray-500/10">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-green-300 font-mono">Loading agents...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-100 font-mono mb-2">No Agents Found</h3>
                <p className="text-gray-400 font-mono">
                  {searchQuery || selectedDomain !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No agents available in the marketplace yet'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-100 font-mono flex items-center gap-2">
                    <span>🤖</span>
                    <span>Available Agents</span>
                    <span className="text-sm text-gray-400 font-normal">
                      ({filteredAgents.length})
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAgents.map((agent) => {
                    const pricing = getAgentPricing(agent.chatId);
                    return (
                      <AgentCard
                        key={agent.chatId}
                        agent={agent}
                        licenseFee={pricing.licenseFee}
                        licenseCrypto={pricing.licenseCrypto}
                        tokenPrice={pricing.tokenPrice}
                        tokenCrypto={pricing.tokenCrypto}
                        isVerified={pricing.isVerified}
                        onSelect={handleAgentSelect}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 