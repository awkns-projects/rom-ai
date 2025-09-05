import { useState, useEffect, useCallback } from 'react';

// Types based on our database schema
export interface Season {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'review' | 'complete' | 'ended';
  theme: string;
  image: string;
  totalPrizePool: string;
  participantCount: number;
  missionCount: number;
  prizes: SeasonPrize[];
}

export interface SeasonPrize {
  id: string;
  rank: number;
  title: string;
  description: string;
  value: string;
  type: 'cash' | 'credits' | 'nft' | 'merchandise' | 'access';
  icon: string;
}

export interface Mission {
  id: string;
  seasonId: string;
  title: string;
  description: string;
  category: 'technical' | 'business' | 'creative' | 'research' | 'other';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  status: 'open' | 'in-progress' | 'solved' | 'closed';
  authorId: string;
  deadline?: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: UserProfile;
  solutions: Solution[];
  missionPrizes: MissionPrize[];
}

export interface Solution {
  id: string;
  missionId: string;
  content: string;
  authorId: string;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean;
  points: number;
  characterConfig?: any; // Optional character configuration JSON
  createdAt: string;
  author: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  totalPoints: number;
  level: number;
  badge: string;
  isOnline: boolean;
}

export interface MissionPrize {
  id: string;
  value: string;
  type: 'cash' | 'credits' | 'nft' | 'merchandise' | 'access';
  description: string;
  condition: string;
  icon: string;
}

// ==================== SEASONS HOOK ====================

export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seasons');
      if (!response.ok) throw new Error('Failed to fetch seasons');

      const data = await response.json();
      setSeasons(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  return { seasons, loading, error, refetch: fetchSeasons };
}

// ==================== MISSIONS HOOK ====================

export function useMissions(filters?: {
  seasonId?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  authorId?: string;
  sortBy?: string;
  limit?: number;
}) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!filters) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters?.seasonId) params.append('seasonId', filters.seasonId);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.authorId) params.append('authorId', filters.authorId);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/missions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch missions');

      const data = await response.json();
      setMissions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  return { missions, loading, error, refetch: fetchMissions };
}

// ==================== SINGLE MISSION HOOK ====================

export function useMission(missionId: string | null, currentUserId?: string) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMission = useCallback(async () => {
    if (!missionId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentUserId) params.append('userId', currentUserId);

      const response = await fetch(`/api/missions/${missionId}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch mission');

      const data = await response.json();
      setMission(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [missionId, currentUserId]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  return { mission, loading, error, refetch: fetchMission };
}

// ==================== MUTATION HOOKS ====================

export function useMissionMutations() {
  const [loading, setLoading] = useState(false);

  const createMission = async (data: {
    seasonId: string;
    authorId: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    tags?: string[];
    deadline?: string;
    bonusPoints?: number;
    attachments?: any[];
  }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create mission');
      }

      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  const submitSolution = async (data: {
    missionId: string;
    seasonId: string;
    authorId: string;
    content: string;
    characterConfig?: any;
    attachments?: any[];
  }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit solution');
      }

      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  const vote = async (data: {
    type: 'mission' | 'solution';
    targetId: string;
    userId: string;
    voteType: 'up' | 'down';
  }) => {
    try {
      const response = await fetch('/api/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }

      return await response.json();
    } catch (error) {
      console.error('Vote error:', error);
      throw error;
    }
  };

  const acceptSolution = async (solutionId: string, userId: string) => {
    try {
      const response = await fetch(`/api/solutions/${solutionId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept solution');
      }

      return await response.json();
    } catch (error) {
      console.error('Accept solution error:', error);
      throw error;
    }
  };

  return {
    createMission,
    submitSolution,
    vote,
    acceptSolution,
    loading
  };
}

// ==================== LEADERBOARD HOOK ====================

export function useLeaderboard(seasonId: string, limit = 10) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!seasonId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/seasons/${seasonId}/leaderboard?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [seasonId, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, loading, error, refetch: fetchLeaderboard };
}

// ==================== NOTIFICATIONS HOOK ====================

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead
  };
}

// ==================== ACHIEVEMENTS HOOK ====================

export function useAchievements() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/achievements');
      if (!response.ok) throw new Error('Failed to fetch achievements');

      const data = await response.json();
      setAchievements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return { achievements, loading, error, refetch: fetchAchievements };
}

export function useUserAchievements(userId: string) {
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/achievements`);
      if (!response.ok) throw new Error('Failed to fetch user achievements');

      const data = await response.json();
      setUserAchievements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserAchievements();
  }, [fetchUserAchievements]);

  return { userAchievements, loading, error, refetch: fetchUserAchievements };
}

// ==================== USER PROFILE HOOK ====================

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) throw new Error('Failed to fetch user profile');

      const data = await response.json();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: any) => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile
  };
} 