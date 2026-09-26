import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { login, telegramLogin } from '../api/auth';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { TelegramLoginWidget } from '../components/TelegramLoginWidget';
import type { TelegramUser } from '../components/TelegramLoginWidget';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [showPassword, setShowPassword] = useState(false);

  const handleTelegramAuth = async (user: TelegramUser) => {
    setError('');
    setIsLoading(true);
    try {
      await telegramLogin(user);
      navigate('/');
    } catch (err: any) {
      console.error('Telegram login error:', err);
      const msg = err.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول عبر تيليجرام';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockTelegramLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await telegramLogin({
        id: Math.floor(Math.random() * 100000),
        first_name: 'Test',
        last_name: 'User',
        username: 'test_telegram_user',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'mock'
      });
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error in mock login';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      const msg = 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم.';
      setError(msg);
      toast.warning(msg);
      return;
    }
    
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setIsLoading(true);
    try {
      const formattedEmail = email.trim().toLowerCase();
      await login({ email: formattedEmail, password });
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formattedEmail);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast.success('تم تسجيل الدخول بنجاح');
      
      // Redirect based on role
      const userRole = (await login({ email: formattedEmail, password })).user?.role;
      if (userRole === 'ACADEMY') {
        navigate('/academy');
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'حدث خطأ، حاول مرة أخرى';
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') errorMessage = data;
        else if (typeof data.error === 'string') errorMessage = data.error;
        else if (typeof data.message === 'string') errorMessage = data.message;
        else errorMessage = JSON.stringify(data);
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(`خطأ: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-[100dvh] w-full flex items-center justify-center p-3 relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: 'url(/stadium-bg.jpg)' }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#0f172a]/90 z-0"></div>

      {/* Back button */}
      <Link to="/" className="absolute top-4 start-4 z-20 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10">
        <ArrowRight size={16} />
        <span className="text-xs font-medium">{t('nav.home')}</span>
      </Link>

      {/* Glassmorphic Modal taking full possible space compressed */}
      <div className="w-full h-full max-w-md relative z-10 flex flex-col justify-center animate-fade-in-up px-2 py-4">
        
        {/* Logo outside the card */}
        <div className="flex flex-col items-center justify-center mb-1 drop-shadow-2xl flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 p-1 backdrop-blur-xl border border-white/20 shadow-[0_0_20px_rgba(34,197,94,0.3)] mb-1">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-lg sm:rounded-xl" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-wide leading-none bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] pb-0.5">
            Goolbet
          </h1>
          <p className="text-white/70 text-[9px] sm:text-[10px] mt-0.5 font-medium tracking-wide">{t('auth.login_subtitle')}</p>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-center w-full overflow-hidden">
          
          <div className="text-center mb-2 sm:mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-0.5">{t('auth.login_title')}</h2>
            <p className="text-white/50 text-[10px] sm:text-xs">{t('auth.login_subtitle')}</p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-1.5 rounded-lg text-[10px] mb-2 flex items-start gap-1">
              <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="space-y-0.5">
              <label className="block text-[10px] sm:text-xs font-medium text-white/80">{t('auth.email')}</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-sm outline-none focus:border-primary focus:bg-white/10 transition-all text-white placeholder-white/30"
                  placeholder="name@example.com أو username"
                  required
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="block text-[10px] sm:text-xs font-medium text-white/80">{t('auth.password')}</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 pl-8 sm:pl-10 text-[11px] sm:text-sm outline-none focus:border-primary focus:bg-white/10 transition-all text-white placeholder-white/30 text-left"
                  dir="ltr"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors rounded hover:bg-white/10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <label className="flex items-center gap-1 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary w-3 h-3 transition-colors" 
                />
                <span className="text-[10px] sm:text-xs text-white/60 group-hover:text-white transition-colors">{t('auth.remember_me', 'تذكرني')}</span>
              </label>
              <a href="#" className="text-[10px] sm:text-xs font-medium text-primary hover:text-primary/80 transition-colors">{t('auth.forgot_password')}</a>
            </div>
            
            <Button className="w-full h-8 sm:h-9 text-xs sm:text-sm font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] mt-1 transition-all active:scale-[0.98]" type="submit" disabled={isLoading}>
              {isLoading ? t('auth.logging_in') : t('auth.login_btn')}
              {!isLoading && <ArrowLeft className="ms-1.5" size={14} />}
            </Button>
          </form>

          <div className="relative flex items-center justify-center my-2 sm:my-3">
            <div className="border-t border-white/10 w-full absolute"></div>
            <div className="bg-[#1a2233] px-2 relative text-[9px] sm:text-[10px] font-semibold text-white/40 uppercase tracking-wider rounded-full py-0.5 border border-white/5">{t('auth.or')}</div>
          </div>

          <div className="space-y-1">
            <div className="[&>div]:w-full [&>div>iframe]:w-full flex justify-center scale-90 sm:scale-100 origin-top">
              <TelegramLoginWidget 
                botName="your_bot_username_here"
                onAuth={handleTelegramAuth}
              />
            </div>
          </div>

          <p className="text-center text-[10px] sm:text-xs text-white/60 mt-2 sm:mt-3">
            {t('auth.no_account')} <Link to="/register" className="font-bold text-primary hover:text-white transition-all">{t('auth.register_link')}</Link>
          </p>
        </div>
        
        {/* Version Info */}
        <div className="text-center mt-2 sm:mt-3 flex-shrink-0">
          <p className="text-[9px] sm:text-[10px] text-white/30 font-bold tracking-widest uppercase font-sans">Goolbet v1.0</p>
        </div>
      </div>
    </div>
  );
};
