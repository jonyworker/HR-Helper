
import React, { useState, useCallback } from 'react';
import { Participant, AppTab, DrawHistory } from './types';
import ParticipantManager from './components/ParticipantManager';
import LuckyDraw from './components/LuckyDraw';
import TeamSplitter from './components/TeamSplitter';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('participants');
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Lifted Draw State to preserve history and "excluded" status across tab switches
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const handleUpdateParticipants = useCallback((newList: Participant[]) => {
    setParticipants(newList);
    // When the master list changes, we should probably check if excluded IDs are still valid
    // but for simplicity, we keep them or reset them if names are cleared.
    if (newList.length === 0) {
      setExcludedIds(new Set());
      setDrawHistory([]);
    }
  }, []);

  const handleDrawWinner = useCallback((winner: Participant, prize: string, allowDuplicates: boolean) => {
    const newEntry: DrawHistory = {
      id: Date.now().toString(),
      winner: winner.name,
      timestamp: new Date(),
      prize: prize || '神秘大獎'
    };
    setDrawHistory(prev => [newEntry, ...prev]);

    if (!allowDuplicates) {
      setExcludedIds(prev => {
        const next = new Set(prev);
        next.add(winner.id);
        return next;
      });
    }
  }, []);

  const handleResetDrawPool = useCallback(() => {
    setExcludedIds(new Set());
    setDrawHistory([]);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'participants':
        return (
          <ParticipantManager 
            participants={participants} 
            onUpdate={handleUpdateParticipants} 
          />
        );
      case 'lucky-draw':
        return (
          <LuckyDraw 
            participants={participants} 
            history={drawHistory}
            excludedIds={excludedIds}
            onDraw={handleDrawWinner}
            onResetPool={handleResetDrawPool}
          />
        );
      case 'team-splitter':
        return (
          <TeamSplitter 
            participants={participants} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <i className="fa-solid fa-users-gear text-indigo-700 text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">HR Fun Hub</h1>
          </div>
          
          <nav className="flex bg-indigo-800 rounded-full p-1">
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-6 py-2 rounded-full transition-all text-sm font-medium ${
                activeTab === 'participants' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-100 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-list-ul mr-2"></i> 名單管理
            </button>
            <button
              onClick={() => setActiveTab('lucky-draw')}
              className={`px-6 py-2 rounded-full transition-all text-sm font-medium ${
                activeTab === 'lucky-draw' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-100 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-gift mr-2"></i> 獎品抽籤
            </button>
            <button
              onClick={() => setActiveTab('team-splitter')}
              className={`px-6 py-2 rounded-full transition-all text-sm font-medium ${
                activeTab === 'team-splitter' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-100 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-sitemap mr-2"></i> 自動分組
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 text-center text-slate-500 text-sm">
        <p>© 2024 HR Fun Hub - 全能人力資源活動助手</p>
      </footer>
    </div>
  );
};

export default App;
