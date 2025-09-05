'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart,
  Sparkles,
  ArrowRight, 
  Play, 
  Star,
  Menu,
  X,
  Zap,
  Brain,
  Users,
  Gift,
  Code,
  Terminal,
  Gamepad2,
  Trophy,
  Calendar,
  Mail,
  FileText,
  Search,
  MessageCircle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  Briefcase,
  Home,
  Music,
  Camera,
  Shield,
  Database,
  Hammer,
  Compass,
  CreditCard,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Suspense, useMemo, useCallback } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { BufferAttribute } from 'three';
import * as THREE from 'three';
import CharacterGenerate from '@/components/character/canva';
import Image from 'next/image';
import { MobileAppDemoWrapper } from '@/artifacts/agent/components/MobileAppDemo';

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#build', label: 'Build' },
  { href: '#explore', label: 'Explore' },
  { href: '#cards', label: 'Cards' },
  { href: '#missions', label: 'Missions' }
];

// Agent Overview Section with Charts
function AgentOverviewSection() {
  return (
    <section className="py-6 px-4 lg:px-8 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Quick Stats Bar */}
        <div className="flex justify-center gap-8 lg:gap-12 mb-8">
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-white">12</div>
            <div className="text-xs text-gray-500">My Agents</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-white">847</div>
            <div className="text-xs text-gray-500">Discovered</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-white">12</div>
            <div className="text-xs text-gray-500">Items</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-white">18</div>
            <div className="text-xs text-gray-500">Missions</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MainFeaturesSection() {
  const features = [
    {
      id: "build",
      title: "Build",
      description: "Create custom AI agents with unique personalities and skills. Design workflows, set behaviors, and deploy your creations.",
      image: "/images/menu/build.png",
      cta: "Create Agent",
      href: "/build",
      gradient: "from-emerald-500 to-teal-600",
      quickStats: [
        { label: "Built", value: "12" },
        { label: "Active", value: "8" },
        { label: "Templates", value: "24" }
      ],
      chartData: [85, 92, 78, 95, 88, 76, 91],
      chartLabel: "7-day builds"
    },
    {
      id: "explore", 
      title: "Agents",
      description: "Browse and discover agents created by other users. Find specialized AI companions for any task or workflow.",
      image: "/images/menu/explore.png",
      cta: "Browse Agents",
      href: "/explore",
      gradient: "from-blue-500 to-cyan-600",
      quickStats: [
        { label: "Available", value: "847" },
        { label: "Popular", value: "156" },
        { label: "New", value: "23" }
      ],
      chartData: [65, 78, 82, 89, 75, 68, 84],
      chartLabel: "Weekly discoveries"
    },
    {
      id: "tournaments",
      title: "Tournaments",
      description: "Unlock and complete mission requests. Earn rewards by helping others with your AI agents' specialized skills.",
      image: "/images/menu/tournament.png",
      cta: "View Missions",
      href: "/tournaments",
      gradient: "from-orange-500 to-red-600",
      quickStats: [
        { label: "Unlocked", value: "18" },
        { label: "Completed", value: "12" },
        { label: "Rewards", value: "$847" }
      ],
      chartData: [72, 68, 75, 82, 78, 71, 79],
      chartLabel: "Completion rate"
    },
    {
      id: "cards",
      title: "Items",
      description: "Purchase card packs to unlock advanced capabilities, premium features, and exclusive agent templates.",
      image: "/images/menu/cards.png",
      cta: "Buy Packs",
      href: "/cards",
      gradient: "from-purple-500 to-pink-600",
      quickStats: [
        { label: "Owned", value: "5" },
        { label: "Rare", value: "12" },
        { label: "Common", value: "34" }
      ],
      chartData: [45, 52, 48, 61, 55, 43, 58],
      chartLabel: "Pack openings"
    },
   
  ];

  return (
    <section className="py-4 px-4 lg:px-8 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={feature.id} className="group">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/70 hover:bg-slate-900/70 transition-all duration-300 h-full">
                
                <div className="flex items-start gap-5">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <Image 
                      src={feature.image} 
                      alt={feature.title}
                      width={120}
                      height={120}
                      className="w-24 h-24 lg:w-32 lg:h-32 rounded-lg object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl lg:text-2xl font-bold text-white">
                        {feature.title}
                      </h3>
                      {/* Mini chart with label */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-bold text-white">
                            {feature.chartData[feature.chartData.length - 1]}%
                          </div>
                          <div className="flex items-end gap-0.5">
                            {feature.chartData.map((value, i) => (
                              <div 
                                key={i}
                                className={`w-1.5 bg-gradient-to-t ${feature.gradient} rounded-full opacity-70 hover:opacity-100 transition-opacity cursor-help`}
                                style={{ height: `${Math.max(value / 4, 8)}px` }}
                                title={`Day ${i + 1}: ${value}%`}
                              ></div>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {feature.chartLabel}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm lg:text-base text-gray-400 leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    {/* Quick stats */}
                    <div className="flex gap-4 mb-5">
                      {feature.quickStats.map((stat, i) => (
                        <div key={i} className="text-center">
                          <div className="text-sm font-bold text-white">{stat.value}</div>
                          <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Button */}
                    <Link href={feature.href}>
                      <Button className={`bg-gradient-to-r ${feature.gradient} text-white px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90 inline-flex items-center`}>
                        {feature.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="text-center m-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
            Rom Center
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Build, discover, upgrade, and deploy your AI companions
          </p>
        </div>
      <AgentOverviewSection />
      <MainFeaturesSection />
    </div>
  );
}
