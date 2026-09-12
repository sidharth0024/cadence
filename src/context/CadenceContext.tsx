// src/context/CadenceContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Objective,
  Assignment,
  UserProgression,
  CreditState,
  UserCapability,
  CompletionResponse,
} from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CadenceContextType {
  primaryObjective: Objective | null;
  currentFocus: Assignment | null;
  progression: UserProgression | null;
  rankState: CreditState | null;
  capabilities: UserCapability[];
  activeExecutionAssignment: Assignment | null;
  completionResult: CompletionResponse | null;
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  startExecution: (assignment: Assignment) => Promise<void>;
  closeExecutionModal: () => void;
  setCompletionResult: (result: CompletionResponse | null) => void;
  dismissCompletionModal: () => void;
}

const CadenceContext = createContext<CadenceContextType | undefined>(undefined);

export const CadenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [primaryObjective, setPrimaryObjective] = useState<Objective | null>(null);
  const [currentFocus, setCurrentFocus] = useState<Assignment | null>(null);
  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [rankState, setRankState] = useState<CreditState | null>(null);
  const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
  const [activeExecutionAssignment, setActiveExecutionAssignment] = useState<Assignment | null>(null);
  const [completionResult, setCompletionResult] = useState<CompletionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [profileData, recommended] = await Promise.all([
        api.getProfile(),
        api.getRecommendedAssignment(),
      ]);

      setProgression(profileData.progression);
      setRankState(profileData.rank);
      setCapabilities(profileData.capabilities);
      setPrimaryObjective(profileData.primaryObjective || null);
      setCurrentFocus(recommended.focus);
    } catch (err) {
      console.error('Failed to refresh Cadence state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  const startExecution = async (assignment: Assignment) => {
    try {
      if (assignment.status !== 'IN_PROGRESS') {
        await api.startAssignment(assignment.id);
        assignment.status = 'IN_PROGRESS';
      }
      setActiveExecutionAssignment(assignment);
    } catch (err) {
      console.error('Failed to start execution:', err);
    }
  };

  const closeExecutionModal = () => {
    setActiveExecutionAssignment(null);
  };

  const dismissCompletionModal = () => {
    setCompletionResult(null);
    refreshAll();
  };

  return (
    <CadenceContext.Provider
      value={{
        primaryObjective,
        currentFocus,
        progression,
        rankState,
        capabilities,
        activeExecutionAssignment,
        completionResult,
        isLoading,
        refreshAll,
        startExecution,
        closeExecutionModal,
        setCompletionResult,
        dismissCompletionModal,
      }}
    >
      {children}
    </CadenceContext.Provider>
  );
};

export const useCadence = () => {
  const ctx = useContext(CadenceContext);
  if (!ctx) throw new Error('useCadence must be used within CadenceProvider');
  return ctx;
};
