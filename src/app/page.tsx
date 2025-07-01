'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Greeting } from '@/components/greeting';
import { 
  Bot, 
  Zap, 
  Database, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  Play, 
  Brain,
  Target,
  Sparkles,
  CheckCircle,
  Star,
  Menu,
  X,
  Terminal,
  Code,
  Activity,
  TrendingUp,
  Cpu,
  GitBranch
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Suspense, useMemo, useCallback } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { BufferAttribute } from 'three';

const features = [
  {
    icon: Bot,
    title: 'Smart AI Apps',
    description: 'Build AI apps that remember conversations, learn from your customers, and get smarter over time - like having your own JARVIS',
    gradient: 'from-green-500/20 via-green-600/10 to-green-700/20',
    border: 'border-green-500/30'
  },
  {
    icon: Database,
    title: 'Customer Memory',
    description: 'Your AI remembers every customer interaction, preferences, and history automatically - just like JARVIS remembers everything for Tony Stark',
    gradient: 'from-blue-500/20 via-blue-600/10 to-blue-700/20',
    border: 'border-blue-500/30'
  },
  {
    icon: Clock,
    title: 'Auto Scheduling',
    description: 'Set your AI to work on schedules - daily reports, weekly follow-ups, monthly analysis. Your personal assistant that never sleeps',
    gradient: 'from-purple-500/20 via-purple-600/10 to-purple-700/20',
    border: 'border-purple-500/30'
  },
  {
    icon: Zap,
    title: 'Data Sync',
    description: 'Connect to any website, database, or app to keep your AI updated with fresh information - complete situational awareness',
    gradient: 'from-orange-500/20 via-orange-600/10 to-orange-700/20',
    border: 'border-orange-500/30'
  }
];

const useCases = [
  {
    emoji: '🗂️',
    title: 'Smart CMS',
    description: 'AI that writes, updates, and organizes your website content automatically - like having JARVIS manage your digital presence'
  },
  {
    emoji: '📋',
    title: 'Customer CRM',
    description: 'Track customers, send follow-ups, and never miss a sale opportunity - your business intelligence system'
  },
  {
    emoji: '🤖',
    title: 'Personal Assistant',
    description: 'AI that handles emails, schedules meetings, and manages your daily tasks - just like Tony Stark\'s JARVIS but for your business'
  },
  {
    emoji: '📊',
    title: 'Business Dashboard',
    description: 'Get daily reports on sales, customers, and business performance with Iron Man-level analytics'
  },
  {
    emoji: '💬',
    title: 'Customer Support Bot',
    description: 'Answer customer questions 24/7 with context from past conversations - always ready, always helpful'
  },
  {
    emoji: '📈',
    title: 'Sales Tracker',
    description: 'Monitor leads, send reminders, and track deals from start to finish with superhero-level efficiency'
  }
];

const stats = [
  { value: '100+', label: 'AI Agents Created', icon: Bot },
  { value: '24/7', label: 'Automated Operations', icon: Clock },
  { value: '∞', label: 'Scaling Potential', icon: Target },
  { value: '95%', label: 'Success Rate', icon: CheckCircle }
];

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#demo', label: 'Demo' },
  { href: '#features', label: 'Features' },
  { href: '#use-cases', label: 'Use Cases' },
  { href: '#marketplace', label: 'Marketplace' },
  { href: '#stats', label: 'Stats' },
  { href: '#get-started', label: 'Get Started' }
];

// React Three Fiber Wave Animation Component with responsive design
function Points() {
  const attributeRef = useRef<BufferAttribute>(null);
  const texture = useLoader(TextureLoader, '/images/circle.png');

  const [t, setT] = useState(0);

  // Responsive wave parameters
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
        map={texture}
        color={0x00FF88}
        size={isMobile ? 0.8 : 1}  // Smaller particles on mobile
        sizeAttenuation
        alphaTest={0.2}
        opacity={1}
      />
    </points>
  )
}

// New Wave Animation Component with responsive camera
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
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
    </div>
  );
}

// Enhanced Fallback Particle Background Component
function EnhancedParticleBackground() {
  const [particles, setParticles] = useState<Array<{
    id: number, 
    x: number, 
    y: number, 
    vx: number, 
    vy: number, 
    opacity: number,
    size: number,
    color: string,
    waveOffset: number
  }>>([]);

  useEffect(() => {
    const colors = ['bg-green-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-lime-400'];
    const newParticles = Array.from({length: 80}, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.8 + 0.3,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      waveOffset: Math.random() * Math.PI * 2
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => {
        const time = Date.now() * 0.001;
        const waveY = Math.sin(time + particle.waveOffset) * 5;
        return {
          ...particle,
          x: (particle.x + particle.vx + 100) % 100,
          y: (particle.y + particle.vy + waveY * 0.1 + 100) % 100,
          opacity: 0.3 + (Math.sin(time * 0.5 + particle.id) + 1) * 0.4
        };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-70">
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`absolute rounded-full ${particle.color} animate-pulse`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 3}px currentColor, 0 0 ${particle.size * 6}px currentColor`,
            filter: 'blur(0.5px)'
          }}
        />
      ))}
    </div>
  );
}

// Typing Animation Component
function TypewriterEffect() {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const phrases = [
    'Sync with Shopify to send abandoned cart emails with 15% discount codes via Gmail API',
    'Connect to Stripe and send personalized follow-up emails through Mailchimp when payments complete',
    'Integrate with Google Sheets to track inventory and send Slack alerts when stock is low',
    'Build a customer support bot that syncs with Zendesk and remembers conversations in HubSpot CRM',
    'Connect LinkedIn Sales Navigator with Gmail to automatically qualify and score leads',
    'Sync with WooCommerce and create competitor price tracking dashboard using web scraping APIs',
    'Integrate Instagram Business API to auto-post products when Shopify inventory updates',
    'Connect Calendly with Salesforce to automatically schedule follow-up calls with warm leads'
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentPhrase = phrases[currentIndex];
      
      if (!isDeleting) {
        if (currentText !== currentPhrase) {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (currentText !== '') {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex((currentIndex + 1) % phrases.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [currentText, currentIndex, isDeleting]);

  return (
    <div className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-lg md:text-xl">
      {currentText}
      <span className="animate-pulse text-green-300">|</span>
    </div>
  );
}

// Floating Success Stories Component - Updated for side panel
function FloatingSuccessStories() {
  const stories = [
    { 
      icon: '🛒', 
      name: 'E-commerce Auto-Pilot', 
      gradient: 'from-blue-500 to-cyan-400',
      revenue: '$2,847/mo',
      description: 'Saved 20 hours/week on inventory and customer emails'
    },
    { 
      icon: '🎯', 
      name: 'Lead Scoring System', 
      gradient: 'from-purple-500 to-pink-400',
      revenue: '$5,123/mo', 
      description: 'Doubled conversion rate by auto-qualifying leads'
    },
    { 
      icon: '📧', 
      name: 'Newsletter Automation', 
      gradient: 'from-orange-500 to-red-400',
      revenue: '$1,956/mo',
      description: 'Grew email list 300% with automated sequences'
    },
    { 
      icon: '📊', 
      name: 'Customer CRM Dashboard', 
      gradient: 'from-green-500 to-teal-400',
      revenue: '$3,234/mo',
      description: 'Never loses track of customer conversations'
    }
  ];

  return (
    <div className="space-y-6">
      {stories.map((story, index) => (
        <div
          key={index}
          className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl transform transition-all duration-300 hover:scale-105`}
          style={{
            animation: `float ${4 + index}s ease-in-out infinite`,
            animationDelay: `${index * 0.8}s`
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${story.gradient} opacity-20 rounded-2xl`}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{story.icon}</span>
              <div>
                <div className="text-white font-bold text-sm">{story.name}</div>
                <div className={`text-transparent bg-clip-text bg-gradient-to-r ${story.gradient} font-bold text-xs`}>
                  {story.revenue}
                </div>
              </div>
            </div>
            <div className="text-white/80 text-xs">{story.description}</div>
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}

// Demo Modal Component
function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 bg-gradient-to-br from-black/95 to-green-950/90 backdrop-blur-xl border border-green-500/30 rounded-3xl p-6 md:p-8 shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-full flex items-center justify-center transition-colors duration-200 group"
        >
          <X className="w-4 h-4 text-green-300 group-hover:text-green-100" />
        </button>

        {/* Modal Content */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-green-100 mb-4 font-mono">
              How Rom Cards Works
            </h3>
            <p className="text-green-300/80 font-mono text-base md:text-lg">
              From idea to smart AI app in minutes
            </p>
          </div>

          {/* Demo Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                emoji: '💭', 
                title: 'Tell Us What You Need',
                text: 'Just describe your business need in plain English. Like "I need a CRM that remembers my customers"',
                gradient: 'from-green-500/20 to-cyan-500/20',
                example: '"I need an AI that calls my leads and schedules meetings"'
              },
              { 
                emoji: '🧠', 
                title: 'AI Builds Your App',
                text: 'Our AI creates your custom app with memory, scheduling, and all the features you need.',
                gradient: 'from-cyan-500/20 to-blue-500/20',
                example: 'Customer database, auto-scheduling, email integration...'
              },
              { 
                emoji: '🔗', 
                title: 'Connect Your Data',
                text: 'Your AI app syncs with your existing tools and stays updated with fresh information.',
                gradient: 'from-blue-500/20 to-green-500/20',
                example: 'Gmail, Google Sheets, your website, social media...'
              },
              { 
                emoji: '🚀', 
                title: 'Launch & Earn',
                text: 'Your AI app starts working immediately. Use it for your business or sell access to others!',
                gradient: 'from-green-500/20 to-emerald-500/20',
                example: 'Live app URL, customer management, automated workflows...'
              }
            ].map((step, index) => (
              <div key={index} className={`p-6 rounded-2xl bg-gradient-to-r ${step.gradient} border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-all duration-300 group`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} border border-green-500/30 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{step.emoji}</span>
                </div>
                <h4 className="text-green-100 font-mono font-bold text-lg mb-3">{step.title}</h4>
                <p className="text-green-300/80 font-mono text-sm mb-4 leading-relaxed">{step.text}</p>
                <div className="bg-black/30 rounded-lg p-3 border border-green-500/20">
                  <p className="text-green-400/70 font-mono text-xs italic">{step.example}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Live Demo Section */}
          <div className="bg-black/50 rounded-2xl p-6 border border-green-500/30">
            <h4 className="text-green-100 font-mono font-bold text-xl mb-4 text-center">
              See It In Action
            </h4>
            <div className="bg-black/70 rounded-xl p-4 font-mono text-sm border border-green-500/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-300/70 ml-2">rom-cards-terminal</span>
              </div>
              <div className="space-y-2">
                <div className="text-cyan-400">$ rom-cards build</div>
                <div className="text-green-300/80">💭 What would you like to build?</div>
                <div className="text-green-400 animate-pulse">
                  &gt; "Send abandoned cart emails with 15% discount codes to customers who haven't purchased in 24 hours"
                </div>
                <div className="text-yellow-400">🧠 Understanding your needs...</div>
                <div className="text-blue-400">💾 Setting up customer cart tracking...</div>
                <div className="text-cyan-400">📧 Creating email automation system...</div>
                <div className="text-purple-400">🎯 Configuring discount code generation...</div>
                <div className="text-orange-400">⏰ Setting up 24-hour trigger scheduling...</div>
                <div className="text-green-400">✅ Your cart recovery system is ready!</div>
                <div className="text-cyan-400">🌐 Live at: https://cart-recovery.romcards.app</div>
                <div className="text-green-300">📊 Database: Customer cart tracking</div>
                <div className="text-yellow-300">💰 Ready to recover abandoned sales!</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-4">
            <p className="text-green-300/70 font-mono text-sm">
              Ready to turn your ideas into reality?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button 
                  onClick={onClose}
                  className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-black border border-green-500/30 shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 px-8 py-3 font-mono text-base group transform hover:scale-105 transition-all duration-300 rounded-xl"
                >
                  <Sparkles className="w-5 h-5 mr-2 group-hover:animate-bounce text-black" />
                  Start Building Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform text-black" />
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20 hover:text-green-100 hover:border-green-500/50 backdrop-blur-sm px-8 py-3 font-mono text-base rounded-xl"
              >
                Got It, Thanks!
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Clean Enhanced Hero Section Component
function EnhancedHeroSection() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Three.js Wave Animation - positioned absolutely behind content with reduced opacity */}
      <div className="absolute inset-0 z-0 opacity-30">
        <WaveAnimation />
      </div>
      
      {/* Removed fallback animated background for cleaner look */}
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Content - Takes 8 columns on large screens */}
          <div className="lg:col-span-8 space-y-8">
            {/* Status Badge with Gradient */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 shadow-lg">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-white font-mono text-sm font-medium">No Coding Required</span>
            </div>
            
            {/* Main Headline with Colorful Gradient */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-200 via-emerald-200 to-cyan-200 font-mono tracking-tight leading-none">
                Rom Cards
              </h1>
              
              <p className="text-xl md:text-2xl lg:text-3xl text-white max-w-4xl leading-relaxed">
                Build your own
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-semibold"> JARVIS DASHBOARD </span>
                using only prompts
              </p>
              
              <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-3xl leading-relaxed">
                Just like Tony Stark, describe what you want in plain English. Our AI builds Iron Man-level smart apps that remember customers, work on schedules, and sync with your tools - all from simple prompts! ✨
              </p>
            </div>

            {/* Colorful Terminal Demo */}
            <div className="w-full max-w-3xl">
              <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-lg"></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"></div>
                  <span className="text-white/80 ml-3 font-mono text-sm">AI Agent Builder</span>
                </div>
                <div className="text-left space-y-4">
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono text-sm opacity-75">💭 What do you want to build?</div>
                  <TypewriterEffect />
                  <div className="text-white/60 font-mono text-sm mt-4">
                    → AI is building this for you right now... 🤖✨
                  </div>
                </div>
              </div>
            </div>

            {/* Vibrant CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full max-w-lg">
              <Link href="/register" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 px-6 py-4 font-mono text-base group transform hover:scale-105 transition-all duration-300 rounded-xl h-14 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-3 group-hover:animate-bounce flex-shrink-0" />
                  <span className="flex-1 text-center">Build My First App</span>
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Button>
              </Link>
              
              <Button
                variant="outline"
                onClick={() => setShowDemo(true)}
                className="flex-1 w-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/50 backdrop-blur-sm px-6 py-4 font-mono text-base group rounded-xl h-14 flex items-center justify-center"
              >
                <Play className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="flex-1 text-center">Show Me How</span>
              </Button>
            </div>
          </div>

          {/* Right Side - Success Stories - Takes 4 columns on large screens */}
          <div className="lg:col-span-4">
            <div className="sticky top-20">
              {/* Desktop Success Stories */}
              <div className="hidden lg:block">
                <div className="mb-6 text-center">
                  <h3 className="text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                    Success Stories
                  </h3>
                  <p className="text-white/60 font-mono text-sm">
                    Real people earning with AI agents
                  </p>
                </div>
                <FloatingSuccessStories />
              </div>

              {/* Mobile Success Stories */}
              <div className="lg:hidden">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                    Success Stories
                  </h3>
                  <p className="text-white/60 font-mono text-sm">
                    Real people earning with AI agents
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { 
                      icon: '🛒', 
                      name: 'E-commerce Auto-Pilot', 
                      gradient: 'from-blue-500 to-cyan-400',
                      revenue: '$2,847/mo',
                      description: 'Saved 20 hours/week on inventory and customer emails'
                    },
                    { 
                      icon: '🎯', 
                      name: 'Lead Scoring System', 
                      gradient: 'from-purple-500 to-pink-400',
                      revenue: '$5,123/mo', 
                      description: 'Doubled conversion rate by auto-qualifying leads'
                    },
                    { 
                      icon: '📧', 
                      name: 'Newsletter Automation', 
                      gradient: 'from-orange-500 to-red-400',
                      revenue: '$1,956/mo',
                      description: 'Grew email list 300% with automated sequences'
                    },
                    { 
                      icon: '📊', 
                      name: 'Customer CRM Dashboard', 
                      gradient: 'from-green-500 to-teal-400',
                      revenue: '$3,234/mo',
                      description: 'Never loses track of customer conversations'
                    }
                  ].map((story, index) => (
                    <div
                      key={index}
                      className="relative bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${story.gradient} opacity-20 rounded-2xl`}></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{story.icon}</span>
                          <div>
                            <div className="text-white font-bold text-sm">{story.name}</div>
                            <div className={`text-transparent bg-clip-text bg-gradient-to-r ${story.gradient} font-bold text-xs`}>
                              {story.revenue}
                            </div>
                          </div>
                        </div>
                        <div className="text-white/80 text-xs">{story.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />

      {/* Subtle gradient overlay */}
    </section>
  );
}

// Enhanced Matrix Rain Effect Component with Colors
function MatrixRain() {
  const [drops, setDrops] = useState<Array<{id: number, x: number, y: number, speed: number, char: string, color: string}>>([]);

  useEffect(() => {
    const chars = ['0', '1', 'ロ', 'ム', 'カ', 'ー', 'ド', '∧', '∨', '⊕', '⊗', '∀', '∃'];
    const colors = ['text-green-400', 'text-cyan-400', 'text-blue-400', 'text-purple-400'];
    
    const newDrops = Array.from({length: 30}, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.3 + Math.random() * 0.7,
      char: chars[Math.floor(Math.random() * chars.length)],
      color: i % 4 === 0 ? colors[Math.floor(Math.random() * colors.length)] : 'text-green-400'
    }));
    setDrops(newDrops);

    const interval = setInterval(() => {
      setDrops(prev => prev.map(drop => ({
        ...drop,
        y: drop.y > 100 ? -10 : drop.y + drop.speed,
        char: Math.random() > 0.95 ? chars[Math.floor(Math.random() * chars.length)] : drop.char
      })));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {drops.map(drop => (
        <div
          key={drop.id}
          className={`absolute font-mono text-sm animate-pulse transition-all duration-300 ${drop.color}`}
          style={{
            left: `${drop.x}%`,
            top: `${drop.y}%`,
            transform: 'translateY(-50%)',
            textShadow: '0 0 10px currentColor'
          }}
        >
          {drop.char}
        </div>
      ))}
    </div>
  );
}

// Interactive Demo Preview Component with Enhanced Colors
function InteractiveDemoPreview() {
  const [step, setStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const steps = [
    { text: 'Type your idea...', icon: Terminal, color: 'text-green-400', bg: 'from-green-500/20 to-green-600/10' },
    { text: 'AI analyzes requirements', icon: Brain, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-600/10' },
    { text: 'Generates code & database', icon: Code, color: 'text-purple-400', bg: 'from-purple-500/20 to-pink-600/10' },
    { text: 'Deploy & start earning!', icon: Zap, color: 'text-orange-400', bg: 'from-orange-500/20 to-red-600/10' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % steps.length);
    }, isHovered ? 4000 : 2500);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div 
      className="bg-gradient-to-br from-green-500/10 to-green-700/10 border border-green-500/20 rounded-2xl p-6 backdrop-blur-sm hover:border-green-500/40 transition-all duration-500 transform hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="space-y-4">
        {steps.map((stepItem, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-500 transform ${
              index === step ? 'opacity-100 scale-105 translate-x-2' : index < step ? 'opacity-70' : 'opacity-30'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center bg-gradient-to-br ${stepItem.bg} transition-all duration-500 ${
              index === step ? `border-green-400 shadow-lg shadow-green-400/30 ${stepItem.bg}` : 
              index < step ? 'border-green-500 bg-green-500/10' : 'border-green-600/30'
            }`}>
              <stepItem.icon className={`w-4 h-4 ${stepItem.color} transition-transform duration-300 ${
                index === step ? 'scale-110' : ''
              }`} />
            </div>
            <span className={`font-mono text-sm transition-all duration-500 ${
              index === step ? `${stepItem.color} font-semibold drop-shadow-lg` : 
              index < step ? 'text-green-300' : 'text-green-600'
            }`}>
              {stepItem.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Animated Code Block Component
function AnimatedCodeBlock() {
  const [currentLine, setCurrentLine] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const codeLines = [
    { text: '> "Build me a customer support system"', color: 'text-cyan-400' },
    { text: '  ✓ Creating database models...', color: 'text-green-400' },
    { text: '  ✓ Generating API endpoints...', color: 'text-blue-400' },
    { text: '  ✓ Building UI components...', color: 'text-purple-400' },
    { text: '  ✓ Setting up automation...', color: 'text-orange-400' },
    { text: '🚀 Agent deployed successfully!', color: 'text-pink-400' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine(prev => (prev + 1) % codeLines.length);
    }, isHovered ? 3000 : 2000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div 
      className="bg-black/80 border border-green-500/30 rounded-xl p-6 font-mono text-sm backdrop-blur-sm hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-500 transform hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        <span className="text-green-300 ml-2">agent-builder.terminal</span>
      </div>
      <div className="space-y-2">
        {codeLines.map((line, index) => (
          <div
            key={index}
            className={`transition-all duration-500 transform ${
              index <= currentLine 
                ? `${line.color} opacity-100 translate-x-0` 
                : 'text-green-600 opacity-30 translate-x-2'
            }`}
            style={{ 
              textShadow: index <= currentLine ? '0 0 10px currentColor' : 'none'
            }}
          >
            {line.text}
            {index === currentLine && (
              <span className="animate-pulse text-green-400 ml-1">_</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Live Metrics Component
function LiveMetrics() {
  const [metrics, setMetrics] = useState({
    agents: 142,
    revenue: 85670,
    uptime: 99.9
  });
  const [animatingMetric, setAnimatingMetric] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const metricIndex = Math.floor(Math.random() * 3);
      setAnimatingMetric(metricIndex);
      
      setTimeout(() => {
        setMetrics(prev => ({
          agents: metricIndex === 0 ? prev.agents + Math.floor(Math.random() * 2 + 1) : prev.agents,
          revenue: metricIndex === 1 ? prev.revenue + Math.floor(Math.random() * 200 + 100) : prev.revenue,
          uptime: metricIndex === 2 ? Math.min(99.9 + Math.random() * 0.08, 99.99) : prev.uptime
        }));
        
        setTimeout(() => setAnimatingMetric(null), 500);
      }, 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const metricData = [
    { 
      icon: Activity, 
      value: metrics.agents, 
      label: 'Active Agents', 
      isAnimating: animatingMetric === 0,
      gradient: 'from-green-500/20 to-cyan-500/20',
      border: 'border-green-500/20',
      color: 'text-green-400'
    },
    { 
      icon: TrendingUp, 
      value: `$${metrics.revenue.toLocaleString()}`, 
      label: 'Revenue Generated', 
      isAnimating: animatingMetric === 1,
      gradient: 'from-blue-500/20 to-purple-500/20',
      border: 'border-blue-500/20',
      color: 'text-blue-400'
    },
    { 
      icon: Cpu, 
      value: `${metrics.uptime.toFixed(1)}%`, 
      label: 'Uptime', 
      isAnimating: animatingMetric === 2,
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/20',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {metricData.map((metric, index) => (
        <div key={index} className={`bg-gradient-to-br ${metric.gradient} border ${metric.border} rounded-xl p-4 text-center transition-all duration-500 backdrop-blur-sm ${
          metric.isAnimating ? `bg-gradient-to-br ${metric.gradient} border-opacity-60 shadow-lg shadow-current/20 scale-105` : ''
        }`}>
          <metric.icon className={`w-6 h-6 ${metric.color} mx-auto mb-2 transition-transform duration-300 ${
            metric.isAnimating ? 'scale-110' : ''
          }`} style={{ filter: metric.isAnimating ? 'drop-shadow(0 0 8px currentColor)' : 'none' }} />
          <div className={`text-2xl font-bold text-green-100 font-mono transition-all duration-500 ${
            metric.isAnimating ? 'text-green-50 scale-105' : ''
          }`} style={{ textShadow: metric.isAnimating ? '0 0 10px currentColor' : 'none' }}>{metric.value}</div>
          <div className="text-green-300/70 font-mono text-sm">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}

// Enhanced Features Section with Interactive Cards
function EnhancedFeatureCard({ feature, index }: { feature: any, index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const colorMap = [
    { text: 'text-green-400', shadow: 'shadow-green-500/20', glow: 'drop-shadow-green' },
    { text: 'text-cyan-400', shadow: 'shadow-cyan-500/20', glow: 'drop-shadow-cyan' },
    { text: 'text-purple-400', shadow: 'shadow-purple-500/20', glow: 'drop-shadow-purple' },
    { text: 'text-orange-400', shadow: 'shadow-orange-500/20', glow: 'drop-shadow-orange' }
  ];
  
  const colors = colorMap[index % colorMap.length];

  return (
    <Card 
      className={`bg-gradient-to-br ${feature.gradient} border ${feature.border} backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 group cursor-pointer ${
        isHovered ? `hover:shadow-xl ${colors.shadow}` : 'hover:shadow-lg hover:shadow-green-500/10'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} border ${feature.border} flex items-center justify-center mb-3 transition-all duration-500 ${
          isHovered ? 'scale-125 rotate-6' : 'group-hover:scale-110'
        }`}>
          <feature.icon className={`w-6 h-6 transition-all duration-300 ${isHovered ? colors.text : 'text-green-300'}`} 
            style={{ filter: isHovered ? 'drop-shadow(0 0 8px currentColor)' : 'none' }} />
        </div>
        <CardTitle className={`font-mono text-lg transition-all duration-300 ${isHovered ? colors.text : 'text-green-100'}`}>
          {feature.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-green-300/70 text-sm font-mono leading-relaxed">
          {feature.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

// Enhanced Use Case Cards
function EnhancedUseCaseCard({ useCase, index }: { useCase: any, index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const gradients = [
    'from-green-500/10 via-cyan-500/5 to-green-700/10',
    'from-cyan-500/10 via-blue-500/5 to-cyan-700/10',
    'from-blue-500/10 via-purple-500/5 to-blue-700/10',
    'from-purple-500/10 via-pink-500/5 to-purple-700/10',
    'from-pink-500/10 via-orange-500/5 to-pink-700/10',
    'from-orange-500/10 via-yellow-500/5 to-orange-700/10'
  ];

  return (
    <Card 
      className={`bg-gradient-to-br ${gradients[index % gradients.length]} border-green-500/20 backdrop-blur-sm transition-all duration-500 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 group cursor-pointer transform hover:-translate-y-1 ${
        isHovered ? 'scale-105' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 transition-all duration-500 ${
            isHovered ? 'scale-125 rotate-12 shadow-lg shadow-green-500/30' : 'group-hover:scale-110'
          }`}>
            <span className="text-2xl" style={{ filter: isHovered ? 'drop-shadow(0 0 8px currentColor)' : 'none' }}>
              {useCase.emoji}
            </span>
          </div>
          <CardTitle className={`font-mono text-lg transition-all duration-300 ${
            isHovered ? 'text-green-50' : 'text-green-100'
          }`}>
            {useCase.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-green-300/70 font-mono leading-relaxed">
          {useCase.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

// Enhanced Revenue Flow Animation Component
function RevenueFlowAnimation() {
  const [activeFlow, setActiveFlow] = useState(0);
  const flows = [
    { from: 'Your Agent', to: 'User Purchase', amount: '$50', color: 'text-green-400', gradient: 'from-green-500/20 to-cyan-500/20' },
    { from: 'Platform Fee', to: 'You Earn', amount: '$35', color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-blue-500/20' },
    { from: 'Monthly Usage', to: 'Recurring Income', amount: '$20/mo', color: 'text-purple-400', gradient: 'from-purple-500/20 to-pink-500/20' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFlow(prev => (prev + 1) % flows.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {flows.map((flow, index) => (
        <div key={index} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-700 ease-in-out transform ${
          index === activeFlow 
            ? `bg-gradient-to-r ${flow.gradient} border-green-500/30 shadow-lg shadow-green-500/10 scale-105` 
            : 'bg-black/20 border-green-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
              index === activeFlow ? 'bg-green-400 scale-125 shadow-lg shadow-green-400/50' : 'bg-green-600'
            }`} style={{ filter: index === activeFlow ? 'drop-shadow(0 0 6px currentColor)' : 'none' }}></div>
            <span className="font-mono text-sm text-green-200">{flow.from}</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className={`w-4 h-4 transition-all duration-500 ${
              index === activeFlow ? `${flow.color} translate-x-1 scale-110` : 'text-green-600'
            }`} style={{ filter: index === activeFlow ? 'drop-shadow(0 0 6px currentColor)' : 'none' }} />
          </div>
          <div className="text-right">
            <div className={`font-mono font-bold transition-all duration-500 ${
              index === activeFlow ? flow.color + ' scale-110' : 'text-green-600'
            }`} style={{ textShadow: index === activeFlow ? '0 0 10px currentColor' : 'none' }}>{flow.amount}</div>
            <div className="font-mono text-xs text-green-300">{flow.to}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Enhanced Agent Licensing Examples Component
function AgentLicensingExamples() {
  const examples = [
    {
      name: 'E-commerce Bot',
      creator: '@sarah_dev',
      price: '$49/month',
      users: '1,247',
      revenue: '$61,503',
      icon: '🛍️',
      gradient: 'from-green-500/10 via-cyan-500/5 to-green-700/10',
      border: 'border-green-500/20',
      hoverBorder: 'hover:border-green-500/40',
      growth: '+23%'
    },
    {
      name: 'Lead Generator',
      creator: '@mike_ai',
      price: '$29/month',
      users: '892',
      revenue: '$25,868',
      icon: '🎯',
      gradient: 'from-cyan-500/10 via-blue-500/5 to-cyan-700/10',
      border: 'border-cyan-500/20',
      hoverBorder: 'hover:border-cyan-500/40',
      growth: '+18%'
    },
    {
      name: 'Content Creator',
      creator: '@alex_code',
      price: '$39/month',
      users: '634',
      revenue: '$24,726',
      icon: '✍️',
      gradient: 'from-purple-500/10 via-pink-500/5 to-purple-700/10',
      border: 'border-purple-500/20',
      hoverBorder: 'hover:border-purple-500/40',
      growth: '+31%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {examples.map((example, index) => (
        <div key={index} className={`bg-gradient-to-br ${example.gradient} border ${example.border} rounded-xl p-6 backdrop-blur-sm ${example.hoverBorder} transition-all duration-300 group cursor-pointer transform hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border ${example.border} group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-green-500/30`}>
              <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}>{example.icon}</span>
            </div>
            <div>
              <h4 className="font-mono font-bold text-green-100 group-hover:text-green-50 transition-colors duration-300">{example.name}</h4>
              <p className="font-mono text-sm text-green-400">{example.creator}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-mono text-sm text-green-300">Price:</span>
              <span className="font-mono text-sm text-green-100 font-bold">{example.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-sm text-green-300">Active Users:</span>
              <span className="font-mono text-sm text-green-100">{example.users}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-sm text-green-300">Total Revenue:</span>
              <span className="font-mono text-sm text-green-400 font-bold">{example.revenue}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-500/20">
            <div className="flex items-center gap-2 text-green-300">
              <TrendingUp className="w-4 h-4" />
              <span className="font-mono text-xs">{example.growth} this month</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Enhanced Stats Component
function EnhancedStatsSection() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  
  const statsData = [
    { value: '100+', label: 'AI Agents Created', icon: Bot, color: 'text-green-400', gradient: 'from-green-500/20 to-cyan-500/20', border: 'border-green-500/20' },
    { value: '24/7', label: 'Automated Operations', icon: Clock, color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/20' },
    { value: '∞', label: 'Scaling Potential', icon: Target, color: 'text-purple-400', gradient: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/20' },
    { value: '95%', label: 'Success Rate', icon: CheckCircle, color: 'text-orange-400', gradient: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/20' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <div 
          key={index} 
          className="text-center group cursor-pointer transform transition-all duration-500 hover:-translate-y-2"
          onMouseEnter={() => setHoveredStat(index)}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} border ${stat.border} rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${
            hoveredStat === index ? 'scale-125 shadow-xl shadow-green-500/30 border-green-500/40' : 'group-hover:scale-110 group-hover:bg-green-500/20'
          }`}>
            <stat.icon className={`w-8 h-8 transition-all duration-300 ${hoveredStat === index ? stat.color : 'text-green-400'}`} 
              style={{ filter: hoveredStat === index ? 'drop-shadow(0 0 10px currentColor)' : 'none' }} />
          </div>
          <div className={`text-3xl font-bold font-mono mb-2 transition-all duration-300 ${
            hoveredStat === index ? `${stat.color} scale-110` : 'text-green-100'
          }`} style={{ textShadow: hoveredStat === index ? '0 0 15px currentColor' : 'none' }}>{stat.value}</div>
          <div className="text-green-300/70 font-mono text-sm">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Enhanced Agent Building Process Visualization
function AgentBuildingProcess() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const steps = [
    { icon: Terminal, label: 'Natural Language Input', color: 'text-green-400', gradient: 'from-green-500/20 to-cyan-500/20' },
    { icon: Brain, label: 'AI Analysis', color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-blue-500/20' },
    { icon: Database, label: 'Schema Generation', color: 'text-blue-400', gradient: 'from-blue-500/20 to-purple-500/20' },
    { icon: Code, label: 'Code Generation', color: 'text-purple-400', gradient: 'from-purple-500/20 to-pink-500/20' },
    { icon: Zap, label: 'Deployment', color: 'text-pink-400', gradient: 'from-pink-500/20 to-orange-500/20' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveStep(prev => (prev + 1) % steps.length);
        setIsAnimating(false);
      }, 200);
    }, isHovered ? 3000 : 2000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div 
      className="w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Background progress line with gradient */}
          <div className="absolute top-6 left-0 right-0 flex items-center">
            <div className="flex-1"></div>
            <div className="flex-1 h-1 bg-gradient-to-r from-green-600/20 via-cyan-600/20 to-purple-600/20 rounded-full mx-6">
              <div 
                className="h-full bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 rounded-full transition-all duration-700 ease-in-out shadow-lg shadow-green-400/50"
                style={{ 
                  width: `${(activeStep / (steps.length - 1)) * 100}%`,
                  filter: 'drop-shadow(0 0 8px currentColor)'
                }}
              />
            </div>
            <div className="flex-1"></div>
          </div>
          
          {/* Icons and labels */}
          <div className="flex justify-between items-start">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center relative z-10 flex-1">
                <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ease-in-out bg-gradient-to-br ${step.gradient} backdrop-blur-sm ${
                  index === activeStep 
                    ? `border-green-400 shadow-xl shadow-green-400/40 scale-110` 
                    : index < activeStep
                    ? `border-green-500 ${step.gradient}`
                    : 'border-green-500/20 bg-black/50'
                } ${isAnimating && index === activeStep ? 'animate-pulse' : ''}`}>
                  <step.icon className={`w-6 h-6 transition-all duration-500 ${
                    index === activeStep ? `${step.color} scale-125` : 
                    index < activeStep ? 'text-green-400' : 'text-green-600'
                  }`} style={{ 
                    filter: index === activeStep ? 'drop-shadow(0 0 10px currentColor)' : 'none'
                  }} />
                </div>
                <span className={`text-xs font-mono mt-3 transition-all duration-500 text-center max-w-20 leading-tight ${
                  index === activeStep ? `${step.color} font-semibold` : 
                  index < activeStep ? 'text-green-300' : 'text-green-600'
                }`} style={{ 
                  textShadow: index === activeStep ? '0 0 8px currentColor' : 'none'
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-500 ease-in-out bg-gradient-to-br ${step.gradient} backdrop-blur-sm flex-shrink-0 ${
                index === activeStep 
                  ? `border-green-400 shadow-lg shadow-green-400/30 scale-110` 
                  : index < activeStep
                  ? 'border-green-500'
                  : 'border-green-500/20 bg-black/50'
              } ${isAnimating && index === activeStep ? 'animate-pulse' : ''}`}>
                <step.icon className={`w-5 h-5 transition-all duration-500 ${
                  index === activeStep ? `${step.color} scale-110` : 
                  index < activeStep ? 'text-green-400' : 'text-green-600'
                }`} style={{ 
                  filter: index === activeStep ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                }} />
              </div>
              <div className="flex-1">
                <span className={`text-sm font-mono transition-all duration-500 ${
                  index === activeStep ? `${step.color} font-semibold` : 
                  index < activeStep ? 'text-green-300' : 'text-green-600'
                }`} style={{ 
                  textShadow: index === activeStep ? '0 0 8px currentColor' : 'none'
                }}>
                  {step.label}
                </span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="ml-5 mt-2 mb-2">
                <div className={`w-0.5 h-6 transition-all duration-700 ease-in-out ${
                  index < activeStep ? `bg-gradient-to-b ${step.gradient} shadow-sm shadow-green-400/50` : 'bg-green-600/30'
                }`} style={{ 
                  filter: index < activeStep ? 'drop-shadow(0 0 4px currentColor)' : 'none'
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    // Small delay to allow menu to close before scrolling
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  return (
    <>
      <header className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-green-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                <img src="/images/logo.png" alt="Rom Cards" className="w-6 h-6" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-green-300 hover:text-green-200 font-mono text-sm transition-colors duration-200 hover:border-b border-green-400 cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/register">
                <Button variant="outline" size="sm" className="border-green-500/30 bg-black/50 text-green-300 hover:bg-green-500/10 hover:text-green-200 hover:border-green-500/50 backdrop-blur-sm font-mono">
                  Join Now
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-green-600 to-green-700 text-black hover:from-green-700 hover:to-green-800 border border-green-500/30 shadow-lg shadow-green-500/20 font-mono">
                  Build Agent
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-green-300 hover:text-green-200 transition-colors relative z-50"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-green-500/20 shadow-2xl shadow-green-500/10 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col py-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="px-6 py-4 text-green-300 hover:text-green-200 hover:bg-green-500/10 font-mono text-base transition-all duration-200 text-left border-l-2 border-transparent hover:border-green-500"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-4 px-6 pt-6 border-t border-green-500/20 mt-4">
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-green-500/30 bg-black/50 text-green-300 hover:bg-green-500/10 hover:text-green-200 hover:border-green-500/50 backdrop-blur-sm font-mono py-3">
                    Join Now
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-black hover:from-green-700 hover:to-green-800 border border-green-500/30 shadow-lg shadow-green-500/20 font-mono py-3">
                    Build Agent
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

// Mobile App Demo Component
function MobileAppDemo() {
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      color: 'text-green-400'
    },
    { 
      id: 'customers', 
      label: 'Customers', 
      icon: '👥',
      color: 'text-blue-400'
    },
    { 
      id: 'emails', 
      label: 'Emails', 
      icon: '📧',
      color: 'text-purple-400'
    },
    { 
      id: 'schedule', 
      label: 'Schedule', 
      icon: '⏰',
      color: 'text-orange-400'
    },
    { 
      id: 'chat', 
      label: 'AI Chat', 
      icon: '🤖',
      color: 'text-cyan-400'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Dashboard
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-100 font-mono font-bold text-lg">Dashboard</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Active Carts', value: '12', color: 'text-orange-400' },
                { label: 'Emails Sent', value: '47', color: 'text-green-400' },
                { label: 'Recovery Rate', value: '23%', color: 'text-blue-400' },
                { label: 'Revenue', value: '$1,247', color: 'text-purple-400' }
              ].map((stat, index) => (
                <div key={index} className="bg-black/30 border border-green-500/20 rounded-lg p-3 text-center">
                  <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                  <div className="text-green-300/70 font-mono text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-green-200 font-mono text-sm font-semibold">Quick Actions</h4>
              {[
                { action: 'Send Cart Recovery Emails', status: 'Ready', color: 'text-green-400' },
                { action: 'Generate Weekly Report', status: 'Scheduled', color: 'text-blue-400' },
                { action: 'Update Discount Codes', status: 'In Progress', color: 'text-orange-400' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
                  <div>
                    <div className="text-green-100 font-mono text-sm">{item.action}</div>
                    <div className={`${item.color} font-mono text-xs`}>{item.status}</div>
                  </div>
                  <button className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-md flex items-center justify-center">
                    <span className="text-green-400 text-xs">→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 1: // Customers
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-100 font-mono font-bold text-lg">Customers</h3>
              <span className="text-orange-300 font-mono text-xs">12 abandoned carts</span>
            </div>
            
            <div className="space-y-3">
              {[
                { name: 'Sarah M.', email: 'sarah@email.com', value: '$127.50', timeLeft: '2h 45m', status: 'pending', avatar: '👩' },
                { name: 'Mike R.', email: 'mike@email.com', value: '$89.99', timeLeft: '5h 12m', status: 'scheduled', avatar: '👨' },
                { name: 'Lisa K.', email: 'lisa@email.com', value: '$203.25', timeLeft: '1h 33m', status: 'pending', avatar: '👩‍💼' },
                { name: 'Tom B.', email: 'tom@email.com', value: '$156.80', timeLeft: '8h 07m', status: 'sent', avatar: '👨‍💻' }
              ].map((customer, index) => (
                <div key={index} className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{customer.avatar}</span>
                    <div className="flex-1">
                      <div className="text-green-100 font-mono text-sm font-medium">{customer.name}</div>
                      <div className="text-green-400/60 font-mono text-xs">{customer.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-300 font-mono text-sm font-bold">{customer.value}</div>
                      <div className="text-green-300/80 font-mono text-xs">{customer.timeLeft}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      customer.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                      customer.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {customer.status}
                    </span>
                    <div className="flex gap-1">
                      <button className="w-6 h-6 bg-green-500/10 border border-green-500/20 rounded text-xs">📧</button>
                      <button className="w-6 h-6 bg-blue-500/10 border border-blue-500/20 rounded text-xs">⏰</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2: // Emails
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-100 font-mono font-bold text-lg">Email Templates</h3>
              <button className="text-green-400 font-mono text-xs">+ New</button>
            </div>
            
            {/* Email Preview */}
            <div className="bg-black/30 border border-green-500/20 rounded-lg p-4">
              <div className="text-green-300/70 font-mono text-xs mb-2">Subject: Don't forget your items + 15% OFF!</div>
              <div className="space-y-2 text-green-200/80 font-mono text-sm">
                <p>Hi Sarah,</p>
                <p>You left some great items in your cart worth $127.50.</p>
                <p>Complete your purchase in the next 24 hours and save 15% with code: <span className="text-cyan-400 font-bold">CART15</span></p>
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-center">
                  <span className="text-green-300 font-bold text-xs">Complete Purchase Now →</span>
                </div>
              </div>
            </div>

            {/* Email Stats */}
            <div className="space-y-2">
              <h4 className="text-green-200 font-mono text-sm font-semibold">Campaign Performance</h4>
              {[
                { metric: 'Open Rate', value: '24.5%', trend: '+2.1%' },
                { metric: 'Click Rate', value: '8.3%', trend: '+1.5%' },
                { metric: 'Conversion', value: '18.2%', trend: '+3.2%' }
              ].map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-500/5 rounded">
                  <span className="text-green-300 font-mono text-sm">{stat.metric}</span>
                  <div className="text-right">
                    <span className="text-green-100 font-mono text-sm font-bold">{stat.value}</span>
                    <span className="text-green-400 font-mono text-xs ml-2">{stat.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3: // Schedule
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-100 font-mono font-bold text-lg">Schedule</h3>
              <button className="text-purple-400 font-mono text-xs">+ Add Task</button>
            </div>
            
            <div className="space-y-3">
              {[
                { time: '2:30 PM', task: 'Send cart recovery emails', count: '8 emails', type: 'email' },
                { time: '6:00 PM', task: 'Follow-up reminders', count: '3 emails', type: 'email' },
                { time: '9:00 AM', task: 'Weekly analysis report', count: 'Tomorrow', type: 'report' },
                { time: '12:00 PM', task: 'Update discount codes', count: 'Daily', type: 'update' }
              ].map((schedule, index) => (
                <div key={index} className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-purple-300 font-mono text-sm font-bold">{schedule.time}</span>
                    </div>
                    <span className="text-purple-400/60 font-mono text-xs">{schedule.count}</span>
                  </div>
                  <div className="text-green-100 font-mono text-sm">{schedule.task}</div>
                </div>
              ))}
            </div>

            {/* Today's Progress */}
            <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 mt-4">
              <h4 className="text-green-200 font-mono text-sm font-semibold mb-2">Today's Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-green-300">Tasks Completed</span>
                  <span className="text-green-400 font-bold">6/8</span>
                </div>
                <div className="w-full bg-green-900/30 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // AI Chat
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
                <span className="text-cyan-400 text-sm">🤖</span>
              </div>
              <h3 className="text-green-100 font-mono font-bold text-lg">AI Assistant</h3>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[
                { type: 'ai', message: 'Found 12 abandoned carts. Should I send recovery emails?' },
                { type: 'user', message: 'Yes, but only to carts over $100' },
                { type: 'ai', message: 'Filtered to 8 high-value carts. Scheduling emails with 15% discount codes.' },
                { type: 'ai', message: 'Email campaign queued. Expected recovery: $890 (18% avg rate)' },
                { type: 'user', message: 'Perfect! Schedule the next batch for 6 PM' },
                { type: 'ai', message: '✅ Scheduled! I\'ll send 3 follow-up emails at 6 PM today.' }
              ].map((chat, index) => (
                <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-lg font-mono text-sm ${
                    chat.type === 'user' 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-100' 
                      : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
                  }`}>
                    {chat.message}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-4">
              <input 
                type="text" 
                placeholder="Ask AI anything..." 
                className="flex-1 bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2 text-green-100 font-mono text-sm focus:outline-none focus:border-green-500/40"
              />
              <button className="w-10 h-10 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg flex items-center justify-center transition-colors duration-200">
                <span className="text-cyan-400">→</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-500/10 via-green-600/5 to-green-700/10 border border-green-500/20 rounded-3xl backdrop-blur-sm shadow-2xl overflow-hidden" style={{ height: '700px', width: '350px' }}>
      {/* Mobile App Header */}
      <div className="bg-black/40 border-b border-green-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🛒</span>
            </div>
            <div>
              <h3 className="text-green-100 font-mono font-bold text-sm">Cart Recovery</h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-mono text-xs">Live</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
        {renderTabContent()}
      </div>

      {/* Bottom Tab Navigation */}
      <div className="bg-black/60 border-t border-green-500/20 px-2 py-2">
        <div className="flex justify-around">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                activeTab === index
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'hover:bg-green-500/10'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className={`font-mono text-xs transition-colors duration-200 ${
                activeTab === index ? tab.color : 'text-green-500'
              }`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-green-200 scroll-smooth">
      <Header />
      
      {/* Enhanced Hero Section */}
      <section id="home" className="scroll-mt-16">
        <EnhancedHeroSection />
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 px-4 relative overflow-hidden scroll-mt-16">
        <MatrixRain />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-100 mb-4 font-mono">
              Watch AI Build Your Business App
            </h2>
            <p className="text-xl text-green-300/80 max-w-3xl mx-auto font-mono">
              See how simple descriptions become working AI apps with memory and smart features - like Tony Stark's workshop
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Animated Code Block */}
            <div className="space-y-6">
              <AnimatedCodeBlock />
              <div className="text-center">
                <p className="text-green-300/70 font-mono text-sm">
                  Real-time agent building in action
                </p>
              </div>
            </div>

            {/* Right side - Process Visualization */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-green-500/10 via-green-600/5 to-green-700/10 border border-green-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-green-100 mb-6 font-mono text-center">
                  Agent Building Process
                </h3>
                <AgentBuildingProcess />
              </div>
              <LiveMetrics />
            </div>
          </div>
        </div>
      </section>

      {/* Created AI App Demo Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-950/10 to-black scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-100 mb-4 font-mono">
              This Is What Your AI App Looks Like
            </h2>
            <p className="text-xl text-green-300/80 max-w-4xl mx-auto font-mono">
              A real cart recovery system built from the prompt above - mobile-first design with intuitive tabs
            </p>
          </div>

          {/* Mobile App Demo Interface */}
          <div className="max-w-sm mx-auto">
            <MobileAppDemo />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-100 mb-4 font-mono">
              Build AI Apps That Actually Help Your Business
            </h2>
            <p className="text-xl text-green-300/80 max-w-3xl mx-auto font-mono">
              From simple requests to powerful AI apps with memory, scheduling, and data connections - your personal JARVIS awaits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <EnhancedFeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-4 bg-gradient-to-b from-black to-green-950/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-100 mb-4 font-mono">
              Turn Ideas Into Revenue Streams
            </h2>
            <p className="text-xl text-green-300/80 max-w-3xl mx-auto font-mono">
              Real businesses built with simple prompts - Iron Man-level automation for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <EnhancedUseCaseCard key={index} useCase={useCase} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Agent Marketplace & Licensing Section */}
      <section id="marketplace" className="py-20 px-4 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-100 mb-4 font-mono">
              License Your Agents & Earn Passive Income
            </h2>
            <p className="text-xl text-green-300/80 max-w-4xl mx-auto font-mono">
              Build once, earn forever. Turn your AI agents into recurring revenue streams by licensing them to thousands of users worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left side - How it works */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-green-500/10 via-green-600/5 to-green-700/10 border border-green-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-green-100 mb-6 font-mono">
                  How Agent Licensing Works
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-400 font-mono font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-green-100 mb-2">Build Your Agent</h4>
                      <p className="text-green-300/70 font-mono text-sm leading-relaxed">
                        Create any automation agent using natural language. From customer service bots to data analyzers.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-400 font-mono font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-green-100 mb-2">List in Marketplace</h4>
                      <p className="text-green-300/70 font-mono text-sm leading-relaxed">
                        Publish your agent to our marketplace with your own pricing and licensing terms.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-400 font-mono font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-green-100 mb-2">Earn Automatically</h4>
                      <p className="text-green-300/70 font-mono text-sm leading-relaxed">
                        Earn 70% of every purchase and usage fee. Get paid monthly via crypto or traditional payments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Flow Animation */}
              <div className="bg-black/50 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-mono font-bold text-green-100 mb-4 text-center">Revenue Flow Example</h4>
                <RevenueFlowAnimation />
              </div>
            </div>

            {/* Right side - Success Examples */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-green-100 mb-6 font-mono text-center">
                  Creator Success Stories
                </h3>
                <AgentLicensingExamples />
              </div>

              {/* Licensing Benefits */}
              <div className="bg-gradient-to-br from-blue-500/10 via-purple-600/5 to-green-700/10 border border-green-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <h4 className="font-mono font-bold text-green-100 mb-6">Why License Your Agents?</h4>
                <div className="space-y-4">
                  {[
                    { icon: DollarSign, text: 'Earn 70% of all revenue from your agents' },
                    { icon: Target, text: 'Reach thousands of potential customers globally' },
                    { icon: Clock, text: 'Generate passive income 24/7 without maintenance' },
                    { icon: TrendingUp, text: 'Build a portfolio of income-generating AI assets' }
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <benefit.icon className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="font-mono text-sm text-green-200">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA for Licensing */}
              <div className="text-center">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-700 text-white hover:from-blue-700 hover:to-purple-800 border border-blue-500/30 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 px-8 py-3 font-mono text-lg group">
                    <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
                    Start Licensing Agents
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-100 mb-4 font-mono">
              Proven Results
            </h2>
            <p className="text-xl text-green-300/80 max-w-2xl mx-auto font-mono">
              Join the growing community of successful automation builders
            </p>
          </div>
          <EnhancedStatsSection />
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="py-20 px-4 scroll-mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-green-600/10 via-green-500/5 to-green-700/10 border border-green-500/30 rounded-3xl p-12 backdrop-blur-sm relative overflow-hidden">
            {/* Simplified background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-cyan-500/5 to-green-500/5 opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center">
                  <Brain className="w-10 h-10 text-green-400" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-green-100 mb-6 font-mono">
                Ready to Build Your AI Empire?
              </h2>
              <p className="text-xl text-green-300/80 mb-8 font-mono max-w-2xl mx-auto">
                Join thousands of entrepreneurs using JARVIS-level AI agents to automate their businesses and create passive income streams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-green-600 to-green-700 text-black hover:from-green-700 hover:to-green-800 border border-green-500/30 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:shadow-xl transform hover:-translate-y-0.5 px-8 py-3 font-mono text-lg group">
                    <Play className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Start Building Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#">
                  <Button variant="outline" className="border-green-500/30 bg-black/50 text-green-300 hover:bg-green-500/10 hover:text-green-200 hover:border-green-500/50 backdrop-blur-sm px-8 py-3 font-mono text-lg group">
                    <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
                    View Examples
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-green-500/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
              <img src="/images/logo.png" alt="Rom Cards" className="w-8 h-8" />
            </div>
          </div>
          <p className="text-green-300/60 font-mono text-sm">
            © 2024 Rom Cards. Building the future of automated business systems.
          </p>
        </div>
      </footer>
    </div>
  );
}
