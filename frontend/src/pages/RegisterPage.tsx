import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import api from '../api/axios';
import { telegramLogin } from '../api/auth';
import { Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { TelegramLoginWidget } from '../components/TelegramLoginWidget';
import type { TelegramUser } from '../components/TelegramLoginWidget';
import { useToast } from '../context/ToastContext';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const isMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const isMismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.warning(t('auth.invalid_email', 'يرجى إدخال بريد إلكتروني صحيح.'));
      return setError(t('auth.invalid_email', 'يرجى إدخال بريد إلكتروني صحيح.'));
    }

    if (formData.password.length < 8) {
      toast.warning(t('auth.password_min_length', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.'));
      return setError(t('auth.password_min_length', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.'));
    }

    if (formData.password !== formData.confirmPassword) {
      toast.warning(t('auth.passwords_mismatch', 'كلمتا المرور غير متطابقتين.'));
      return setError(t('auth.passwords_mismatch', 'كلمتا المرور غير متطابقتين.'));
    }

    setIsLoading(true);
    try {
      const formattedEmail = formData.email.trim().toLowerCase();
      await api.post('/auth/register', {
        username: formData.username,
        email: formattedEmail,
        password: formData.password
      });
      
      const loginRes = await api.post('/auth/login', {
        email: formattedEmail,
        password: formData.password
      });

      localStorage.setItem('token', loginRes.data.token);
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      
      toast.success(t('auth.register_success', 'تم إنشاء الحساب بنجاح'));
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || t('auth.register_error', 'حدث خطأ أثناء إنشاء الحساب');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramAuth = async (user: TelegramUser) => {
    setError('');
    setIsLoading(true);
    try {
      await telegramLogin(user);
      navigate('/');
    } catch (err: any) {
      console.error('Telegram login error:', err);
      const msg = err.response?.data?.error || t('auth.telegram_register_error', 'حدث خطأ أثناء التسجيل عبر تيليجرام');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-[100dvh] w-full flex items-center justify-center p-3 relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: 'url(/stadium-bg.jpg)' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#0f172a]/90 z-0"></div>

      {/* Back button */}
      <Link to="/" className="absolute top-4 right-4 z-20 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10">
        <ArrowRight size={16} />
        <span className="text-xs font-medium">{t('auth.home', 'الرئيسية')}</span>
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
          <p className="text-white/70 text-[9px] sm:text-[10px] mt-0.5 font-medium tracking-wide">{t('auth.register_title', 'تسجيل حساب جديد')}</p>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-center w-full overflow-hidden">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-1.5 rounded-lg text-[10px] mb-2 flex items-start gap-1">
              <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-2.5">
            <div className="space-y-0.5">
              <label className="block text-[9px] sm:text-[11px] font-medium text-white/80">{t('auth.username_label', 'اسم المستخدم (Username)')}</label>
              <input 
                type="text" 
                required
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value.replace(/\s+/g, '')})}
                className="w-full bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 text-[10px] sm:text-sm outline-none focus:border-primary focus:bg-white/10 transition-all text-white placeholder-white/30"
                placeholder="user123"
                dir="ltr"
              />
            </div>

            <div className="space-y-0.5">
              <label className="block text-[9px] sm:text-[11px] font-medium text-white/80">{t('auth.email_label', 'البريد الإلكتروني')}</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 text-[10px] sm:text-sm outline-none focus:border-primary focus:bg-white/10 transition-all text-white placeholder-white/30"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-0.5">
              <label className="block text-[9px] sm:text-[11px] font-medium text-white/80">{t('auth.password_label', 'كلمة المرور')}</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 pl-8 sm:pl-9 text-[10px] sm:text-sm outline-none focus:border-primary focus:bg-white/10 transition-all text-white placeholder-white/30 text-left"
                  dir="ltr"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="absolute left-1 sm:left-1.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors rounded hover:bg-white/10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={12} className="sm:w-3.5 sm:h-3.5" /> : <Eye size={12} className="sm:w-3.5 sm:h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <label className="block text-[9px] sm:text-[11px] font-medium text-white/80">{t('auth.confirm_password_label', 'تأكيد كلمة المرور')}</label>
                {isMatch && <span className="text-[8px] sm:text-[10px] font-medium text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-1 sm:px-1.5 py-0.5 rounded-full"><CheckCircle2 size={8} /> {t('auth.match', 'متطابقة')}</span>}
                {isMismatch && <span className="text-[8px] sm:text-[10px] font-medium text-red-400 flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-1 sm:px-1.5 py-0.5 rounded-full"><XCircle size={8} /> {t('auth.mismatch', 'غير متطابقة')}</span>}
              </div>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full bg-white/5 border rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 pl-8 sm:pl-9 text-[10px] sm:text-sm outline-none transition-all text-white placeholder-white/30 text-left ${isMatch ? 'border-emerald-500 focus:border-emerald-500 focus:bg-emerald-500/10' : isMismatch ? 'border-red-500 focus:border-red-500 focus:bg-red-500/10' : 'border-white/10 focus:border-primary focus:bg-white/10'}`}
                  dir="ltr"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="absolute left-1 sm:left-1.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors rounded hover:bg-white/10"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={12} className="sm:w-3.5 sm:h-3.5" /> : <Eye size={12} className="sm:w-3.5 sm:h-3.5" />}
                </button>
              </div>
            </div>
            
            <Button disabled={isLoading} className="w-full h-8 sm:h-10 mt-1 text-xs sm:text-sm font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all active:scale-[0.98]" type="submit">
              {isLoading ? t('auth.registering', 'جاري الإنشاء...') : t('auth.register_button', 'إنشاء الحساب')}
              {!isLoading && <ArrowLeft className="mr-1 sm:mr-1.5" size={14} />}
            </Button>
          </form>

          <div className="relative flex items-center justify-center my-2 sm:my-3">
            <div className="border-t border-white/10 w-full absolute"></div>
            <div className="bg-[#1a2233] px-2 relative text-[9px] sm:text-[10px] font-semibold text-white/40 uppercase tracking-wider rounded-full py-0.5 border border-white/5">{t('auth.or', 'أو')}</div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="[&>div]:w-full [&>div>iframe]:w-full flex justify-center scale-90 sm:scale-100 origin-top">
              <TelegramLoginWidget 
                botName="your_bot_username_here"
                onAuth={handleTelegramAuth}
              />
            </div>
          </div>

          <p className="text-center text-[10px] sm:text-xs text-white/60 mt-2 sm:mt-4">
            {t('auth.have_account', 'لديك حساب بالفعل؟')} <Link to="/login" className="font-bold text-primary hover:text-white transition-all">{t('auth.login_link', 'تسجيل الدخول')}</Link>
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
