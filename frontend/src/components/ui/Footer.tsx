import React from 'react';
import { Link } from 'react-router-dom';
import { Copyright } from 'lucide-react';

const FacebookIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const InstagramIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
);

const TwitterIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const TelegramIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-12 border-t border-slate-200 bg-white/60 backdrop-blur-xl pb-20 md:pb-6 pt-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-6">
          
          {/* Brand & Description */}
          <div className="space-y-2 max-w-sm mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary p-[2px] shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.jpg" alt="Goolbet Logo" className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <span className="font-black text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)] pb-1">
                Goolbet
              </span>
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed">
              منصتك الأولى للمراهنات الرياضية. استمتع بأفضل الاحتمالات، وتجربة مستخدم لا مثيل لها بضمان الأمان والموثوقية.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <a href="#" className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary hover:text-white hover:bg-primary hover:border-primary hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <FacebookIcon size={14} className="group-hover:rotate-[360deg] transition-transform duration-700 ease-in-out" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary hover:text-white hover:bg-[#E4405F] hover:border-[#E4405F] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <InstagramIcon size={14} className="group-hover:rotate-[360deg] transition-transform duration-700 ease-in-out" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary hover:text-white hover:bg-[#1DA1F2] hover:border-[#1DA1F2] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <TwitterIcon size={14} className="group-hover:rotate-[360deg] transition-transform duration-700 ease-in-out" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary hover:text-white hover:bg-[#0088cc] hover:border-[#0088cc] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <TelegramIcon size={14} className="group-hover:rotate-[360deg] transition-transform duration-700 ease-in-out -ml-0.5 mt-0.5" />
            </a>
          </div>

        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-4"></div>

        {/* Copyright & Developer Signature */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] md:text-xs">
          <div className="text-slate-400 flex items-center gap-1">
            <Copyright size={12} />
            <span>{new Date().getFullYear()} Goolbet. جميع الحقوق محفوظة.</span>
          </div>
          
          {/* Developer Signature */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
            <span className="text-slate-500 text-[10px]">المطور:</span>
            <span className="font-bold text-[10px] bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-500 flex items-center gap-1">
              طه الخطيب
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
