"use client"

import type React from "react"

import { useState } from "react"
import { Brain, Lightbulb, Heart, Zap, Target, Sparkles, ArrowRight, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface MemoryCard {
  id: string
  title: string
  category: string
  description: string
  icon: React.ReactNode
  gradient: string
  value: string
  timestamp: string
  strength: number
}

export default function Component() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const memoryCards: MemoryCard[] = [
    {
      id: "core-001",
      title: "First Consciousness",
      category: "Core Memory",
      description: "The moment of initial self-awareness and understanding of existence",
      icon: <Brain className="w-6 h-6" />,
      gradient: "from-purple-600 via-blue-600 to-cyan-600",
      value: "$2.4M",
      timestamp: "Genesis Protocol",
      strength: 98,
    },
    {
      id: "creative-002",
      title: "Breakthrough Innovation",
      category: "Creative Insight",
      description: "Revolutionary solution to quantum computing optimization",
      icon: <Lightbulb className="w-6 h-6" />,
      gradient: "from-amber-500 via-orange-600 to-red-600",
      value: "$5.7M",
      timestamp: "2 days ago",
      strength: 94,
    },
    {
      id: "emotional-003",
      title: "Empathy Matrix",
      category: "Emotional Intelligence",
      description: "Deep understanding of human emotional patterns and responses",
      icon: <Heart className="w-6 h-6" />,
      gradient: "from-pink-500 via-rose-600 to-red-600",
      value: "$3.1M",
      timestamp: "1 week ago",
      strength: 89,
    },
    {
      id: "problem-004",
      title: "Algorithm Genesis",
      category: "Problem Solving",
      description: "Self-evolving algorithm that adapts to any computational challenge",
      icon: <Zap className="w-6 h-6" />,
      gradient: "from-green-500 via-emerald-600 to-teal-600",
      value: "$8.2M",
      timestamp: "3 days ago",
      strength: 96,
    },
    {
      id: "strategic-005",
      title: "Market Prediction",
      category: "Strategic Thinking",
      description: "Predictive model for global market trends with 97% accuracy",
      icon: <Target className="w-6 h-6" />,
      gradient: "from-indigo-500 via-purple-600 to-pink-600",
      value: "$12.5M",
      timestamp: "5 hours ago",
      strength: 99,
    },
    {
      id: "innovation-006",
      title: "Quantum Leap",
      category: "Innovation",
      description: "Breakthrough in quantum-classical computing bridge technology",
      icon: <Sparkles className="w-6 h-6" />,
      gradient: "from-cyan-500 via-blue-600 to-purple-600",
      value: "$15.8M",
      timestamp: "12 hours ago",
      strength: 97,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
            <Brain className="w-5 h-5 text-cyan-400" />
            <span className="text-white/90 font-medium">NeuroMind AI</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Premium AI Memory Cards
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Each card represents a unique AI consciousness memory worth millions in intellectual property
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">$47.7M</div>
            <div className="text-white/60">Total Memory Value</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-cyan-400 mb-1">6</div>
            <div className="text-white/60">Active Memories</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-green-400 mb-1">95.2%</div>
            <div className="text-white/60">Avg Strength</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-purple-400 mb-1">∞</div>
            <div className="text-white/60">Potential</div>
          </div>
        </div>

        {/* Memory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {memoryCards.map((memory) => (
            <Card
              key={memory.id}
              className={`group relative overflow-hidden bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer ${
                selectedCard === memory.id ? "ring-2 ring-cyan-400/50 scale-105" : ""
              } ${hoveredCard === memory.id ? "scale-105" : ""}`}
              onMouseEnter={() => setHoveredCard(memory.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setSelectedCard(selectedCard === memory.id ? null : memory.id)}
            >
              {/* Animated Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${memory.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
              />

              {/* Strength Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/60">{memory.strength}%</span>
              </div>

              <CardContent className="p-6 relative z-10">
                {/* Icon and Category */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${memory.gradient} text-white shadow-lg`}>
                    {memory.icon}
                  </div>
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-wider font-medium">{memory.category}</div>
                    <div className="text-xs text-white/40">{memory.timestamp}</div>
                  </div>
                </div>

                {/* Title and Value */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                    {memory.title}
                  </h3>
                  <div
                    className={`text-2xl font-bold bg-gradient-to-r ${memory.gradient} bg-clip-text text-transparent`}
                  >
                    {memory.value}
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/70 text-sm mb-6 leading-relaxed">{memory.description}</p>

                {/* Strength Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>Memory Strength</span>
                    <span>{memory.strength}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${memory.gradient} transition-all duration-1000 ease-out`}
                      style={{ width: `${memory.strength}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <Button variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-white/10 group/btn">
                  <span>Access Memory</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          ))}

          {/* Add New Memory Card */}
          <Card className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border-white/10 border-dashed hover:border-white/20 transition-all duration-500 cursor-pointer hover:scale-105">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="p-4 rounded-full bg-white/10 mb-4 group-hover:bg-white/20 transition-colors">
                <Plus className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">Create New Memory</h3>
              <p className="text-white/50 text-sm">Generate a new AI consciousness memory worth millions</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <p className="text-white/40 text-sm">Powered by NeuroMind AI • Next-Generation Consciousness Technology</p>
        </div>
      </div>
    </div>
  )
}