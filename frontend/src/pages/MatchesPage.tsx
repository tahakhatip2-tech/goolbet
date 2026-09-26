import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import { BetSlip } from '../components/BetSlip';
import { getStreams } from '../api/streams';
import { BackendImage } from '../components/BackendImage';
import { HeroSection } from '../components/ui/HeroSection';
import { Trophy, ShieldHalf, CalendarDays, Clock, Activity, MessageCircle, Zap, Shield, Star, LockKeyhole, Tv, Video, Mic } from 'lucide-react';

import { useToast } from '../context/ToastContext';

import { useTranslation } from 'react-i18next';

export const MatchesPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedBet, setSelectedBet] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MATCH' | 'TRAINING' | 'PODCAST'>('ALL');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchMatches = async () => {
      try {
        const data = await getStreams();
        if (isMounted) {
          // Show SCHEDULED and LIVE
          setMatches(data.filter((m: any) => m.status !== 'ENDED'));
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMatches(); // Initial fetch
    
    // Poll every 5 seconds for instant updates
    const intervalId = setInterval(fetchMatches, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="animate-in fade-in duration-500 min-h-screen">
      <HeroSection 
        title={
          <>
            {t('matches.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-500">{t('matches.title_highlight')}</span>
          </>
        }
        subtitle={t('matches.subtitle')}
        badge={t('matches.badge')}
        minHeight="min-h-[40vh]"
      >
        <div className="flex flex-col items-center gap-4 mt-6 max-w-lg mx-auto">
          {/* Status Filters */}
          <div className="flex gap-2 justify-center w-full">
            <Button 
              variant="outline" 
              onClick={() => setFilter('ALL')}
              className={`text-sm flex-1 rounded-xl shadow-sm font-bold transition-all ${filter === 'ALL' ? 'border-blue-500 text-blue-600 bg-blue-50/50 hover:bg-blue-100/50 hover:text-blue-700' : 'border-slate-300 text-slate-600 bg-white/50 backdrop-blur-sm hover:bg-slate-100 hover:text-slate-900'}`}
            >{t('matches.all')}</Button>
            <Button 
              variant="outline" 
              onClick={() => setFilter('LIVE')}
              className={`text-sm flex-1 rounded-xl shadow-sm font-bold transition-all ${filter === 'LIVE' ? 'border-red-500 text-red-600 bg-red-50/50 hover:bg-red-100/50 hover:text-red-700' : 'border-slate-300 text-slate-600 bg-white/50 backdrop-blur-sm hover:bg-slate-100 hover:text-slate-900'}`}
            >{t('matches.live_badge')}</Button>
            <Button 
              variant="outline" 
              onClick={() => setFilter('UPCOMING')}
              className={`text-sm flex-1 rounded-xl shadow-sm font-bold transition-all ${filter === 'UPCOMING' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/50 hover:text-emerald-700' : 'border-slate-300 text-slate-600 bg-white/50 backdrop-blur-sm hover:bg-slate-100 hover:text-slate-900'}`}
            >{t('matches.upcoming')}</Button>
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 justify-center w-full">
            <Button 
              variant="outline" size="sm"
              onClick={() => setTypeFilter('ALL')}
              className={`text-xs flex-1 rounded-lg font-bold ${typeFilter === 'ALL' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500'}`}
            >الكل</Button>
            <Button 
              variant="outline" size="sm"
              onClick={() => setTypeFilter('MATCH')}
              className={`text-xs flex-1 rounded-lg font-bold flex items-center justify-center gap-1 ${typeFilter === 'MATCH' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'}`}
            ><Trophy size={14}/> مباريات</Button>
            <Button 
              variant="outline" size="sm"
              onClick={() => setTypeFilter('TRAINING')}
              className={`text-xs flex-1 rounded-lg font-bold flex items-center justify-center gap-1 ${typeFilter === 'TRAINING' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            ><Video size={14}/> تمارين</Button>
            <Button 
              variant="outline" size="sm"
              onClick={() => setTypeFilter('PODCAST')}
              className={`text-xs flex-1 rounded-lg font-bold flex items-center justify-center gap-1 ${typeFilter === 'PODCAST' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
            ><Mic size={14}/> بودكاست</Button>
          </div>
        </div>
      </HeroSection>

      <div className="container mx-auto px-4 pt-1 pb-12">

      {isLoading ? (
        <div className="flex justify-center items-center h-[40vh]">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : matches.filter(m => (filter === 'ALL' || (filter === 'UPCOMING' && m.status === 'SCHEDULED') || m.status === filter) && (typeFilter === 'ALL' || m.streamType === typeFilter)).length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-slate-200">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Tv size={64} className="opacity-20 mb-6" />
            <p className="text-xl font-bold text-slate-900 mb-2">لا توجد بثوث حالياً</p>
            <p className="text-slate-500">جرب تغيير عوامل التصفية للبحث عن المزيد.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {matches.filter(m => (filter === 'ALL' || (filter === 'UPCOMING' && m.status === 'SCHEDULED') || m.status === filter) && (typeFilter === 'ALL' || m.streamType === typeFilter)).map((match) => (
            <div key={match.id} className="glass rounded-3xl overflow-hidden relative group border border-slate-200 hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-[0_8px_30px_rgba(34,197,94,0.15)] flex flex-col bg-white/40">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent opacity-50"></div>
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
                  match.status === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {match.status === 'LIVE' && <Activity size={12} className="animate-pulse" />}
                  {match.status === 'LIVE' ? t('match_details.live') : t('match_details.upcoming')}
                </span>
              </div>
              
              {/* League & Source Badge */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-amber-600 text-xs font-bold gap-1.5 shadow-sm">
                  <Trophy size={12} />
                  {match.league || match.academy?.name || 'بطولة'}
                </span>
                {/* Admin vs Academy Badge */}
                {match.isAdminMatch ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 border border-purple-300 text-purple-700 text-[10px] font-bold">
                    🏆 مباراة رسمية
                  </span>
                ) : match.academy ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-[10px] font-bold">
                    🏫 {match.academy.name}
                  </span>
                ) : null}
              </div>

              {/* Teams & Score / Title Area */}
              <div className="pt-12 pb-3 px-3 relative z-10 flex-1">
                <div className="text-center mb-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                    <CalendarDays size={12} />
                    <span>{new Date(match.scheduledAt || match.matchDate || Date.now()).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                    <span className="mx-1">•</span>
                    <Clock size={12} />
                    <span>{new Date(match.scheduledAt || match.matchDate || Date.now()).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>

                {match.streamType === 'MATCH' ? (
                  <div className="flex items-center justify-between gap-2">
                    {/* Team 1 */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="relative w-12 h-12 mb-1 group-hover:scale-110 transition-transform duration-300">
                        <div className={`w-full h-full rounded-full bg-white border flex items-center justify-center p-1 overflow-hidden relative z-10 ${match.team1Score > match.team2Score ? 'border-transparent' : match.team1Score < match.team2Score ? 'border-red-500 shadow-sm opacity-90' : 'border-emerald-500 shadow-sm'}`}>
                          <BackendImage src={match.team1Logo} alt={match.team1Name} className="w-full h-full object-contain" fallbackIcon={<ShieldHalf size={24} className="text-slate-300" />} />
                        </div>
                      </div>
                      <h3 className="font-bold text-xs text-center text-slate-900 line-clamp-2">{match.team1Name}</h3>
                    </div>

                    {/* VS or Score */}
                    <div className="flex flex-col items-center justify-center px-2">
                      {match.status === 'LIVE' || match.status === 'ENDED' ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                            <span className="font-bold text-base text-slate-900">{match.team1Score || 0}</span>
                            <span className="text-slate-400 font-bold">-</span>
                            <span className="font-bold text-base text-slate-900">{match.team2Score || 0}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-primary/30">VS</div>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="relative w-12 h-12 mb-1 group-hover:scale-110 transition-transform duration-300">
                        <div className={`w-full h-full rounded-full bg-white border flex items-center justify-center p-1 overflow-hidden relative z-10 ${match.team2Score > match.team1Score ? 'border-transparent' : match.team2Score < match.team1Score ? 'border-red-500 shadow-sm opacity-90' : 'border-emerald-500 shadow-sm'}`}>
                          <BackendImage src={match.team2Logo} alt={match.team2Name} className="w-full h-full object-contain" fallbackIcon={<ShieldHalf size={24} className="text-slate-300" />} />
                        </div>
                      </div>
                      <h3 className="font-bold text-xs text-center text-slate-900 line-clamp-2">{match.team2Name}</h3>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-bold text-slate-900">{match.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{match.description || 'لا يوجد وصف'}</p>
                  </div>
                )}
              </div>

              {/* Watch Live & Details Buttons */}
              <div className="px-2 pb-2 flex gap-2">
                {match.status === 'LIVE' && (
                  <button
                    onClick={() => navigate(`/watch/${match.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-red-500/30 transition-all duration-200 animate-pulse hover:animate-none"
                  >
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <Tv size={14} />
                    {t('matches.watch')}
                  </button>
                )}
                
                <button
                  onClick={() => navigate(`/match/${match.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
                >
                  <Activity size={14} />
                  {t('match_details.match_info')}
                </button>
              </div>

              {/* Betting Odds Area */}
              {match.streamType === 'MATCH' && (
                <div className="p-2 border-t border-slate-200 bg-white/60 backdrop-blur-md">
                  {match.status !== 'SCHEDULED' ? (
                    // Betting closed banner for LIVE / FINISHED
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 border border-red-200">
                      <LockKeyhole size={14} className="text-red-500 shrink-0" />
                      <span className="text-xs font-bold text-red-500">{t('match_details.bet_not_available')}</span>
                    </div>
                  ) : (
                    // Normal odds buttons for SCHEDULED
                    <>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-2 mb-1">
                        <span>{t('match_details.bet_options')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button 
                          onClick={() => setSelectedBet({ matchId: match.id, team1: match.team1Name, team2: match.team2Name, selectionLabel: t('matches.win_1') + ' ' + match.team1Name, selectionValue: 'TEAM_1_WIN', odds: match.odds?.[0]?.team1Win || 1.5 })}
                          className="flex flex-col items-center py-1.5 px-1 rounded-lg bg-white hover:bg-primary/10 border border-slate-200 hover:border-primary/30 shadow-sm transition-all group/btn"
                        >
                          <span className="text-[9px] text-slate-400 font-bold mb-0.5 group-hover/btn:text-slate-600 transition-colors">{t('matches.win_1')}</span>
                          <span className="font-black text-primary text-xs">{match.odds?.[0]?.team1Win || '-'}</span>
                        </button>
                        <button 
                          onClick={() => setSelectedBet({ matchId: match.id, team1: match.team1Name, team2: match.team2Name, selectionLabel: t('matches.draw'), selectionValue: 'DRAW', odds: match.odds?.[0]?.draw || 3.0 })}
                          className="flex flex-col items-center py-1.5 px-1 rounded-lg bg-white hover:bg-amber-500/10 border border-slate-200 hover:border-amber-500/30 shadow-sm transition-all group/btn"
                        >
                          <span className="text-[9px] text-slate-400 font-bold mb-0.5 group-hover/btn:text-slate-600 transition-colors">{t('matches.draw')}</span>
                          <span className="font-black text-amber-500 text-xs">{match.odds?.[0]?.draw || '-'}</span>
                        </button>
                        <button 
                          onClick={() => setSelectedBet({ matchId: match.id, team1: match.team1Name, team2: match.team2Name, selectionLabel: t('matches.win_2') + ' ' + match.team2Name, selectionValue: 'TEAM_2_WIN', odds: match.odds?.[0]?.team2Win || 2.5 })}
                          className="flex flex-col items-center py-1.5 px-1 rounded-lg bg-white hover:bg-blue-500/10 border border-slate-200 hover:border-blue-500/30 shadow-sm transition-all group/btn"
                        >
                          <span className="text-[9px] text-slate-400 font-bold mb-0.5 group-hover/btn:text-slate-600 transition-colors">{t('matches.win_2')}</span>
                          <span className="font-black text-blue-500 text-xs">{match.odds?.[0]?.team2Win || '-'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <BetSlip 
        selection={selectedBet} 
        onClose={() => setSelectedBet(null)} 
        onConfirm={() => {
          setSelectedBet(null);
        }} 
      />
    </div>
    </div>
  );
};
