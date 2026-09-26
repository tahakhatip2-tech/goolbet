import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Mail, Trophy, Activity, Wallet, ShieldCheck } from 'lucide-react';

import { HeroSection } from '../components/ui/HeroSection';
import { useTranslation } from 'react-i18next';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [bets, setBets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await api.get('/auth/me'); // Ensure this route exists or we can just fetch bets
        setUser(userRes.data);
      } catch (err) {
        // User profile might not exist, but we can still fetch bets
      }

      try {
        const betsRes = await api.get('/bets');
        setBets(betsRes.data);
      } catch (error) {
        console.error('Failed to fetch bets', error);
      }

      try {
        const walletRes = await api.get('/wallet');
        setWallet(walletRes.data);
      } catch (error) {
        console.error('Failed to fetch wallet', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const activeBets = bets.filter(b => b.status === 'PENDING');
  const pastBets = bets.filter(b => b.status !== 'PENDING');
  const wonBets = bets.filter(b => b.status === 'WON');

  const getSelectionText = (selection: string, team1Name: string, team2Name: string) => {
    if (selection === 'TEAM_1_WIN') return `${t('matches.win_1')} ${team1Name}`;
    if (selection === 'TEAM_2_WIN') return `${t('matches.win_2')} ${team2Name}`;
    if (selection === 'DRAW') return t('matches.draw');
    return selection;
  };

  const getStatusBadge = (status: string, potentialPayout?: number) => {
    if (status === 'WON') {
      return (
        <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap">
          <Trophy size={12} />
          {t('profile.status_won')} +${Number(potentialPayout).toFixed(2)}
        </div>
      );
    }
    if (status === 'LOST') {
      return (
        <div className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
          {t('profile.status_lost')}
        </div>
      );
    }
    return (
      <div className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap">
        <Activity size={12} />
        {t('profile.status_pending')}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 min-h-screen">
      <HeroSection 
        title={
          <>
            {t('profile.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t('profile.title_highlight')}</span>
          </>
        }
        subtitle={t('profile.subtitle')}
        badge={t('profile.badge')}
        minHeight="min-h-[30vh]"
      >
        <div className="mt-8 grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto">
          {/* Total Bets Card */}
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/70 transition-all cursor-pointer">
            <Activity size={20} className="text-blue-500 mb-1" />
            <span className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">{t('nav.bets')}</span>
            <span className="text-lg md:text-xl font-black text-slate-900">{bets.length}</span>
          </div>
          
          {/* Won Bets Card */}
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/70 transition-all cursor-pointer">
            <Trophy size={20} className="text-green-500 mb-1" />
            <span className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">{t('profile.status_won')}</span>
            <span className="text-lg md:text-xl font-black text-slate-900">{wonBets.length}</span>
          </div>

          {/* Real Balance Card */}
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/70 transition-all cursor-pointer">
            <Wallet size={20} className="text-slate-700 mb-1" />
            <span className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">{t('wallet.available_balance')}</span>
            <span className="text-lg md:text-xl font-black text-slate-900">${wallet?.balance?.toFixed(1) || '0.0'}</span>
          </div>

          {/* Bonus Balance Card */}
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/70 transition-all cursor-pointer">
            <span className="text-xl mb-1">🎁</span>
            <span className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">{t('wallet.bonus_balance')}</span>
            <span className="text-lg md:text-xl font-black text-slate-900">${wallet?.bonusBalance?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </HeroSection>

      <div className="container mx-auto px-4 mt-2 mb-8 max-w-5xl relative z-20">

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active Bets Section */}
          <section>
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                <Activity size={20} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{t('wallet.locked_bets')}</h2>
            </div>
            
            <div className="grid gap-4">
              {activeBets.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Trophy size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">{t('profile.no_bets')}</h3>
                  <p className="text-slate-500 text-sm"></p>
                </div>
              ) : (
                activeBets.map(bet => (
                  <div key={bet.id} className="bg-white rounded-3xl p-1 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                    <div className="bg-slate-50/50 rounded-[1.25rem] p-5 md:p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>
                      
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                        <div className="text-center md:text-right w-full">
                          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[10px] font-bold mb-4 tracking-wide">
                            <Activity size={12} />
                            {t('matches.upcoming')}
                          </div>
                          <h3 className="font-bold text-xl mb-3 text-slate-800">{bet.match.team1Name} <span className="text-slate-400 font-normal px-2">{t('matches.vs')}</span> {bet.match.team2Name}</h3>
                          
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm">
                            <span className="text-slate-500 text-xs font-bold">{t('profile.bet_on')}</span>
                            <span className="bg-slate-800 text-white font-bold px-3 py-1 rounded-md text-xs shadow-sm">{getSelectionText(bet.selection, bet.match.team1Name, bet.match.team2Name)}</span>
                            <span className="text-[10px] text-slate-400 font-bold mr-2">({t('profile.odds')} {bet.oddsAtBet})</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                          <div className="bg-white rounded-2xl p-4 flex-1 md:w-32 text-center border border-slate-100 shadow-sm flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">{t('profile.stake')}</span>
                            <span className="font-black text-xl text-slate-800">${Number(bet.stake).toFixed(2)}</span>
                          </div>
                          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 flex-1 md:w-32 text-center border border-primary/20 shadow-sm flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px]"></div>
                            <span className="text-[10px] font-bold text-primary/80 mb-1 relative z-10">{t('profile.potential_return')}</span>
                            <span className="font-black text-xl text-primary relative z-10">${Number(bet.potentialPayout).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div>
          {/* History Section */}
          <section className="sticky top-28">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                <Wallet size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('profile.bets_history')}</h2>
            </div>

            <div className="glass rounded-3xl p-2 border border-border/40 max-h-[600px] overflow-y-auto no-scrollbar">
              {pastBets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium">
                  {t('profile.no_bets')}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pastBets.map(bet => (
                    <div key={bet.id} className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="font-bold text-sm text-slate-800 line-clamp-1 flex-1 pl-2">{bet.match?.team1Name} <span className="text-slate-400 font-normal text-xs px-1">{t('matches.vs')}</span> {bet.match?.team2Name}</div>
                        {getStatusBadge(bet.status, bet.potentialPayout)}
                      </div>
                      
                      <div className="flex justify-between items-end bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[10px] text-slate-500 font-bold">{t('profile.bet_on')} <span className="text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{getSelectionText(bet.selection, bet.match?.team1Name, bet.match?.team2Name)}</span></div>
                          <div className="text-[10px] text-slate-500 font-bold">{t('profile.stake')} <span className="text-slate-800 font-black">${Number(bet.stake).toFixed(2)}</span></div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                          {t('profile.odds')} {bet.oddsAtBet}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
    </div>
  );
};
