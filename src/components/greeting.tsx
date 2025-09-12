'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import { SidebarHistory, type ChatHistory } from './sidebar-history';
import { User } from 'next-auth';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/lib/utils';
import { getChatHistoryPaginationKey } from './sidebar-history';
import CharacterGenerate from './character/canva';

interface WelcomeMessage {
  id: string;
  text: string;
  delay: number;
}

interface UserProfile {
  assistantType?: string;
  job?: string;
  workChallenges?: string;
  contentNeeds?: string;
  automationDesires?: string;
  currentTools?: string;
}

interface GreetingProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
  user?: User;
}

export const Greeting = ({ chatId, append, selectedVisibilityType, user }: GreetingProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showMessages, setShowMessages] = useState<WelcomeMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'selection' | 'welcome' | 'questions' | 'examples'>('selection');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [userInput, setUserInput] = useState('');
  const [variablesList, setVariablesList] = useState<string[]>(['']);
  const [newVariable, setNewVariable] = useState('');
  const router = useRouter();

  // Fetch chat history for the selection phase
  const {
    data: paginatedChatHistories,
    isLoading: isLoadingChats,
  } = useSWRInfinite<ChatHistory>(
    user ? getChatHistoryPaginationKey : () => null,
    fetcher,
    {
      fallbackData: [],
    }
  );

  const welcomeMessages: WelcomeMessage[] = [
    {
      id: 'msg-1',
      text:  "I'm here to create a special digital companion - think of it as your personal Digimon - that will help with your daily life!",
      delay: 500,
    },
    {
      id: 'msg-2', 
      text: "✨ Just like how each Digimon has unique abilities, your digital companion will have powers tailored specifically to YOUR needs.",
      delay: 500,
    },
  ];

  interface Question {
    id: string;
    question: string;
    placeholder: string;
    key: keyof UserProfile;
    isVariablesList?: boolean;
  }

  const questions: Question[] = [
    {
      id: 'category',
      question: "What type of assistant do you want to create?",
      placeholder: "Content Creator, Price Monitor, Research Assistant, Social Media Manager, Document Tracker...",
      key: 'assistantType' as keyof UserProfile
    },
    {
      id: 'purpose',
      question: "What ongoing job should this assistant handle for you?",
      placeholder: "Monitor products for changes, make daily posts, generate content, track documents...",
      key: 'job' as keyof UserProfile
    },
    {
      id: 'instruction',
      question: "Tell me the instruction you'd give me — and list the items if there are more than one.",
      placeholder: "Write 3 posts about travel and food, or watch prices for ETH, SOL, and BTC...",
      key: 'workChallenges' as keyof UserProfile
    },
    {
      id: 'variables',
      question: "Which parts of that instruction should stay flexible?",
      placeholder: "Add variables like: number of posts, topic, coin, threshold, date/time...",
      key: 'contentNeeds' as keyof UserProfile,
      isVariablesList: true
    },
    {
      id: 'frequency',
      question: "Do you want me to: run once, keep watching continuously, or send updates on a schedule? And for how long?",
      placeholder: "Check every hour for 30 days, run once now, send daily updates for a week...",
      key: 'automationDesires' as keyof UserProfile
    }
  ];

  // Auto-display welcome messages
  useEffect(() => {
    if (currentPhase === 'welcome' && currentMessageIndex < welcomeMessages.length) {
      const currentMessage = welcomeMessages[currentMessageIndex];
      
      const timer = setTimeout(() => {
        setShowMessages(prev => [...prev, currentMessage]);
        setCurrentMessageIndex(prev => prev + 1);
      }, currentMessage.delay);

      return () => clearTimeout(timer);
    } else if (currentPhase === 'welcome' && currentMessageIndex === welcomeMessages.length) {
      // All welcome messages shown, move to questions
      const timer = setTimeout(() => {
        setCurrentPhase('questions');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, currentPhase]);

  // Reset welcome messages when entering welcome phase
  useEffect(() => {
    if (currentPhase === 'welcome') {
      setCurrentMessageIndex(0);
      setShowMessages([]);
    }
  }, [currentPhase]);

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentQuestion = questions[currentQuestionIndex];
    
    // Handle variables list differently
    if (currentQuestion.isVariablesList) {
      const validVariables = variablesList.filter(v => v.trim() !== '');
      if (validVariables.length === 0) return;
      
      setUserProfile(prev => ({
        ...prev,
        [currentQuestion.key]: validVariables.join(', ')
      }));
    } else {
      if (!userInput.trim()) return;
      setUserProfile(prev => ({
        ...prev,
        [currentQuestion.key]: userInput.trim()
      }));
    }

    setUserInput('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // Reset variables list for next question
      if (questions[currentQuestionIndex + 1]?.isVariablesList) {
        setVariablesList(['']);
      }
    } else {
      // All questions answered, create the companion
      createDigitalCompanion();
    }
  };

  const skipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // Reset variables list for next question
      if (questions[currentQuestionIndex + 1]?.isVariablesList) {
        setVariablesList(['']);
      }
    } else {
      createDigitalCompanion();
    }
  };

  const addVariable = () => {
    if (newVariable.trim()) {
      setVariablesList(prev => [...prev.filter(v => v.trim() !== ''), newVariable.trim(), '']);
      setNewVariable('');
    }
  };

  const removeVariable = (index: number) => {
    setVariablesList(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, value: string) => {
    setVariablesList(prev => prev.map((v, i) => i === index ? value : v));
  };

  const goBackQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const returnToSelection = () => {
    setCurrentPhase('selection');
    setCurrentQuestionIndex(0);
    setUserProfile({});
    setUserInput('');
  };

  const createDigitalCompanion = () => {
    // Build a comprehensive prompt from the user's answers
    const answers = Object.entries(userProfile).filter(([_, value]) => value && value.trim() !== '');
    
    if (answers.length > 0) {
      const companionPrompt = `I want to create a digital assistant/companion for my work and life. Here's information about me:

${userProfile.assistantType ? `🤖 Assistant type I want: ${userProfile.assistantType}` : ''}

${userProfile.job ? `📋 Ongoing job for the assistant: ${userProfile.job}` : ''}

${userProfile.workChallenges ? `📝 My specific instructions: ${userProfile.workChallenges}` : ''}

${userProfile.contentNeeds ? `⚙️ Variables to keep flexible: ${userProfile.contentNeeds}` : ''}

${userProfile.automationDesires ? `⏰ Frequency and duration: ${userProfile.automationDesires}` : ''}

Please create a personalized AI agent that can help me with these specific needs and integrate with my workflow. Make it like a digital companion that understands my unique situation and can assist me in practical ways.`;

      // Trigger the chat with this prompt
      triggerChatStart(companionPrompt);
    } else {
      // No answers provided, show examples instead
      setCurrentPhase('examples');
    }
  };

  const triggerChatStart = (message: string) => {
    // Update the URL to reflect the chat session
    window.history.replaceState({}, '', `/agents/my-agents/chat/${chatId}`);
    
    // Use the append function to start the chat
    append({
      role: 'user',
      content: message,
    });
  };

  const handleExampleClick = (example: any) => {
    triggerChatStart(example.action);
  };

  const examplePrompts = [
    {
      emoji: '👋',
      title: 'Marketing Manager Assistant',
      label: 'Social media, content creation, and campaign management',
      action: `I want to create a digital assistant/companion for my work and life. Here's information about me:

🏢 My job/role: Marketing Manager at a tech startup

⚡ My biggest work challenges: Creating consistent social media content across multiple platforms, managing campaign timelines, and tracking performance metrics manually

✍️ Content creation needs: I struggle with generating fresh content ideas, writing engaging captions, and maintaining brand voice consistency across LinkedIn, Twitter, and Instagram

🤖 Tasks I want to automate: Scheduling social media posts, generating content calendars, pulling performance reports from different platforms, and creating weekly marketing summaries

🛠️ Tools I currently use: Hootsuite for scheduling, Canva for graphics, Google Analytics, Slack for team communication, and Notion for content planning

Please create a personalized AI agent that can help me with these specific needs and integrate with my workflow. Make it like a digital companion that understands my unique situation and can assist me in practical ways.`,
    },
    {
      emoji: '💪',
      title: 'Fitness & Wellness Coach',
      label: 'Health tracking, workout planning, and wellness habits',
      action: `I want to create a digital assistant/companion for my work and life. Here's information about me:

🏢 My job/role: Software developer working remotely

⚡ My biggest work challenges: Sitting for long hours, irregular eating schedules, and forgetting to take breaks or exercise

✍️ Content creation needs: I want to document my fitness journey and share progress on social media to stay accountable

🤖 Tasks I want to automate: Tracking daily water intake, reminding me to take movement breaks, logging workouts, monitoring sleep patterns, and generating weekly health reports

🛠️ Tools I currently use: Apple Health for basic tracking, MyFitnessPal for nutrition, and a basic workout app

Please create a personalized AI agent that can help me with these specific needs and integrate with my workflow. Make it like a digital companion that understands my unique situation and can assist me in practical ways.`,
    },
    {
      emoji: '🎯',
      title: 'Content Creator & Influencer',
      label: 'Content planning, audience engagement, and brand partnerships',
      action: `I want to create a digital assistant/companion for my work and life. Here's information about me:

🏢 My job/role: Full-time content creator and lifestyle influencer

⚡ My biggest work challenges: Maintaining consistent posting schedules, managing brand partnership deadlines, and engaging with my audience across multiple platforms

✍️ Content creation needs: I need help brainstorming fresh content ideas, writing captions that drive engagement, and repurposing content across different platforms (Instagram, TikTok, YouTube)

🤖 Tasks I want to automate: Content calendar planning, hashtag research, performance analytics tracking, brand outreach follow-ups, and audience engagement monitoring

🛠️ Tools I currently use: Later for scheduling, Photoshop for editing, Google Sheets for tracking partnerships, and native platform analytics

Please create a personalized AI agent that can help me with these specific needs and integrate with my workflow. Make it like a digital companion that understands my unique situation and can assist me in practical ways.`,
    },
    {
      emoji: '🏠',
      title: 'Busy Parent & Household Manager',
      label: 'Family scheduling, household tasks, and personal organization',
      action: `I want to create a digital assistant/companion for my work and life. Here's information about me:

🏢 My job/role: Working parent managing both a part-time consulting business and household responsibilities

⚡ My biggest work challenges: Juggling client deadlines with family schedules, keeping track of kids' activities and appointments, and managing household budgets and tasks

✍️ Content creation needs: I want to document family memories and share parenting tips, but struggle to find time for consistent posting

🤖 Tasks I want to automate: Family calendar management, meal planning and grocery lists, tracking household expenses, scheduling maintenance tasks, and organizing kids' school and activity schedules

🛠️ Tools I currently use: Google Calendar for family scheduling, Mint for budgeting, a shared grocery list app, and basic photo storage

Please create a personalized AI agent that can help me with these specific needs and integrate with my workflow. Make it like a digital companion that understands my unique situation and can assist me in practical ways.`,
    },
  ];

  const startNewAgent = () => {
    setCurrentPhase('welcome');
  };

  const selectExistingChat = (chatId: string) => {
    router.push(`/agents/my-agents/chat/${chatId}`);
  };

  // Get all chats from paginated data
  const allChats = paginatedChatHistories?.flatMap(page => page.chats) || [];
  const hasChats = allChats.length > 0;

  // Selection Phase UI
  if (currentPhase === 'selection') {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
      

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
            Build Your AI Agent
            </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-600 dark:text-gray-400"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Your AI Digital Companion Builder
            </motion.p>
        </div>

        {/* Main Selection Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Create New Agent Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-green-950/20 rounded-3xl shadow-xl border border-purple-200 dark:border-purple-700 p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer"
            onClick={startNewAgent}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🚀</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Create New Agent
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Start fresh and create a personalized AI digital companion tailored to your specific needs and workflow.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                  <span className="text-lg">⚡</span>
                  <span>Build Your Digimon</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <CharacterGenerate showRandomCharacter={true} />
            </div>
          </motion.div>

          {/* Continue Existing Chat Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-3xl shadow-xl border border-green-200 dark:border-green-700 p-8"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                My Agents
              </h2>
              {!user ? (
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Sign in to access your conversation history and continue where you left off.
                </p>
              ) : hasChats ? (
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Build with your existing AI agents.
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  No agents found. Start by creating your first agent!
                </p>
              )}
            </div>

            {/* Chat History Section */}
            {user && hasChats && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-green-200 dark:border-green-700 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-green-200 dark:border-green-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Recent Conversations</h3>
                </div>
                <div className="p-4 space-y-3">
                  {allChats.slice(0, 5).map((chat) => (
                    <motion.div
                      key={chat.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      onClick={() => selectExistingChat(chat.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        {chat.avatar ? (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">🤖</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 dark:text-gray-400 text-xs">💭</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                            {chat.title}
                          </h4>
                          {chat.avatar && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                              🤖 {chat.avatar.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(chat.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {allChats.length > 5 && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => router.push('/agents/my-agents/chat')}
                        className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                      >
                        View all {allChats.length} conversations →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!user && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-green-200 dark:border-green-700 p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 dark:text-green-400 text-xl">🔐</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Sign in to access your chat history
                </p>
                <a
                  href="/login"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Sign In
                </a>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Not sure where to start? Try one of our popular agent types:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { emoji: '👋', label: 'Marketing Assistant', onClick: () => setCurrentPhase('examples') },
              { emoji: '💪', label: 'Wellness Coach', onClick: () => setCurrentPhase('examples') },
              { emoji: '🎯', label: 'Content Creator', onClick: () => setCurrentPhase('examples') },
              { emoji: '🏠', label: 'Household Manager', onClick: () => setCurrentPhase('examples') },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span>{action.emoji}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (currentPhase === 'welcome') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 via-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl">
                <img src="/images/logo.png" alt="ROM" className="w-8 h-8" />
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
            Digital Companion Creation Lab
          </motion.h1>
          
          <motion.p 
            className="text-base text-gray-600 dark:text-gray-400"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Creating your personalized AI Digimon ⚡
          </motion.p>
        </div>

        {/* Welcome Messages */}
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-green-950/20 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-700 overflow-hidden mb-8">
          <div className="p-6 space-y-4 min-h-[350px]">
            <AnimatePresence>
              {showMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-3 shadow-sm max-w-md border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs">🤖</span>
                      </div>
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">ROM</span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === 'questions') {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Back to Start Button */}
        <div className="mb-6">
          <button
            onClick={returnToSelection}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
          >
            ← Back to Start
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-blue-500 to-green-500 rounded-3xl flex items-center justify-center shadow-xl">
                <img src="/images/logo.png" alt="ROM" className="w-12 h-12" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg animate-pulse">
                ⚡
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
            Creating Your Digital Companion
          </h1>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <motion.div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Conversation Style Question */}
        <div className="space-y-6 mb-8">
          {/* Previous Q&A Pairs (in chronological order) */}
          {Object.entries(userProfile)
            .filter(([key, value]) => {
              if (!value || !value.trim()) return false;
              const questionIndex = questions.findIndex(q => q.key === key);
              return questionIndex !== -1 && questionIndex < currentQuestionIndex;
            })
            .sort(([keyA], [keyB]) => {
              const indexA = questions.findIndex(q => q.key === keyA);
              const indexB = questions.findIndex(q => q.key === keyB);
              return indexA - indexB;
            })
            .map(([key, value], index) => {
              const questionIndex = questions.findIndex(q => q.key === key);
              const question = questions[questionIndex];
              
              return (
                <div key={`qa-${key}`} className="space-y-3">
                  {/* Previous Question */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-3 shadow-sm max-w-md border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs">🤖</span>
                        </div>
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">ROM</span>
                      </div>
                      <p className="text-sm leading-relaxed">{question.question}</p>
                    </div>
                  </motion.div>
                  
                  {/* Previous Answer */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                    className="flex justify-end"
                  >
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl px-4 py-3 shadow-sm max-w-md">
                      <p className="text-sm leading-relaxed">{value}</p>
                    </div>
                  </motion.div>
                </div>
              );
            })}

          {/* Current ROM's Question Message */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-3 shadow-sm max-w-md border border-purple-200 dark:border-purple-700">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs">🤖</span>
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">ROM</span>
              </div>
              <p className="text-sm leading-relaxed">{currentQuestion.question}</p>
            </div>
          </motion.div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnswerSubmit} className="space-y-6">
          <div className="flex justify-end">
            <div className="w-full max-w-md">
              {currentQuestion.isVariablesList ? (
                /* Variables List Input */
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Add the flexible parts of your instruction (one at a time):
                  </p>
                  
                  {/* Existing Variables */}
                  {variablesList.filter(v => v.trim() !== '').map((variable, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={variable}
                        onChange={(e) => updateVariable(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-sm"
                        placeholder="e.g., number of posts"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariable(index)}
                        className="px-2 py-2 text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {/* Add New Variable */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      placeholder="Add another variable..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                    />
                    <button
                      type="button"
                      onClick={addVariable}
                      disabled={!newVariable.trim()}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                /* Regular Text Input */
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  autoFocus
                />
              )}
              
              <div className="flex gap-3 mt-3">
                <button
                  type="submit"
                  disabled={currentQuestion.isVariablesList ? 
                    variablesList.filter(v => v.trim() !== '').length === 0 : 
                    !userInput.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Create My Companion! 🎉' : 'Send →'}
                </button>
                
                <button
                  type="button"
                  onClick={skipQuestion}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Navigation Options */}
        {currentQuestionIndex > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={goBackQuestion}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
            >
              ← Previous Question
            </button>
          </div>
        )}

        {/* Option to use examples instead */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Don't want to answer questions? No problem!
          </p>
          <button
            onClick={() => setCurrentPhase('examples')}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Choose from Examples Instead
          </button>
        </div>
      </div>
    );
  }

  if (currentPhase === 'examples') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-blue-500 to-green-500 rounded-3xl flex items-center justify-center shadow-xl">
              <img src="/images/logo.png" alt="ROM" className="w-12 h-12" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
            Choose Your Companion Type
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Pick an example that matches your needs, and we'll customize it for you!
          </p>
        </div>

        {/* Example Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examplePrompts.map((example, index) => (
            <motion.div
              key={example.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleExampleClick(example)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-xl flex items-center justify-center text-2xl">
                  {example.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">{example.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{example.label}</p>
                </div>
              </div>
              
              <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium">
                Create This Companion Type
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setCurrentPhase('questions')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back to Questions
          </button>
        </div>
      </div>
    );
  }

  return null;
};
