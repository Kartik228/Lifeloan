import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { api, getStoredUser } from '../api';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text:
        'Greetings. I am LifeLoan AI, your financial intelligence advisor. I have access to your active borrowing facilities, credit metrics, and ML risk evaluation. How can I assist your loan planning today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ============================================================
  // AUTO-SCROLL TO BOTTOM
  // ============================================================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // ============================================================
  // PREFILL FROM LOCALSTORAGE ON OPEN
  // ============================================================
  useEffect(() => {
    if (isOpen) {
      const initialPrompt = localStorage.getItem('lifeloan_chat_initial_prompt');
      if (initialPrompt) {
        localStorage.removeItem('lifeloan_chat_initial_prompt');
        handleSend(initialPrompt);
      }
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // 6 REQUIRED QUICK PROMPTS
  // ============================================================
  const quickQuestions = [
    'Why was I approved?',
    'Why is my risk high?',
    'How can I improve my borrowing capacity?',
    'Can I afford another loan?',
    'Explain my Digital Twin simulation',
    'Help me reduce my debt',
  ];

  // ============================================================
  // BUILD GROUNDED USER CONTEXT
  // ============================================================
  const getLifeLoanContext = async () => {
    try {
      const [profile, loans, latestApp, digitalTwinScenario] = await Promise.all([
        api.get('/financial-profile').catch(() => null),
        api.get('/loans').catch(() => []),
        api.get('/applications/latest').catch(() => null),
        Promise.resolve().then(() => {
          try {
            const raw = localStorage.getItem('lifeloan_digital_twin_scenario');
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        }),
      ]);

      return {
        user: getStoredUser(),
        profile,
        active_loans: loans,
        latest_application: latestApp?.application,
        latest_prediction: latestApp?.prediction,
        digital_twin_scenario: digitalTwinScenario,
      };
    } catch (e) {
      return { user: getStoredUser() };
    }
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setLastFailedQuery(null);

    try {
      const context = await getLifeLoanContext();
      const response = await api.post<{ reply: string }>('/ai-chat', {
        prompt: query,
        context: context,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      setLastFailedQuery(query);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text:
          err.message ||
          'LifeLoan AI is temporarily unavailable or experiencing high load. Please click "Try Again" in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-init',
        sender: 'ai',
        text:
          'Chat history reset. How else can I assist your loan planning or financial decisions?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative flex flex-col h-[640px] w-full max-w-2xl rounded-3xl border border-[#242c27] bg-[#161d19] shadow-2xl overflow-hidden">
        {/* ============================================================
            HEADER
        ============================================================ */}
        <div className="flex items-center justify-between border-b border-[#242c27] px-6 py-4 bg-[#101713]/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#10b981]/10 border border-[#4edea3]/20">
              <Bot className="h-5 w-5 text-[#4edea3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#dde4dd]">LifeLoan AI Advisor</h3>
                <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
              </div>
              <p className="text-[10px] text-[#71837a]">
                Grounded in your authentic database profile & SHAP XAI factors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearChat}
              title="Clear conversation history"
              className="rounded-lg p-2 text-[#71837a] hover:text-[#dde4dd] hover:bg-[#1f2722] transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#71837a] hover:text-[#dde4dd] hover:bg-[#1f2722] transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ============================================================
            MESSAGES AREA
        ============================================================ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#4edea3]">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-5 ${
                    isUser
                      ? 'bg-[#10b981] text-[#003824] font-medium'
                      : 'bg-[#0e1511] text-[#dde4dd] border border-[#242c27]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`mt-1.5 block text-[9px] ${
                      isUser ? 'text-[#003824]/70' : 'text-[#52625a]'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#242c27] text-[#9aa9a1]">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#4edea3]">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-[#242c27] bg-[#0e1511] px-4 py-3 text-xs text-[#71837a] flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4edea3]" />
                <span>LifeLoan AI is analyzing your profile...</span>
              </div>
            </div>
          )}

          {lastFailedQuery && (
            <div className="flex justify-center my-2">
              <button
                type="button"
                onClick={() => handleSend(lastFailedQuery)}
                className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry Question
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ============================================================
            QUICK PROMPTS
        ============================================================ */}
        <div className="border-t border-[#242c27] bg-[#101713]/60 px-6 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#71837a] mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#4edea3]" />
            Quick Consultation Prompts
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={loading}
                className="rounded-lg border border-[#242c27] bg-[#161d19] px-2.5 py-1 text-[11px] text-[#9aa9a1] hover:border-[#4edea3]/40 hover:text-[#4edea3] transition disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================
            INPUT AREA
        ============================================================ */}
        <div className="border-t border-[#242c27] p-4 bg-[#161d19]">
          <div className="relative flex items-center gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your approval factors, EMI impact, or reduction strategies... (Enter to send)"
              className="flex-1 resize-none rounded-2xl border border-[#242c27] bg-[#0e1511] px-4 py-3 text-xs text-[#dde4dd] placeholder-[#52625a] focus:border-[#4edea3] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#10b981] text-[#003824] hover:bg-[#4edea3] transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-[#52625a] mt-2 text-center">
            Educational guidance powered by Gemini 3.5. LifeLoan predictions are algorithmic estimates and not loan approval guarantees.
          </p>
        </div>
      </div>
    </div>
  );
};
export default AIChatModal;