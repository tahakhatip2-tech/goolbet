import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Send, Wifi, WifiOff, Smile } from 'lucide-react';
import api from '../api/axios';
import { useMatchChat } from '../hooks/useMatchChat';
import type { ChatMessage } from '../hooks/useMatchChat';
import { AgoraViewer } from '../components/AgoraViewer';

const REACTIONS = ['⚽', '🔥', '❤️', '😱', '👏', '😂'];

const PHASE_LABELS: Record<string, string> = {
  FIRST_HALF: 'الشوط الأول',
  HALF_TIME: 'استراحة',
  SECOND_HALF: 'الشوط الثاني',
  EXTRA_TIME: 'الوقت الإضافي',
  PENALTIES: 'ضربات الترجيح',
  FINISHED: 'انتهت المباراة'
};

interface Match {
  id: string;
  team1Name: string;
  team1Logo?: string;
  team1Score: number;
  team2Name: string;
  team2Logo?: string;
  team2Score: number;
  status: string;
  matchPhase?: string;
  liveUpdate?: string;
  streamUrl?: string;
  isStreamActive: boolean;
  league: string;
}

export const WatchPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const { messages, viewerCount, reactions, connected, sendMessage, sendReaction } = useMatchChat({
    matchId: matchId || '',
    token,
    initialMessages
  });

  // Load match data + previous messages
  useEffect(() => {
    if (!matchId) return;
    Promise.all([
      api.get(`/matches/${matchId}`),
      api.get(`/chat/matches/${matchId}/comments`)
    ]).then(([matchRes, commentsRes]) => {
      setMatch(matchRes.data);
      setInitialMessages(commentsRes.data.map((c: any) => ({
        id: c.id,
        userId: c.userId,
        username: c.user?.firstName || c.user?.username || 'مستخدم',
        message: c.message,
        createdAt: c.createdAt
      })));
    }).catch(() => navigate('/matches'));
  }, [matchId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const msg = inputMsg.trim();
    if (!msg || !token) return;
    sendMessage(msg);
    setInputMsg('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const embedUrl = match.streamUrl?.includes('youtube.com/watch?v=')
    ? match.streamUrl.replace('watch?v=', 'embed/') + '?autoplay=1&rel=0&controls=0&modestbranding=1&disablekb=1'
    : match.streamUrl;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" dir="rtl">
      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/matches')}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <ArrowRight size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {match.status === 'LIVE' && (
              <span className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                LIVE
              </span>
            )}
            <span className="text-white font-bold text-sm truncate">
              {match.team1Name} vs {match.team2Name}
            </span>
          </div>
          <p className="text-slate-400 text-xs">{match.league}</p>
        </div>
        {/* Viewer count */}
        <div className="flex items-center gap-1.5 text-slate-400 text-sm shrink-0">
          <Users size={15} />
          <span>{viewerCount}</span>
        </div>
        {/* Connection */}
        <div className={`p-1 ${connected ? 'text-emerald-400' : 'text-slate-600'}`}>
          {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ===== LEFT: Video + Score ===== */}
        <div className="lg:flex-1 flex flex-col bg-black">
          {/* Score Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 px-4 py-3">
            <div className="flex items-center justify-center gap-4">
              {/* Team 1 */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-white font-bold text-sm md:text-base truncate">{match.team1Name}</span>
                {match.team1Logo
                  ? <img src={match.team1Logo} className="w-8 h-8 object-contain" alt="" />
                  : <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">{match.team1Name[0]}</div>
                }
              </div>
              {/* Score */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-3xl font-black text-white">{match.team1Score}</span>
                <span className="text-slate-500 text-xl font-bold">—</span>
                <span className="text-3xl font-black text-white">{match.team2Score}</span>
              </div>
              {/* Team 2 */}
              <div className="flex items-center gap-2 flex-1">
                {match.team2Logo
                  ? <img src={match.team2Logo} className="w-8 h-8 object-contain" alt="" />
                  : <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm">{match.team2Name[0]}</div>
                }
                <span className="text-white font-bold text-sm md:text-base truncate">{match.team2Name}</span>
              </div>
            </div>
            {/* Phase + live update */}
            <div className="text-center mt-1">
              {match.matchPhase && (
                <span className="text-xs text-blue-400 font-semibold">
                  {PHASE_LABELS[match.matchPhase] || match.matchPhase}
                </span>
              )}
              {match.liveUpdate && (
                <p className="text-xs text-yellow-400 mt-0.5">{match.liveUpdate}</p>
              )}
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 bg-black relative" style={{ minHeight: '240px' }}>
            {match.isStreamActive && match.streamUrl?.startsWith('agora://') ? (
              <AgoraViewer channelName={match.streamUrl.replace('agora://', '')} />
            ) : match.isStreamActive && embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="Live Stream"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">📺</span>
                </div>
                <p className="text-slate-400 font-semibold">البث غير متاح حالياً</p>
                <p className="text-slate-600 text-sm mt-1">سيبدأ البث عند انطلاق المباراة</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT: Live Chat ===== */}
        <div className="w-full lg:w-80 xl:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col" style={{ height: '60vh' }}>
          {/* Chat header */}
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-white font-bold text-sm flex items-center gap-2">
              💬 الدردشة الحية
            </span>
            <span className="text-xs text-slate-500">{messages.length} رسالة</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 && (
              <div className="text-center text-slate-600 text-sm py-8">
                <p className="text-2xl mb-2">💬</p>
                <p>كن أول من يعلق على هذه المباراة!</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 items-start ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 shrink-0 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {msg.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className={`max-w-[75%] ${msg.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                  <span className="text-xs text-slate-500 mb-0.5 px-1">{msg.username}</span>
                  <div className={`px-3 py-1.5 rounded-2xl text-sm leading-relaxed ${
                    msg.userId === user?.id
                      ? 'bg-blue-600 text-white rounded-tl-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tr-sm'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Reactions bar */}
          <div className="px-3 py-2 border-t border-slate-800 shrink-0">
            <div className="flex gap-2 justify-center mb-2">
              {REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform active:scale-95"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input */}
            {token ? (
              <div className="flex items-center gap-2 bg-slate-800 rounded-2xl px-3 py-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب تعليقك..."
                  maxLength={200}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none min-w-0"
                  dir="rtl"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputMsg.trim()}
                  className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors p-1"
                >
                  <Send size={18} />
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500">
                <button onClick={() => navigate('/login')} className="text-blue-400 underline">
                  سجل دخولك
                </button>
                {' '}للمشاركة في الدردشة
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Floating reactions animation */}
      <div className="fixed bottom-24 left-4 pointer-events-none z-50">
        {reactions.map(r => (
          <div
            key={r.id}
            className="absolute text-3xl animate-bounce"
            style={{
              animation: 'floatUp 2.5s ease-out forwards',
              left: `${Math.random() * 60}px`
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
        }
      `}</style>
    </div>
  );
};
