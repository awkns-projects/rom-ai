"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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

export default function Component() {
  const [cassettes, setCassettes] = useState<AICassette[]>([
    {
      id: "neural-core",
      name: "NEURAL_CORE_ROM.bin",
      type: "CONSCIOUSNESS",
      description: "{'>>> PRIMARY ROM CONSCIOUSNESS PROTOCOLS <<<'}",
      color: "from-green-500 to-lime-400",
      gradient: "bg-gradient-to-r from-green-500 to-lime-400",
      icon: <Brain className="w-5 h-5" />,
      balance: 247.5,
      capacity: "2.4TB",
      isInserted: false,
      slotId: null,
      matrixCode: "01001110 01000101 01010101",
      costPerHour: 12.5,
      lastUsed: "2 hours ago",
    },
    {
      id: "quantum-proc",
      name: "QUANTUM_PROC_ROM.sys",
      type: "COMPUTATION",
      description: "{'>>> ADVANCED QUANTUM ROM PROCESSING CORE <<<'}",
      color: "from-cyan-400 to-green-500",
      gradient: "bg-gradient-to-r from-cyan-400 to-green-500",
      icon: <Cpu className="w-5 h-5" />,
      balance: 89.25,
      capacity: "1.8TB",
      isInserted: false,
      slotId: null,
      matrixCode: "01010001 01010101 01000001",
      costPerHour: 8.75,
      lastUsed: "1 day ago",
    },
    {
      id: "creative-spark",
      name: "CREATIVE_SPARK_ROM.ai",
      type: "INNOVATION",
      description: "{'>>> CREATIVE ROM BREAKTHROUGH ALGORITHMS <<<'}",
      color: "from-pink-500 to-cyan-400",
      gradient: "bg-gradient-to-r from-pink-500 to-cyan-400",
      icon: <Sparkles className="w-5 h-5" />,
      balance: 156.8,
      capacity: "3.1TB",
      isInserted: false,
      slotId: null,
      matrixCode: "01000011 01010010 01000101",
      costPerHour: 15.25,
      lastUsed: "30 minutes ago",
    },
    {
      id: "emotion-engine",
      name: "EMOTION_ENGINE_ROM.dll",
      type: "EMPATHY",
      description: "{'>>> EMOTIONAL ROM INTELLIGENCE PROTOCOLS <<<'}",
      color: "from-purple-500 to-pink-400",
      gradient: "bg-gradient-to-r from-purple-500 to-pink-400",
      icon: <Heart className="w-5 h-5" />,
      balance: 23.4,
      capacity: "1.5TB",
      isInserted: false,
      slotId: null,
      matrixCode: "01000101 01001101 01001111",
      costPerHour: 9.8,
      lastUsed: "5 hours ago",
    },
    {
      id: "strategy-matrix",
      name: "STRATEGY_MATRIX_ROM.bin",
      type: "PLANNING",
      description: "{'>>> STRATEGIC ROM PLANNING DECISION CORE <<<'}",
      color: "from-blue-500 to-cyan-400",
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-400",
      icon: <Target className="w-5 h-5" />,
      balance: 312.75,
      capacity: "2.7TB",
      isInserted: false,
      slotId: null,
      matrixCode: "01010011 01010100 01010010",
      costPerHour: 11.3,
      lastUsed: "15 minutes ago",
    },
    {
      id: "lightning-core",
      name: "LIGHTNING_CORE_ROM.exe",
      type: "SPEED",
      description: "{'>>> ULTRA-FAST ROM PROCESSING MATRIX <<<'}",
      color: "from-yellow-400 to-green-500",
      gradient: "bg-gradient-to-r from-yellow-400 to-green-500",
      icon: <Zap className="w-5 h-5" />,
      balance: 5.2,
      capacity: "4.2TB",
      isInserted: false,
      slotId: null,
      matrixCode: "01001100 01001001 01000111",
      costPerHour: 13.9,
      lastUsed: "3 days ago",
    },
  ])

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

  // New state for multiple ROM Cards
  const [romCards, setRomCards] = useState<ROMCard[]>([
    {
      id: "card-1",
      name: "Project Alpha",
      description: "Main development workspace",
      color: "from-green-500 to-cyan-400",
      gradient: "bg-gradient-to-r from-green-500 to-cyan-400",
      slots: [
        { id: 1, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 2, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 3, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 4, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
      ],
      totalBalance: 500.0,
      isDeployed: false,
      createdAt: "2024-01-15",
      lastUsed: "2 hours ago",
    },
    {
      id: "card-2", 
      name: "Client Beta",
      description: "Client project workspace",
      color: "from-purple-500 to-pink-400",
      gradient: "bg-gradient-to-r from-purple-500 to-pink-400",
      slots: [
        { id: 1, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 2, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 3, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 4, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
      ],
      totalBalance: 250.0,
      isDeployed: true,
      createdAt: "2024-01-10",
      lastUsed: "1 day ago",
    }
  ])

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
  const [selectedRomCard, setSelectedRomCard] = useState<string | null>("card-1") // Default to first ROM Card
  const [isMobile, setIsMobile] = useState(false)
  const [bootSequence, setBootSequence] = useState(true)
  const [bootProgress, setBootProgress] = useState(0)
  const [systemTime, setSystemTime] = useState(new Date())
  const [originalBalances, setOriginalBalances] = useState<Record<string, number>>({})

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
    const newId = `card-${Date.now()}`
    const colors = [
      { color: "from-blue-500 to-cyan-400", gradient: "bg-gradient-to-r from-blue-500 to-cyan-400" },
      { color: "from-purple-500 to-pink-400", gradient: "bg-gradient-to-r from-purple-500 to-pink-400" },
      { color: "from-yellow-400 to-orange-500", gradient: "bg-gradient-to-r from-yellow-400 to-orange-500" },
      { color: "from-green-500 to-teal-400", gradient: "bg-gradient-to-r from-green-500 to-teal-400" },
      { color: "from-indigo-500 to-purple-400", gradient: "bg-gradient-to-r from-indigo-500 to-purple-400" },
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    const newRomCard: ROMCard = {
      id: newId,
      name: `Project ${String.fromCharCode(65 + romCards.length)}`,
      description: "New workspace for ROM agents",
      color: randomColor.color,
      gradient: randomColor.gradient,
      slots: [
        { id: 1, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 2, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 3, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
        { id: 4, isOccupied: false, cassetteId: null, agentId: null, isActive: false, startTime: null, totalSpent: 0 },
      ],
      totalBalance: 100.0,
      isDeployed: false,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: "Just created",
    }
    
    setRomCards([...romCards, newRomCard])
    setSelectedRomCard(newId)
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
              ROM CARDS DEPLOYMENT MATRIX SYSTEM
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
            <span className="text-green-400 font-mono text-xs tracking-widest">ROM_CARDS_MATRIX_v3.0.1</span>
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
        {selectedCassette && (
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
        )}

        {/* Mobile Layout */}
        {isMobile ? (
          <>
            {/* Cassette Library Section - MOVED TO TOP */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-green-400 font-mono text-sm font-bold">{">>> MY_AGENTS.DIR <<<"}</h3>
              </div>

              {/* Horizontal Matrix Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {cassettes.slice(0, 4).map((cassette) => {
                  const isLowBalance = cassette.balance < cassette.costPerHour
                  const deploymentCount = getAgentDeploymentCount(cassette.id)
                  const activeCount = getAgentActiveCount(cassette.id)
                  const isInCurrentCard = !canInsertCassetteInCurrentCard(cassette.id)
                  return (
                    <Card
                      key={cassette.id}
                      className={`${cassette.gradient} p-3 flex-shrink-0 w-40 transition-all duration-200 border-2 border-black/20 shadow-lg ${
                        selectedCassette === cassette.id
                          ? "ring-2 ring-white/70 scale-105 shadow-2xl"
                          : "hover:scale-102 hover:shadow-xl"
                      } ${isLowBalance ? "ring-2 ring-red-400" : ""} ${
                        isInCurrentCard ? "opacity-60 ring-2 ring-orange-400" : ""
                      }`}
                      onClick={() => handleCassetteSelect(cassette.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-black flex-shrink-0">{cassette.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-black font-bold text-xs font-mono truncate">{cassette.name}</div>
                          <div className="text-black/80 text-xs font-mono">{cassette.type}</div>
                        </div>
                        {isLowBalance && <AlertTriangle className="w-3 h-3 text-red-600" />}
                      </div>
                      <div className="text-black/90 text-xs font-mono mb-2 leading-relaxed">
                        {cassette.description}
                      </div>
                      <div className="text-black/60 text-xs font-mono">${cassette.costPerHour}/hr</div>

                      {/* Deployment Status */}
                      {deploymentCount > 0 && (
                        <div className="mt-2 text-center">
                          <div className="inline-flex items-center gap-2 bg-black/20 rounded px-3 py-1">
                            <div className="text-black text-xs font-mono font-bold">
                              DEPLOYED TO {deploymentCount} ROM CARD{deploymentCount > 1 ? 'S' : ''}
                              {activeCount > 0 && (
                                <div className="text-green-800 mt-1">
                                  {activeCount} ACTIVELY RUNNING
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Current ROM Card Status */}
                      {isInCurrentCard && (
                        <div className="text-center mb-3">
                          <div className="inline-flex items-center gap-2 bg-orange-500/20 rounded px-3 py-1">
                            <div className="text-orange-800 text-xs font-mono font-bold">
                              ALREADY IN THIS ROM CARD
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedCassette === cassette.id && (
                        <div className="text-center mb-3">
                          <div className="inline-flex items-center gap-2 bg-black/30 rounded px-3 py-1">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                            <span className="text-black text-xs font-mono font-bold">{">>> SELECTED <<<"}</span>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
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
                {cassettes.map((cassette) => {
                  const isLowBalance = cassette.balance < cassette.costPerHour
                  const deploymentCount = getAgentDeploymentCount(cassette.id)
                  const activeCount = getAgentActiveCount(cassette.id)
                  const isInCurrentCard = !canInsertCassetteInCurrentCard(cassette.id)
                  return (
                    <Card
                      key={cassette.id}
                      className={`${cassette.gradient} p-4 cursor-pointer transform transition-all duration-200 shadow-lg hover:shadow-2xl border-2 border-black/20 ${
                        selectedCassette === cassette.id ? "ring-4 ring-white/70 scale-105" : "hover:scale-105"
                      } ${isLowBalance ? "ring-2 ring-red-400" : ""} ${
                        isInCurrentCard ? "opacity-60 ring-2 ring-orange-400" : ""
                      }`}
                      onClick={() => handleCassetteSelect(cassette.id)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-black flex-shrink-0">{cassette.icon}</div>
                        <div className="flex-1">
                          <div className="text-black font-bold text-base font-mono">{cassette.name}</div>
                          <div className="text-black/90 text-sm font-mono">{cassette.type}</div>
                        </div>
                        {isLowBalance && <AlertTriangle className="w-5 h-5 text-red-600" />}
                      </div>

                      <div className="text-black/90 text-sm mb-3 leading-relaxed font-mono">
                        {cassette.description}
                      </div>

                      <div className="flex justify-between items-center text-sm mb-3 font-mono">
                        <span className="text-black/90">Cost/Hour:</span>
                        <span className="text-black font-bold text-lg">${cassette.costPerHour}</span>
                      </div>

                      {/* Deployment Status */}
                      {deploymentCount > 0 && (
                        <div className="text-center mb-3">
                          <div className="inline-flex items-center gap-2 bg-black/20 rounded px-3 py-1">
                            <div className="text-black text-xs font-mono font-bold">
                              DEPLOYED TO {deploymentCount} ROM CARD{deploymentCount > 1 ? 'S' : ''}
                              {activeCount > 0 && (
                                <div className="text-green-800 mt-1">
                                  {activeCount} ACTIVELY RUNNING
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Current ROM Card Status */}
                      {isInCurrentCard && (
                        <div className="text-center mb-3">
                          <div className="inline-flex items-center gap-2 bg-orange-500/20 rounded px-3 py-1">
                            <div className="text-orange-800 text-xs font-mono font-bold">
                              ALREADY IN THIS ROM CARD
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedCassette === cassette.id && (
                        <div className="text-center mb-3">
                          <div className="inline-flex items-center gap-2 bg-black/30 rounded px-3 py-1">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                            <span className="text-black text-xs font-mono font-bold">{">>> SELECTED <<<"}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-1">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-black/40 rounded-full"></div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
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
                {romCards.map((romCard) => (
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
                ))}
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
    </div>
  )
}