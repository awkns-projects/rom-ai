"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAgents, type Agent } from "@/hooks/use-agents"
import { useRomCards, type RomCard } from "@/hooks/use-rom-cards"
import { CompositeUnicorn } from "@/components/composite-unicorn"
import { CardPurchaseModal } from "@/components/card-purchase-modal"
import Image from "next/image"
import {
  Brain,
  Cpu,
  Zap,
  Heart,
  Target,
  Sparkles,
  Play,
  Pause,
  EraserIcon as Eject,
  Power,
  Library,
  X,
  Terminal,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface AICassette {
  id: string
  name: string
  type: string
  description: string
  color: string
  gradient: string
  icon: React.ReactNode
  balance: number
  capacity: string
  isInserted?: boolean
  slotId?: number | null
  matrixCode: string
  costPerHour: number
  lastUsed: string
  originalAgent?: Agent
}

interface AIAgent {
  id: string
  name: string
  type: string
  costPerHour: number
  description: string
  icon: React.ReactNode
}

interface CassetteSlot {
  id: number
  isOccupied: boolean
  cassetteId: string | null
  agentId: string | null
  isActive: boolean
  startTime: number | null
  totalSpent: number
}

// New interface for ROM Card instances
interface ROMCard {
  id: string
  name: string
  description: string
  color: string
  gradient: string
  slots: CassetteSlot[]
  totalBalance: number
  isDeployed: boolean
  createdAt: string
  lastUsed: string
}

// Matrix Rain Component
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}".split("")
    const fontSize = 10
    const columns = canvas.width / fontSize

    const drops: number[] = []
    for (let x = 0; x < columns; x++) {
      drops[x] = 1
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.04)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#0F0"
      ctx.font = fontSize + "px monospace"

      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 35)
    return () => clearInterval(interval)
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-20 z-0" />
}

// Glitch Text Component
const GlitchText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    const interval = setInterval(
      () => {
        setIsGlitching(true)
        setTimeout(() => setIsGlitching(false), 100)
      },
      3000 + Math.random() * 2000,
    )

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div
        className={`transition-all duration-100 ${isGlitching ? "transform translate-x-1 text-red-500" : ""}`}
        style={{
          textShadow: isGlitching ? "2px 0 #ff0000, -2px 0 #00ffff, 0 0 10px #00ff00" : "0 0 10px currentColor",
        }}
      >
        {children}
      </div>
      {isGlitching && (
        <>
          <div className="absolute inset-0 text-cyan-400 transform -translate-x-1 opacity-70">{children}</div>
          <div className="absolute inset-0 text-red-500 transform translate-x-1 opacity-70">{children}</div>
        </>
      )}
    </div>
  )
}

// Typewriter Effect
const TypewriterText = ({ text, speed = 50 }: { text: string; speed?: number }) => {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  return (
    <span className="font-mono">
      {displayText}
      <span className="animate-pulse text-green-400">█</span>
    </span>
  )
}

// Progress Bar Component
const ProgressBar = ({ progress }: { progress: number }) => {
  const filledBlocks = Math.floor((progress / 100) * 32)
  const progressBar = Array.from({ length: 32 }, (_, i) => i < filledBlocks ? '█' : '░').join('')
  
  return (
    <span className="font-mono text-green-400">
      [{progressBar}] {progress.toFixed(0)}%
    </span>
  )
}

// Helper function to render agent avatar
const renderAgentAvatar = (agent: Agent, size = 48) => {
  const avatar = agent.agentData?.avatar
  
  if (avatar?.type === 'rom-unicorn' && avatar.unicornParts) {
    return <CompositeUnicorn parts={avatar.unicornParts} size={size} />
  } else if (avatar?.type === 'custom' && avatar.customType === 'upload' && avatar.uploadedImage) {
    return (
      <Image
        src={avatar.uploadedImage}
        alt={agent.agentData?.name || agent.title}
        width={size}
        height={size}
        className="rounded-lg object-cover"
      />
    )
  } else if (avatar?.type === 'custom' && avatar.customType === 'wallet' && avatar.selectedNFT) {
    return <span className="text-xl">{avatar.selectedNFT.split(' ')[0]}</span>
  } else {
    return <span className="text-xl text-gray-400">🤖</span>
  }
}

// Helper function to convert agent to cassette format
const agentToCassette = (agent: Agent): AICassette => {
  const getIconForDomain = (domain: string) => {
    switch (domain?.toLowerCase()) {
      case 'marketing': return <Target className="w-5 h-5" />
      case 'health': return <Heart className="w-5 h-5" />
      case 'content': return <Sparkles className="w-5 h-5" />
      case 'development': return <Cpu className="w-5 h-5" />
      case 'analysis': return <TrendingUp className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  const getThemeGradient = (theme?: string) => {
    switch (theme) {
      case 'blue': return 'from-blue-500 to-cyan-400'
      case 'purple': return 'from-purple-500 to-pink-400'
      case 'red': return 'from-red-500 to-pink-400'
      case 'yellow': return 'from-yellow-400 to-green-500'
      case 'pink': return 'from-pink-500 to-cyan-400'
      case 'green':
      default: return 'from-green-500 to-lime-400'
    }
  }

  const gradient = getThemeGradient(agent.agentData?.theme)
  const domain = agent.agentData?.domain || 'GENERAL'
  const agentName = agent.agentData?.name || agent.title
  
  return {
    id: agent.chatId,
    name: `${agentName.toUpperCase().replace(/\s+/g, '_')}_ROM.bin`,
    type: domain.toUpperCase(),
    description: `{'>>> ${(agent.agentData?.description || 'AI AGENT PROTOCOLS').toUpperCase()} <<<'}`,
    color: gradient,
    gradient: `bg-gradient-to-r ${gradient}`,
    icon: getIconForDomain(domain),
    balance: Math.random() * 300 + 50, // Random balance for demo
    capacity: `${(Math.random() * 3 + 1).toFixed(1)}TB`,
    isInserted: false,
    slotId: null,
    matrixCode: Array(3).fill(0).map(() => 
      Math.floor(Math.random() * 256).toString(2).padStart(8, '0')
    ).join(' '),
    costPerHour: Math.random() * 10 + 5, // Random cost between 5-15
    lastUsed: `${Math.floor(Math.random() * 24)} hours ago`,
    // Store the original agent for access to full data
    originalAgent: agent,
  }
}

export default function AIPlayer() {
  const { agents, isLoading } = useAgents({ limit: 20 })
  const { romCards: dbRomCards, isLoading: loadingCards, refreshCards } = useRomCards()
  const [cassettes, setCassettes] = useState<AICassette[]>([])
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const [availableAgents] = useState<AIAgent[]>([
    {
      id: "data-analyst",
      name: "DATA_ANALYST_ROM_v3.2",
      type: "ANALYSIS",
      costPerHour: 8.5,
      description: "Advanced ROM data processing and analysis capabilities",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "content-creator",
      name: "CONTENT_GEN_ROM_v2.1",
      type: "CREATIVE",
      costPerHour: 12.0,
      description: "Creative ROM content generation and writing protocols",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: "code-assistant",
      name: "CODE_ASSIST_ROM_v4.0",
      type: "DEVELOPMENT",
      costPerHour: 15.75,
      description: "Advanced ROM coding and development assistance",
      icon: <Terminal className="w-4 h-4" />,
    },
    {
      id: "research-bot",
      name: "RESEARCH_ROM_v1.8",
      type: "RESEARCH",
      costPerHour: 10.25,
      description: "Comprehensive ROM research and information gathering",
      icon: <Brain className="w-4 h-4" />,
    },
  ])

  // Transform database ROM cards to component format
  const [romCards, setRomCards] = useState<ROMCard[]>([])

  // Legacy state - keeping for now but will use romCards primarily
  const [slots, setSlots] = useState<CassetteSlot[]>([
    { id: 1, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
    { id: 2, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
    { id: 3, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
    { id: 4, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
  ])

  const [isPowered, setIsPowered] = useState(true)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [selectedCassette, setSelectedCassette] = useState<string | null>(null)
  const [selectedRomCard, setSelectedRomCard] = useState<string | null>(null) // Will be set from database
  const [isMobile, setIsMobile] = useState(false)
  const [bootSequence, setBootSequence] = useState(true)
  const [bootProgress, setBootProgress] = useState(0)
  const [systemTime, setSystemTime] = useState(new Date())
  const [originalBalances, setOriginalBalances] = useState<Record<string, number>>({})

  // Helper function to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  // Transform database cards to component format
  useEffect(() => {
    if (dbRomCards && dbRomCards.length > 0) {
      const transformedCards: ROMCard[] = dbRomCards.map((dbCard) => {
        const getCardColor = (cardType: string) => {
          switch (cardType) {
            case 'regular': return { color: 'from-green-500 to-cyan-400', gradient: 'bg-gradient-to-r from-green-500 to-cyan-400' };
            case 'marketplace': return { color: 'from-blue-500 to-purple-400', gradient: 'bg-gradient-to-r from-blue-500 to-purple-400' };
            case 'publish': return { color: 'from-purple-500 to-pink-400', gradient: 'bg-gradient-to-r from-purple-500 to-pink-400' };
            default: return { color: 'from-green-500 to-cyan-400', gradient: 'bg-gradient-to-r from-green-500 to-cyan-400' };
          }
        };

        const cardStyle = getCardColor(dbCard.cardType.name);
        const maxSlots = dbCard.cardType.maxSlots || 4;
        
        // Create empty slots based on card type
        const slots: CassetteSlot[] = [];
        for (let i = 1; i <= maxSlots; i++) {
          slots.push({
            id: i,
            isOccupied: false,
            cassetteId: null,
            agentId: null,
            isActive: false,
            startTime: null,
            totalSpent: 0
          });
        }

        return {
          id: dbCard.id,
          name: dbCard.name,
          description: `${dbCard.cardType.displayName} - ${maxSlots} slots`,
          color: cardStyle.color,
          gradient: cardStyle.gradient,
          slots,
          totalBalance: parseFloat(dbCard.balance),
          isDeployed: dbCard.isDeployed,
          createdAt: new Date(dbCard.createdAt).toISOString().split('T')[0],
          lastUsed: dbCard.lastUsed ? formatTimeAgo(new Date(dbCard.lastUsed)) : 'Never used',
        };
      });

      setRomCards(transformedCards);
      
      // Set first card as selected if none selected
      if (!selectedRomCard && transformedCards.length > 0) {
        setSelectedRomCard(transformedCards[0].id);
      }
    }
  }, [dbRomCards, selectedRomCard])

  // Helper functions for consistent cost calculations
  const getSelectedCassette = () => cassettes.find((c) => c.id === selectedCassette)
  const getCassetteBaseCost = () => getSelectedCassette()?.costPerHour || 0
  const getTotalHourlyCost = () => getCassetteBaseCost()

  // New helper functions for ROM Cards
  const getSelectedRomCard = () => romCards.find((card) => card.id === selectedRomCard)
  const getCurrentSlots = () => getSelectedRomCard()?.slots || []
  
  // Helper function to check if a cassette can be inserted into the current ROM card
  const canInsertCassetteInCurrentCard = (cassetteId: string) => {
    const currentCard = getSelectedRomCard()
    if (!currentCard) return false
    return !currentCard.slots.some(slot => slot.cassetteId === cassetteId)
  }

  // Helper function to count how many ROM cards an agent is deployed to
  const getAgentDeploymentCount = (cassetteId: string) => {
    return romCards.reduce((count, romCard) => {
      const deployedInThisCard = romCard.slots.some(slot => slot.cassetteId === cassetteId)
      return count + (deployedInThisCard ? 1 : 0)
    }, 0)
  }

  const getAgentActiveCount = (cassetteId: string) => {
    return romCards.reduce((count, romCard) => {
      const activeInThisCard = romCard.slots.some(slot => slot.cassetteId === cassetteId && slot.isActive)
      return count + (activeInThisCard ? 1 : 0)
    }, 0)
  }
  
  // Updated ROM Card cost calculations
  const getRomCardHourlyCost = (romCard: ROMCard) => {
    return romCard.slots
      .filter(slot => slot.isOccupied && slot.cassetteId)
      .reduce((sum, slot) => {
        const cassette = cassettes.find(c => c.id === slot.cassetteId)
        return sum + (cassette?.costPerHour || 0)
      }, 0)
  }

  const getAllRomCardsHourlyCost = () => {
    return romCards.reduce((total, romCard) => total + getRomCardHourlyCost(romCard), 0)
  }

  const getActiveRomCardsCount = () => {
    return romCards.filter(card => card.isDeployed).length
  }

  const getRomCardActiveSlotsCost = (romCard: ROMCard) => {
    return romCard.slots
      .filter(slot => slot.isActive && slot.cassetteId)
      .reduce((sum, slot) => {
        const cassette = cassettes.find(c => c.id === slot.cassetteId)
        return sum + (cassette?.costPerHour || 0)
      }, 0)
  }

  const getAllActiveSlotsCost = () => {
    return romCards.reduce((total, romCard) => total + getRomCardActiveSlotsCost(romCard), 0)
  }

  const getTotalSessionSpentAllCards = () => {
    return romCards.reduce((total, card) => 
      total + card.slots.reduce((sum, slot) => sum + slot.totalSpent, 0), 0
    )
  }

  const getCurrentTotalBalance = () => {
    return romCards.reduce((sum, card) => sum + card.totalBalance, 0)
  }

  const getPreviewOrActiveCost = () => {
    const activeSlotsCost = getAllActiveSlotsCost()
    if (activeSlotsCost > 0) {
      return activeSlotsCost
    } else {
      // Only show preview cost for deployed ROM cards
      return romCards
        .filter(card => card.isDeployed)
        .reduce((total, romCard) => total + getRomCardHourlyCost(romCard), 0)
    }
  }

  // ROM Card management functions
  const addNewRomCard = () => {
    setShowPurchaseModal(true)
  }

  const handlePurchaseComplete = () => {
    refreshCards() // Refresh the cards from database
  }

  const deleteRomCard = (cardId: string) => {
    if (romCards.length <= 1) return // Don't allow deleting the last card
    
    const updatedCards = romCards.filter(card => card.id !== cardId)
    setRomCards(updatedCards)
    
    if (selectedRomCard === cardId) {
      setSelectedRomCard(updatedCards[0]?.id || null)
    }
  }

  const deployRomCard = (cardId: string) => {
    setRomCards(cards => 
      cards.map(card => 
        card.id === cardId 
          ? { ...card, isDeployed: !card.isDeployed, lastUsed: "Just deployed" }
          : card
      )
    )
  }

  const getEstimatedRuntime = () => {
    const cassette = getSelectedCassette()
    const totalCost = getTotalHourlyCost()
    if (!cassette || totalCost === 0 || !selectedCassette) return { hours: 0, minutes: 0 }
    const totalHours = cassette.balance / totalCost
    return {
      hours: Math.floor(totalHours),
      minutes: Math.floor((totalHours % 1) * 60),
    }
  }

  // Update active slot spending function for ROM Cards
  const updateActiveSlotSpending = () => {
    setRomCards((prevRomCards) =>
      prevRomCards.map((romCard) => ({
        ...romCard,
        slots: romCard.slots.map((slot) => {
          if (slot.isActive && slot.startTime && slot.cassetteId) {
            const cassette = cassettes.find((c) => c.id === slot.cassetteId)
            if (cassette) {
              const hoursRunning = (Date.now() - slot.startTime) / (1000 * 60 * 60)
              const currentCost = hoursRunning * cassette.costPerHour
              return { ...slot, totalSpent: currentCost }
            }
          }
          return slot
        }),
      }))
    )

    // Update ROM card balances based on active slots
    setRomCards((prevRomCards) =>
      prevRomCards.map((romCard) => {
        const totalSpentThisCard = romCard.slots.reduce((sum, slot) => sum + slot.totalSpent, 0)
        const originalBalance = originalBalances[romCard.id] || romCard.totalBalance
        const newBalance = Math.max(0, originalBalance - totalSpentThisCard)
        return { ...romCard, totalBalance: newBalance }
      })
    )

    // Update cassette balances separately for display
    setCassettes((prevCassettes) =>
      prevCassettes.map((cassette) => {
        // Find all active slots across all ROM cards using this cassette
        let totalSpentOnCassette = 0
        romCards.forEach(romCard => {
          romCard.slots.forEach(slot => {
            if (slot.cassetteId === cassette.id && slot.isActive && slot.startTime) {
              const hoursRunning = (Date.now() - slot.startTime) / (1000 * 60 * 60)
              totalSpentOnCassette += hoursRunning * cassette.costPerHour
            }
          })
        })
        
        if (totalSpentOnCassette > 0) {
          const originalBalance = originalBalances[cassette.id] || cassette.balance
          const newBalance = Math.max(0, originalBalance - totalSpentOnCassette)
          return { ...cassette, balance: newBalance }
        }
        return cassette
      }),
    )
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date())
      updateActiveSlotSpending()
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Boot sequence timer
  useEffect(() => {
    if (bootSequence) {
      const duration = 3000 // 3 seconds
      const interval = 50 // Update every 50ms for smooth animation
      const steps = duration / interval
      let currentStep = 0

      const progressTimer = setInterval(() => {
        currentStep++
        const progress = Math.min((currentStep / steps) * 100, 100)
        setBootProgress(progress)

        if (currentStep >= steps) {
          clearInterval(progressTimer)
          setBootSequence(false)
        }
      }, interval)

      return () => clearInterval(progressTimer)
    }
  }, [bootSequence])

  // Convert agents to cassettes when agents load
  useEffect(() => {
    if (agents && agents.length > 0) {
      const agentCassettes = agents.map(agentToCassette)
      setCassettes(agentCassettes)
    }
  }, [agents])

  const insertCassette = (cassetteId: string, slotId: number) => {
    if (!selectedRomCard) return
    
    const currentCard = getSelectedRomCard()
    if (!currentCard) return
    
    // Check if this cassette is already inserted in this ROM card
    const isAlreadyInCard = currentCard.slots.some(slot => slot.cassetteId === cassetteId)
    if (isAlreadyInCard) {
      // Could add a toast notification here
      console.log(`Agent already deployed to this ROM card`)
      return
    }
    
    setRomCards(cards => 
      cards.map(card => 
        card.id === selectedRomCard 
          ? {
              ...card,
              slots: card.slots.map(slot => 
                slot.id === slotId 
                  ? { ...slot, isOccupied: true, cassetteId, agentId: null, isActive: false }
                  : slot
              )
            }
          : card
      )
    )
    
    setSelectedCassette(null)
  }

  const ejectCassette = (slotId: number) => {
    if (!selectedRomCard) return
    
    const currentCard = getSelectedRomCard()
    const slot = currentCard?.slots.find(s => s.id === slotId)
    
    if (slot?.cassetteId) {
      // Stop agent if running - directly update the slot
      if (slot.isActive) {
        setRomCards(cards => 
          cards.map(card => 
            card.id === selectedRomCard 
              ? {
                  ...card,
                  slots: card.slots.map(s => 
                    s.id === slotId 
                      ? { ...s, isActive: false, startTime: null }
                      : s
                  )
                }
              : card
          )
        )
      }
      
      // Update ROM Card slots
      setRomCards(cards => 
        cards.map(card => 
          card.id === selectedRomCard 
            ? {
                ...card,
                slots: card.slots.map(s => 
                  s.id === slotId 
                    ? { ...s, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 }
                    : s
                )
              }
            : card
        )
      )
    }
  }

  const handleCassetteSelect = (cassetteId: string) => {
    setSelectedCassette(selectedCassette === cassetteId ? null : cassetteId)
  }

  const handleSlotTap = (slotId: number) => {
    if (!selectedRomCard) return
    
    const currentCard = getSelectedRomCard()
    const slot = currentCard?.slots.find(s => s.id === slotId)
    
    if (!slot?.isOccupied && selectedCassette) {
      // Check if this cassette is already in this ROM card
      const isAlreadyInCard = currentCard?.slots.some(s => s.cassetteId === selectedCassette)
      if (isAlreadyInCard) {
        console.log(`Agent already deployed to this ROM card`)
        return
      }
      insertCassette(selectedCassette, slotId)
    }
    
    setActiveSlot(slotId)
  }

  const getInsertedCassette = (slotId: number, romCardId?: string) => {
    const cardId = romCardId || selectedRomCard
    const card = romCards.find(c => c.id === cardId)
    const slot = card?.slots.find(s => s.id === slotId)
    return slot?.cassetteId ? cassettes.find((c) => c.id === slot.cassetteId) : null
  }

  const availableCassettes = cassettes // Show all cassettes since they can be reused across multiple ROM cards
  const totalBalance = getCurrentTotalBalance()
  const activeAgents = getActiveRomCardsCount()
  const totalSpending = getTotalSessionSpentAllCards()

  const stopAgent = (slotId: number) => {
    if (!selectedRomCard) return
    
    setRomCards(cards => 
      cards.map(card => 
        card.id === selectedRomCard 
          ? {
              ...card,
              slots: card.slots.map(s => 
                s.id === slotId 
                  ? { ...s, isActive: false, startTime: null }
                  : s
              )
            }
          : card
      )
    )
  }

  // Initialize original balances for ROM cards when starting agents
  const startAgent = (romCardId: string, slotId: number) => {
    const romCard = romCards.find(c => c.id === romCardId)
    const slot = romCard?.slots.find(s => s.id === slotId)
    
    if (romCard && slot?.cassetteId) {
      // Store original balances if not already stored
      if (!originalBalances[romCardId]) {
        setOriginalBalances(prev => ({
          ...prev,
          [romCardId]: romCard.totalBalance,
          [slot.cassetteId!]: cassettes.find(c => c.id === slot.cassetteId)?.balance || 0
        }))
      }
      
      setRomCards(cards => 
        cards.map(card => 
          card.id === romCardId 
            ? {
                ...card,
                slots: card.slots.map(s => 
                  s.id === slotId 
                    ? { ...s, isActive: true, startTime: Date.now() }
                    : s
                )
              }
            : card
        )
      )
    }
  }

  if (bootSequence) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <MatrixRain />
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <div className="text-green-400 font-mono text-2xl mb-4 animate-pulse">
              <Terminal className="w-8 h-8 mx-auto mb-2" />
              ROM CARDS DEPLOYMENT SYSTEM
            </div>
            <div className="text-green-300 font-mono text-sm space-y-2">
              <div>
                <TypewriterText text="INITIALIZING ROM CARD PROTOCOLS..." speed={30} />
              </div>
              <div className="mt-2">
                <TypewriterText text="LOADING ROM CARDS PAYMENT SYSTEM..." speed={25} />
              </div>
              <div className="mt-2">
                <TypewriterText text="ESTABLISHING ROM CARDS CONNECTIONS..." speed={35} />
              </div>
            </div>
          </div>
          <div className="text-green-400 font-mono text-xs">
            <div className="flex justify-center space-x-4 mb-4">
              <ProgressBar progress={bootProgress} />
            </div>
            <div>ROM CARDS SYSTEM READY - ENTERING...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MatrixRain />

      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-10">
        <div
          className="h-full w-full bg-gradient-to-b from-transparent via-green-500 to-transparent bg-repeat-y animate-pulse"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 relative z-20">
        {/* Matrix Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded border border-green-500/50 px-4 py-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${isPowered ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
            <span className="text-green-400 font-mono text-xs tracking-widest">ROM_CARDS_v0.0.1</span>
            <div className="text-green-300 font-mono text-xs">{systemTime.toLocaleTimeString()}</div>
          </div>
          <GlitchText className="text-xl sm:text-2xl font-bold text-green-400 font-mono tracking-wider">
            {"◤ ROM CARDS DEPLOYMENT ◥"}
          </GlitchText>
          <div className="text-green-300 font-mono text-xs mt-1">Deploy your AI Agents</div>
        </div>

        {/* Account Summary */}
        <Card className="bg-black/90 backdrop-blur-sm border-green-500/50 border-2 p-4 mb-4 shadow-lg shadow-green-500/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-green-400 font-mono text-xs mb-1">TOTAL_BALANCE</div>
              <div className="text-cyan-400 font-mono text-lg font-bold">${getCurrentTotalBalance().toFixed(2)}</div>
            </div>
            <div>
              <div className="text-green-400 font-mono text-xs mb-1">ACTIVE_ROM_CARDS</div>
              <div className="text-yellow-400 font-mono text-lg font-bold">
                {getActiveRomCardsCount()}
              </div>
            </div>
            <div>
              <div className="text-green-400 font-mono text-xs mb-1">
                {getAllActiveSlotsCost() > 0 ? "ACTIVE_COST" : "PREVIEW_COST"}
              </div>
              <div className="text-red-400 font-mono text-lg font-bold">${getPreviewOrActiveCost().toFixed(2)}</div>
            </div>
            <div>
              <div className="text-green-400 font-mono text-xs mb-1">SESSION_SPENT</div>
              <div className="text-orange-400 font-mono text-lg font-bold">${getTotalSessionSpentAllCards().toFixed(2)}</div>
            </div>
          </div>
        </Card>

        {/* Cost Preview Section */}
        {/* {selectedCassette && (
          <Card className="bg-black/90 backdrop-blur-sm border-yellow-500/50 border-2 p-4 mb-4 shadow-lg shadow-yellow-500/20">
            <div className="text-center">
              <div className="text-yellow-400 font-mono text-sm mb-2">{">>> COST_CALCULATOR.EXE <<<"}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-green-400 font-mono text-xs mb-1">CASSETTE_COST</div>
                  <div className="text-cyan-400 font-mono text-lg font-bold">
                    ${getCassetteBaseCost().toFixed(2)}/hr
                  </div>
                  <div className="text-green-300 font-mono text-xs">
                    {selectedCassette ? getSelectedCassette()?.name : "No cassette selected"}
                  </div>
                </div>
                <div>
                  <div className="text-green-400 font-mono text-xs mb-1">TOTAL_COST</div>
                  <div
                    className={`font-mono text-xl font-bold ${
                      selectedCassette
                        ? getTotalHourlyCost() > 25
                          ? "text-red-400"
                          : getTotalHourlyCost() > 20
                            ? "text-yellow-400"
                            : "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    ${selectedCassette ? getTotalHourlyCost().toFixed(2) : "0.00"}/hr
                  </div>
                  <div className="text-green-300 font-mono text-xs">
                    {selectedCassette ? "Ready to deploy" : "Select cassette"}
                  </div>
                </div>
              </div>

              {selectedCassette && (
                <div className="mt-4 p-3 bg-green-900/20 rounded border border-green-500/30">
                  <div className="text-green-400 font-mono text-xs mb-2">COST_BREAKDOWN.LOG</div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-green-300">Per Minute:</span>
                      <span className="text-cyan-400 ml-2 font-bold">${(getTotalHourlyCost() / 60).toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="text-green-300">Per Hour:</span>
                      <span className="text-cyan-400 ml-2 font-bold">${getTotalHourlyCost().toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-green-300">Per Day (24h):</span>
                      <span className="text-cyan-400 ml-2 font-bold">${(getTotalHourlyCost() * 24).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-green-300">Runtime Available:</span>
                      <span className="text-cyan-400 ml-2 font-bold">
                        {getEstimatedRuntime().hours}h {getEstimatedRuntime().minutes}m
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )} */}

        {/* Mobile Layout */}
        {isMobile ? (
          <>
            {/* Cassette Library Section - MOVED TO TOP */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-green-400 font-mono text-sm font-bold">{">>> MY_AGENTS.DIR <<<"}</h3>
              </div>

              {/* Horizontal Agent Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                    <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                    Loading agents...
                  </div>
                ) : cassettes.length === 0 ? (
                  <div className="text-green-400 font-mono text-sm">No agents found</div>
                ) : (
                  cassettes.slice(0, 6).map((cassette) => {
                    const isLowBalance = cassette.balance < cassette.costPerHour
                    const deploymentCount = getAgentDeploymentCount(cassette.id)
                    const activeCount = getAgentActiveCount(cassette.id)
                    const isInCurrentCard = !canInsertCassetteInCurrentCard(cassette.id)
                    const isSelected = selectedCassette === cassette.id
                    
                    return (
                      <div 
                        key={cassette.id}
                        className="relative group cursor-pointer flex-shrink-0 w-64"
                        onClick={() => handleCassetteSelect(cassette.id)}
                      >
                        <div className={`block p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                          isSelected 
                            ? 'bg-green-900/30 border-green-400/80 shadow-xl shadow-green-500/20 scale-[1.02]' 
                            : 'bg-gray-900/50 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600/70'
                        } ${isInCurrentCard ? 'opacity-60' : ''}`}>
                          
                          <div className="flex items-start gap-3">
                            {/* Agent Avatar */}
                            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {cassette.originalAgent ? renderAgentAvatar(cassette.originalAgent, 40) : cassette.icon}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Title and Status */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-medium text-xs leading-tight truncate text-green-100">
                                  {cassette.originalAgent?.agentData?.name || cassette.originalAgent?.title || cassette.name}
                                </h3>
                                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-mono ${
                                  isSelected 
                                    ? 'bg-green-500/20 text-green-300' 
                                    : 'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {(cassette.originalAgent?.agentData?.domain || cassette.type).substring(0, 8)}
                                </span>
                              </div>
                              
                              {/* Description */}
                              <p className="text-xs text-gray-400 mb-2 leading-relaxed line-clamp-2">
                                {cassette.originalAgent?.agentData?.description || cassette.description.replace(/[{}'>'"<]/g, '')}
                              </p>
                              
                              {/* Stats */}
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Cost:</span>
                                  <span className="text-cyan-400 font-bold">${cassette.costPerHour.toFixed(2)}/hr</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Badges */}
                          {(deploymentCount > 0 || activeCount > 0 || isLowBalance) && (
                            <div className="mt-2 flex gap-1 flex-wrap">
                              {deploymentCount > 0 && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-mono">
                                  Deployed: {deploymentCount}
                                </span>
                              )}
                              {activeCount > 0 && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-mono">
                                  Active: {activeCount}
                                </span>
                              )}
                              {isLowBalance && (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-mono">
                                  Low Balance
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}

              </div>
            </div>

            {/* ROM Cards Management - MOVED BELOW AGENTS */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-green-400 font-mono text-sm font-bold">My Rom Cards</h3>
                <Button
                  onClick={addNewRomCard}
                  size="sm"
                  variant="outline"
                  className="border-green-500/50 text-green-400 px-3 py-1 font-mono text-xs hover:bg-green-500/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  ADD_ROM_CARD
                </Button>
              </div>

              {/* ROM Cards List */}
              <div className="space-y-4">
                {romCards.map((romCard) => (
                  <Card 
                    key={romCard.id} 
                    className={`bg-black/90 backdrop-blur-sm border-2 p-4 shadow-lg transition-all duration-200 ${
                      selectedRomCard === romCard.id 
                        ? 'border-cyan-400 shadow-cyan-400/20' 
                        : 'border-green-500/50 shadow-green-500/20'
                    }`}
                  >
                    {/* ROM Card Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-green-500/30">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className={`w-4 h-4 rounded-full flex-shrink-0 ${romCard.isDeployed ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}
                        />
                        <Button
                          onClick={() => setSelectedRomCard(romCard.id)}
                          variant="ghost"
                          className={`text-green-400 font-mono text-lg font-bold p-0 truncate ${
                            selectedRomCard === romCard.id ? 'text-cyan-400' : ''
                          }`}
                        >
                          {romCard.name}
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                          onClick={() => deployRomCard(romCard.id)}
                          className={`px-4 py-2 font-mono ${
                            romCard.isDeployed 
                              ? 'bg-red-500/20 border-red-400 text-red-400 hover:bg-red-500/30' 
                              : 'bg-green-500/20 border-green-400 text-green-400 hover:bg-green-500/30'
                          } border`}
                        >
                          {romCard.isDeployed ? 'STOP' : 'DEPLOY'}
                        </Button>
                        {romCards.length > 1 && (
                          <Button
                            onClick={() => deleteRomCard(romCard.id)}
                            variant="outline"
                            className="border-red-500/50 text-red-400 p-2 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* ROM Card Slots */}
                    {selectedRomCard === romCard.id && (
                      <div className="grid grid-cols-2 gap-3">
                        {romCard.slots.map((slot) => {
                          const insertedCassette = getInsertedCassette(slot.id, romCard.id)
                          const currentCassette = cassettes.find((c) => c.id === insertedCassette?.id)
                          const displayBalance = currentCassette?.balance || insertedCassette?.balance || 0
                          const isLowBalance = insertedCassette && displayBalance < insertedCassette.costPerHour
                          const deploymentCount = getAgentDeploymentCount(insertedCassette?.id || "")
                          const activeCount = getAgentActiveCount(insertedCassette?.id || "")
                          const isInCurrentCard = !canInsertCassetteInCurrentCard(insertedCassette?.id || "")
                          return (
                            <div
                              key={slot.id}
                              className={`relative h-24 bg-black/60 rounded border-2 transition-all duration-300 ${
                                slot.isOccupied
                                  ? slot.isActive
                                    ? "border-cyan-400 bg-cyan-900/20 shadow-cyan-400/30"
                                    : "border-green-500/70 bg-green-900/20"
                                  : selectedCassette
                                    ? canInsertCassetteInCurrentCard(selectedCassette)
                                      ? "border-cyan-400 border-dashed animate-pulse shadow-cyan-400/50"
                                      : "border-red-400 border-dashed bg-red-900/10"
                                    : "border-green-500/30 hover:border-green-400/50"
                              } ${isLowBalance ? "ring-2 ring-red-400 animate-pulse" : ""}`}
                              onClick={() => handleSlotTap(slot.id)}
                            >
                              {/* Slot Label */}
                              <div className="absolute top-1 left-2 text-xs text-green-400 font-mono font-bold">
                                SLOT_{slot.id}
                              </div>

                              {/* Low Balance Warning */}
                              {isLowBalance && (
                                <div className="absolute top-1 right-2">
                                  <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
                                </div>
                              )}

                              {/* Inserted Cassette */}
                              {insertedCassette && (
                                <div
                                  className={`absolute inset-1 rounded ${insertedCassette.gradient} p-2 animate-in slide-in-from-right-full duration-500 shadow-lg`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-black text-xs font-bold font-mono truncate flex-1 mr-1">
                                      {insertedCassette.name}
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      {!slot.isActive && (
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            startAgent(romCard.id, slot.id)
                                          }}
                                          size="sm"
                                          className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 border border-white/30 shadow-lg"
                                        >
                                          <Play className="w-3 h-3 text-white" />
                                        </Button>
                                      )}
                                      {slot.isActive && (
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setRomCards(cards => 
                                              cards.map(card => 
                                                card.id === selectedRomCard 
                                                  ? {
                                                      ...card,
                                                      slots: card.slots.map(s => 
                                                        s.id === slot.id 
                                                          ? { ...s, isActive: false, startTime: null }
                                                          : s
                                                      )
                                                    }
                                                  : card
                                              )
                                            )
                                          }}
                                          size="sm"
                                          className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 border border-white/30 shadow-lg"
                                        >
                                          <Pause className="w-3 h-3 text-white" />
                                        </Button>
                                      )}
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          ejectCassette(slot.id)
                                        }}
                                        size="sm"
                                        className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 border border-white/30 shadow-lg"
                                      >
                                        <Eject className="w-3 h-3 text-white" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-black/80 text-xs font-mono">
                                    {insertedCassette.type}
                                  </div>
                                  <div className="text-black/90 text-xs font-mono font-bold">
                                    ${displayBalance.toFixed(2)}
                                    {slot.isActive && (
                                      <span className="text-black/60 block text-xs">
                                        ${insertedCassette.costPerHour.toFixed(2)}/hr (-$
                                        {slot.totalSpent.toFixed(2)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Empty Slot Matrix */}
                              {!slot.isOccupied && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-green-500/70 text-center">
                                    {selectedCassette && selectedRomCard === romCard.id ? (
                                      canInsertCassetteInCurrentCard(selectedCassette) ? (
                                        <div className="text-cyan-400">
                                          <div className="text-sm font-mono font-bold mb-1 animate-pulse">
                                            {">>> INSERT <<<"}
                                          </div>
                                          <div className="text-xs font-mono">SELECTED CASSETTE</div>
                                        </div>
                                      ) : (
                                        <div className="text-red-400">
                                          <div className="text-sm font-mono font-bold mb-1">
                                            {">>> BLOCKED <<<"}
                                          </div>
                                          <div className="text-xs font-mono">ALREADY DEPLOYED</div>
                                        </div>
                                      )
                                    ) : (
                                      <div>
                                        <div className="w-12 h-8 mx-auto mb-2 border-2 border-dashed border-green-500/50 rounded"></div>
                                        <div className="text-xs font-mono">EMPTY SLOT</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Deployment Status */}
                              {deploymentCount > 0 && (
                                <div className="mt-2 text-center">
                                  <div className="inline-flex items-center gap-1 bg-black/20 rounded px-2 py-1">
                                    <div className="text-black text-xs font-mono font-bold">
                                      {deploymentCount} ROM{deploymentCount > 1 ? 'S' : ''}
                                      {activeCount > 0 && (
                                        <span className="text-green-800"> • {activeCount} ACTIVE</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Current ROM Card Status */}
                              {isInCurrentCard && (
                                <div className="mt-2 text-center">
                                  <div className="inline-flex items-center gap-2 bg-orange-500/20 rounded px-2 py-1">
                                    <div className="text-orange-800 text-xs font-mono font-bold">
                                      ALREADY IN THIS ROM CARD
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Mobile ROM Card Info */}
                    {selectedRomCard === romCard.id && (
                      <div className="mt-4 text-sm font-mono text-green-300 space-y-1">
                        <div className="flex justify-between">
                          <span>BALANCE:</span>
                          <span className="text-yellow-400">${romCard.totalBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>COST/HOUR:</span>
                          <span className="text-red-400">${getRomCardHourlyCost(romCard).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ACTIVE_SLOTS:</span>
                          <span className="text-cyan-400">{romCard.slots.filter(s => s.isActive).length}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-green-400/70 text-sm font-mono">
                {">>> INSERT_ROM_CARD → DEPLOY_SYSTEM <<<"}
              </p>
            </div>
          </>
        ) : (
          /* Desktop Layout - Agents on LEFT, ROM Cards on RIGHT */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Desktop Agents Library - MOVED TO LEFT */}
            <div className="space-y-4">
              <div className="space-y-3">
                <GlitchText className="text-green-400 font-semibold text-lg mb-4 font-mono">
                  My Agents
                </GlitchText>
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-green-400 font-mono">Loading agents...</p>
                  </div>
                ) : cassettes.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-green-400 font-mono mb-2">No agents found</p>
                    <p className="text-xs text-green-300 font-mono">Create an agent to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cassettes.map((cassette) => {
                      const isLowBalance = cassette.balance < cassette.costPerHour
                      const deploymentCount = getAgentDeploymentCount(cassette.id)
                      const activeCount = getAgentActiveCount(cassette.id)
                      const isInCurrentCard = !canInsertCassetteInCurrentCard(cassette.id)
                      const isSelected = selectedCassette === cassette.id
                      
                      return (
                        <div 
                          key={cassette.id}
                          className="relative group cursor-pointer"
                          onClick={() => handleCassetteSelect(cassette.id)}
                        >
                          <div className={`block p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                            isSelected 
                              ? 'bg-green-900/30 border-green-400/80 shadow-xl shadow-green-500/20 scale-[1.02]' 
                              : 'bg-gray-900/50 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600/70'
                          } ${isInCurrentCard ? 'opacity-60' : ''}`}>
                            
                            <div className="flex items-start gap-3">
                              {/* Agent Avatar */}
                              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                {cassette.originalAgent ? renderAgentAvatar(cassette.originalAgent, 48) : cassette.icon}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {/* Title and Status */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className="font-medium text-sm leading-tight truncate text-green-100">
                                    {cassette.originalAgent?.agentData?.name || cassette.originalAgent?.title || cassette.name}
                                  </h3>
                                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-mono ${
                                    isSelected 
                                      ? 'bg-green-500/20 text-green-300' 
                                      : 'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {cassette.originalAgent?.agentData?.domain || cassette.type}
                                  </span>
                                </div>
                                
                                {/* Description */}
                                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                  {cassette.originalAgent?.agentData?.description || cassette.description.replace(/[{}'>'"<]/g, '')}
                                </p>
                                
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500 font-mono">Balance:</span>
                                    <span className="text-green-400 ml-2 font-bold">${cassette.balance.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 font-mono">Cost:</span>
                                    <span className="text-cyan-400 ml-2 font-bold">${cassette.costPerHour.toFixed(2)}/hr</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 font-mono">Capacity:</span>
                                    <span className="text-blue-400 ml-2 font-bold">{cassette.capacity}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 font-mono">Updated:</span>
                                    <span className="text-purple-400 ml-2 font-bold">{cassette.lastUsed}</span>
                                  </div>
                                </div>
                                
                                {/* Status Badges */}
                                {(deploymentCount > 0 || activeCount > 0 || isLowBalance || isInCurrentCard) && (
                                  <div className="mt-3 flex gap-1 flex-wrap">
                                    {deploymentCount > 0 && (
                                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-mono">
                                        Deployed: {deploymentCount}
                                      </span>
                                    )}
                                    {activeCount > 0 && (
                                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-mono">
                                        Active: {activeCount}
                                      </span>
                                    )}
                                    {isLowBalance && (
                                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-mono">
                                        Low Balance
                                      </span>
                                    )}
                                    {isInCurrentCard && (
                                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full font-mono">
                                        In Current Card
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop ROM Cards Management - MOVED TO RIGHT */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-green-400 font-mono text-lg font-bold">My Rom Cards</h3>
                <Button
                  onClick={addNewRomCard}
                  variant="outline"
                  className="border-green-500/50 text-green-400 px-4 py-2 font-mono hover:bg-green-500/10"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  ADD_ROM_CARD
                </Button>
              </div>

              {/* ROM Cards Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loadingCards ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-green-400 font-mono">Loading ROM Cards...</p>
                    </div>
                  </div>
                ) : romCards.length === 0 ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-bold text-green-100 mb-2 font-mono">No ROM Cards Yet</h4>
                      <p className="text-gray-400 font-mono text-sm mb-6">
                        Purchase your first ROM card to start deploying AI agents
                      </p>
                      <Button
                        onClick={addNewRomCard}
                        className="bg-green-600 hover:bg-green-700 font-mono"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Purchase ROM Card
                      </Button>
                    </div>
                  </div>
                ) : (
                  romCards.map((romCard) => (
                  <Card 
                    key={romCard.id} 
                    className={`bg-black/90 backdrop-blur-sm border-2 p-6 shadow-2xl transition-all duration-200 ${
                      selectedRomCard === romCard.id 
                        ? 'border-cyan-400 shadow-cyan-400/20' 
                        : 'border-green-500/50 shadow-green-500/20'
                    }`}
                  >
                    {/* ROM Card Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-green-500/30">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className={`w-4 h-4 rounded-full flex-shrink-0 ${romCard.isDeployed ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}
                        />
                        <Button
                          onClick={() => setSelectedRomCard(romCard.id)}
                          variant="ghost"
                          className={`text-green-400 font-mono text-lg font-bold p-0 truncate ${
                            selectedRomCard === romCard.id ? 'text-cyan-400' : ''
                          }`}
                        >
                          {romCard.name}
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                          onClick={() => deployRomCard(romCard.id)}
                          className={`px-4 py-2 font-mono ${
                            romCard.isDeployed 
                              ? 'bg-red-500/20 border-red-400 text-red-400 hover:bg-red-500/30' 
                              : 'bg-green-500/20 border-green-400 text-green-400 hover:bg-green-500/30'
                          } border`}
                        >
                          {romCard.isDeployed ? 'STOP' : 'DEPLOY'}
                        </Button>
                        {romCards.length > 1 && (
                          <Button
                            onClick={() => deleteRomCard(romCard.id)}
                            variant="outline"
                            className="border-red-500/50 text-red-400 p-2 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* ROM Card Info */}
                    <div className="mb-4 text-sm font-mono text-green-300">
                      <div className="flex justify-between mb-1">
                        <span>STATUS:</span>
                        <span className={romCard.isDeployed ? 'text-green-400' : 'text-gray-400'}>
                          {romCard.isDeployed ? 'DEPLOYED' : 'STANDBY'}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>SLOTS_OCCUPIED:</span>
                        <span className="text-cyan-400">{romCard.slots.filter(s => s.isOccupied).length}/4</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>BALANCE:</span>
                        <span className="text-yellow-400">${romCard.totalBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>COST/HOUR:</span>
                        <span className="text-red-400">${getRomCardHourlyCost(romCard).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* ROM Card Slots Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {romCard.slots.map((slot) => {
                        const insertedCassette = getInsertedCassette(slot.id, romCard.id)
                        const currentCassette = cassettes.find((c) => c.id === insertedCassette?.id)
                        const displayBalance = currentCassette?.balance || insertedCassette?.balance || 0
                        const isLowBalance = insertedCassette && displayBalance < insertedCassette.costPerHour
                        const deploymentCount = getAgentDeploymentCount(insertedCassette?.id || "")
                        const activeCount = getAgentActiveCount(insertedCassette?.id || "")
                        const isInCurrentCard = !canInsertCassetteInCurrentCard(insertedCassette?.id || "")
                        return (
                          <div
                            key={slot.id}
                            className={`relative h-32 bg-black/60 rounded border-2 border-dashed transition-all duration-300 cursor-pointer ${
                              slot.isOccupied
                                ? slot.isActive
                                  ? "border-cyan-400 bg-cyan-900/20 shadow-cyan-400/30"
                                  : "border-green-500/70 bg-green-900/20"
                                : selectedCassette
                                  ? canInsertCassetteInCurrentCard(selectedCassette)
                                    ? "border-cyan-400 hover:border-cyan-300 shadow-cyan-400/50"
                                    : "border-red-400 bg-red-900/10 cursor-not-allowed"
                                  : "border-green-500/30 hover:border-green-400/50"
                            } ${isLowBalance ? "ring-2 ring-red-400 animate-pulse" : ""}`}
                            onClick={() => {
                              setSelectedRomCard(romCard.id)
                              handleSlotTap(slot.id)
                            }}
                          >
                            <div className="absolute top-2 left-2 text-xs text-green-400 font-mono font-bold">
                              SLOT_{slot.id}
                            </div>

                            {isLowBalance && (
                              <div className="absolute top-2 right-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                              </div>
                            )}

                            {insertedCassette && (
                              <div
                                className={`absolute inset-2 rounded ${insertedCassette.gradient} p-3 animate-in slide-in-from-right-full duration-500 shadow-lg`}
                              >
                                <div className="flex items-center justify-between text-black text-xs mb-2">
                                  <span className="font-mono font-bold truncate">
                                    {insertedCassette.name}
                                  </span>
                                  <div className="flex gap-1">
                                    {!slot.isActive && (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          startAgent(romCard.id, slot.id)
                                        }}
                                        size="sm"
                                        className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 border border-white/30 shadow-lg"
                                      >
                                        <Play className="w-3 h-3 text-white" />
                                      </Button>
                                    )}
                                    {slot.isActive && (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setRomCards(cards => 
                                            cards.map(card => 
                                              card.id === selectedRomCard 
                                                ? {
                                                    ...card,
                                                    slots: card.slots.map(s => 
                                                      s.id === slot.id 
                                                        ? { ...s, isActive: false, startTime: null }
                                                        : s
                                                    )
                                                  }
                                                : card
                                            )
                                          )
                                        }}
                                        size="sm"
                                        className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 border border-white/30 shadow-lg"
                                      >
                                        <Pause className="w-3 h-3 text-white" />
                                      </Button>
                                    )}
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        ejectCassette(slot.id)
                                      }}
                                      size="sm"
                                      className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 border border-white/30 shadow-lg"
                                    >
                                      <Eject className="w-3 h-3 text-white" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-black font-bold text-sm mb-1 font-mono truncate">
                                  {insertedCassette.name}
                                </div>
                                <div className="text-black/90 text-xs font-mono font-bold">
                                  ${displayBalance.toFixed(2)}
                                  {slot.isActive && (
                                    <span className="text-black/60 block text-xs">
                                      ${insertedCassette.costPerHour.toFixed(2)}/hr (-$
                                      {slot.totalSpent.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {!slot.isOccupied && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-green-500/70 text-center">
                                  {selectedCassette && selectedRomCard === romCard.id ? (
                                    canInsertCassetteInCurrentCard(selectedCassette) ? (
                                      <div className="text-cyan-400">
                                        <div className="text-sm font-mono font-bold mb-1 animate-pulse">
                                          {">>> INSERT <<<"}
                                        </div>
                                        <div className="text-xs font-mono">SELECTED CASSETTE</div>
                                      </div>
                                    ) : (
                                      <div className="text-red-400">
                                        <div className="text-sm font-mono font-bold mb-1">
                                          {">>> BLOCKED <<<"}
                                        </div>
                                        <div className="text-xs font-mono">ALREADY DEPLOYED</div>
                                      </div>
                                    )
                                  ) : (
                                    <div>
                                      <div className="w-12 h-8 mx-auto mb-2 border-2 border-dashed border-green-500/50 rounded"></div>
                                      <div className="text-xs font-mono">EMPTY SLOT</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Matrix Footer */}
        <div className="mt-8 text-center">
          <p className="text-green-400/70 text-sm font-mono">
            {">>> INSERT_ROM_CARD → DEPLOY_SYSTEM <<<"}
          </p>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Purchase Modal */}
      <CardPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </div>
  )
}