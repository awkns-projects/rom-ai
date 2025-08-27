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
  Database
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
  { href: '#how-it-works', label: 'How it Works' },
  { href: '#showcase', label: 'Showcase' },
  { href: '#pricing', label: 'Pricing' }
];

// Sophisticated multi-layer wave animation
function WaveAnimation() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Custom shader material for advanced visual effects
  const vertexShader = `
    uniform float uTime;
    uniform float uWaveStrength;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    float noise(vec3 p) {
      return sin(p.x * 1.2) * sin(p.y * 1.5) * sin(p.z * 0.8);
    }
    
    void main() {
      vUv = uv;
      vPosition = position;
      
             // Enhanced wave calculation with more dramatic movement
       float wave1 = sin(position.x * 0.2 + uTime * 2.0) * 0.25;
       float wave2 = sin(position.y * 0.15 + uTime * 1.5) * 0.20;
       float wave3 = sin((position.x + position.y) * 0.1 + uTime * 2.5) * 0.15;
       float wave4 = sin(position.x * 0.5 - uTime * 3.0) * 0.12;
       float wave5 = sin(position.y * 0.4 + uTime * 2.8) * 0.10;
      
             // Add enhanced noise for more organic movement
       float noiseValue = noise(position + uTime * 0.3) * 0.08;
      
      vec3 newPosition = position;
      newPosition.z = (wave1 + wave2 + wave3 + wave4 + wave5 + noiseValue) * uWaveStrength;
      
      vPosition = newPosition;
      vNormal = normal;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      // Dynamic color mixing based on position and time
      float colorMix1 = sin(vPosition.x * 0.1 + uTime * 0.5) * 0.5 + 0.5;
      float colorMix2 = sin(vPosition.y * 0.1 + uTime * 0.3) * 0.5 + 0.5;
      float colorMix3 = sin(vPosition.z * 2.0 + uTime * 0.8) * 0.5 + 0.5;
      
      vec3 color = mix(uColor1, uColor2, colorMix1);
      color = mix(color, uColor3, colorMix2);
      
      // Add glow effect based on wave height
      float glow = abs(vPosition.z) * 3.0;
      color += vec3(glow * 0.2, glow * 0.4, glow * 0.1);
      
      // Fade edges for seamless blending
      float edgeFade = 1.0 - smoothstep(0.7, 1.0, length(vUv - 0.5) * 2.0);
      
      gl_FragColor = vec4(color, 0.15 * edgeFade);
    }
  `;
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveStrength: { value: 2.5 },
    uColor1: { value: new THREE.Color('#00ff88') },
    uColor2: { value: new THREE.Color('#00aaff') },
    uColor3: { value: new THREE.Color('#aa00ff') }
  }), []);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1.5, -2]}>
      <planeGeometry args={[35, 35, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
}



// Advanced 3D Wave Background with enhanced movement
function Wave3D() {
  return (
    <div className="absolute inset-0 opacity-60">
      <Canvas camera={{ position: [0, 3, 8], fov: 75 }}>
        <Suspense fallback={null}>
          {/* Main wave surface */}
          <WaveAnimation />
          
          {/* Secondary wave layer with different parameters */}
          <mesh rotation={[-Math.PI / 2.2, 0, Math.PI / 4]} position={[0, -2, -3]} scale={[0.8, 0.8, 0.8]}>
            <planeGeometry args={[30, 30, 96, 96]} />
            <meshBasicMaterial 
              color="#0066ff" 
              wireframe 
              opacity={0.15} 
              transparent 
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Advanced lighting setup */}
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1.0} color="#00ff88" />
          <pointLight position={[-10, -10, 5]} intensity={0.8} color="#0088ff" />
          <pointLight position={[0, 15, -5]} intensity={0.6} color="#8800ff" />
          
          {/* Fog for depth */}
          <fog attach="fog" args={['#000000', 5, 20]} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Simple floating particles
function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    speed: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const newParticles = Array.from({length: 8}, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.1 + Math.random() * 0.2,
      opacity: Math.random() * 0.4 + 0.2
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
          ...particle,
        y: particle.y > 100 ? -5 : particle.y + particle.speed,
        opacity: 0.2 + Math.sin(Date.now() * 0.001 + particle.id) * 0.2
      })));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-green-400 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            boxShadow: '0 0 10px #00ff88',
          }}
        />
      ))}
    </div>
  );
}

// Smooth typewriter effect
function TypewriterText() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const words = [
    'Your childhood digital pet, evolved.',
    'Now they remember everything.',
    'Now they help with real life.',
    'Your AI companion awaits.'
  ];

  useEffect(() => {
    const current = loopNum % words.length;
    const fullText = words[current];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (text.length < fullText.length) {
          setText(fullText.substring(0, text.length + 1));
          setTypingSpeed(80 + Math.random() * 40); // Vary speed slightly for realism
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        // Deleting
        if (text.length > 0) {
          setText(text.substring(0, text.length - 1));
          setTypingSpeed(30 + Math.random() * 20); // Faster deletion
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
          setTypingSpeed(100);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, words]);

  return (
    <div className="text-lg sm:text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-green-400 font-medium min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-center text-center leading-tight">
      {text}
      <span className="ml-1 text-emerald-400 animate-pulse">|</span>
    </div>
  );
}

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
      <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-green-500/20 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <Image 
                src="/images/logo.png" 
                alt="Rom Cards Logo" 
                width={40} 
                height={40}
                className="object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-bold text-white">
                Rom Cards
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-green-300 hover:text-white font-medium transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <Link href="/chat" className="hidden md:block">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                <Play className="w-4 h-4 mr-2" />
                Get Started
                </Button>
              </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-green-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/90"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-green-500/20">
            <nav className="flex flex-col py-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="px-6 py-4 text-green-300 hover:text-white text-left"
                >
                  {link.label}
                </button>
              ))}
              <div className="px-6 pt-4">
                <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Get Started
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

// Clean hero section focused on the core message
function HeroSection() {
  return (
    <section id="home" className="min-h-screen pt-20 pb-16 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-gray-950 to-black">
      <Wave3D />
      <FloatingParticles />
      
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        
        <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-xl border border-emerald-400/20 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 shadow-xl shadow-emerald-500/10">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
          <span className="text-emerald-300 text-xs sm:text-sm font-medium tracking-wide">AI Digital Companions</span>
        </div>
            
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight px-2">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 font-extrabold">
            Rom Cards
          </span>
        </h1>

        <div className="mb-6 sm:mb-8 min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center px-4">
          <TypewriterText />
        </div>
            
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto leading-relaxed font-light px-4">
          Remember those digital pets? They're back—but now they're intelligent AI companions that actually help run your life.
        </p>

        {/* Character Showcase - Centered */}
        <div className="mb-8 sm:mb-12 px-4">
          <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-cyan-400/20 to-purple-400/20 rounded-3xl border-2 border-emerald-400/30 shadow-2xl"></div>
            <div className="absolute inset-3 sm:inset-4 bg-black/60 backdrop-blur-sm rounded-2xl border border-purple-400/20 flex items-center justify-center overflow-hidden">
              <CharacterGenerate showRandomCharacter={true} />
            </div>
            
            {/* Floating abilities with animations - responsive positioning */}
            <div className="absolute -top-3 -left-6 sm:-top-4 sm:-left-8 bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/30 rounded-xl p-2 sm:p-4 text-emerald-100 text-xs sm:text-sm animate-float shadow-lg">
              📊 Analyzes data
            </div>
            <div className="absolute top-12 -right-8 sm:top-16 sm:-right-12 bg-cyan-500/20 backdrop-blur-xl border border-cyan-400/30 rounded-xl p-2 sm:p-4 text-cyan-100 text-xs sm:text-sm animate-float shadow-lg" style={{ animationDelay: '1s' }}>
              🤖 Makes decisions
            </div>
            <div className="absolute -bottom-6 -left-3 sm:-bottom-8 sm:-left-4 bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 rounded-xl p-2 sm:p-4 text-purple-100 text-xs sm:text-sm animate-float shadow-lg" style={{ animationDelay: '2s' }}>
              💡 Learns patterns
            </div>
            <div className="absolute bottom-6 -right-6 sm:bottom-8 sm:-right-8 bg-pink-500/20 backdrop-blur-xl border border-pink-400/30 rounded-xl p-2 sm:p-4 text-pink-100 text-xs sm:text-sm animate-float shadow-lg" style={{ animationDelay: '1.5s' }}>
              ⚡ Evolves daily
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-6 sm:mb-8 px-4">
          <Link href="/chat">
            <Button className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl rounded-2xl shadow-2xl shadow-emerald-500/25 transform hover:scale-105 hover:shadow-emerald-500/40 transition-all duration-300 border border-emerald-500/30 w-full sm:w-auto">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
              Create Your Rom Card
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button variant="outline" className="border-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400/50 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl rounded-2xl backdrop-blur-sm transition-all duration-300 w-full sm:w-auto">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            Watch Demo
          </Button>
        </div>

                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-gray-400 text-sm font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Free to start</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>30 seconds setup</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>No coding required</span>
          </div>
        </div>
                    </div>
    </section>
  );
}


// How it Works - 3 simple steps
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Create Your Character",
      description: "Choose your companion's appearance, personality, and initial skills. Give them a name and backstory.",
      icon: "🎨",
      color: "emerald"
    },
    {
      number: "02", 
      title: "Train & Configure",
      description: "Set up your data models, automation rules, and workflows. Your Rom Card learns your preferences.",
      icon: "🧠",
      color: "blue"
    },
    {
      number: "03",
      title: "Watch Them Work",
      description: "Your companion handles tasks, sends updates, and grows smarter every day. You focus on what matters.",
      icon: "🚀",
      color: "purple"
    }
  ];

  return (
    <section id="how-it-works" className="py-32 px-8 bg-gradient-to-b from-slate-950 via-gray-950 to-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-400/20 rounded-full px-6 py-3 mb-8 shadow-2xl shadow-blue-500/10">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium tracking-wide">SIMPLE 3-STEP PROCESS</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            How It
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 font-extrabold">
              Works
            </span>
          </h2>
          
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
            Getting started with your Rom Card is surprisingly simple. No technical skills required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="group relative">
              <div className="bg-gradient-to-br from-slate-900/60 via-gray-900/70 to-slate-950/80 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-8 hover:border-slate-600/50 transition-all duration-700 shadow-2xl">
                
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-${step.color}-600 to-${step.color}-700 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  
                  <div className={`text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-${step.color}-400 to-${step.color}-600 mb-4`}>
                    {step.number}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 text-center tracking-tight">
                  {step.title}
                </h3>
                
                <p className="text-gray-400 leading-relaxed text-center font-light">
                  {step.description}
                </p>
              </div>

              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-slate-600 to-transparent transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Demo CTA */}
        <div className="text-center mt-20">
          <Link href="#showcase">
            <Button variant="outline" className="border-2 border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/50 px-8 py-4 text-lg rounded-2xl backdrop-blur-sm transition-all duration-300">
              <Play className="w-5 h-5 mr-2" />
              See It In Action
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Interactive Demo Section
function DemoSection() {
  const [demoTheme, setDemoTheme] = useState("green");
  
  // Sample agent data for the demo
  const demoAgentData = {
    name: "Luna",
    description: "Your intelligent life coach companion",
    theme: demoTheme,
    domain: "life-coaching",
    createdAt: new Date().toISOString(),
    avatar: {
      type: "default",
      emoji: "🌙"
    },
    models: [
      {
        id: "tasks",
        name: "Daily Tasks",
        emoji: "✅",
        fields: [
          { name: "task", type: "text", description: "Task description" },
          { name: "priority", type: "text", description: "Task priority" },
          { name: "completed", type: "boolean", description: "Completion status" }
        ],
        records: [
          {
            id: "1",
            data: { task: "Morning workout", priority: "High", completed: true },
            createdAt: new Date().toISOString()
          },
          {
            id: "2", 
            data: { task: "Call dentist", priority: "Medium", completed: false },
            createdAt: new Date().toISOString()
          }
        ],
        hasPublishedField: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "goals",
        name: "Life Goals",
        emoji: "🎯",
        fields: [
          { name: "goal", type: "text", description: "Goal description" },
          { name: "deadline", type: "date", description: "Target date" }
        ],
        records: [
          {
            id: "1",
            data: { goal: "Learn Spanish", deadline: "2024-12-31" },
            createdAt: new Date().toISOString()
          }
        ],
        hasPublishedField: true,
        createdAt: new Date().toISOString()
      }
    ],
    actions: [
      {
        id: "schedule-reminder",
        name: "Schedule Reminder",
        results: { actionType: "Notification" }
      },
      {
        id: "daily-check",
        name: "Daily Check-in",
        results: { actionType: "Survey" }
      }
    ],
    schedules: [
      {
        id: "morning-routine",
        name: "Morning Routine Check",
        description: "Daily morning wellness check-in",
        interval: { active: true, pattern: "Daily 8:00 AM" }
      },
      {
        id: "weekly-review",
        name: "Weekly Goal Review",
        description: "Review progress on life goals",
        interval: { active: true, pattern: "Weekly Sunday" }
    }
    ]
  };

  return (
    <section className="py-32 px-8 bg-gradient-to-b from-slate-950 via-gray-950 to-black relative overflow-hidden">
      {/* Premium background decoration */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-8xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-400/20 rounded-full px-6 py-3 mb-8 shadow-2xl shadow-blue-500/10">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium tracking-wide">LIVE INTERACTIVE PREVIEW</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            Experience
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 font-extrabold">
              Excellence
            </span>
          </h2>
          
          <p className="text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed font-light">
            Interact with a fully functional AI companion interface. See the premium features in action.
          </p>
      </div>

        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <Suspense fallback={
              <div className="w-full h-[36rem] bg-gradient-to-br from-slate-900/60 to-gray-900/80 rounded-3xl border border-slate-700/30 flex items-center justify-center backdrop-blur-xl shadow-2xl">
                <div className="text-blue-400 animate-pulse font-medium">Loading Interactive Demo...</div>
      </div>
            }>
              <div className="relative">
                <MobileAppDemoWrapper 
                  agentData={demoAgentData as any}
                  onThemeChange={(newTheme: string) => {
                    console.log('🎨 Demo theme changed to:', newTheme);
                    setDemoTheme(newTheme);
                  }} 
                  onDataChange={(updatedData: any) => {
                    console.log('📊 Demo data changed:', updatedData);
                  }}
                />
                {/* Premium glow effect around demo */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10"></div>
        </div>
            </Suspense>
          </div>
        </div>

        {/* Demo Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Interaction</h3>
            <p className="text-gray-400 font-light">Chat with AI, browse data models, and explore all features</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Data Management</h3>
            <p className="text-gray-400 font-light">Create, edit, and manage records in real-time</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Theme Customization</h3>
            <p className="text-gray-400 font-light">Switch between premium color schemes instantly</p>
          </div>
      </div>
    </div>
    </section>
  );
}



// Showcase section - Demo + Success Stories
function ShowcaseSection() {
  const [demoTheme, setDemoTheme] = useState("green");
  
  // Demo agent data for the interactive preview
  const demoAgentData = {
    name: "Luna",
    description: "Your intelligent life coach companion",
    theme: demoTheme,
    domain: "life-coaching",
    createdAt: new Date().toISOString(),
    avatar: {
      type: "default",
      emoji: "🌙"
    },
    models: [
      {
        id: "tasks",
        name: "Daily Tasks",
        emoji: "✅",
        fields: [
          { name: "task", type: "text", description: "Task description" },
          { name: "priority", type: "text", description: "Task priority" },
          { name: "completed", type: "boolean", description: "Completion status" }
        ],
        records: [
          {
            id: "1",
            data: { task: "Morning workout", priority: "High", completed: true },
            createdAt: new Date().toISOString()
          },
          {
            id: "2", 
            data: { task: "Call dentist", priority: "Medium", completed: false },
            createdAt: new Date().toISOString()
          }
        ],
        hasPublishedField: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "goals",
        name: "Life Goals",
        emoji: "🎯",
        fields: [
          { name: "goal", type: "text", description: "Goal description" },
          { name: "deadline", type: "date", description: "Target date" }
        ],
        records: [
          {
            id: "1",
            data: { goal: "Learn Spanish", deadline: "2024-12-31" },
            createdAt: new Date().toISOString()
          }
        ],
        hasPublishedField: true,
        createdAt: new Date().toISOString()
      }
    ],
    actions: [
      {
        id: "schedule-reminder",
        name: "Schedule Reminder",
        results: { actionType: "Notification" }
      },
      {
        id: "daily-check",
        name: "Daily Check-in",
        results: { actionType: "Survey" }
      }
    ],
    schedules: [
      {
        id: "morning-routine",
        name: "Morning Routine Check",
        description: "Daily morning wellness check-in",
        interval: { active: true, pattern: "Daily 8:00 AM" }
      },
      {
        id: "weekly-review",
        name: "Weekly Goal Review",
        description: "Review progress on life goals",
        interval: { active: true, pattern: "Weekly Sunday" }
      }
    ]
  };

  const companions = [
    {
      name: "Aurelia",
      type: "Executive Assistant",
      description: "Enterprise-grade scheduling, meeting optimization, and strategic planning intelligence",
      earnings: "$12,500/month",
      gradient: "from-purple-600 to-violet-600",
      accentColor: "purple"
    },
    {
      name: "Zenith", 
      type: "Innovation Strategist",
      description: "Advanced market research, competitive analysis, and creative ideation workflows",
      earnings: "$18,900/month",
      gradient: "from-blue-600 to-cyan-600",
      accentColor: "blue"
    },
    {
      name: "Synapse",
      type: "Data Intelligence", 
      description: "Complex data analysis, predictive modeling, and automated insight generation",
      earnings: "$24,750/month",
      gradient: "from-emerald-600 to-green-600",
      accentColor: "emerald"
    }
  ];

  return (
    <section id="showcase" className="py-32 px-8 bg-gradient-to-b from-black via-slate-950 to-gray-950 relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-8xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-purple-500/10 backdrop-blur-xl border border-emerald-400/20 rounded-full px-6 py-3 mb-8 shadow-2xl shadow-emerald-500/10">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium tracking-wide">LIVE DEMO & SUCCESS STORIES</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            See Them
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 font-extrabold">
              In Action
            </span>
            </h2>
          
          <p className="text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed font-light">
            Try the interactive demo and meet creators building successful AI companions.
            </p>
          </div>

        {/* Interactive Demo Section */}
        <div className="text-center mb-32">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-400/20 rounded-full px-6 py-3 mb-8 shadow-xl shadow-blue-500/10">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium tracking-wide">INTERACTIVE DEMO</span>
          </div>
          
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Try It <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Live</span>
          </h3>
          
          <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
            This is a fully functional Rom Card. Click around, explore features, and see how it works.
          </p>

          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <Suspense fallback={
                <div className="w-full h-[36rem] bg-gradient-to-br from-slate-900/60 to-gray-900/80 rounded-3xl border border-slate-700/30 flex items-center justify-center backdrop-blur-xl shadow-2xl">
                  <div className="text-blue-400 animate-pulse font-medium">Loading Interactive Demo...</div>
                </div>
              }>
                <div className="relative">
                  <MobileAppDemoWrapper 
                    agentData={demoAgentData as any}
                    onThemeChange={(newTheme: string) => {
                      console.log('🎨 Theme changed to:', newTheme);
                      setDemoTheme(newTheme);
                    }} 
                    onDataChange={(updatedData: any) => {
                      console.log('📊 Data changed:', updatedData);
                    }}
                  />
                  {/* Premium glow effect around demo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10"></div>
                </div>
              </Suspense>
            </div>
          </div>

          {/* Demo Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Real-Time Chat</h4>
              <p className="text-gray-400 font-light text-sm">Chat with AI and explore all features</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Live Data</h4>
              <p className="text-gray-400 font-light text-sm">Create and manage records in real-time</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Themes</h4>
              <p className="text-gray-400 font-light text-sm">Switch color schemes instantly</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          {companions.map((companion, index) => (
            <div key={index} className="group relative bg-gradient-to-br from-slate-900/60 via-gray-900/70 to-slate-950/80 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-10 hover:border-slate-600/50 transition-all duration-700 hover:transform hover:-translate-y-4 shadow-2xl hover:shadow-3xl">
              {/* Premium glow effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${companion.gradient} rounded-3xl blur-2xl transition-opacity duration-700`}></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className={`w-24 h-24 bg-gradient-to-br ${companion.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-${companion.accentColor}-500/25`}>
                    <CharacterGenerate showRandomCharacter={true} />
                  </div>
                </div>

                <h3 className="text-3xl font-bold text-white mb-3 text-center tracking-tight group-hover:text-emerald-300 transition-colors duration-300 relative -mt-4 z-20" style={{
                  textShadow: '0 0 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)',
                  backdropFilter: 'blur(2px)'
                }}>
                {companion.name}
                </h3>
                
                <div className="text-center mb-6">
                  <span className={`inline-block px-4 py-2 bg-gradient-to-r ${companion.gradient} text-white text-sm font-semibold rounded-full shadow-lg relative z-20`}>
                    {companion.type}
                  </span>
                </div>
                
                <p className="text-gray-400 text-center mb-8 leading-relaxed font-light group-hover:text-gray-300 transition-colors duration-300 relative z-20 drop-shadow-sm">
                  {companion.description}
                </p>
              
                <div className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700/30">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                    <span className="text-3xl font-bold text-emerald-400">{companion.earnings}</span>
                  </div>
                  <p className="text-gray-500 text-sm font-medium tracking-wide">MONTHLY REVENUE</p>
                </div>
              </div>

              {/* Premium corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                <div className={`w-full h-full bg-gradient-to-br ${companion.gradient} transform rotate-45 translate-x-12 -translate-y-12 rounded-2xl`}></div>
              </div>
            </div>
          ))}
          </div>

        {/* Premium Stats Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-900/60 via-gray-900/70 to-slate-950/80 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-12 inline-block shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 mb-3">15,200+</div>
                <div className="text-gray-400 font-medium tracking-wide">Enterprise Companions</div>
          </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3">$2.1M+</div>
                <div className="text-gray-400 font-medium tracking-wide">Creator Revenue</div>
          </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">99.9%</div>
                <div className="text-gray-400 font-medium tracking-wide">Enterprise Uptime</div>
        </div>
          </div>
          </div>
          </div>
        </div>
      </section>
  );
}

// Simple pricing section
function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-8 bg-gradient-to-b from-gray-950 via-slate-950 to-black relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 backdrop-blur-xl border border-emerald-400/20 rounded-full px-6 py-3 mb-8 shadow-xl shadow-emerald-500/10">
            <Gift className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium tracking-wide">SIMPLE PRICING</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            Start
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 font-extrabold">
              Free
            </span>
          </h2>
          
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
            Create your first Rom Card for free. Upgrade as you grow.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-br from-slate-900/60 via-gray-900/70 to-slate-950/80 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 mb-4">
                Free
              </div>
              <p className="text-gray-400">Get started today</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300">1 Rom Card</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300">Basic automation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300">Community support</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300">No credit card required</span>
              </div>
            </div>

            <Link href="/chat">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-4 text-lg rounded-2xl shadow-xl shadow-emerald-500/25 transition-all duration-300">
                Start Free
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400">
            Need more? <span className="text-emerald-400">Paid plans start at $9/month</span> with unlimited Rom Cards and advanced features.
          </p>
        </div>
      </div>
    </section>
  );
}

// Premium create section
function CreateSection() {
  return (
    <section id="create" className="py-32 px-8 bg-gradient-to-b from-gray-950 via-slate-950 to-black relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="bg-gradient-to-br from-slate-900/60 via-gray-900/70 to-slate-950/80 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-16 relative overflow-hidden shadow-2xl">
          {/* Premium overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-xl border border-emerald-400/20 rounded-full px-6 py-3 mb-12 shadow-xl shadow-emerald-500/10">
              <Lightbulb className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium tracking-wide">Ready to Transform</span>
            </div>

            <div className="flex justify-center mb-12">
              <div className="relative">
                <Image 
                  src="/images/logo.png" 
                  alt="Rom Cards Logo" 
                  width={80} 
                  height={80}
                  className="object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          </div>
        </div>
            
            <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Ready to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 font-extrabold">
                Elevate?
              </span>
            </h2>
            
            <p className="text-2xl text-gray-300 mb-12 leading-relaxed font-light max-w-4xl mx-auto">
              Remember that excitement when you first discovered something truly revolutionary?<br />
              That moment when everything changed?<br />
              <span className="text-white font-medium">Your transformation begins now.</span>
            </p>
            
            <div className="mb-12 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-emerald-500/20 via-blue-500/15 to-purple-500/20 border border-emerald-400/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="relative">
                <CharacterGenerate showRandomCharacter={true} />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 rounded-2xl blur-xl"></div>
                </div>
                <p className="text-emerald-300 font-medium mt-6 tracking-wide">Your elite companion awaits</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Link href="/register">
                <Button className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-2xl px-16 py-8 rounded-2xl shadow-2xl shadow-emerald-500/25 transform hover:scale-105 hover:shadow-emerald-500/40 transition-all duration-300 border border-emerald-500/30">
                  <Play className="w-7 h-7 mr-4 group-hover:scale-110 transition-transform" />
                  Begin Transformation
                  <ArrowRight className="w-7 h-7 ml-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Enterprise-ready</span>
          </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>Instant deployment</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Bank-level security</span>
              </div>
            </div>
          </div>

          {/* Premium corner accents */}
          <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-500 transform -rotate-45 -translate-x-16 -translate-y-16 rounded-2xl"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 transform rotate-45 translate-x-16 translate-y-16 rounded-2xl"></div>
          </div>
        </div>
        </div>
      </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <PricingSection />
      <CreateSection />
      
      <footer className="py-20 px-8 border-t border-slate-800/50 bg-gradient-to-b from-black to-slate-950">
        <div className="max-w-8xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Image 
                src="/images/logo.png" 
                alt="Rom Cards Logo" 
                width={48} 
                height={48}
                className="object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-lg animate-pulse"></div>
                </div>
              </div>
          
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Rom Cards</h3>
            <p className="text-gray-400 font-light max-w-2xl mx-auto">
              Transforming digital companionship through enterprise-grade AI intelligence
            </p>
          </div>

          <div className="flex items-center justify-center gap-8 mb-8 text-gray-500 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Global Scale</span>
            </div>
          </div>
          
          <div className="border-t border-slate-800/50 pt-8">
            <p className="text-gray-500 font-light">
              © 2025 Rom Cards • Redefining the future of AI companionship
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
