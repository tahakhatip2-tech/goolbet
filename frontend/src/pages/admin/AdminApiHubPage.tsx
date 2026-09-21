import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Server, MapPin, Trophy } from 'lucide-react';
import { HeroSection } from '../../components/ui/HeroSection';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export const AdminApiHubPage: React.FC = () => {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchAllLeagues = async () => {
      try {
        setLeaguesLoading(true);
        // Fetch all leagues
        const res = await api.get('/admin/api-football/leagues');
        setLeagues(res.data || []);
      } catch (err) {
        console.error(err);
        toast.showToast('فشل جلب الدوريات', 'error');
      } finally {
        setLeaguesLoading(false);
      }
    };
    fetchAllLeagues();
  }, []);

  const filteredLeagues = leagues.filter(l => 
    l.league.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchFixtures = async () => {
    if (!selectedLeague) {
      toast.showToast('يرجى اختيار الدوري أولاً', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      
      // Find the current active season for this specific league
      const currentSeason = selectedLeague.seasons?.find((s: any) => s.current)?.year || new Date().getFullYear();
      
      // Fetch all matches for the current season (no date filtering)
      let url = `/admin/api-football/fixtures?league=${selectedLeague.league.id}&season=${currentSeason}`;
      
      let res;
      try {
        res = await api.get(url);
      } catch (error: any) {
        // If API fails (e.g. Free plan restriction for 2026), fallback to 2024
        console.log(`Failed to fetch season ${currentSeason}, falling back to 2024...`);
        url = `/admin/api-football/fixtures?league=${selectedLeague.league.id}&season=2024`;
        res = await api.get(url);
      }
      
      let fetchedFixtures = res.data || [];
      
      // If current season returned 0 matches (API hasn't populated it yet), fallback to 2024
      if (fetchedFixtures.length === 0 && currentSeason > 2024) {
        console.log(`Season ${currentSeason} has 0 matches, falling back to 2024...`);
        url = `/admin/api-football/fixtures?league=${selectedLeague.league.id}&season=2024`;
        try {
          res = await api.get(url);
          fetchedFixtures = res.data || [];
        } catch (e) {
          fetchedFixtures = [];
        }
      }
      
      // Sort matches chronologically (oldest to newest)
      const sortedFixtures = fetchedFixtures.sort((a: any, b: any) => {
        return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
      });
      
      setFixtures(sortedFixtures);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'حدث خطأ أثناء جلب المباريات من API. تأكد من وجود مفتاح API صحيح.';
      toast.showToast(errMsg, 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLeague) {
      fetchFixtures();
    }
  }, [selectedLeague]);

  const displayedFixtures = fixtures.filter((f: any) => 
    f.teams.home.name.toLowerCase().includes(teamSearch.toLowerCase()) || 
    f.teams.away.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const handleImport = async (fixture: any) => {
    try {
      setImporting(fixture.fixture.id);
      
      const payload = {
        team1Name: fixture.teams.home.name,
        team1Logo: fixture.teams.home.logo,
        team2Name: fixture.teams.away.name,
        team2Logo: fixture.teams.away.logo,
        league: fixture.league.name,
        matchDate: fixture.fixture.date,
        status: 'UPCOMING',
        apiFixtureId: fixture.fixture.id
      };

      await api.post('/admin/api-football/import', payload);
      toast.showToast('تم استيراد المباراة بنجاح إلى منصتك!', 'success');
    } catch (error: any) {
      toast.showToast(error.response?.data?.message || 'حدث خطأ أثناء استيراد المباراة', 'error');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <HeroSection 
        title={
          <>
            استيراد <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-400">المباريات</span>
          </>
        }
        minHeight="min-h-[25vh]"
      />

      <div className="sticky top-20 z-50 px-2 md:px-4 -mt-10 mb-6">
        <div className="w-full max-w-lg mx-auto bg-white/60 backdrop-blur-2xl rounded-2xl p-3 md:p-4 border border-white/50 shadow-xl">
          <div className="grid grid-cols-2 gap-2 md:gap-3 items-end mb-2">
            <div className="relative text-start">
              <label className="block text-[10px] md:text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5 drop-shadow-sm">
                <Trophy size={12} className="text-amber-500" />
                الدوري (بحث)
              </label>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={leaguesLoading ? 'جاري التحميل...' : 'اسم الدوري...'}
                disabled={leaguesLoading}
                className="w-full bg-white/50 border border-white/60 rounded-xl px-2 py-1.5 md:py-2 text-xs md:text-sm outline-none focus:border-purple-400 focus:bg-white/70 transition-all text-slate-900 font-bold disabled:opacity-50 placeholder:text-slate-500"
              />
              {showDropdown && (
                <div className="absolute top-full mt-1 w-full max-h-48 overflow-y-auto bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-100 z-50 text-start">
                  {filteredLeagues.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs">لا توجد نتائج</div>
                  ) : (
                    filteredLeagues.slice(0, 100).map((l: any) => (
                      <div 
                        key={l.league.id}
                        onClick={() => {
                          setSelectedLeague(l);
                          setSearchQuery(`${l.league.name} (${l.country.name})`);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 p-2 hover:bg-purple-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <img src={l.league.logo} alt={l.league.name} className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                        <div>
                          <div className="font-bold text-slate-800 text-[10px] md:text-xs">{l.league.name}</div>
                          <div className="text-[9px] text-slate-500">{l.country.name}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="relative text-start">
              <label className="block text-[10px] md:text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5 drop-shadow-sm">
                <Trophy size={12} className="text-amber-500" />
                بحث فريق
              </label>
              <input 
                type="text" 
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="اسم الفريق..."
                disabled={fixtures.length === 0}
                className="w-full bg-white/50 border border-white/60 rounded-xl px-2 py-1.5 md:py-2 text-xs md:text-sm outline-none focus:border-purple-400 focus:bg-white/70 transition-all text-slate-900 font-bold disabled:opacity-50 placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <button 
            onClick={fetchFixtures}
            disabled={loading || !selectedLeague}
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-purple-600 hover:bg-purple-50 text-purple-600 px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'جاري الجلب...' : 'تحديث المباريات'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-4 relative z-20">

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : displayedFixtures.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-white border-dashed">
            <Server size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد مباريات مطابقة لبحثك</h3>
            <p className="text-slate-500">جرب تغيير التاريخ، الدولة، أو الدوري.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {displayedFixtures.map((item: any) => {
              const matchDate = new Date(item.fixture.date);
              const isFinished = item.fixture.status.short === 'FT' || item.fixture.status.short === 'PEN' || item.fixture.status.short === 'AET';
              const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(item.fixture.status.short);
              
              return (
              <div key={item.fixture.id} className="bg-white rounded-3xl p-2 md:p-4 shadow-lg border border-slate-100 flex flex-col hover:shadow-xl transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] md:text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md line-clamp-1 flex items-center gap-1">
                    <Trophy size={10} className="text-amber-500" />
                    {item.league.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {isLive && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md animate-pulse">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        مباشر
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center gap-0 mb-2 text-[9px] md:text-xs font-bold text-slate-500 bg-slate-50 py-1 rounded-md">
                  <span>{matchDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-slate-400">{matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>

                <div className="flex items-center justify-between mt-1 mb-2">
                  <div className="flex flex-col items-center flex-1 w-1/3">
                    <img src={item.teams.home.logo} alt="Home" className="w-6 h-6 md:w-10 md:h-10 object-contain mb-1 drop-shadow-sm" />
                    <span className="text-[9px] md:text-xs font-bold text-slate-800 text-center line-clamp-2 leading-tight" title={item.teams.home.name}>
                      {item.teams.home.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center shrink-0 mx-1">
                    {isFinished || isLive ? (
                      <div className="flex items-center gap-1 text-sm md:text-xl font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-xl">
                        <span>{item.goals.home ?? 0}</span>
                        <span className="text-slate-400 text-[10px] md:text-sm">-</span>
                        <span>{item.goals.away ?? 0}</span>
                      </div>
                    ) : (
                      <div className="text-slate-300 font-black text-xs md:text-lg italic">VS</div>
                    )}
                  </div>
                  <div className="flex flex-col items-center flex-1 w-1/3">
                    <img src={item.teams.away.logo} alt="Away" className="w-6 h-6 md:w-10 md:h-10 object-contain mb-1 drop-shadow-sm" />
                    <span className="text-[9px] md:text-xs font-bold text-slate-800 text-center line-clamp-2 leading-tight" title={item.teams.away.name}>
                      {item.teams.away.name}
                    </span>
                  </div>
                </div>

                {item.fixture.venue?.name && (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-auto">
                    <MapPin size={12} />
                    <span className="truncate max-w-[200px]">{item.fixture.venue.name}</span>
                  </div>
                )}

                <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleImport(item)}
                    disabled={importing === item.fixture.id}
                    className="w-full bg-transparent border border-blue-500 hover:bg-blue-50 text-blue-600 px-1 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {importing === item.fixture.id ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>جاري الاستيراد...</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>استيراد للمنصة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};
