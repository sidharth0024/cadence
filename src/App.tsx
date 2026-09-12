// src/App.tsx
// Cadence Master Shell

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CadenceProvider, useCadence } from './context/CadenceContext';
import { GlobalNavigation } from './components/common/GlobalNavigation';
import { HomePage } from './components/home/HomePage';
import { ObjectivesPage } from './components/objectives/ObjectivesPage';
import { AssignmentsPage } from './components/assignments/AssignmentsPage';
import { CapabilitiesPage } from './components/capabilities/CapabilitiesPage';
import { PerformancePage } from './components/performance/PerformancePage';
import { JournalPage } from './components/journal/JournalPage';
import { AIChatPage } from './components/chat/AIChatPage';
import { RankAchievementsPage } from './components/rank/RankAchievementsPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { ExecutionModeModal } from './components/assignments/ExecutionModeModal';
import { CinematicCompletionModal } from './components/common/CinematicCompletionModal';
import { CreateAssignmentModal } from './components/assignments/CreateAssignmentModal';
import { AuthModal } from './components/auth/AuthModal';
import { QuickLogFAB } from './components/common/QuickLogFAB';

function CadenceApp() {
  const { user, loading } = useAuth();
  const {
    activeExecutionAssignment,
    closeExecutionModal,
    completionResult,
    dismissCompletionModal,
    refreshAll,
  } = useCadence();

  const [activeTab, setActiveTab] = useState('home');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06080A]">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-brand)] bg-[var(--color-surface-elevated)]">
            <span className="font-display text-2xl font-bold text-[var(--color-brand-highlight)]">C</span>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)] animate-pulse">
            SYNCHRONIZING CADENCE TELEMETRY...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const isCommander = user.operatingMode === 'COMMANDER';
  const themeClass = isCommander ? 'theme-commander' : 'theme-manual';

  return (
    <div className={`min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] font-ui transition-colors duration-700 ${themeClass}`}>
      {/* Top Global Navigation Bar */}
      <GlobalNavigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={setActiveTab}
            onOpenCreate={() => setCreateModalOpen(true)}
          />
        )}
        {activeTab === 'objectives' && <ObjectivesPage />}
        {activeTab === 'assignments' && (
          <AssignmentsPage onOpenCreate={() => setCreateModalOpen(true)} />
        )}
        {activeTab === 'capabilities' && <CapabilitiesPage />}
        {activeTab === 'performance' && <PerformancePage />}
        {activeTab === 'journal' && <JournalPage />}
        {activeTab === 'ai-chat' && <AIChatPage />}
        {activeTab === 'rank' && <RankAchievementsPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Global Quick-Log Floating Action Button (FAB) across all screens */}
      <QuickLogFAB />

      {/* Execution Mode Distraction-Free Modal */}
      {activeExecutionAssignment && (
        <ExecutionModeModal
          assignment={activeExecutionAssignment}
          onClose={closeExecutionModal}
        />
      )}

      {/* Cinematic Completion Progression Modal */}
      {completionResult && (
        <CinematicCompletionModal
          result={completionResult}
          onDismiss={dismissCompletionModal}
        />
      )}

      {/* Manual Assignment Creation Modal */}
      {createModalOpen && (
        <CreateAssignmentModal
          onClose={() => setCreateModalOpen(false)}
          onCreated={refreshAll}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CadenceProvider>
        <CadenceApp />
      </CadenceProvider>
    </AuthProvider>
  );
}
