import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Video, Settings, LogOut, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AcademyLayout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/academy', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم' },
    { path: '/academy/streams', icon: <Video size={20} />, label: 'إدارة البثوث' },
    { path: '/academy/tournaments', icon: <Trophy size={20} />, label: 'البطولات' },
    { path: '/academy/settings', icon: <Settings size={20} />, label: 'إعدادات الأكاديمية' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary">لوحة الأكاديمية</h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold">نظام الأكاديميات (SaaS)</h1>
          <Link to="/" className="text-gray-400 hover:text-white text-sm">
            العودة للمنصة الرئيسية
          </Link>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
