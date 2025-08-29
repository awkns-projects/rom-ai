"use client"

import { useState } from 'react';
import { X, Check, Zap, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCardTypes, usePurchaseCard, type CardType } from '@/hooks/use-rom-cards';
import { toast } from '@/components/toast';

interface CardPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

export function CardPurchaseModal({ isOpen, onClose, onPurchaseComplete }: CardPurchaseModalProps) {
  const [selectedCardType, setSelectedCardType] = useState<CardType | null>(null);
  const [cardName, setCardName] = useState('');
  const [step, setStep] = useState<'select' | 'name' | 'confirm'>('select');
  
  const { cardTypes, isLoading: loadingTypes } = useCardTypes();
  const { purchaseCard, isLoading: purchasing } = usePurchaseCard();

  const handleSelectCard = (cardType: CardType) => {
    setSelectedCardType(cardType);
    setStep('name');
  };

  const handleConfirmPurchase = async () => {
    if (!selectedCardType || !cardName.trim()) return;

    try {
      await purchaseCard(selectedCardType.id, cardName.trim());
      toast({
        type: 'success',
        description: `Successfully purchased ${selectedCardType.displayName}!`,
      });
      onPurchaseComplete();
      handleClose();
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to purchase card. Please try again.',
      });
    }
  };

  const handleClose = () => {
    setSelectedCardType(null);
    setCardName('');
    setStep('select');
    onClose();
  };

  const getCardIcon = (cardName: string) => {
    switch (cardName) {
      case 'regular': return <Zap className="w-8 h-8" />;
      case 'marketplace': return <Star className="w-8 h-8" />;
      case 'publish': return <Crown className="w-8 h-8" />;
      default: return <Zap className="w-8 h-8" />;
    }
  };

  const getCardGradient = (cardName: string) => {
    switch (cardName) {
      case 'regular': return 'from-green-500 to-green-600';
      case 'marketplace': return 'from-blue-500 to-purple-600';
      case 'publish': return 'from-purple-500 to-pink-600';
      default: return 'from-green-500 to-green-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-green-500/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-500/20">
          <h2 className="text-2xl font-bold text-green-100 font-mono">Purchase ROM Card</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <div>
              <h3 className="text-lg font-semibold text-green-100 mb-6 font-mono">
                Choose Your ROM Card Type
              </h3>
              
              {loadingTypes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {cardTypes.map((cardType) => (
                    <div
                      key={cardType.id}
                      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        cardType.name === 'publish' 
                          ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10' 
                          : cardType.name === 'marketplace'
                          ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-purple-500/10'
                          : 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-600/10'
                      }`}
                      onClick={() => handleSelectCard(cardType)}
                    >
                      {/* Card Type Badge */}
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${getCardGradient(cardType.name)} flex items-center justify-center mb-4 text-white`}>
                        {getCardIcon(cardType.name)}
                      </div>

                      {/* Card Info */}
                      <h4 className="text-xl font-bold text-green-100 mb-2 font-mono">
                        {cardType.displayName}
                      </h4>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        {cardType.description}
                      </p>

                      {/* Price */}
                      <div className="text-3xl font-bold text-green-400 mb-4 font-mono">
                        ${cardType.price}
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        {cardType.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Check size={16} className="text-green-400 flex-shrink-0" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </div>
                        ))}
                        {cardType.features.length > 4 && (
                          <div className="text-gray-500 text-sm">
                            +{cardType.features.length - 4} more features
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'name' && selectedCardType && (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-green-100 mb-6 font-mono text-center">
                Name Your {selectedCardType.displayName}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-300 mb-2 font-mono">
                    Card Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g., My First ROM Card"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-green-100 font-mono focus:outline-none focus:border-green-500"
                    maxLength={50}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('select')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep('confirm')}
                    disabled={!cardName.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedCardType && (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-green-100 mb-6 font-mono text-center">
                Confirm Purchase
              </h3>
              
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getCardGradient(selectedCardType.name)} flex items-center justify-center text-white`}>
                    {getCardIcon(selectedCardType.name)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-100 font-mono">
                      {selectedCardType.displayName}
                    </h4>
                    <p className="text-gray-400 font-mono">{cardName}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-mono">Total:</span>
                    <span className="text-2xl font-bold text-green-400 font-mono">
                      ${selectedCardType.price}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('name')}
                  disabled={purchasing}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={purchasing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {purchasing ? 'Processing...' : 'Purchase Card'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 