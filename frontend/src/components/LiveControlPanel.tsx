import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Send, Clock, Trophy, Zap, Shield, Flag } from 'lucide-react';
import api from '../api/axios';

interface Match {
  id: string;
  team1Name: string;
  team1Logo?: string;
  team2Name: string;
  team2Logo?: string;
  team1Score: number;
  team2Score: number;
  status: string;
  matchPhase?: string;
  liveUpdate?: string;
  isKnockout: boolean;
  extraTimeTeam1: number;
  extraTimeTeam2: number;
  penaltiesTeam1: number;
  penaltiesTeam2: number;
  apiFixtureId?: number | null;
}

interface LiveControlPanelProps {
  match: Match;
  onClose: () => void;
  onUpdate: () => void;
}

const PHASES = [
  { value: 'FIRST_HALF',        label: 'الشوط الأول',        icon: '▶', color: 'green' },
  { value: 'HALF_TIME',         label: 'استراحة',            icon: '☕', color: 'yellow' },
  { value: 'SECOND_HALF',       label: 'الشوط الثاني',       icon: '▶▶', color: 'green' },
  { value: 'EXTRA_TIME_FIRST',  label: 'الوقت الإضافي 1',    icon: '⚡', color: 'orange' },
  { value: 'EXTRA_TIME_SECOND', label: 'الوقت الإضافي 2',    icon: '⚡', color: 'orange' },
  { value: 'PENALTIES',         label: 'ركلات الترجيح',      icon: '🥅', color: 'red' },
];

const phaseColorMap: Record<string, string> = {
  green: 'bg-green-500/10 text-green-700 border-green-300 hover:bg-green-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-700 border-yellow-300 hover:bg-yellow-500/20',
  orange: 'bg-orange-500/10 text-orange-700 border-orange-300 hover:bg-orange-500/20',
  red: 'bg-red-500/10 text-red-700 border-red-300 hover:bg-red-500/20',
};

export const LiveControlPanel: React.FC<LiveControlPanelProps> = ({ match, onClose, onUpdate }) => {
  const [score1, setScore1] = useState(match.team1Score);
  const [score2, setScore2] = useState(match.team2Score);
  const [phase, setPhase] = useState(match.matchPhase || 'FIRST_HALF');
  const [liveUpdate, setLiveUpdate] = useState('');
  const [isKnockout, setIsKnockout] = useState(match.isKnockout);
  const [et1, setEt1] = useState(match.extraTimeTeam1);
  const [et2, setEt2] = useState(match.extraTimeTeam2);
  const [pen1, setPen1] = useState(match.penaltiesTeam1);
  const [pen2, setPen2] = useState(match.penaltiesTeam2);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const showInExtra = isKnockout && (score1 === score2);
  const showPenalties = showInExtra && (et1 === et2) && (phase === 'PENALTIES' || match.penaltiesTeam1 > 0 || match.penaltiesTeam2 > 0);

  const saveAll = async () => {
    setIsSaving(true);
    try {
      await api.put(`/admin/matches/${match.id}/live-update`, {
        team1Score: score1,
        team2Score: score2,
        matchPhase: phase,
        liveUpdate: liveUpdate || undefined,
        isKnockout,
        extraTimeTeam1: et1,
        extraTimeTeam2: et2,
        penaltiesTeam1: pen1,
        penaltiesTeam2: pen2,
      });
      setSavedMsg('✓ تم الحفظ');
      setLiveUpdate('');
      setTimeout(() => setSavedMsg(''), 2500);
      onUpdate();
    } catch {
      setSavedMsg('✗ فشل الحفظ');
      setTimeout(() => setSavedMsg(''), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const ScoreControl = ({
    label, value, onChange
  }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px] text-center">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center hover:bg-red-500/20 transition-colors font-bold border border-red-200"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-3xl font-black text-slate-900 w-10 text-center">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center hover:bg-green-500/20 transition-colors font-bold border border-green-200"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const content = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          
          {match.apiFixtureId ? (
            <div className="p-8 text-center flex flex-col items-center">
              <Server size={48} className="text-purple-500 mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">مباراة تدار تلقائياً (API)</h3>
              <p className="text-slate-500 text-sm mb-6">
                هذه المباراة متصلة بشكل مباشر بخدمة API-Football. يتم تحديث النتيجة ووقت المباراة وأحداثها تلقائياً بدون تدخل يدوي.
              </p>
              <button
                onClick={onClose}
                className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold transition-all w-full"
              >
                حسناً، إغلاق
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-5 py-4 flex items-center justify-between shrink-0 rounded-t-3xl sm:rounded-t-3xl">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">لوحة التحكم الحي</h3>
                <p className="text-green-100 text-[10px]">{match.team1Name} vs {match.team2Name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-ping" />
                مباشر
              </span>
              <button onClick={onClose} className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 min-h-0 p-4 space-y-4">

            {/* SCORE CONTROL */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-700">النتيجة الحالية</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <ScoreControl label={match.team1Name} value={score1} onChange={setScore1} />
                <div className="text-slate-300 font-black text-xl">VS</div>
                <ScoreControl label={match.team2Name} value={score2} onChange={setScore2} />
              </div>
            </div>

            {/* PHASE CONTROL */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-700">مرحلة المباراة</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PHASES.filter(p => {
                  if (['EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'PENALTIES'].includes(p.value)) {
                    return isKnockout;
                  }
                  return true;
                }).map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPhase(p.value)}
                    className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      phase === p.value
                        ? 'ring-2 ring-offset-1 ring-blue-500 ' + phaseColorMap[p.color]
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm">{p.icon}</span>
                    <span className="block">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* KNOCKOUT TOGGLE */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-purple-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-700">مباراة إقصائية</span>
                    <p className="text-[10px] text-slate-400">يتيح الوقت الإضافي وركلات الترجيح</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsKnockout(!isKnockout)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isKnockout ? 'bg-purple-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isKnockout ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* EXTRA TIME (only when knockout and draw) */}
            {showInExtra && (
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-orange-700">أهداف الوقت الإضافي</span>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <ScoreControl label={match.team1Name} value={et1} onChange={setEt1} />
                  <div className="text-orange-300 font-black text-xl">+</div>
                  <ScoreControl label={match.team2Name} value={et2} onChange={setEt2} />
                </div>
              </div>
            )}

            {/* PENALTIES (only when knockout, draw after 90 and ET) */}
            {showPenalties && (
              <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-700">ركلات الترجيح</span>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <ScoreControl label={match.team1Name} value={pen1} onChange={setPen1} />
                  <div className="text-red-300 font-black text-xl">🥅</div>
                  <ScoreControl label={match.team2Name} value={pen2} onChange={setPen2} />
                </div>
              </div>
            )}

            {/* LIVE TEXT UPDATE */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-700">تحديث نصي حي للمستخدمين</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={liveUpdate}
                  onChange={e => setLiveUpdate(e.target.value)}
                  placeholder="مثال: دقيقة 67 - هدف تم إلغاؤه..."
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 bg-white"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['الشوط الثاني انطلق!', 'بطاقة صفراء', 'إصابة لاعب', 'تغيير لاعب', 'ضربة ركنية'].map(t => (
                  <button
                    key={t}
                    onClick={() => setLiveUpdate(t)}
                    className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer - Save Button */}
          <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
            {savedMsg && (
              <div className={`text-center text-xs font-bold mb-2 ${savedMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                {savedMsg}
              </div>
            )}
            <button
              onClick={saveAll}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-green-500/30 hover:from-green-600 hover:to-emerald-600 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </span>
              ) : '💾 حفظ جميع التحديثات'}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
};
