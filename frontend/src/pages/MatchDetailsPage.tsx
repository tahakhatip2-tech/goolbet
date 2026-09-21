import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/ui/HeroSection';
import { BackendImage } from '../components/BackendImage';
import { ShieldHalf, Activity, CalendarDays, Clock, Trophy, ChevronRight, LockKeyhole, AlertCircle } from 'lucide-react';
import { BetSlip } from '../components/BetSlip';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';

export const MatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [match, setMatch] = useState<any>(null);
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BETTING' | 'LINEUPS' | 'STATS'>('BETTING');
  const [selectedBet, setSelectedBet] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMatchDetails = async () => {
      try {
        // Fetch our match data
        const res = await api.get(`/matches/${id}`);
        if (isMounted) {
          setMatch(res.data);
          
          // If it has apiFixtureId, fetch the extra details
          if (res.data.apiFixtureId) {
            try {
              const apiRes = await api.get(`/admin/api-football/fixtures/${res.data.apiFixtureId}`);
              if (isMounted) {
                setApiDetails(apiRes.data);
              }
            } catch (e) {
              console.error('Failed to fetch extra API details', e);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          toast.showToast('فشل تحميل بيانات المباراة', 'error');
          setLoading(false);
        }
      }
    };

    fetchMatchDetails();
    
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchMatchDetails, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">المباراة غير موجودة</h2>
        <Button onClick={() => navigate('/matches')}>العودة للمباريات</Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-24 pb-12 relative overflow-hidden">
        {/* Background Blur */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-[128px] animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <button 
            onClick={() => navigate('/matches')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-bold"
          >
            <ChevronRight size={16} /> العودة للمباريات
          </button>

          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold mb-6 backdrop-blur-md">
              <Trophy size={14} className="text-amber-400" />
              {match.league}
            </span>

            <div className="flex items-center justify-center gap-4 md:gap-12 w-full max-w-3xl">
              {/* Home Team */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 rounded-full p-4 border-2 border-white/20 backdrop-blur-md mb-4 shadow-2xl">
                  <BackendImage src={match.team1Logo} alt={match.team1Name} className="w-full h-full object-contain" fallbackIcon={<ShieldHalf size={48} className="text-slate-400" />} />
                </div>
                <h2 className="text-lg md:text-2xl font-black text-center">{match.team1Name}</h2>
              </div>

              {/* Score / Status */}
              <div className="flex flex-col items-center shrink-0">
                <div className="text-center mb-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 font-medium mb-4">
                    <CalendarDays size={14} />
                    <span>{new Date(match.matchDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {match.status === 'LIVE' || match.status === 'FINISHED' ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                      <span className="font-black text-4xl md:text-5xl">{match.team1Score || 0}</span>
                      <span className="text-slate-500 font-bold text-2xl">-</span>
                      <span className="font-black text-4xl md:text-5xl">{match.team2Score || 0}</span>
                    </div>
                    {match.status === 'LIVE' && (
                      <span className="flex items-center gap-2 text-sm text-red-400 font-bold mt-4 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full">
                        <Activity size={14} className="animate-pulse" />
                        {match.liveUpdate || 'مباشر'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-3xl md:text-4xl font-black text-slate-600 bg-black/20 px-6 py-3 rounded-2xl border border-white/5">VS</div>
                    <span className="flex items-center gap-2 text-sm text-blue-400 font-bold mt-4 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
                      <Clock size={14} />
                      {new Date(match.matchDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 rounded-full p-4 border-2 border-white/20 backdrop-blur-md mb-4 shadow-2xl">
                  <BackendImage src={match.team2Logo} alt={match.team2Name} className="w-full h-full object-contain" fallbackIcon={<ShieldHalf size={48} className="text-slate-400" />} />
                </div>
                <h2 className="text-lg md:text-2xl font-black text-center">{match.team2Name}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="container mx-auto px-4 -mt-8 relative z-20 pb-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button 
              onClick={() => setActiveTab('BETTING')}
              className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'BETTING' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
            >
              المراهنة
            </button>
            <button 
              onClick={() => setActiveTab('LINEUPS')}
              className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'LINEUPS' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
            >
              التشكيلة
            </button>
            <button 
              onClick={() => setActiveTab('STATS')}
              className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'STATS' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
            >
              الإحصائيات
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-10">
            {activeTab === 'BETTING' && (
              <div className="max-w-2xl mx-auto">
                {match.status !== 'UPCOMING' ? (
                  <div className="bg-red-50 text-red-600 p-8 rounded-2xl text-center border border-red-100 flex flex-col items-center">
                    <LockKeyhole size={48} className="mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">أُغلق باب المراهنة</h3>
                    <p className="text-red-500/80">المباراة جارية أو انتهت، لا يمكن وضع رهانات جديدة.</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">اختر توقعك للمباراة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button 
                        onClick={() => setSelectedBet({ matchId: match.id, team1: match.team1Name, team2: match.team2Name, selectionLabel: 'فوز ' + match.team1Name, selectionValue: 'TEAM_1_WIN', odds: match.odds?.[0]?.team1Win || 1.5 })}
                        className="bg-white border-2 border-slate-100 hover:border-primary rounded-2xl p-6 flex flex-col items-center transition-all hover:shadow-lg hover:shadow-primary/10 group"
                      >
                        <span className="text-slate-500 text-sm font-bold mb-2 group-hover:text-slate-700">فوز {match.team1Name}</span>
                        <span className="text-3xl font-black text-primary">{match.odds?.[0]?.team1Win || '-'}</span>
                      </button>
                      
                      <button 
                        onClick={() => setSelectedBet({ matchId: match.id, team1: match.team1Name, team2: match.team2Name, selectionLabel: 'تعادل', selectionValue: 'DRAW', odds: match.odds?.[0]?.draw || 3.0 })}
                        className="bg-white border-2 border-slate-100 hover:border-amber-500 rounded-2xl p-6 flex flex-col items-center transition-all hover:shadow-lg hover:shadow-amber-500/10 group"
                      >
                        <span className="text-slate-500 text-sm font-bold mb-2 group-hover:text-slate-700">تعادل</span>
                        <span className="text-3xl font-black text-amber-500">{match.odds?.[0]?.draw || '-'}</span>
                      </button>
                      
                      <button 
                        onClick={() => setSelectedBet({ matchId: match.id, team1: match.team1Name, team2: match.team2Name, selectionLabel: 'فوز ' + match.team2Name, selectionValue: 'TEAM_2_WIN', odds: match.odds?.[0]?.team2Win || 2.5 })}
                        className="bg-white border-2 border-slate-100 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
                      >
                        <span className="text-slate-500 text-sm font-bold mb-2 group-hover:text-slate-700">فوز {match.team2Name}</span>
                        <span className="text-3xl font-black text-blue-500">{match.odds?.[0]?.team2Win || '-'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'LINEUPS' && (
              <div className="max-w-4xl mx-auto">
                {!apiDetails?.lineups || apiDetails.lineups.length === 0 ? (
                  <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">التشكيلات غير متوفرة بعد</h3>
                    <p className="text-slate-500">عادة ما يتم الإعلان عن التشكيلات قبل ساعة من بداية المباراة.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Home Lineup */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
                        <img src={apiDetails.lineups[0].team.logo} alt="home" className="w-12 h-12" />
                        <div>
                          <h4 className="font-bold text-lg">{apiDetails.lineups[0].team.name}</h4>
                          <span className="text-sm font-bold text-slate-500">خطة: {apiDetails.lineups[0].formation}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-bold text-slate-700 mb-3">التشكيلة الأساسية</h5>
                        {apiDetails.lineups[0].startXI.map((player: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                            <span className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{player.player.number}</span>
                            <span className="font-bold text-sm text-slate-800">{player.player.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Away Lineup */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
                        <img src={apiDetails.lineups[1].team.logo} alt="away" className="w-12 h-12" />
                        <div>
                          <h4 className="font-bold text-lg">{apiDetails.lineups[1].team.name}</h4>
                          <span className="text-sm font-bold text-slate-500">خطة: {apiDetails.lineups[1].formation}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-bold text-slate-700 mb-3">التشكيلة الأساسية</h5>
                        {apiDetails.lineups[1].startXI.map((player: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                            <span className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{player.player.number}</span>
                            <span className="font-bold text-sm text-slate-800">{player.player.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'STATS' && (
              <div className="max-w-3xl mx-auto">
                {!apiDetails?.statistics || apiDetails.statistics.length === 0 ? (
                  <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد إحصائيات متاحة حالياً</h3>
                    <p className="text-slate-500">تبدأ الإحصائيات بالظهور عند بداية المباراة.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {apiDetails.statistics[0].statistics.map((stat: any, idx: number) => {
                      const homeValue = stat.value === null ? 0 : typeof stat.value === 'string' ? parseInt(stat.value) : stat.value;
                      const awayStat = apiDetails.statistics[1].statistics.find((s: any) => s.type === stat.type);
                      const awayValue = awayStat?.value === null ? 0 : typeof awayStat?.value === 'string' ? parseInt(awayStat.value) : awayStat?.value;
                      const total = homeValue + awayValue || 1; // prevent division by zero
                      
                      const homePercent = (homeValue / total) * 100;
                      const awayPercent = (awayValue / total) * 100;

                      return (
                        <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">{stat.value || 0}</span>
                            <span className="text-xs font-bold text-slate-500">{stat.type}</span>
                            <span className="font-bold text-sm">{awayStat?.value || 0}</span>
                          </div>
                          <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-200">
                            <div className="bg-primary" style={{ width: `${homePercent}%` }}></div>
                            <div className="bg-blue-500" style={{ width: `${awayPercent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <BetSlip 
        selection={selectedBet} 
        onClose={() => setSelectedBet(null)} 
        onConfirm={() => {
          setSelectedBet(null);
        }} 
      />
    </div>
  );
};
