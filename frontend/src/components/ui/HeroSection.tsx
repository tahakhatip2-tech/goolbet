import React from 'react';

interface HeroSectionProps {
  title: React.ReactNode;
  subtitle?: string;
  backgroundImage?: string;
  children?: React.ReactNode;
  badge?: string;
  minHeight?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  backgroundImage = '/hero-img.jpg',
  children,
  badge,
  minHeight = 'min-h-[40vh]',
}) => {
  return (
    <section className={`relative flex items-center justify-center ${minHeight} py-3 md:py-5 mb-4 bg-slate-50 border-b border-slate-200/50`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Background Image - Changed to contain to show completely */}
        <div 
          className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-20 md:opacity-40"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
        ></div>
        
        {/* Subtle Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80"></div>
      </div>

      <div className="container mx-auto px-2 relative z-10 flex justify-center">
        <div className="w-full max-w-4xl text-center">
          
          {badge && (
            <div className="inline-block mb-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold shadow-sm animate-fade-in-up">
              {badge}
            </div>
          )}
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-1.5 tracking-tight leading-[1.1] animate-fade-in-up text-slate-900 drop-shadow-sm" style={{ animationDelay: '0.1s' }}>
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-sm md:text-base text-slate-700 max-w-2xl mx-auto mb-3 leading-snug animate-fade-in-up font-semibold drop-shadow-sm" style={{ animationDelay: '0.2s' }}>
              {subtitle}
            </p>
          )}
          
          {children && (
            <div className="animate-fade-in-up flex flex-col items-center w-full" style={{ animationDelay: '0.3s' }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
