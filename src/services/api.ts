// src/services/api.ts
// Robust API Client for Cadence

import {
  User,
  OperatingMode,
  Objective,
  Assignment,
  CapabilityOverviewData,
  UserCapability,
  PerformanceOverview,
  PerformancePatterns,
  JournalEvent,
  ProfileResponse,
  LeaderboardEntry,
  CompletionResponse,
  UserStreakDoc,
  StreakCheckinResponse,
  QuickLogResponse,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('cadence_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ user: User; token: string }> {
    const res = await fetchJson<{ user: User; token: string }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) localStorage.setItem('cadence_token', res.token);
    return res;
  },

  async register(email: string, password: string, displayName?: string): Promise<{ user: User; token: string }> {
    const res = await fetchJson<{ user: User; token: string }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    if (res.token) localStorage.setItem('cadence_token', res.token);
    return res;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('cadence_token');
    await fetchJson(`${API_BASE}/auth/logout`, { method: 'POST' });
  },

  async getMe(): Promise<User> {
    return fetchJson<User>(`${API_BASE}/auth/me`);
  },

  async setMode(mode: OperatingMode): Promise<{ operatingMode: OperatingMode }> {
    return fetchJson(`${API_BASE}/auth/mode`, {
      method: 'PATCH',
      body: JSON.stringify({ mode }),
    });
  },

  // Objectives
  async getObjectives(): Promise<Objective[]> {
    return fetchJson<Objective[]>(`${API_BASE}/objectives`);
  },

  async createObjective(data: Partial<Objective>): Promise<Objective> {
    return fetchJson<Objective>(`${API_BASE}/objectives`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getObjective(id: string): Promise<Objective> {
    return fetchJson<Objective>(`${API_BASE}/objectives/${id}`);
  },

  async updateObjective(id: string, data: Partial<Objective>): Promise<Objective> {
    return fetchJson<Objective>(`${API_BASE}/objectives/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Assignments
  async getAssignments(params?: Record<string, string>): Promise<Assignment[]> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchJson<Assignment[]>(`${API_BASE}/assignments${qs}`);
  },

  async createAssignment(data: Partial<Assignment>): Promise<Assignment> {
    return fetchJson<Assignment>(`${API_BASE}/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getRecommendedAssignment(): Promise<{
    focus: Assignment;
    isExisting: boolean;
    reasonCodes?: string[];
    explanation?: string;
    engine?: string;
  }> {
    return fetchJson(`${API_BASE}/assignments/recommended`);
  },

  async generateCommanderAssignment(): Promise<Assignment> {
    return fetchJson<Assignment>(`${API_BASE}/assignments/generate`, {
      method: 'POST',
    });
  },

  async startAssignment(id: string): Promise<{ status: string; startedAt: string }> {
    return fetchJson(`${API_BASE}/assignments/${id}/start`, { method: 'POST' });
  },

  async pauseAssignment(id: string): Promise<{ status: string; pausedAt: string }> {
    return fetchJson(`${API_BASE}/assignments/${id}/pause`, { method: 'POST' });
  },

  async resumeAssignment(id: string): Promise<{ status: string; resumedAt: string }> {
    return fetchJson(`${API_BASE}/assignments/${id}/resume`, { method: 'POST' });
  },

  async completeAssignment(id: string): Promise<CompletionResponse> {
    return fetchJson<CompletionResponse>(`${API_BASE}/assignments/${id}/complete`, {
      method: 'POST',
    });
  },

  async skipAssignment(id: string, reason: string): Promise<{ status: string; skipReason: string }> {
    return fetchJson(`${API_BASE}/assignments/${id}/skip`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Capabilities
  async getCapabilities(): Promise<UserCapability[]> {
    return fetchJson<UserCapability[]>(`${API_BASE}/capabilities`);
  },

  async getCapabilityOverview(): Promise<CapabilityOverviewData> {
    return fetchJson<CapabilityOverviewData>(`${API_BASE}/capabilities/overview`);
  },

  async getCapabilityDetail(dimension: string): Promise<{
    capability: UserCapability;
    events: any[];
    contributors: any[];
  }> {
    return fetchJson(`${API_BASE}/capabilities/${dimension}`);
  },

  // Performance
  async getPerformanceOverview(mode?: OperatingMode): Promise<PerformanceOverview> {
    const qs = mode ? `?mode=${mode}` : '';
    return fetchJson<PerformanceOverview>(`${API_BASE}/performance/overview${qs}`);
  },

  async getPerformancePatterns(mode?: OperatingMode): Promise<PerformancePatterns> {
    const qs = mode ? `?mode=${mode}` : '';
    return fetchJson<PerformancePatterns>(`${API_BASE}/performance/patterns${qs}`);
  },

  async getPerformanceAdaptations(): Promise<any[]> {
    return fetchJson<any[]>(`${API_BASE}/performance/adaptations`);
  },

  // Supabase 24/7 Cloud Persistence
  async getSupabaseStatus(): Promise<{
    connected: boolean;
    status: string;
    projectUrl: string;
    endpointDomain: string;
    bucket: string;
    lastSyncedAt: string | null;
    lastError: string | null;
    mode: string;
    counts?: {
      users: number;
      objectives: number;
      assignments: number;
      journals: number;
      capabilities: number;
    };
  }> {
    return fetchJson(`${API_BASE}/supabase/status`);
  },

  async syncToSupabase(): Promise<{
    success: boolean;
    connected: boolean;
    lastSyncedAt: string;
  }> {
    return fetchJson(`${API_BASE}/supabase/sync`, { method: 'POST' });
  },

  // Journal
  async getJournal(type?: string, search?: string): Promise<JournalEvent[]> {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.set('type', type);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<JournalEvent[]>(`${API_BASE}/journal${qs}`);
  },

  async getJournalStats(): Promise<{
    totalEvents: number;
    assignmentsCompleted: number;
    milestonesUnlocked: number;
    adaptations: number;
  }> {
    return fetchJson(`${API_BASE}/journal/stats`);
  },

  // Rank & Profile
  async getRank(): Promise<{
    totalCredits: number;
    rankPosition: number;
    rankTier: string;
    leaderboard: LeaderboardEntry[];
  }> {
    return fetchJson(`${API_BASE}/rank`);
  },

  async getProfile(): Promise<ProfileResponse> {
    return fetchJson<ProfileResponse>(`${API_BASE}/profile`);
  },

  // AI Chat
  async sendChatMessage(message: string, history?: { role: 'user' | 'assistant'; content: string }[]): Promise<{
    reply: string;
    provider: string;
    timestamp: string;
  }> {
    return fetchJson(`${API_BASE}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },

  // Consistency Streak (Persisted 24/7 in Supabase)
  async getStreak(): Promise<UserStreakDoc> {
    return fetchJson<UserStreakDoc>(`${API_BASE}/streak`);
  },

  async checkinStreak(notes?: string): Promise<StreakCheckinResponse> {
    return fetchJson<StreakCheckinResponse>(`${API_BASE}/streak/checkin`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  // Quick Log Completed Action (Auto-linked to Active Objective)
  async quickLogAction(data: {
    title: string;
    dimension?: string;
    duration?: number;
    notes?: string;
  }): Promise<QuickLogResponse> {
    return fetchJson<QuickLogResponse>(`${API_BASE}/quick-log`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
