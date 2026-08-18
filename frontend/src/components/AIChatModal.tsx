import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, Bot, User, HelpCircle } from 'lucide-react';
import { ChatMessage } from '../types';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Greetings. I am LifeLoan AI, your dedicated loan intelligence & financial twin advisor. How can I assist with your borrowing capacity or credit risk strategy today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    'How do I double my borrowing capacity?',
    'Optimal EMI for $150k income?',
    'Is refinancing my 5.8% mortgage optimal now?',
    'How does my Digital Twin calculate risk?',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      if (!res.ok) throw new Error('AI Chat service error');
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'LifeLoan AI algorithm suggests optimizing DTI below 30% to maximize pre-approval options.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'LifeLoan AI: To maximize borrowing capacity, reduce credit utilization below 10% and convert short-term revolving debt into a fixed 5-year facility.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09100c]/85 backdrop-blur-md">
      <div className="relative flex flex-col h-[620px] w-full max-w-xl rounded-2xl glass-panel border border-[#3c4a42] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242c27] px-6 py-4 bg-[#161d19]">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10b981] text-[#003824]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#dde4dd]">LifeLoan AI Assistant</h3>
              <div className="flex items-center space-x-1 text-[10px] text-[#4edea3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-ping" />
                <span>Online • Intelligence v2.5</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#86948a] hover:bg-[#1a211d] hover:text-[#dde4dd]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-[#1e1b4b] text-[#b9c8de]'
                    : 'bg-[#10b981]/20 text-[#4edea3]'
                }`}
              >
                {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#10b981] text-[#003824] font-medium'
                    : 'bg-[#0e1511] text-[#dde4dd] border border-[#242c27]'
                }`}
              >
                <p>{msg.text}</p>
                <span className={`block text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-[#003824]/70' : 'text-[#86948a]'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#4edea3]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing financial model...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-6 py-2 border-t border-[#242c27] bg-[#0e1511]/50 overflow-x-auto flex space-x-2">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="shrink-0 rounded-full border border-[#2f3632] bg-[#161d19] px-3 py-1 text-[10px] text-[#bbcabf] hover:border-[#4edea3] hover:text-[#4edea3] transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#242c27] bg-[#161d19]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask LifeLoan AI about your borrowing capacity, DTI, or interest rates..."
              className="flex-1 rounded-full bg-[#0e1511] border border-[#242c27] px-4 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10b981] text-[#003824] hover:bg-[#4edea3] disabled:opacity-40 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
