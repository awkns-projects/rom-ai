'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CharacterGenerate from '../../../components/character/canva'
import {
  useSeasons,
  useMissions,
  useMission,
  useMissionMutations,
  useLeaderboard,
  useNotifications,
  useUserProfile
} from '@/hooks/useTournament'

// Types from our hooks
import type { Season, Mission, Solution, UserProfile } from '@/hooks/useTournament'

export default function TournamentPageConnected() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Use the actual user ID from session instead of hardcoded one
  const currentUserId = session?.user?.id || '550e8400-e29b-41d4-a716-446655440001'
  
  // State - ALL hooks must be called at the top level before any conditional returns
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSubmitForm, setShowSubmitForm] = useState<boolean>(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [showSolutionForm, setShowSolutionForm] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'points' | 'votes'>('newest')
  const [showNotifications, setShowNotifications] = useState<boolean>(false)
  const [showAchievements, setShowAchievements] = useState<boolean>(false)
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false)
  const [showSeasonInfo, setShowSeasonInfo] = useState<boolean>(false)
  const [animatingPoints, setAnimatingPoints] = useState<boolean>(false)
  const [showQuickTemplates, setShowQuickTemplates] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [selectedFormDifficulty, setSelectedFormDifficulty] = useState<string>('medium')
  const [missionView, setMissionView] = useState<'public' | 'mine'>('public')
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [solutionCharacters, setSolutionCharacters] = useState<{ [key: string]: number }>({})
  const [submitSolutionCharacter, setSubmitSolutionCharacter] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State for file uploads
  const [missionFiles, setMissionFiles] = useState<File[]>([])
  const [solutionFiles, setSolutionFiles] = useState<File[]>([])
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)

  // API Hooks - These must be called at the top level, before any conditional returns
  const { seasons, loading: seasonsLoading } = useSeasons()
  const { createMission, submitSolution, vote, loading: mutationLoading } = useMissionMutations()
  const { profile: currentUser, loading: profileLoading } = useUserProfile(currentUserId)

  // Memoize filters to prevent infinite re-renders
  const missionFilters = useMemo(() => {
    if (!selectedSeason) return undefined;

    return {
      seasonId: selectedSeason,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
      authorId: missionView === 'mine' ? currentUser?.userId : undefined,
      sortBy,
      limit: 50
    };
  }, [selectedSeason, selectedCategory, selectedDifficulty, missionView, currentUser?.userId, sortBy]);

  // Fetch missions with current filters
  const {
    missions,
    loading: missionsLoading,
    refetch: refetchMissions
  } = useMissions(missionFilters)

  // Fetch leaderboard for current season
  const { leaderboard } = useLeaderboard(selectedSeason || '', 10)

  // Fetch notifications for current user
  const { notifications } = useNotifications(currentUserId)

  // Handle authentication
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      router.push('/login?callbackUrl=%2Ftournaments')
      return
    }
  }, [session, status, router])

  // Initialize selected season when seasons load
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0].id)
    }
  }, [seasons, selectedSeason])

  // Update selectedMission when missions array changes (after solution submission)
  useEffect(() => {
    if (selectedMission && missions) {
      const updatedMission = missions.find(m => m.id === selectedMission.id)
      if (updatedMission && updatedMission.solutions?.length !== selectedMission.solutions?.length) {
        // Only update if the solutions count has changed
        setSelectedMission(updatedMission)
      }
    }
  }, [missions, selectedMission])

  // Prevent body scroll when modals are open
  useEffect(() => {
    const hasModal = showSubmitForm || selectedMission || showSolutionForm || showAchievements || showQuickTemplates || showLeaderboard || showSeasonInfo
    if (hasModal) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    return () => document.body.classList.remove('modal-open')
  }, [showSubmitForm, selectedMission, showSolutionForm, showAchievements, showQuickTemplates, showLeaderboard, showSeasonInfo])

  // Get current season
  const currentSeason = seasons.find(s => s.id === selectedSeason) || seasons[0]

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading...</div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (!session) {
    return null
  }

  // Show loading state while user profile is loading
  if (profileLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <div className="text-white">Loading tournament data...</div>
        </div>
      </div>
    )
  }

  // Check if user can see solution details
  const canSeeSolutionDetails = (solution: Solution, mission: Mission) => {
    // Solution creator can always see their own solution details
    if (solution.author.id === currentUser?.userId) {
      return true
    }

    // Mission owner can see solution details only when season is in review or complete status
    if (mission.author.id === currentUser?.userId && currentSeason && (currentSeason.status === 'review' || currentSeason.status === 'complete')) {
      return true
    }

    return false
  }

  // Filter missions by search query (client-side for now)
  const filteredMissions = missions.filter(mission => {
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()
    return (
      mission.title.toLowerCase().includes(searchLower) ||
      mission.description.toLowerCase().includes(searchLower) ||
      mission.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  })

  const handleVote = async (missionId: string, type: 'up' | 'down') => {
    try {
      await vote({
        type: 'mission',
        targetId: missionId,
        userId: currentUser?.userId || '',
        voteType: type
      })

      // Refresh missions to get updated vote counts
      refetchMissions()

      if (type === 'up') {
        setAnimatingPoints(true)
        setTimeout(() => setAnimatingPoints(false), 1000)
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const handleSolutionVote = async (solutionId: string, type: 'up' | 'down') => {
    try {
      await vote({
        type: 'solution',
        targetId: solutionId,
        userId: currentUser?.userId || '',
        voteType: type
      })

      // If viewing a mission detail, refresh it
      if (selectedMission) {
        // Trigger a refresh of the mission data
        // This would need to be handled by the useMission hook
      }

      if (type === 'up') {
        setAnimatingPoints(true)
        setTimeout(() => setAnimatingPoints(false), 1000)
      }
    } catch (error) {
      console.error('Failed to vote on solution:', error)
    }
  }

  const handleGenerateCharacter = (solutionId: string) => {
    setSolutionCharacters(prev => ({
      ...prev,
      [solutionId]: (prev[solutionId] || 0) + 1
    }))
  }

  const handleGenerateSubmitCharacter = () => {
    setSubmitSolutionCharacter(prev => prev + 1)
  }

  const handleSolutionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedMission) return

    // Validate required data
    if (!currentUser?.userId) {
      alert('User profile not loaded. Please refresh the page.')
      return
    }

    const formData = new FormData(e.currentTarget)
    const content = formData.get('solution') as string

    if (!content.trim()) {
      alert('Please provide a solution before submitting.')
      return
    }

    try {
      // Upload files first if any
      let uploadedFiles: any[] = []
      if (solutionFiles.length > 0) {
        uploadedFiles = await handleFileUpload(solutionFiles, 'solution', selectedMission.id)
      }

      await submitSolution({
        missionId: selectedMission.id,
        seasonId: selectedMission.seasonId,
        authorId: currentUser?.userId || '',
        content: content.trim(),
        characterConfig: { randomSeed: submitSolutionCharacter },
        attachments: uploadedFiles
      })

      // Refresh missions list - the useEffect will handle updating selectedMission
      await refetchMissions()

      // Close solution form but keep mission modal open
      setShowSolutionForm(false)

      // Animate points gain
      setAnimatingPoints(true)
      setTimeout(() => setAnimatingPoints(false), 1000)

      // Reset form
      const form = e.currentTarget
      if (form) {
        form.reset()
      }
      setSolutionFiles([])
      setSubmitSolutionCharacter(0)
    } catch (error) {
      console.error('Failed to submit solution:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to submit solution: ${errorMessage}. Please try again.`)
    }
  }

  const handleMissionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const difficulty = selectedFormDifficulty
    const description = formData.get('description') as string
    const tags = (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || []
    const bonusPoints = parseInt(formData.get('bonusPoints') as string) || 0

    if (!title.trim() || !description.trim()) return

    // Validate required data
    if (!selectedSeason) {
      alert('Please select a season first')
      return
    }

    if (!currentUser?.userId) {
      alert('User profile not loaded. Please refresh the page.')
      return
    }

    try {
      // Upload files first if any
      let uploadedFiles: any[] = []
      if (missionFiles.length > 0) {
        uploadedFiles = await handleFileUpload(missionFiles, 'mission')
      }

      await createMission({
        seasonId: selectedSeason,
        authorId: currentUser?.userId || '',
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        tags,
        bonusPoints,
        attachments: uploadedFiles
      })

      // Close form
      setShowSubmitForm(false)

      // Refresh missions
      await refetchMissions()

      // Animate points gain
      setAnimatingPoints(true)
      setTimeout(() => setAnimatingPoints(false), 1000)

      // Reset form
      const form = e.currentTarget
      if (form) {
        form.reset()
      }
      setMissionFiles([])
      setSelectedFormDifficulty('medium')
    } catch (error) {
      console.error('Failed to create mission:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to create mission: ${errorMessage}. Please try again.`)
    }
  }

  const quickTemplates = [
    { title: 'Bug Report', category: 'technical', difficulty: 'easy', description: 'I found a bug in [component/feature] where [describe the issue]...' },
    { title: 'Feature Request', category: 'business', difficulty: 'medium', description: 'I need help implementing [feature] that should [describe functionality]...' },
    { title: 'Code Review', category: 'technical', difficulty: 'medium', description: 'Please review my code for [project/feature]. I\'m concerned about [specific areas]...' },
    { title: 'Architecture Design', category: 'technical', difficulty: 'hard', description: 'I need help designing the architecture for [system/application] that needs to handle [requirements]...' }
  ]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      // Determine context - if mission form is open, add to mission files, otherwise solution files
      const context = showSubmitForm ? 'mission' : 'solution'
      handleFileSelect(files, context)
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  const getAchievementColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-600'
      case 'rare': return 'text-blue-400 border-blue-600'
      case 'epic': return 'text-purple-400 border-purple-600'
      case 'legendary': return 'text-yellow-400 border-yellow-600'
      default: return 'text-gray-400 border-gray-600'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-orange-400'
      case 'expert': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500'
      case 'in-progress': return 'bg-yellow-500'
      case 'solved': return 'bg-blue-500'
      case 'closed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // File upload functions
  const handleFileUpload = async (files: File[], type: 'mission' | 'solution', relatedId?: string) => {
    if (files.length === 0) return []

    setUploadLoading(true)
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('type', type)
      if (relatedId) formData.append('relatedId', relatedId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result.files
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
      return []
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileSelect = (files: FileList | null, type: 'mission' | 'solution') => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (type === 'mission') {
      setMissionFiles(prev => [...prev, ...validFiles])
    } else {
      setSolutionFiles(prev => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number, type: 'mission' | 'solution') => {
    if (type === 'mission') {
      setMissionFiles(prev => prev.filter((_, i) => i !== index))
    } else {
      setSolutionFiles(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Show loading state
  if (seasonsLoading || !currentSeason) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🏆</span>
          </div>
          <div className="text-lg font-medium text-white mb-2">Loading Tournament...</div>
          <div className="text-sm text-slate-400">Fetching latest data</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Modern Header */}
      {/* <header className="border-b border-slate-800 bg-[#0a0e1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 border border-slate-600/50">
                <img
                  src="/images/logo.png"
                  alt="ROM Cards"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base sm:text-lg md:text-xl font-semibold text-white truncate">
                  Tournament
                </div>
                <div className="text-xs text-slate-400 truncate">
                  <span className="sm:hidden">{currentSeason.status}</span>
                  <span className="hidden sm:inline md:hidden">{currentSeason.status} • {Math.floor(currentSeason.participantCount / 1000)}k players</span>
                  <span className="hidden md:inline">{currentSeason.status} • {currentSeason.participantCount.toLocaleString()} players</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:flex bg-slate-800/50 border border-slate-700 rounded-xl p-1">
                <button
                  onClick={() => setMissionView('public')}
                  className={`px-2 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${missionView === 'public'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMissionView('mine')}
                  className={`px-2 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${missionView === 'mine'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                  Mine
                </button>
              </div>

              {unreadNotifications > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group"
                  >
                    <div className="relative">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
                      </svg>
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-xs font-bold text-white">{unreadNotifications}</span>
                      </div>
                    </div>
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-[60]">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-white">Notifications</div>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-slate-400 hover:text-white w-6 h-6 flex items-center justify-center rounded transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {notifications.filter(n => !n.read).map((notif) => (
                            <div key={notif.id} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800/70 transition-colors">
                              <div className="font-medium text-sm text-white">{notif.title}</div>
                              <div className="text-xs text-slate-400 mt-1">{notif.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="text-right hidden xs:block">
                  <div className="text-xs sm:text-sm font-medium text-white">{currentUser?.username || 'Loading...'}</div>
                  <div className="text-xs text-blue-400">{currentUser?.totalPoints?.toLocaleString() || '0'} pts</div>
                </div>
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full">
                  <span className="text-sm">{currentUser?.avatar || '👤'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Season Overview Card */}
        <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-6 bg-slate-900/50 border border-slate-700 rounded-xl md:rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
            {/* Season Selector */}
            <div className="flex items-center gap-2 sm:gap-3">
              <label className="text-xs sm:text-sm font-medium text-slate-300 shrink-0">Season:</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Season Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-24 h-24 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-xl overflow-hidden shrink-0 border-2 border-slate-600/50 shadow-lg">
                  <img
                    src={currentSeason.image}
                    alt={currentSeason.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base sm:text-lg md:text-xl font-semibold text-white truncate">{currentSeason.name}</div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    <span className="block xs:inline">${parseFloat(currentSeason.totalPrizePool).toLocaleString()} pool</span>
                    <span className="hidden xs:inline"> • </span>
                    <span className="block xs:inline">{Math.floor(currentSeason.participantCount / 1000)}k players</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowSeasonInfo(true)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-300 transition-colors"
                >
                  Info
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs sm:text-sm text-white font-medium transition-colors"
                >
                  Ranks
                </button>
              </div>
            </div>

            {/* Season Stats */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-800/50">
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">{filteredMissions.filter(m => m.status === 'open').length}</div>
                <div className="text-xs text-slate-400">Open</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">{filteredMissions.filter(m => m.status === 'solved').length}</div>
                <div className="text-xs text-slate-400">Solved</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400 mb-1">{currentUser?.totalPoints || 0}</div>
                <div className="text-xs text-slate-400">Points</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400 mb-1">
                  {missionView === 'mine'
                    ? missions.filter(m => m.author.id === currentUser?.userId).length
                    : (() => {
                      const userIndex = leaderboard?.findIndex(entry => entry.user.userId === currentUser?.userId) ?? -1;
                      return userIndex >= 0 ? `#${userIndex + 1}` : '#?';
                    })()
                  }
                </div>
                <div className="text-xs text-slate-400">
                  {missionView === 'mine' ? 'Posted' : 'Rank'}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Mission Feature Explanation Section - Same as original */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-xl md:rounded-2xl backdrop-blur-sm">
          <div className="space-y-6 md:space-y-0 md:flex md:items-start md:gap-8">
            {/* Explanation */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-xl sm:text-2xl">🎯</span>
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">What are Missions?</div>
                  <p className="text-xs sm:text-sm text-slate-400">Collaborative problem-solving platform</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  <strong className="text-white">Missions</strong> are real-world problems posted by community members looking for expert solutions.
                  Whether you need help with code optimization, business strategy, creative design, or research challenges - the community is here to help.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-3 sm:gap-4 mt-6">
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <span className="text-green-400 text-lg sm:text-xl shrink-0">💡</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-green-400 text-xs sm:text-sm mb-1">Submit Solutions</div>
                      <div className="text-xs text-slate-400 leading-tight">Help others solve problems and earn points</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <span className="text-blue-400 text-lg sm:text-xl shrink-0">🏆</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-blue-400 text-xs sm:text-sm mb-1">Earn Rewards</div>
                      <div className="text-xs text-slate-400 leading-tight">Get points, prizes, and recognition</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <span className="text-purple-400 text-lg sm:text-xl shrink-0">🎮</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-purple-400 text-xs sm:text-sm mb-1">Compete</div>
                      <div className="text-xs text-slate-400 leading-tight">Climb leaderboards and win prizes</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <span className="text-cyan-400 text-lg sm:text-xl shrink-0">🤝</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-cyan-400 text-xs sm:text-sm mb-1">Collaborate</div>
                      <div className="text-xs text-slate-400 leading-tight">Learn from diverse expertise</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Mission CTA */}
            <div className="md:w-72 lg:w-80 shrink-0">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl md:rounded-2xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-2xl sm:text-3xl">🚀</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-green-300 mb-2">Got a Problem?</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mb-4 sm:mb-6 leading-relaxed">
                    Post your mission and tap into the collective wisdom of expert problem-solvers worldwide.
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    <button
                      onClick={() => setShowSubmitForm(true)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-xl border border-green-400/30 text-sm sm:text-base md:text-lg"
                      disabled={mutationLoading}
                    >
                      {mutationLoading ? '⏳ Creating...' : '✨ Create Mission'}
                    </button>

                    <button
                      onClick={() => setShowQuickTemplates(true)}
                      className="w-full px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 text-xs sm:text-sm rounded-xl transition-all duration-200 border border-slate-600/50"
                    >
                      📝 Use Template
                    </button>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-green-500/20">
                    <div className="text-xs text-slate-400">
                      Earn <span className="text-green-400 font-semibold">75-500 points</span> based on difficulty
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Mission View Toggle for Mobile */}
        <div className="mb-4">
          <div className="flex bg-slate-900/50 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setMissionView('public')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${missionView === 'public'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              All Missions
            </button>
            <button
              onClick={() => setMissionView('mine')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${missionView === 'mine'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              My Missions
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-3 sm:space-y-4">
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Search missions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-700 rounded-xl text-xs sm:text-sm transition-all duration-200 shrink-0 ${showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
            >
              Filters
            </button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="p-4 sm:p-6 bg-slate-900/30 border border-slate-700 rounded-xl backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="business">Business</option>
                    <option value="creative">Creative</option>
                    <option value="research">Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Levels</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="newest">Latest</option>
                    <option value="points">Most Points</option>
                    <option value="votes">Popular</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mission Cards */}
        <div className="space-y-3 sm:space-y-4">
          {missionsLoading ? (
            // Loading state
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-slate-900/50 border border-slate-700 rounded-xl animate-pulse">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-700 rounded mb-3 w-3/4"></div>
                      <div className="h-3 bg-slate-700 rounded mb-2 w-full"></div>
                      <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                    </div>
                    <div className="w-16 h-8 bg-slate-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMissions.length > 0 ? (
            // Mission cards with real data
            filteredMissions.map((mission) => (
              <div
                key={mission.id}
                className="group p-3 sm:p-4 md:p-6 bg-slate-900/50 border border-slate-700 rounded-xl sm:rounded-2xl hover:border-slate-600 hover:bg-slate-900/70 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedMission(mission)}
              >
                <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 overflow-x-auto">
                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 ${getStatusColor(mission.status).replace('bg-', 'bg-')}`}></div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {mission.category}
                        </span>
                        <span className="text-xs text-slate-500 shrink-0">•</span>
                        <span className={`text-xs font-medium whitespace-nowrap ${getDifficultyColor(mission.difficulty)}`}>
                          {mission.difficulty}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                        {mission.title}
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                        {mission.description}
                      </p>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400 mb-1">{mission.points}</div>
                      <div className="text-xs text-slate-400">points</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-3 sm:pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400 overflow-x-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-xs sm:text-sm">{mission.author.avatar}</span>
                      </div>
                      <span className="whitespace-nowrap font-medium">{mission.author.username}</span>
                    </div>
                    <span className="shrink-0 text-slate-600">•</span>
                    <span className="whitespace-nowrap">{formatDate(mission.createdAt)}</span>
                    {mission.missionPrizes?.length > 0 && (
                      <>
                        <span className="shrink-0 text-slate-600">•</span>
                        <span className="text-yellow-400 font-medium whitespace-nowrap">{mission.missionPrizes.length} prize{mission.missionPrizes.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400 min-w-0 flex-1">
                      {mission.solutions?.length > 0 && (
                        <span className="whitespace-nowrap">{mission.solutions.length} solution{mission.solutions.length > 1 ? 's' : ''}</span>
                      )}
                      <span className="whitespace-nowrap">↑ {mission.upvotes}</span>
                      <div className={`px-2 sm:px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap ${mission.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        mission.status === 'solved' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                        {mission.status === 'open' ? 'Open' : mission.status === 'solved' ? 'Solved' : mission.status}
                      </div>
                    </div>

                    {mission.status === 'open' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedMission(mission)
                          setShowSolutionForm(true)
                        }}
                        className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap shrink-0"
                        disabled={mutationLoading}
                      >
                        💡 <span className="hidden xs:inline">Submit </span>Solution
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 sm:py-20">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🔍</span>
              </div>
              <div className="text-base sm:text-lg font-medium text-white mb-2">No missions found</div>
              <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      {/* All the existing modals go here - they remain the same but will use the real API calls */}
      {/* Submit Mission Form, Solution Form, Season Info, Leaderboard, etc. */}
      {/* The form handlers now use the real API calls instead of mock data */}

      {/* Submit Mission Form */}
      {showSubmitForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-full overflow-y-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 pb-4 sm:pb-6 border-b border-slate-800">
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 line-clamp-1">
                    Submit New Mission
                  </div>
                  <p className="text-slate-400 text-sm sm:text-base line-clamp-2">Share your problem and get expert solutions from the community</p>
                </div>
                <button
                  onClick={() => setShowSubmitForm(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl p-2 sm:p-3 transition-all shrink-0"
                >
                  ✕
                </button>
              </div>

              <form
                className="space-y-4 sm:space-y-6"
                onSubmit={handleMissionSubmit}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-white">Mission Title *</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Describe your problem in one sentence"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-white">Category *</label>
                    <select name="category" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" required>
                      <option value="technical">Technical</option>
                      <option value="business">Business</option>
                      <option value="creative">Creative</option>
                      <option value="research">Research</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-white">Difficulty & Reward *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'easy', label: 'Easy', points: '75 pts', color: 'border-green-500 hover:bg-green-500/10 text-green-400' },
                      { value: 'medium', label: 'Medium', points: '150 pts', color: 'border-yellow-500 hover:bg-yellow-500/10 text-yellow-400' },
                      { value: 'hard', label: 'Hard', points: '300 pts', color: 'border-orange-500 hover:bg-orange-500/10 text-orange-400' },
                      { value: 'expert', label: 'Expert', points: '500 pts', color: 'border-red-500 hover:bg-red-500/10 text-red-400' }
                    ].map((diff) => (
                      <div
                        key={diff.value}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${diff.color} ${selectedFormDifficulty === diff.value ? 'ring-2 ring-blue-500/50 bg-blue-500/10 border-blue-500' : 'bg-slate-800/30'}`}
                        onClick={() => setSelectedFormDifficulty(diff.value)}
                      >
                        <div className="font-medium mb-1">{diff.label}</div>
                        <div className="text-xs text-slate-400">{diff.points}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-white">Description *</label>
                  <textarea
                    name="description"
                    rows={6}
                    placeholder="Provide detailed context about your problem, what you've tried, and what kind of solution you're looking for..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-white">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    placeholder="e.g. react, javascript, optimization (comma separated)"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>

                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-white">Attachments</label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 backdrop-blur-sm ${dragActive ? 'border-purple-500 bg-purple-500/20 scale-105' : 'border-slate-600/50 hover:border-purple-500/30 hover:bg-slate-800/40'}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files, 'mission')}
                    />
                    <div className="text-4xl mb-2">📎</div>
                    <p className="text-sm text-slate-400 mb-2">
                      Drag files here or <button type="button" onClick={() => fileInputRef.current?.click()} className="text-purple-400 hover:text-purple-300">browse</button>
                    </p>
                    <p className="text-xs text-slate-500">Screenshots, code files, documents</p>
                  </div>

                  {/* Show selected files */}
                  {missionFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-medium text-white">Selected files:</div>
                      {missionFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📄</span>
                            <div>
                              <div className="text-sm text-white">{file.name}</div>
                              <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index, 'mission')}
                            className="text-slate-400 hover:text-red-400 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bonus Points (Optional)</label>
                  <input
                    type="number"
                    name="bonusPoints"
                    placeholder="e.g. 100"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>

                <div className="flex gap-4 pt-8 mt-8 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmitForm(false)
                      setMissionFiles([])
                    }}
                    className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all duration-200 text-slate-300 font-medium"
                    disabled={mutationLoading || uploadLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg font-medium text-white"
                    disabled={mutationLoading || uploadLoading}
                  >
                    {uploadLoading ? 'Uploading...' : mutationLoading ? 'Creating...' : 'Submit Mission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submit Solution Form */}
      {showSolutionForm && selectedMission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-full overflow-y-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 pb-4 sm:pb-6 border-b border-slate-800">
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 line-clamp-1">
                    Submit Solution
                  </div>
                  <p className="text-slate-400 text-sm sm:text-base line-clamp-1">Help solve this mission and earn points</p>
                </div>
                <button
                  onClick={() => {
                    setShowSolutionForm(false)
                    // Don't reset selectedMission here - let user go back to mission detail
                  }}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl p-2 sm:p-3 transition-all shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
                <div className="font-semibold mb-3 text-white">Mission: {selectedMission.title}</div>
                <p className="text-sm text-slate-400 line-clamp-3">{selectedMission.description}</p>
              </div>

              <form className="space-y-4 sm:space-y-6" onSubmit={handleSolutionSubmit}>
                {/* Character Generation Section */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-white">Solution Character</label>
                  <div className="border-2 border-dashed border-purple-500/30 rounded-xl p-4 bg-purple-900/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-slate-300">Generate a character to represent your solution</div>
                      <button
                        type="button"
                        onClick={handleGenerateSubmitCharacter}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-xl transition-colors duration-200 font-medium"
                      >
                        🎲 Generate Character
                      </button>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-2 sm:p-3 overflow-hidden">
                      <div className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px] mx-auto transform scale-75 sm:scale-90 md:scale-100 origin-center">
                        <CharacterGenerate
                          showRandomCharacter={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-white">Your Solution *</label>
                  <div className="relative">
                    <textarea
                      name="solution"
                      rows={10}
                      placeholder="Provide your detailed solution with code examples, explanations, and implementation steps..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-400 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                      required
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
                      Markdown supported
                    </div>
                  </div>
                </div>

                {/* File Upload for Solution */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-white">Attachments</label>
                  <div className="border-2 border-dashed border-slate-600/50 rounded-xl p-4 text-center hover:border-green-500/30 hover:bg-slate-800/40 transition-all duration-300 backdrop-blur-sm">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="solution-files"
                      onChange={(e) => handleFileSelect(e.target.files, 'solution')}
                    />
                    <label htmlFor="solution-files" className="cursor-pointer">
                      <div className="text-2xl mb-1">📁</div>
                      <p className="text-sm text-slate-400">Upload code files, screenshots, or docs</p>
                    </label>
                  </div>

                  {/* Show selected files */}
                  {solutionFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-medium text-white">Selected files:</div>
                      {solutionFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📄</span>
                            <div>
                              <div className="text-sm text-white">{file.name}</div>
                              <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index, 'solution')}
                            className="text-slate-400 hover:text-red-400 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl border border-green-500/40 backdrop-blur-sm">
                  <div className="text-lg">💡</div>
                  <div className="text-sm text-slate-300">
                    <strong className="text-green-400">Pro Tips:</strong>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• Include working code examples with explanations</li>
                      <li>• Break down complex solutions into steps</li>
                      <li>• Test your solution before submitting</li>
                      <li>• Reference documentation and best practices</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 mt-8 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSolutionForm(false)
                      setSolutionFiles([])
                      // Don't reset selectedMission - let user go back to mission detail
                    }}
                    className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all duration-200 text-slate-300 font-medium"
                    disabled={mutationLoading || uploadLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg font-medium text-white"
                    disabled={mutationLoading || uploadLoading}
                  >
                    {uploadLoading ? 'Uploading...' : mutationLoading ? 'Submitting...' : 'Submit Solution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mission Detail Modal */}
      {selectedMission && !showSolutionForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-full overflow-y-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-start justify-between mb-4 sm:mb-6 md:mb-8 pb-4 sm:pb-6 border-b border-slate-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 overflow-x-auto">
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0 ${selectedMission.status === 'open' ? 'bg-green-400' :
                      selectedMission.status === 'solved' ? 'bg-blue-400' :
                        selectedMission.status === 'in-progress' ? 'bg-yellow-400' : 'bg-slate-400'
                      }`}></div>
                    <span className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {selectedMission.category}
                    </span>
                    <span className="text-slate-600 shrink-0">•</span>
                    <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${getDifficultyColor(selectedMission.difficulty)}`}>
                      {selectedMission.difficulty}
                    </span>
                  </div>

                  <div className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-white line-clamp-2">{selectedMission.title}</div>

                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-xs sm:text-sm font-medium text-blue-400">
                      {selectedMission.points} points
                    </span>
                    {selectedMission.missionPrizes?.length > 0 && (
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-600/20 border border-yellow-500/30 rounded-xl text-xs sm:text-sm font-medium text-yellow-400">
                        {selectedMission.missionPrizes.length} prize{selectedMission.missionPrizes.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium ${selectedMission.status === 'open' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                      selectedMission.status === 'solved' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' :
                        'bg-slate-500/20 border border-slate-500/30 text-slate-400'
                      }`}>
                      {selectedMission.status === 'open' ? 'Open' : selectedMission.status === 'solved' ? 'Solved' : selectedMission.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400 overflow-x-auto">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xs sm:text-sm">{selectedMission.author.avatar}</span>
                    </div>
                    <span className="font-medium whitespace-nowrap">{selectedMission.author.username}</span>
                    <span className="shrink-0">•</span>
                    <span className="whitespace-nowrap">{formatDate(selectedMission.createdAt)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMission(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl p-2 sm:p-3 transition-all shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="mb-8">
                <div className="text-lg font-semibold mb-4 text-white">Description</div>
                <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedMission.description}
                  </p>
                </div>
              </div>

              {selectedMission.tags.length > 0 && (
                <div className="mb-8">
                  <div className="text-lg font-semibold mb-4 text-white">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMission.tags.map((tag) => (
                      <span key={tag} className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-300 hover:bg-slate-700/50 transition-colors">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mission Prizes */}
              {selectedMission.missionPrizes?.length > 0 && (
                <div className="mb-8">
                  <div className="text-lg font-semibold mb-4 text-white">Mission Prizes</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedMission.missionPrizes.map((prize) => (
                      <div key={prize.id} className="p-5 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-lg">{prize.icon}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-yellow-400 mb-1">
                              {prize.type === 'cash' ? `$${parseFloat(prize.value).toLocaleString()}` :
                                prize.type === 'credits' ? `${prize.value} credits` :
                                  prize.type === 'nft' ? 'Exclusive NFT' :
                                    prize.type === 'merchandise' ? 'Merchandise' : 'Special Access'}
                            </div>
                            <div className="text-sm text-slate-300">{prize.description}</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Condition: {prize.condition}</span>
                          <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-400">
                            Platform
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Solution CTA - Prominent */}
              {selectedMission.status === 'open' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold text-green-300 mb-2">💡 Ready to solve this mission?</div>
                      <p className="text-sm text-slate-300">Share your solution and earn <span className="text-green-400 font-semibold">{selectedMission.points} points</span> plus potential prizes!</p>
                    </div>
                    <button
                      onClick={() => setShowSolutionForm(true)}
                      className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl transition-all duration-200 hover:scale-105 shadow-xl font-bold text-white border border-green-400/30 whitespace-nowrap text-lg"
                    >
                      🚀 Submit Solution
                    </button>
                  </div>
                </div>
              )}

              {/* Solutions */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-lg font-semibold text-white">
                    Solutions ({selectedMission.solutions?.length || 0})
                  </div>
                </div>

                <div className="space-y-8">
                  {selectedMission.solutions?.map((solution, index) => {
                    const canViewDetails = canSeeSolutionDetails(solution, selectedMission);

                    return (
                      <div key={solution.id} className="relative group">
                        {/* Agent Card */}
                        <div className={`bg-gradient-to-r from-slate-900/90 to-slate-800/90 border border-slate-600 rounded-2xl overflow-hidden transition-all duration-300 ${canViewDetails ? 'hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10' : 'opacity-60'}`}>

                          {/* Agent Header */}
                          <div className="relative bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-b border-cyan-500/20 p-4">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/5 to-blue-500/5"></div>

                            {/* Top Row: Agent Name and Actions */}
                            <div className="relative flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="text-xl font-bold text-cyan-300 tracking-wide">AGENT {solution.author.username.toUpperCase()}</div>
                                {solution.isAccepted && (
                                  <div className="px-3 py-1 bg-green-500/20 border border-green-400/40 rounded-xl">
                                    <span className="text-green-300 text-xs font-bold">✓ MISSION SUCCESS</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSolutionVote(solution.id, 'up');
                                  }}
                                  className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/30 hover:bg-cyan-500/30 rounded-xl text-xs transition-all duration-200 text-cyan-300 font-mono"
                                >
                                  APPROVE {solution.upvotes}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSolutionVote(solution.id, 'down');
                                  }}
                                  className="px-3 py-1.5 bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 rounded-xl text-xs transition-all duration-200 text-red-300 font-mono"
                                >
                                  REJECT {solution.downvotes}
                                </button>
                              </div>
                            </div>

                            {/* Agent Character and Info */}
                            <div className="relative flex items-center gap-3 sm:gap-4 md:gap-6">
                              {/* Agent Avatar */}
                              <div className="relative shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 rounded-xl sm:rounded-2xl backdrop-blur-sm overflow-hidden flex items-center justify-center">
                                  <div className="transform scale-50 sm:scale-60 md:scale-75 origin-center">
                                    <CharacterGenerate
                                      showRandomCharacter={true}
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateCharacter(solution.id);
                                  }}
                                  className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 hover:bg-purple-400 rounded-full flex items-center justify-center transition-colors group"
                                  title="Regenerate character"
                                >
                                  <span className="text-xs group-hover:scale-110 transition-transform">🎲</span>
                                </button>
                              </div>

                              {/* Agent Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-base sm:text-lg font-bold text-cyan-300 line-clamp-1 mb-1">
                                      {solution.author.username}
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-400">
                                      Deployed {formatDate(solution.createdAt)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1">
                                      <span className="text-cyan-300 font-mono">{solution.points}</span>
                                      <span className="text-slate-500">EXP</span>
                                    </div>
                                    <div className="text-slate-500 font-mono">
                                      #{solution.id.slice(-6).toUpperCase()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Mission Briefing */}
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                              <div className="text-sm font-bold text-orange-300 tracking-wider">MISSION BRIEFING</div>
                              <div className="flex-1 h-px bg-gradient-to-r from-orange-400/30 to-transparent"></div>
                            </div>

                            <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-4">
                              {canViewDetails ? (
                                <div className="text-slate-200 leading-relaxed whitespace-pre-line text-sm">
                                  {solution.content}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="text-slate-500 text-sm mb-2">🔒 Access Restricted</div>
                                  <div className="text-xs text-slate-600">
                                    {solution.author.id === currentUser?.userId
                                      ? "This is your solution"
                                      : selectedMission.author.id === currentUser?.userId
                                        ? "Solution details will be available when season enters review phase"
                                        : "Solution details are private"
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Agent Status */}
                          <div className="bg-slate-900/50 border-t border-slate-600/50 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <div className="flex items-center gap-2 text-slate-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="font-mono">ACTIVE SOLUTION</span>
                              </div>
                              <div className="text-cyan-300 font-mono">
                                {formatDate(solution.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {(!selectedMission.solutions || selectedMission.solutions.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">💡</span>
                      </div>
                      <h4 className="text-lg font-medium text-white mb-2">No solutions yet</h4>
                      <p className="text-slate-400">Be the first to help solve this mission!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Season Info Modal */}
      {showSeasonInfo && currentSeason && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-3xl max-h-full overflow-y-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-start justify-between mb-4 sm:mb-6 md:mb-8 pb-4 sm:pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-slate-600 shrink-0">
                    <img
                      src={currentSeason.image}
                      alt={currentSeason.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 line-clamp-1">
                      {currentSeason.name}
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base line-clamp-2">{currentSeason.description}</p>
                    <div className="text-xs sm:text-sm text-slate-500 mt-1">Theme: {currentSeason.theme}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowSeasonInfo(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl p-2 sm:p-3 transition-all shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 mb-1 sm:mb-2">${parseFloat(currentSeason.totalPrizePool).toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-slate-400">Total Prize Pool</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400 mb-1 sm:mb-2">{currentSeason.participantCount.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-slate-400">Participants</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400 mb-1 sm:mb-2">{currentSeason.missionCount}</div>
                  <div className="text-xs sm:text-sm text-slate-400">Missions</div>
                </div>
              </div>

              <div className="mb-8">
                <div className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">Prize Distribution</div>
                <div className="space-y-3 sm:space-y-4">
                  {currentSeason.prizes?.map((prize) => (
                    <div key={prize.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-800/30 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-lg sm:text-xl md:text-2xl">{prize.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-white text-sm sm:text-base md:text-lg line-clamp-1">{prize.title}</div>
                          <div className="text-xs sm:text-sm text-slate-400 line-clamp-1">{prize.description}</div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="font-bold text-yellow-400 text-base sm:text-lg md:text-xl">
                          {prize.type === 'cash' ? `$${parseFloat(prize.value).toLocaleString()}` :
                            prize.type === 'credits' ? `${prize.value} credits` :
                              prize.type === 'nft' ? 'Exclusive NFT' : 'Special Access'}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-400">Rank #{prize.rank}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
                <div className="text-slate-400">
                  Season runs from {new Date(currentSeason.startDate).toLocaleDateString()} to {new Date(currentSeason.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && currentSeason && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-full overflow-y-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 pb-4 sm:pb-6 border-b border-slate-800">
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 line-clamp-1">
                    Season Leaderboard
                  </div>
                  <p className="text-slate-400 text-sm sm:text-base line-clamp-1">{currentSeason.name} Rankings</p>
                </div>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl p-2 sm:p-3 transition-all shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {leaderboard?.map((entry, index) => (
                  <div key={entry.user.id} className={`flex items-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-5 rounded-xl border transition-all duration-200 hover:border-slate-600 ${index === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-yellow-500/30' :
                    index === 1 ? 'bg-gradient-to-r from-slate-800/40 to-slate-700/40 border-slate-500/40' :
                      index === 2 ? 'bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30' :
                        'bg-slate-800/30 border-slate-700'
                    }`}>
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/50 rounded-xl shrink-0">
                      <span className="text-base sm:text-lg md:text-xl font-bold">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                      <span className="text-base sm:text-lg">{entry.user.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm sm:text-base md:text-lg line-clamp-1">{entry.user.username}</div>
                      <div className="text-xs sm:text-sm text-slate-400 line-clamp-1">{entry.user.badge}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-blue-400 text-base sm:text-lg md:text-xl">{entry.seasonPoints.points?.toLocaleString() || '0'}</div>
                      <div className="text-xs sm:text-sm text-slate-400">points</div>
                    </div>
                  </div>
                ))}

                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="text-center py-8">
                    <div className="text-slate-500 text-lg mb-2">🏆</div>
                    <div className="text-slate-400">No rankings available yet</div>
                  </div>
                )}
              </div>

              <div className="mt-4 sm:mt-6 md:mt-8 text-center p-3 sm:p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
                <div className="text-slate-400 text-sm sm:text-base">
                  {leaderboard && leaderboard.length > 0 ? (
                    (() => {
                      const userIndex = leaderboard.findIndex(entry => entry.user.userId === currentUser?.userId);
                      return userIndex >= 0 ?
                        <>Your current rank: <span className="text-white font-semibold">#{userIndex + 1}</span></> :
                        <>You haven't earned points in this season yet. Start solving missions!</>;
                    })()
                  ) : (
                    <>Start solving missions to appear on the leaderboard!</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
} 