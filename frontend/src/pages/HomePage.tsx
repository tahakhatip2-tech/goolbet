import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getMatches } from '../api/matches';
import { HeroSection } from '../components/ui/HeroSection';
import { FeaturesSlider } from '../components/FeaturesSlider';

export const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [featuredMatches, setFeaturedMatches] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await getMatches();
        // Get up to 3 upcoming or live matches
        const matches = data.filter((m: any) => m.status !== 'FINISHED').slice(0, 3);
        // Fallback to any 3 matches if no upcoming/live found
        setFeaturedMatches(matches.length > 0 ? matches : data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch featured matches:', error);
      } finally {
        setIsLoadingMatches(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection 
        title={
          <>
            {t('home.hero_title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-500">{t('home.hero_title_highlight')}</span>
          </>
        }
        subtitle={t('home.hero_subtitle')}
        badge={t('home.hero_badge')}
        minHeight="min-h-[40vh]"
      >
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center items-center w-full max-w-md mx-auto">
          <Button size="lg" className="w-full sm:w-auto shadow-[0_0_15px_rgba(34,197,94,0.4)] text-lg px-8" onClick={() => navigate('/matches')}>
            {t('home.start_betting')}
          </Button>
        </div>
      </HeroSection>

      {/* Features Section - Professional Slider */}
      <section className="py-1 relative z-10 bg-white border-y border-slate-200 shadow-sm overflow-hidden">
        <div className="container mx-auto px-2">
          <FeaturesSlider />
        </div>
      </section>

      {/* Featured Matches Teaser */}
      <section className="py-2 relative z-10">
        <div className="container mx-auto px-2">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-2 gap-1">
            <div className="text-center md:text-start">
              <h2 className="text-xl md:text-2xl font-bold mb-0.5 text-slate-900">{t('home.featured_matches')}</h2>
              <p className="text-slate-600 text-xs md:text-sm">{t('home.featured_matches_sub')}</p>
            </div>
            <Link to="/matches" className="text-primary hover:text-primary/80 font-bold flex items-center justify-center gap-1 group transition-colors text-sm bg-primary/10 px-4 py-2 rounded-full md:bg-transparent md:px-0 md:py-0">
              {t('home.view_all')}
              {isRtl ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </Link>
          </div>

          {isLoadingMatches ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : featuredMatches.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-200 text-slate-500 font-medium">{t('home.no_featured')}</div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-2">
              {featuredMatches.map(match => (
                <div key={match.id} className="bg-white rounded-2xl p-3 relative overflow-hidden group hover:border-primary/40 transition-colors shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      {new Date(match.matchDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} • {new Date(match.matchDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                      {match.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center gap-1 mb-4">
                    <div className="text-center flex-1">
                      {match.team1Logo ? (
                         <img src={match.team1Logo.startsWith('http') ? match.team1Logo : `http://localhost:5000${match.team1Logo}`} alt={match.team1Name} className="w-10 h-10 mx-auto mb-1 object-contain drop-shadow-sm" />
                      ) : (
                         <div className="w-10 h-10 mx-auto mb-1 bg-slate-100 rounded-full flex items-center justify-center text-lg font-black text-slate-600">{match.team1Name[0]}</div>
                      )}
                      <div className="font-bold text-xs text-slate-800 line-clamp-1">{match.team1Name}</div>
                    </div>
                    
                    <div className="text-slate-300 font-black text-sm italic bg-slate-50 w-6 h-6 flex items-center justify-center rounded-full shrink-0">VS</div>
                    
                    <div className="text-center flex-1">
                      {match.team2Logo ? (
                         <img src={match.team2Logo.startsWith('http') ? match.team2Logo : `http://localhost:5000${match.team2Logo}`} alt={match.team2Name} className="w-10 h-10 mx-auto mb-1 object-contain drop-shadow-sm" />
                      ) : (
                         <div className="w-10 h-10 mx-auto mb-1 bg-slate-100 rounded-full flex items-center justify-center text-lg font-black text-slate-600">{match.team2Name[0]}</div>
                      )}
                      <div className="font-bold text-xs text-slate-800 line-clamp-1">{match.team2Name}</div>
                    </div>
                  </div>
                  
                  <Button className="w-full h-8 bg-primary text-slate-900 hover:bg-primary/90 text-xs font-bold rounded-lg shadow-none" onClick={() => navigate('/matches')}>{t('home.bet_now')}</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
