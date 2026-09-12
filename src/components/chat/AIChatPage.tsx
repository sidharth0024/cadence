// src/components/chat/AIChatPage.tsx
// Cadence AI Strategic Consultation
// Connects to /api/ai/chat backed by failover engine (Gemini -> OpenRouter -> Groq -> Deterministic)

import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: string;
}

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Greetings, Operative. I am Cadence Intelligence. I monitor your behavioral signals, capabilities, and objective trajectories. How may I assist your progression today?',
      provider: 'Cadence Core',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsSending(true);

    try {
      // Build history for context
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const response = await api.sendChatMessage(query.trim(), history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        provider: response.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Telemetry error: ${err.message || 'Failed to reach AI provider failover engine.'}`,
        provider: 'System Error',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const samplePrompts = [
    'Analyze my current execution patterns and consistency',
    'Recommend my next high-impact challenge assignment',
    'How do I accelerate my Intellect capability?',
    'What behavioral tendencies have you observed recently?',
  ];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[var(--color-brand)]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
              STRATEGIC CONSULTATION
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
            Cadence Intelligence
          </h1>
        </div>
        <div className="flex items-center space-x-2 font-mono text-[10px] text-[var(--color-text-tertiary)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-status-success)] animate-pulse" />
          <span>FAILOVER ENGINE ACTIVE</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6 space-y-4">
        {messages.map(m => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  isUser
                    ? 'border-[var(--color-border-gold)] bg-[var(--color-brand)]/20 text-[var(--color-brand-highlight)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-brand)]'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? 'border border-[var(--color-border-gold)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]'
                    : 'border border-[var(--color-border)] bg-[var(--color-bg)]/80 text-[var(--color-text-primary)]'
                }`}
              >
                <div className="mb-1 flex items-center justify-between font-mono text-[9px] text-[var(--color-text-tertiary)]">
                  <span>{isUser ? user?.displayName || 'Operative' : `Cadence AI (${m.provider || 'Core'})`}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center space-x-3 text-xs text-[var(--color-text-tertiary)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
              <Bot className="h-4 w-4 text-[var(--color-brand)] animate-spin" />
            </div>
            <span className="font-mono text-[11px]">Synthesizing behavioral intelligence...</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Suggested Prompts Pill Row */}
      <div className="flex items-center space-x-2 overflow-x-auto py-1 text-xs">
        {samplePrompts.map(p => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            disabled={isSending}
            className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-mono text-[10px] text-[var(--color-text-secondary)] hover:border-[var(--color-border-gold)] hover:text-white transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Consult Cadence Intelligence on strategy, capabilities, or execution..."
          disabled={isSending}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-4 pr-12 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none shadow-sm"
        />
        <button
          onClick={() => handleSend()}
          disabled={isSending || !inputValue.trim()}
          className="absolute right-2 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] p-2 text-[#06080A] hover:bg-[var(--color-brand-highlight)] transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
