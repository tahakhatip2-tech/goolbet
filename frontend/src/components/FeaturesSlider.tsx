import React, { useState, useRef, useEffect, useCallback } from "react";
import { Zap, ShieldCheck, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const FeatureIcon: React.FC<{ name: string }> = ({ name }) => {
  if (name === "zap") return <Zap className="w-5 h-5 text-primary" />;
  if (name === "shield") return <ShieldCheck className="w-5 h-5 text-blue-500" />;
  return <Trophy className="w-5 h-5 text-amber-500" />;
};

export const FeaturesSlider: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const features = [
    {
      iconName: "zap",
      iconBg: "bg-primary/10",
      borderHover: "hover:border-primary/40",
      gradientFrom: "from-primary/5",
      title: t('features_slider.feature_1_title', 'احتمالات حية وديناميكية'),
      description: t('features_slider.feature_1_desc', 'تحديثات فورية للاحتمالات (Odds) لضمان حصولك على أفضل العوائد في كل ثانية من المباراة.'),
      badge: t('features_slider.feature_1_badge', '⚡ مباشر'),
      badgeClass: "bg-primary/10 text-primary",
    },
    {
      iconName: "shield",
      iconBg: "bg-blue-500/10",
      borderHover: "hover:border-blue-500/40",
      gradientFrom: "from-blue-500/5",
      title: t('features_slider.feature_2_title', 'محفظة آمنة'),
      description: t('features_slider.feature_2_desc', 'إيداع وسحب فوري مع أعلى معايير الأمان والتشفير لضمان حماية أموالك.'),
      badge: t('features_slider.feature_2_badge', '🔒 موثوق'),
      badgeClass: "bg-blue-500/10 text-blue-600",
    },
    {
      iconName: "trophy",
      iconBg: "bg-amber-500/10",
      borderHover: "hover:border-amber-500/40",
      gradientFrom: "from-amber-500/5",
      title: t('features_slider.feature_3_title', 'دفع فوري وتلقائي'),
      description: t('features_slider.feature_3_desc', 'بمجرد انتهاء المباراة وتحديد النتيجة، يتم إضافة أرباحك إلى محفظتك بشكل تلقائي وفوري.'),
      badge: t('features_slider.feature_3_badge', '🏆 ضامنون'),
      badgeClass: "bg-amber-500/10 text-amber-600",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = features.length;

  const goTo = useCallback((index: number, dir: "left" | "right") => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setIsAnimating(false);
    }, 280);
  }, [isAnimating]);

  const next = useCallback(() => goTo((current + 1) % total, "right"), [current, total, goTo]);
  const prev = useCallback(() => goTo((current - 1 + total) % total, "left"), [current, total, goTo]);

  useEffect(() => {
    autoPlayRef.current = setInterval(next, 4000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [next]);

  const resetAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(next, 4000);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) { resetAutoPlay(); diff > 0 ? next() : prev(); }
    touchStartX.current = null; touchEndX.current = null;
  };

  const feat = features[current];

  return (
    <div className="relative select-none max-w-lg mx-auto" dir={isRtl ? "rtl" : "ltr"}>
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${feat.gradientFrom} to-white rounded-2xl border border-slate-200 ${feat.borderHover} transition-all duration-300 shadow-md p-4 flex flex-col gap-2 cursor-grab active:cursor-grabbing`}
        style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? `translateX(${direction === "right" ? "-24px" : "24px"})` : "translateX(0)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-transparent opacity-60 pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${feat.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
            <FeatureIcon name={feat.iconName} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${feat.badgeClass}`}>{feat.badge}</span>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">{feat.title}</h3>
          </div>
        </div>
        <p className="text-slate-500 text-xs leading-relaxed">{feat.description}</p>
      </div>

      <button onClick={() => { resetAutoPlay(); prev(); }} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? '-right-4' : '-left-4'} z-20 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all active:scale-90`} aria-label="السابق">
        {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
      <button onClick={() => { resetAutoPlay(); next(); }} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? '-left-4' : '-right-4'} z-20 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all active:scale-90`} aria-label="التالي">
        {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      <div className="flex justify-center gap-2.5 mt-2">
        {features.map((_, i) => (
          <button key={i} onClick={() => { resetAutoPlay(); goTo(i, i > current ? "right" : "left"); }} className={`rounded-full transition-all duration-300 ${i === current ? "w-8 h-2.5 bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"}`} aria-label={`بطاقة ${i + 1}`} />
        ))}
      </div>
    </div>
  );
};
