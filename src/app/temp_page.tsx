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
  Image,
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
  ChevronRight,
  Hexagon,
  Circle,
  Square
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Suspense, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { BufferAttribute } from 'three';
import * as THREE from 'three';
import CharacterGenerate from '@/components/character/canva';

const navLinks = [
  { href: '#home', label: 'HOME' },
  { href: '#what-is', label: 'WHAT IS ROM CARD' },
  { href: '#examples', label: 'REAL EXAMPLES' },
  { href: '#magical', label: 'WHY MAGICAL' },
  { href: '#start-today', label: 'START TODAY' }
];

// Enhanced wave animation with 3D scattered dots
function Points() {
  const attributeRef = useRef<BufferAttribute>(null);

  const [t, setT] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const graph = useCallback((x: number, z: number) => {
    const f = isMobile ? 0.003 : 0.002;  // Higher frequency for mobile
    const a = isMobile ? 3 : 5;          // Smaller amplitude for mobile

    return Math.sin(f * ((x - 15) ** 2 + (z + 30) ** 2 + t)) * a;
  }, [t, isMobile])

  // Responsive grid parameters
  const count = isMobile ? 40 : 80;      // Fewer particles on mobile
  const sep = isMobile ? 4 : 3;          // More spacing on mobile
  const dimension = 3;
  
  let positions = useMemo(() => {
    let positions: number[] = [];

    for (let xi = 0; xi < count; xi++) {
      for (let zi = 0; zi < count; zi++) {
        let x = sep * (xi - count / 2);
        let z = sep * (zi - count / 2);
        let y = graph(x, z);

        positions.push(x, y, z);
      }
    }
    return new Float32Array(positions);
  }, [count, sep, graph])

  useFrame(() => {
    setT(t + (isMobile ? 3 : 5))  // Slower animation on mobile for better performance

    if (attributeRef.current) {
      const positions = attributeRef.current.array as Float32Array;

      let i = 0;
      for (let xi = 0; xi < count; xi++) {
        for (let zi = 0; zi < count; zi++) {
          let x = sep * (xi - count / 2);
          let z = sep * (zi - count / 2);

          positions[i + 1] = graph(x, z);
          i += 3;
        }
      }
      attributeRef.current.needsUpdate = true;
    }
  })

  return (
    <points>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          ref={attributeRef}
          attach='attributes-position'
          args={[positions, dimension]}
          count={positions.length / dimension}
          itemSize={dimension}
          needsUpdate={true}
        />
      </bufferGeometry>

      <pointsMaterial
        attach="material"
        color={0x00FF88}
        size={isMobile ? 0.8 : 1.2}  // Larger particles for better visibility
        sizeAttenuation
        opacity={0.8}
        transparent
      />
    </points>
  )
}

function WaveAnimation() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
      <Canvas 
        camera={{ 
          position: isMobile ? [80, 40, 8] : [150, 60, 10],  // Closer camera on mobile
          fov: isMobile ? 45 : 35,                            // Wider FOV on mobile
          near: 1, 
          far: 800 
        }}
      >
        <Suspense fallback={null}>
          <Points />
        </Suspense>
      </Canvas>
  );
}

// 3D Background
function Background3D() {
  return (
    <div className="absolute inset-0 opacity-30 pointer-events-none">
      <WaveAnimation />
    </div>
  );
}

// Geometric decorations
function GeometricElement({ className = "", style = {} }: { className?: string; style?: any }) {
  return (
    <div 
      className={`absolute border border-green-400/20 ${className}`}
      style={style}
    />
  );
}

// Angular button component
function AngularButton({ children, variant = "primary", className = "", onClick, href }: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const baseStyles = "relative px-8 py-4 font-bold text-sm uppercase tracking-wider transition-all duration-300 transform hover:scale-105 overflow-hidden";
  
  const variants = {
    primary: "bg-gradient-to-r from-green-500 to-emerald-500 text-black hover:from-green-400 hover:to-emerald-400 shadow-lg shadow-green-500/25 hover:shadow-green-500/40",
    secondary: "bg-gray-800 text-green-400 border border-green-500/50 hover:bg-green-500/10 hover:border-green-500/80",
    outline: "border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black hover:border-green-300"
  };

  const buttonStyles = `${baseStyles} ${variants[variant]} ${className}`;
  
  const buttonContent = (
    <>
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-green-400 opacity-80"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-green-400 opacity-80"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-green-400 opacity-80"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-400 opacity-80"></div>
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={buttonStyles}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={buttonStyles}>
      {buttonContent}
    </button>
  );
}

// Premium header
function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      <header className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-green-500/20 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 transform rotate-45 rounded-lg"></div>
                <div className="absolute inset-0 w-12 h-12 bg-black transform rotate-45 rounded-lg border-2 border-green-400"></div>
                <Gamepad2 className="absolute inset-0 w-6 h-6 text-green-400 m-auto transform -rotate-45" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-wider">ROM</div>
                <div className="text-xs text-green-400 uppercase tracking-widest -mt-1">CARDS</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="relative text-green-300 hover:text-white font-bold text-sm uppercase tracking-wider transition-all group"
                >
                  {link.label}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></div>
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs uppercase tracking-wider">LIVE SYSTEM</span>
              </div>
              <AngularButton href="/register" variant="primary">
                <Play className="w-4 h-4 mr-2" />
                DEPLOY
              </AngularButton>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-green-300 hover:text-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Geometric header decoration */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/95" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-20 left-0 right-0 bg-black/98 backdrop-blur-xl border-b border-green-500/20">
            <nav className="flex flex-col py-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="px-6 py-4 text-green-300 hover:text-white text-left font-bold uppercase tracking-wider transition-colors duration-200 hover:bg-green-500/10"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

// Magical Egg Hatching Animation Component
function HatchingEgg() {
  const [isHatching, setIsHatching] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsHatching(true);
      setTimeout(() => {
        setShowCharacter(true);
        setTimeout(() => {
          setIsHatching(false);
          setShowCharacter(false);
        }, 3000);
      }, 1000);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Magical glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-cyan-400/30 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
      
      {!showCharacter ? (
        // Egg
        <div className={`relative w-full h-full transform transition-all duration-1000 ${isHatching ? 'animate-bounce' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full border-4 border-green-400 shadow-2xl shadow-green-500/50">
            {/* Egg patterns */}
            <div className="absolute top-8 left-8 w-4 h-4 bg-green-200/50 rounded-full"></div>
            <div className="absolute top-16 right-12 w-6 h-6 bg-green-100/30 rounded-full"></div>
            <div className="absolute bottom-16 left-16 w-3 h-3 bg-green-200/40 rounded-full"></div>
            
            {/* Crack lines when hatching */}
            {isHatching && (
              <>
                <div className="absolute top-1/2 left-1/3 w-px h-8 bg-white/80 transform rotate-45"></div>
                <div className="absolute top-1/3 right-1/3 w-px h-6 bg-white/60 transform -rotate-12"></div>
                <div className="absolute bottom-1/3 left-1/2 w-px h-4 bg-white/70 transform rotate-78"></div>
              </>
            )}
          </div>
          
          {/* Sparkles around egg */}
          <div className="absolute -top-4 -left-4 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>✨</div>
          <div className="absolute -top-2 -right-6 text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>⭐</div>
          <div className="absolute -bottom-6 -left-2 text-lg animate-bounce" style={{ animationDelay: '1s' }}>💫</div>
          <div className="absolute -bottom-4 -right-4 text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>🌟</div>
        </div>
      ) : (
        // Hatched Character
        <div className="relative w-full h-full transform transition-all duration-1000 animate-in zoom-in-50">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-2xl border-2 border-cyan-400/50 flex items-center justify-center">
            <CharacterGenerate showRandomCharacter={true} />
            
            {/* Floating clipboard and tasks */}
            <div className="absolute -top-8 -right-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg p-2 text-xs text-gray-800 transform rotate-12 animate-float">
              <div className="font-bold">📋 Today's Tasks</div>
              <div>✓ Send emails</div>
              <div>✓ Update inventory</div>
              <div>○ Call clients</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Magical Hero Section
function MagicalHeroSection() {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-black via-purple-950/30 to-black pt-20">
      <Background3D />
      
      {/* Floating magical elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 text-4xl animate-float" style={{ animationDelay: '0s' }}>🌟</div>
        <div className="absolute top-40 right-32 text-3xl animate-float" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute bottom-40 left-40 text-2xl animate-float" style={{ animationDelay: '2s' }}>🎮</div>
        <div className="absolute bottom-60 right-20 text-3xl animate-float" style={{ animationDelay: '1.5s' }}>💫</div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left content */}
          <div className="space-y-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full">
              <span className="text-2xl">🌟</span>
              <span className="text-purple-300 uppercase tracking-wider font-bold text-sm">Rom Cards – Hatch Your Digital Friend Today</span>
            </div>
            
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-200 via-cyan-200 to-purple-200">
                  ✨ "Imagine if a 
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200">
                  Pokémon could
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-green-200 to-emerald-200">
                  run your business."
                </span>
              </h1>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-200 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                <span className="text-cyan-300 font-semibold">Rom Cards are AI companions</span> that look like game characters but work like assistants.
              </p>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                They remember, automate, and evolve to help you win at real life.
              </p>
            </div>
              
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
              <AngularButton href="/register" variant="primary" className="text-lg px-10 py-5">
                <span className="text-2xl mr-3">🪄</span>
                Hatch Your First Rom Card Now
                <Sparkles className="w-5 h-5 ml-3" />
              </AngularButton>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 text-sm text-gray-400 uppercase tracking-wider justify-center lg:justify-start pt-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥚</span>
                <span>FREE TO START</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <span>INSTANT HATCH</span>
              </div>
            </div>
          </div>

          {/* Right content - Hatching Animation */}
          <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0">
            <HatchingEgg />
          </div>
        </div>
      </div>

      {/* Custom CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

// What is a Rom Card Section
function WhatIsSection() {
  return (
    <section id="what-is" className="py-32 px-6 bg-gradient-to-b from-black to-purple-950/20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
            What is a 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Rom Card?
            </span>
          </h2>
          
          <div className="space-y-6 text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
            <p>
              <span className="text-cyan-300 font-bold">Rom Cards are living digital companions.</span>
            </p>
            <p className="text-lg text-gray-300">
              Not boring apps. Not faceless dashboards.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left - Character showcase */}
          <div className="relative">
            <div className="w-80 h-80 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-purple-400/20 to-pink-400/20 rounded-3xl border-2 border-cyan-400/30"></div>
              <div className="absolute inset-4 bg-black/40 rounded-2xl border border-purple-400/20 flex items-center justify-center">
                <CharacterGenerate showRandomCharacter={true} />
              </div>
              
              {/* Floating abilities */}
              <div className="absolute -top-4 -left-8 bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-3 text-cyan-100 text-sm animate-float">
                📝 Tracks tasks
              </div>
              <div className="absolute top-16 -right-12 bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-lg p-3 text-purple-100 text-sm animate-float" style={{ animationDelay: '1s' }}>
                ⚡ Automates workflows
              </div>
              <div className="absolute -bottom-8 -left-4 bg-pink-500/20 backdrop-blur-sm border border-pink-400/30 rounded-lg p-3 text-pink-100 text-sm animate-float" style={{ animationDelay: '2s' }}>
                🔔 Sends reminders
              </div>
              <div className="absolute bottom-8 -right-8 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg p-3 text-green-100 text-sm animate-float" style={{ animationDelay: '1.5s' }}>
                📈 Helps you win
              </div>
            </div>
          </div>

          {/* Right - Description */}
          <div className="space-y-6">
            <div className="text-lg text-gray-200 leading-relaxed space-y-4">
              <p>They're characters you <span className="text-cyan-300 font-semibold">hatch, train, and evolve</span>—who then:</p>
              
              <div className="space-y-3 ml-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Keep track of your tasks</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Automate your workflows</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Send reminders and reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Help you stay ahead</span>
                </div>
              </div>
              
              <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 font-semibold mt-8">
                It's like having a Digimon in real life—except it runs your shop, your coaching business, or your content studio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Real Examples Section
function RealExamplesSection() {
  const examples = [
    {
      emoji: '🛍️',
      title: 'Shop Owner Mode',
      description: 'Your Rom Card becomes a store manager:',
      features: [
        'Tracks every order and customer',
        'Sends thank-you messages automatically',
        'Sets up marketing campaigns to bring buyers back',
        'Reminds you of low-stock products'
      ],
      result: 'Instead of juggling spreadsheets and apps, your Rom Card handles it.',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-cyan-500/30'
    },
    {
      emoji: '🏋️',
      title: 'Fitness Coach Mode',
      description: 'Your Rom Card turns into a training partner:',
      features: [
        'Collects client workout + meal logs in one place',
        'Creates weekly health progress reports',
        'Sends motivational reminders to your clients',
        'Suggests new programs based on client progress'
      ],
      result: 'You spend less time on admin, more time actually coaching.',
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30'
    },
    {
      emoji: '🎨',
      title: 'Creator Mode',
      description: 'Your Rom Card becomes your content assistant:',
      features: [
        'Helps brainstorm, script, and edit posts',
        'Analyzes which content gets the most likes/comments',
        'Suggests the next trend to ride',
        'Organizes sponsorship deals in a mini-CRM'
      ],
      result: 'More creativity, less burnout.',
      gradient: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30'
    },
    {
      emoji: '📈',
      title: 'Crypto Trader Mode',
      description: 'Your Rom Card evolves into a market watcher:',
      features: [
        'Tracks token prices in real-time',
        'Alerts you when your target conditions are met',
        'Analyzes trading patterns',
        'Can even connect to smart contracts for automation'
      ],
      result: 'No more staring at charts all day. Your Rom Card does the watching.',
      gradient: 'from-orange-500/20 to-red-500/20',
      border: 'border-orange-500/30'
    }
  ];

  return (
    <section id="examples" className="py-32 px-6 bg-gradient-to-b from-purple-950/20 to-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Real Examples,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
              Right Now
            </span>
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Here's what happens the moment you hatch your Rom Card:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {examples.map((example, index) => (
            <div key={index} className={`bg-gradient-to-br ${example.gradient} border ${example.border} rounded-3xl p-8 backdrop-blur-sm hover:scale-105 transition-all duration-500 group`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-6xl">{example.emoji}</div>
                <h3 className="text-2xl font-black text-white">{example.title}</h3>
              </div>
              
              <p className="text-gray-200 mb-6 text-lg">{example.description}</p>
              
              <div className="space-y-3 mb-6">
                {example.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-green-400 text-lg">✔</span>
                    <span className="text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-black/30 rounded-xl border border-white/10">
                <span className="text-cyan-400 text-xl">👉</span>
                <p className="text-cyan-300 font-semibold">{example.result}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Why Magical Section
function WhyMagicalSection() {
  const magicalFeatures = [
    {
      emoji: '🌱',
      title: 'They grow with you',
      description: 'Start as an egg, evolve into a skilled companion.',
      gradient: 'from-green-500/20 to-emerald-500/20'
    },
    {
      emoji: '🧠',
      title: 'They remember',
      description: 'Unlike apps, your Rom Card knows your history.',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      emoji: '🎮',
      title: 'It feels like a game',
      description: 'Leveling up your Rom Card is leveling up your life.',
      gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      emoji: '🤝',
      title: 'A community world',
      description: 'Share, trade, or use Rom Cards made by others.',
      gradient: 'from-orange-500/20 to-red-500/20'
    }
  ];

  return (
    <section id="magical" className="py-32 px-6 bg-gradient-to-b from-black to-purple-950/20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
            Why Rom Cards Feel 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Magical
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {magicalFeatures.map((feature, index) => (
            <div key={index} className={`bg-gradient-to-br ${feature.gradient} border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm hover:scale-105 transition-all duration-500`}>
              <div className="text-6xl mb-4">{feature.emoji}</div>
              <h3 className="text-2xl font-black text-white mb-4">{feature.title}</h3>
              <p className="text-gray-200 text-lg">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/30 rounded-3xl p-12">
            <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-4">
              This isn't software.
            </p>
            <p className="text-2xl md:text-3xl text-white">
              This is a digital friend that makes your life easier every single day.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Why Start Today Section
function WhyStartTodaySection() {
  return (
    <section id="start-today" className="py-32 px-6 bg-gradient-to-b from-purple-950/20 to-black relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl md:text-6xl font-black text-white mb-12">
          Why Start 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
            Today?
          </span>
        </h2>

        <div className="space-y-8 text-xl md:text-2xl text-gray-200 mb-16">
          <p>
            <span className="text-cyan-300 font-semibold">The earlier you hatch your Rom Card, the faster it learns.</span>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-lg">
            <div className="bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-2xl p-6">
              <div className="text-3xl mb-4">🌱</div>
              <p>Start building habits now.</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
              <div className="text-3xl mb-4">📈</div>
              <p>Let it grow alongside you.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
              <div className="text-3xl mb-4">🔓</div>
              <p>Watch it unlock new powers as you do.</p>
            </div>
            <div className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/20 rounded-2xl p-6">
              <div className="text-3xl mb-4">✨</div>
              <p>Just like in the games you loved as a kid, the first egg is always the most special.</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-cyan-500/20 border border-purple-500/30 rounded-3xl p-12 relative overflow-hidden">
          {/* Magical decorations */}
          <div className="absolute top-4 left-4 text-2xl animate-bounce">🌟</div>
          <div className="absolute top-6 right-8 text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
          <div className="absolute bottom-6 left-8 text-lg animate-bounce" style={{ animationDelay: '1s' }}>💫</div>
          <div className="absolute bottom-4 right-4 text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>⭐</div>
          
          <div className="relative z-10 space-y-8">
            <h3 className="text-4xl md:text-5xl font-black text-white">
              🌟 Ready to meet your first Rom Card?
            </h3>
            <p className="text-xl text-gray-200">
              Your future companion is waiting to hatch.
            </p>
            
            <AngularButton href="/register" variant="primary" className="text-xl px-12 py-6 animate-pulse">
              <span className="text-3xl mr-4">🚀</span>
              Hatch Now
              <Sparkles className="w-6 h-6 ml-4" />
            </AngularButton>
            
            <p className="text-sm text-gray-400">
              (Button pulses like a Pokéball or Digivice button.)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />
      <MagicalHeroSection />
      <WhatIsSection />
      <RealExamplesSection />
      <WhyMagicalSection />
      <WhyStartTodaySection />
      
      <footer className="py-16 px-6 border-t border-gray-800 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 transform rotate-45 rounded-lg"></div>
                <div className="absolute inset-0 w-10 h-10 bg-black transform rotate-45 rounded-lg border border-green-400"></div>
                <Gamepad2 className="absolute inset-0 w-5 h-5 text-green-400 m-auto transform -rotate-45" />
              </div>
              <div>
                <div className="text-lg font-black text-white">ROM CARDS</div>
                <div className="text-xs text-green-400 uppercase tracking-wider">Hatch Your Digital Friend</div>
              </div>
            </div>

            <div className="text-gray-400 text-sm">
              © 2025 ROM CARDS • Where Digital Friends Come to Life
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
