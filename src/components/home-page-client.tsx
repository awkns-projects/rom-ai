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
import { motion } from 'framer-motion';

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
      description: "Build custom AI agents with unique personalities and skills. Design workflows, set behaviors, and deploy your creations.",
      image: "/images/menu/create.png",
      cta: "Build Agent",
      href: "/agents/my-agents/chat",
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
      id: "agents", 
      title: "Agents",
      description: "Browse and discover agents created by other users. Find specialized AI companions for any task or workflow.",
      image: "/images/menu/agents.png",
      cta: "Browse Agents",
      href: "/agents/explore",
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
   
   
  ];

  return (
    <section className="py-4 px-4 lg:px-8 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6">
          {features.map((feature, index) => (
            <div key={feature.id} className="group">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/70 hover:bg-slate-900/70 transition-all duration-300 h-full">
                
                {/* Mobile Layout */}
                <div className="flex md:hidden items-center gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <Image 
                      src={feature.image} 
                      alt={feature.title}
                      width={120}
                      height={120}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    
                    <p className="text-sm text-gray-400 leading-relaxed mb-3">
                      {feature.description}
                    </p>
                    
                    {/* Button */}
                    <Link href={feature.href}>
                      <Button className={`bg-gradient-to-r ${feature.gradient} text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90 inline-flex items-center`}>
                        {feature.cta}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex items-center gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <Image 
                      src={feature.image} 
                      alt={feature.title}
                      width={180}
                      height={180}
                      className="w-36 h-36 lg:w-44 lg:h-44 rounded-xl object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                      {feature.title}
                    </h3>
                    
                    <p className="text-base lg:text-lg text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Button */}
                  <div className="flex-shrink-0">
                    <Link href={feature.href}>
                      <Button className={`bg-gradient-to-r ${feature.gradient} text-white px-6 py-3 lg:px-8 lg:py-4 rounded-lg font-medium text-base lg:text-lg transition-all duration-200 hover:opacity-90 inline-flex items-center`}>
                        {feature.cta}
                        <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 ml-2" />
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

export function HomePageClient() {
  return (
    <div className="min-h-screen bg-black text-white py-8">
     <div className="text-center mb-8">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl">
                <img src="/images/logo.png" alt="ROM" className="w-10 h-10" />
              </div>
               <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-sm animate-pulse">
                ✨
              </div> 
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Rom Center
          </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-600 dark:text-gray-400"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Build, explore, and earn with AI agents that make your daily life easier.
          </motion.p>
        </div>

      {/* <AgentOverviewSection /> */}
      <MainFeaturesSection />
    </div>
  );
} 