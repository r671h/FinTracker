'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader, Spinner } from '@/components/ui';
import { aiApi } from '@/lib/api';
import { ChatMessage } from '@/types';

const QUICK_PROMPTS = [
  'Summarise my spending',
  'Top spending category?',
  'Where can I save money?',
  'Biggest transactions',
  'Income vs expenses ratio',
];

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    try {
      const res = await aiApi.chat(content, messages);
      setMessages([...history, { role: 'assistant', content: res.data.reply }]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'AI request failed');
      setMessages(history);
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <PageHeader title="AI Analysis" />

      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-3">
        <div className="card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-purple-50/50 flex-shrink-0">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 12.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zm-2-3a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm-2-3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"/>
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold">AI Finance Analyst</div>
              <div className="text-[10px] text-gray-400">Powered by Gemini</div>
            </div>
          </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="max-w-xs bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 leading-relaxed">
                👋 Hi! I'm your AI finance analyst. Ask me anything about your spending patterns and savings.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={clsx(
                  'max-w-[85%] text-sm leading-relaxed rounded-2xl px-4 py-3',
                  msg.role === 'user' ? 'bg-brand-green text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 flex gap-2 p-3 flex-shrink-0">
            <input
              className="input flex-1 text-sm"
              placeholder="Ask about your finances…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <button className="btn btn-primary text-xs px-4" onClick={() => sendMessage()}
              disabled={loading || !input.trim()}>
              {loading ? <Spinner size="sm" /> : 'Send'}
            </button>
          </div>
        </div>

        {/* Quick prompts — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} onClick={() => sendMessage(p)} disabled={loading}
              className="btn text-xs whitespace-nowrap hover:border-brand-green hover:text-brand-green flex-shrink-0">
              {p}
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}