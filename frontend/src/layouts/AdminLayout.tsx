import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/ui/Footer';
import { LayoutDashboard, Trophy, Users, Receipt, Target, Menu, LogOut, Gift, MoreHorizontal, ArrowRight, Globe, Settings, Heart, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';

export const AdminLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/admin/transactions/pending-count');
      setPendingCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch pending count', error);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    const intervalId = setInterval(fetchPendingCount, 30000); // Poll every 30s
    return () => clearInterval(intervalId);
  }, []);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
    if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
      setIsMoreMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const currentLang = i18n.resolvedLanguage || i18n.language || 'ar';
    i18n.changeLanguage(currentLang.startsWith('ar') ? 'en' : 'ar');
  };

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      window.location.href = '/';
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'الرئيسية', path: '/admin', icon: LayoutDashboard },
    { name: 'المباريات', path: '/admin/matches', icon: Trophy },
    { name: 'المستخدمين', path: '/admin/users', icon: Users },
    { name: 'الأكاديميات', path: '/admin/academies', icon: ShieldCheck },
    { name: 'المعاملات', path: '/admin/transactions', icon: Receipt },
    { name: 'الرهانات', path: '/admin/bets', icon: Target },
    { name: 'الجمعيات الخيرية', path: '/admin/charities', icon: Heart },
    { name: 'البونص', path: '/admin/bonus', icon: Gift },
    { name: 'استيراد المباريات', path: '/admin/api-hub', icon: Globe },
    { name: 'الدوريات', path: '/admin/leagues', icon: Trophy },
    { name: 'الإعدادات', path: '/admin/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-20 pointer-events-none"></div>

      {/* Navbar */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/admin" className="text-3xl font-black bg-gradient-to-l from-primary to-emerald-200 bg-clip-text text-transparent tracking-tighter flex items-center gap-2">
            <img src="/logo.jpg" alt="Goolbet Logo" className="w-10 h-10 object-cover rounded-full border border-primary/30" />
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-primary to-emerald-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)] pb-1">{t('nav.admin')}</span>
          </Link>
          
          <nav className="hidden lg:flex gap-4 xl:gap-6 flex-wrap justify-center">
             {navItems.map((item) => (
               <Link 
                 key={item.path}
                 to={item.path} 
                 className={`relative text-sm hover:text-primary transition-colors flex items-center gap-1.5 ${location.pathname === item.path ? 'text-primary font-bold' : 'text-muted-foreground'}`}
               >
                 <item.icon size={16} />
                 {item.name}
                 {item.name === 'المعاملات' && pendingCount > 0 && (
                   <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                     {pendingCount}
                   </span>
                 )}
               </Link>
             ))}
          </nav>

            <div className="flex items-center gap-2 md:gap-4">
              <NotificationDropdown />
              <Button variant="ghost" className="px-2" onClick={toggleLanguage}>
                {(i18n.resolvedLanguage || i18n.language)?.startsWith('ar') ? 'EN' : 'عربي'}
              </Button>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-emerald-500/10 border-2 border-white shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none"
                >
                  <span className="text-primary font-black text-lg">
                    {user?.firstName?.[0]?.toUpperCase() || 'A'}
                  </span>
                  
                  {/* Green Online Dot */}
                  <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  
                  <div className="absolute -bottom-1 -left-1 bg-slate-100 border border-white rounded-full p-0.5 shadow-sm">
                    <Menu size={12} className="text-slate-700" />
                  </div>
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute end-0 top-full mt-3 w-56 bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 origin-top-end">
                    <div className="p-3 border-b border-border/30 bg-emerald-500/10">
                      <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-emerald-600 truncate font-bold">Admin</p>
                    </div>
                    
                    <div className="p-2 flex flex-col gap-1">
                      <Link to="/admin/bonus" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 text-sm font-medium transition-colors text-slate-700">
                        <Gift size={18} className="text-primary" />
                        البونص
                      </Link>
                      <Link to="/admin/charities" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 text-sm font-medium transition-colors text-slate-700">
                        <Heart size={18} className="text-red-500" />
                        الجمعيات الخيرية
                      </Link>
                      <Link to="/admin/leagues" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 text-sm font-medium transition-colors text-slate-700">
                        <Trophy size={18} className="text-primary" />
                        الدوريات
                      </Link>
                      <Link to="/admin/api-hub" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 text-sm font-medium transition-colors text-slate-700">
                        <Globe size={18} className="text-primary" />
                        استيراد المباريات
                      </Link>
                      <Link to="/admin/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 text-sm font-medium transition-colors text-slate-700">
                        <Settings size={18} className="text-primary" />
                        الإعدادات
                      </Link>
                      <div className="h-px bg-border/50 my-1"></div>
                      <Link to="/" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 text-sm font-medium transition-colors text-slate-700">
                        <ArrowRight size={18} className="text-primary" />
                        العودة للموقع
                      </Link>
                    </div>
                    
                    <div className="p-2 border-t border-border/30">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-sm font-medium transition-colors text-red-500">
                        <LogOut size={18} />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pb-24 md:pb-16">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center h-16 px-2 pb-safe">
        <Link to="/admin/users" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/admin/users' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Users size={20} className={location.pathname === '/admin/users' ? 'stroke-blue-600 fill-blue-600/20' : ''} />
          <span className="text-[10px] font-medium">{t('admin_nav.users', 'المستخدمين')}</span>
        </Link>
        <Link to="/admin/transactions" className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/admin/transactions' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Receipt size={20} className={location.pathname === '/admin/transactions' ? 'stroke-blue-600 fill-blue-600/20' : ''} />
          <span className="text-[10px] font-medium">{t('admin_nav.transactions', 'المعاملات')}</span>
          {pendingCount > 0 && (
            <span className="absolute top-2 right-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
              {pendingCount}
            </span>
          )}
        </Link>
        
        {/* Center Item (Home) */}
        <Link to="/admin" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/admin' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
          <LayoutDashboard size={20} className={location.pathname === '/admin' ? 'stroke-primary fill-primary/20' : ''} />
          <span className="text-[10px] font-medium">{t('nav.home')}</span>
        </Link>

        <Link to="/admin/bets" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/admin/bets' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Target size={20} className={location.pathname === '/admin/bets' ? 'stroke-emerald-600 fill-emerald-600/20' : ''} />
          <span className="text-[10px] font-medium">{t('admin_nav.bets', 'الرهانات')}</span>
        </Link>
        <Link to="/admin/matches" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/admin/matches' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Trophy size={20} className={location.pathname === '/admin/matches' ? 'stroke-blue-600 fill-blue-600/20' : ''} />
          <span className="text-[10px] font-medium">{t('nav.matches')}</span>
        </Link>
      </nav>

      <Footer />
    </div>
  );
};
