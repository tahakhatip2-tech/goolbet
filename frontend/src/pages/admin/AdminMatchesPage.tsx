import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { BackendImage } from '../../components/BackendImage';
import { HeroSection } from '../../components/ui/HeroSection';
import { Plus, X, Edit, CheckCircle, Clock, CalendarDays, Activity, Trophy, ShieldHalf, Trash2, Loader2, PlayCircle, Settings } from 'lucide-react';
import { LiveControlPanel } from '../../components/LiveControlPanel';
import { useToast } from '../../context/ToastContext';

export const AdminMatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [liveControlMatch, setLiveControlMatch] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    team1Name: '', team2Name: '', league: '', matchDate: '', status: 'UPCOMING',
    team1Score: 0, team2Score: 0,
    odds: { team1Win: 1.5, draw: 3.0, team2Win: 2.5 },
    streamUrl: '',
    isStreamActive: false
  });
  const [team1LogoFile, setTeam1LogoFile] = useState<File | null>(null);
  const [team2LogoFile, setTeam2LogoFile] = useState<File | null>(null);
  const [team1LogoPreview, setTeam1LogoPreview] = useState<string | null>(null);
  const [team2LogoPreview, setTeam2LogoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMatches = async () => {
    try {
      const res = await api.get('/matches');
      setMatches(res.data);
    } catch (error) {
      console.error('Error fetching matches', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagues = async () => {
    try {
      const res = await api.get('/admin/leagues');
      setLeagues(res.data);
    } catch (error) {
      console.error('Error fetching leagues', error);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchLeagues();
  }, []);

  const handleAddOrEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('team1Name', formData.team1Name);
      data.append('team2Name', formData.team2Name);
      data.append('league', formData.league);
      data.append('matchDate', formData.matchDate);
      data.append('status', formData.status);
      data.append('team1Score', formData.team1Score.toString());
      data.append('team2Score', formData.team2Score.toString());
      data.append('odds', JSON.stringify(formData.odds));
      if (formData.streamUrl) data.append('streamUrl', formData.streamUrl);
      data.append('isStreamActive', String(formData.isStreamActive));
      
      if (team1LogoFile) data.append('team1Logo', team1LogoFile);
      if (team2LogoFile) data.append('team2Logo', team2LogoFile);

      if (editingMatchId) {
        await api.put(`/admin/matches/${editingMatchId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/admin/matches', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowAddForm(false);
      setEditingMatchId(null);
      setTeam1LogoFile(null);
      setTeam2LogoFile(null);
      setTeam1LogoPreview(null);
      setTeam2LogoPreview(null);
      fetchMatches();
      toast.success(editingMatchId ? 'تم تعديل المباراة بنجاح!' : 'تم إضافة المباراة بنجاح!');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ المباراة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (match: any) => {
    // Format date for datetime-local input
    const d = new Date(match.matchDate);
    const dateStr = d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    
    setFormData({
      team1Name: match.team1Name,
      team2Name: match.team2Name,
      league: match.league,
      matchDate: dateStr,
      status: match.status,
      team1Score: match.team1Score || 0,
      team2Score: match.team2Score || 0,
      odds: {
        team1Win: match.odds[0]?.team1Win || 1.5,
        draw: match.odds[0]?.draw || 3.0,
        team2Win: match.odds[0]?.team2Win || 2.5,
      },
      streamUrl: match.streamUrl || '',
      isStreamActive: match.isStreamActive || false
    });
    setTeam1LogoFile(null);
    setTeam2LogoFile(null);
    setTeam1LogoPreview(match.team1Logo || null);
    setTeam2LogoPreview(match.team2Logo || null);
    setEditingMatchId(match.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewClick = () => {
    setFormData({
      team1Name: '', team2Name: '',
      league: '', matchDate: '', status: 'UPCOMING',
      team1Score: 0, team2Score: 0,
      odds: { team1Win: 1.5, draw: 3.0, team2Win: 2.5 },
      streamUrl: '',
      isStreamActive: false
    });
    setTeam1LogoFile(null);
    setTeam2LogoFile(null);
    setTeam1LogoPreview(null);
    setTeam2LogoPreview(null);
    setEditingMatchId(null);
    setShowAddForm(!showAddForm);
  };

  const handleSettle = async (matchId: string, result: string) => {
    if (!window.confirm('هل أنت متأكد من تسوية هذه المباراة؟ لا يمكن التراجع عن هذا الإجراء وسيتم توزيع الأرباح.')) return;
    try {
      await api.put(`/admin/matches/${matchId}/settle`, { result });
      fetchMatches();
      toast.success('تم تسوية المباراة وتوزيع الأرباح!');
    } catch (error) {
      toast.error('حدث خطأ أثناء التسوية');
    }
  };

  const handleEndMatch = (match: any) => {
    if (!window.confirm('هل أنت متأكد من إنهاء المباراة الآن وتوزيع الأرباح بناءً على النتيجة الحالية؟')) return;
    
    // Call the API directly without the second confirm (backend will use resultAt90/extra time automatically now)
    api.put(`/admin/matches/${match.id}/settle`, {})
      .then(() => {
        fetchMatches();
        toast.success('تم إنهاء المباراة وتسويتها بنجاح!');
      })
      .catch(() => {
        toast.error('حدث خطأ أثناء التسوية');
      });
  };

  const handleStartMatch = async (matchId: string) => {
    if (!confirm('هل أنت متأكد من بدء هذه المباراة الآن؟ ستتحول إلى البث المباشر.')) return;
    try {
      await api.put(`/admin/matches/${matchId}/start`);
      fetchMatches();
      toast.success('بدأت المباراة بنجاح.');
    } catch (error) {
      toast.error('حدث خطأ أثناء بدء المباراة');
    }
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المباراة نهائياً؟ سيتم حذف جميع الرهانات المرتبطة بها!')) return;
    try {
      await api.delete(`/admin/matches/${matchId}`);
      fetchMatches();
      toast.success('تم حذف المباراة بنجاح.');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleToggleStream = async (match: any) => {
    try {
      await api.put(`/admin/matches/${match.id}/stream`, {
        isStreamActive: !match.isStreamActive
      });
      fetchMatches();
      toast.success(!match.isStreamActive ? '✅ تم تفعيل البث المباشر' : '⏹️ تم إيقاف البث');
    } catch (error) {
      toast.error('حدث خطأ أثناء تغيير حالة البث');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {liveControlMatch && (
        <LiveControlPanel 
          match={liveControlMatch} 
          onClose={() => setLiveControlMatch(null)} 
          onUpdate={fetchMatches} 
        />
      )}
      
      <HeroSection 
        title={
          <>
            إدارة <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-400">المباريات</span>
          </>
        }
        subtitle="أضف، عدل، أو سوّي المباريات والرهانات."
        badge="لوحة الإدارة ⚙️"
        minHeight="min-h-[40vh]"
      >
        <div className="mt-8 flex justify-center">
          <Button onClick={handleAddNewClick} className="flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            {showAddForm && !editingMatchId ? <X size={20} /> : <Plus size={20} />}
            {showAddForm && !editingMatchId ? 'إلغاء الإضافة' : 'مباراة جديدة'}
          </Button>
        </div>
      </HeroSection>

      <div className="container mx-auto px-4 mt-2 relative z-20">


      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-[2rem] p-6 pb-12 md:p-10 border border-primary/20 relative shadow-[0_15px_60px_rgb(0,0,0,0.5)] scrollbar-hide">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
            
            <button onClick={() => { setShowAddForm(false); setEditingMatchId(null); }} className="absolute top-6 left-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-slate-900 transition-colors border border-white/10">
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-slate-900">
              {editingMatchId ? <Edit size={24} className="text-blue-400" /> : <Plus size={24} className="text-primary" />}
              {editingMatchId ? 'تعديل بيانات المباراة' : 'إضافة مباراة جديدة'}
            </h2>
            
            <form onSubmit={handleAddOrEditMatch} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teams Input */}
                <div className="glass p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-lg font-bold text-primary mb-2">بيانات الفرق</h3>
                  <div>
                    <label className="block text-sm mb-1.5 text-muted-foreground">الفريق الأول (المضيف)</label>
                    <input type="text" className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-slate-900" required placeholder="مثال: ريال مدريد" value={formData.team1Name} onChange={e => setFormData({...formData, team1Name: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm mb-1.5 text-muted-foreground">شعار الفريق الأول (اختياري)</label>
                      <input type="file" accept="image/*" className="w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border border-white/10 rounded-xl bg-background/50" onChange={e => {
                        const file = e.target.files ? e.target.files[0] : null;
                        setTeam1LogoFile(file);
                        if (file) setTeam1LogoPreview(URL.createObjectURL(file));
                        else setTeam1LogoPreview(null);
                      }} />
                    </div>
                    {team1LogoPreview && (
                      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-lg mt-5">
                        <BackendImage src={team1LogoPreview} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-white/5 my-2"></div>
                  <div>
                    <label className="block text-sm mb-1.5 text-muted-foreground">الفريق الثاني (الضيف)</label>
                    <input type="text" className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-slate-900" required placeholder="مثال: برشلونة" value={formData.team2Name} onChange={e => setFormData({...formData, team2Name: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm mb-1.5 text-muted-foreground">شعار الفريق الثاني (اختياري)</label>
                      <input type="file" accept="image/*" className="w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border border-white/10 rounded-xl bg-background/50" onChange={e => {
                        const file = e.target.files ? e.target.files[0] : null;
                        setTeam2LogoFile(file);
                        if (file) setTeam2LogoPreview(URL.createObjectURL(file));
                        else setTeam2LogoPreview(null);
                      }} />
                    </div>
                    {team2LogoPreview && (
                      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-lg mt-5">
                        <BackendImage src={team2LogoPreview} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
  
                {/* Match Info Input */}
                <div className="glass p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-lg font-bold text-amber-400 mb-2">تفاصيل المباراة</h3>
                  <div>
                    <label className="block text-sm mb-1.5 text-muted-foreground">اسم البطولة / الدوري</label>
                    <input 
                      type="text" 
                      list="leaguesList"
                      className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-slate-900" 
                      required 
                      placeholder="اختر أو ابحث عن دوري..." 
                      value={formData.league} 
                      onChange={e => setFormData({...formData, league: e.target.value})} 
                      autoComplete="off"
                    />
                    <datalist id="leaguesList">
                      {leagues.map((l) => (
                        <option key={l.id} value={l.name}>
                          {l.country ? `${l.name} (${l.country})` : l.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 text-muted-foreground">تاريخ ووقت المباراة</label>
                    <input type="datetime-local" className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-slate-900" required value={formData.matchDate} onChange={e => setFormData({...formData, matchDate: e.target.value})} />
                  </div>
                  {editingMatchId && (
                    <div>
                      <label className="block text-sm mb-1.5 text-muted-foreground">حالة المباراة</label>
                      <select className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-slate-900" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="UPCOMING">قادمة (UPCOMING)</option>
                        <option value="LIVE">جارية الآن (LIVE)</option>
                        <option value="CANCELLED">ملغاة (CANCELLED)</option>
                      </select>
                    </div>
                  )}
                  {editingMatchId && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm mb-1.5 text-muted-foreground">أهداف الفريق الأول</label>
                        <input type="number" min="0" className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-slate-900 text-center text-lg font-bold" required value={formData.team1Score} onChange={e => setFormData({...formData, team1Score: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-sm mb-1.5 text-muted-foreground">أهداف الفريق الثاني</label>
                        <input type="number" min="0" className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-slate-900 text-center text-lg font-bold" required value={formData.team2Score} onChange={e => setFormData({...formData, team2Score: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold mt-8 mb-2 text-primary">الاحتمالات (Odds)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs mb-1 text-muted-foreground text-center line-clamp-1" title={`فوز ${formData.team1Name || 'الأول'}`}>فوز {formData.team1Name || 'الأول'}</label>
                      <input type="number" step="0.01" className="w-full bg-background/50 border border-white/10 rounded-xl px-2 py-2 outline-none focus:border-primary text-center font-bold text-primary" required value={formData.odds.team1Win} onChange={e => setFormData({...formData, odds: {...formData.odds, team1Win: parseFloat(e.target.value)}})} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-muted-foreground text-center">تعادل</label>
                      <input type="number" step="0.01" className="w-full bg-background/50 border border-white/10 rounded-xl px-2 py-2 outline-none focus:border-amber-500 text-center font-bold text-amber-500" required value={formData.odds.draw} onChange={e => setFormData({...formData, odds: {...formData.odds, draw: parseFloat(e.target.value)}})} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-muted-foreground text-center line-clamp-1" title={`فوز ${formData.team2Name || 'الثاني'}`}>فوز {formData.team2Name || 'الثاني'}</label>
                      <input type="number" step="0.01" className="w-full bg-background/50 border border-white/10 rounded-xl px-2 py-2 outline-none focus:border-blue-500 text-center font-bold text-blue-500" required value={formData.odds.team2Win} onChange={e => setFormData({...formData, odds: {...formData.odds, team2Win: parseFloat(e.target.value)}})} />
                    </div>
                  </div>

                  {/* Stream Settings */}
                  <h3 className="text-lg font-bold mt-8 mb-2 text-rose-500 flex items-center gap-2">
                    <span>📺</span> إعدادات البث المباشر
                  </h3>
                  <div>
                    <label className="block text-sm mb-1.5 text-muted-foreground">رابط البث (YouTube Embed أو أي رابط)</label>
                    <input
                      type="url"
                      className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-rose-400 transition-colors text-slate-900"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.streamUrl}
                      onChange={e => setFormData({...formData, streamUrl: e.target.value})}
                    />
                    <p className="text-xs text-slate-400 mt-1">ادخل رابط YouTube أو أي رابط بث مباشر. سيتم تحويله تلقائياً لرابط embed.</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, isStreamActive: !formData.isStreamActive})}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${formData.isStreamActive ? 'bg-rose-500' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${formData.isStreamActive ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{formData.isStreamActive ? '🔴 البث نشط – سيظهر للمستخدمين' : '⏹️ البث موقف – لن يظهر للمستخدمين'}</p>
                      <p className="text-xs text-slate-500">قم بتفعيله عند بدء البث الفعلي للمباراة</p>
                    </div>
                  </div>
                </div>
              </div>
  
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> جاري النشر...</span>
                  ) : (
                    editingMatchId ? 'حفظ التعديلات' : 'نشر المباراة'
                  )}
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-14 text-lg" onClick={() => { setShowAddForm(false); setEditingMatchId(null); }}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matches Grid (FIFA Style Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map(match => (
          <div key={match.id} className="bg-white rounded-3xl overflow-hidden relative group border border-blue-500/50 hover:border-blue-400 transition-all duration-300 shadow-xl hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)] flex flex-col">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent opacity-50"></div>
            
            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
                match.status === 'FINISHED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                match.status === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {match.status === 'LIVE' && <Activity size={12} className="animate-pulse" />}
                {match.status === 'FINISHED' ? 'مكتملة' : match.status === 'LIVE' ? 'جارية الآن' : 'قادمة'}
              </span>
            </div>
            
            {/* League Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-amber-400" title={match.league}>
                <Trophy size={14} />
              </span>
            </div>

            {/* Teams & Score Area */}
            <div className="pt-12 pb-6 px-6 relative z-10 flex-1">
              <div className="text-center mb-6">
                <p className="text-xs text-muted-foreground font-medium mb-1">{match.league}</p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-900/70">
                  <CalendarDays size={12} />
                  <span>{new Date(match.matchDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                  <span className="mx-1">•</span>
                  <Clock size={12} />
                  <span>{new Date(match.matchDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Team 1 */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg mb-3 p-2 overflow-hidden">
                    <BackendImage src={match.team1Logo} alt={match.team1Name} className="w-full h-full object-contain" fallbackIcon={<ShieldHalf size={28} className="text-primary/50" />} />
                  </div>
                  <h3 className="font-bold text-sm text-center text-slate-900 line-clamp-2">{match.team1Name}</h3>
                </div>

                {/* VS or Score */}
                <div className="flex flex-col items-center justify-center px-2">
                  {match.status === 'FINISHED' ? (
                    <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-xl font-black text-lg">
                      نهاية
                    </div>
                  ) : match.status === 'LIVE' ? (
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-lg text-slate-900">{match.team1Score || 0}</span>
                      <span className="text-slate-400 font-bold">-</span>
                      <span className="font-bold text-lg text-slate-900">{match.team2Score || 0}</span>
                    </div>
                  ) : (
                    <div className="text-xl font-black italic text-slate-900/30 tracking-widest">VS</div>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg mb-3 p-2 overflow-hidden">
                    <BackendImage src={match.team2Logo} alt={match.team2Name} className="w-full h-full object-contain" fallbackIcon={<ShieldHalf size={28} className="text-blue-400/50" />} />
                  </div>
                  <h3 className="font-bold text-sm text-center text-slate-900 line-clamp-2">{match.team2Name}</h3>
                </div>
              </div>
            </div>

            {/* Actions / Settlement Area */}
            <div className="p-4 border-t border-slate-200 bg-white backdrop-blur-md">
              {match.status !== 'FINISHED' ? (
                <div className="space-y-3">
                  {(match.status === 'UPCOMING' || match.status === 'DRAFT') && (
                    <button 
                      onClick={() => handleStartMatch(match.id)} 
                      className="w-full py-3 px-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-600 font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <PlayCircle size={18} />
                      بدء المباراة
                    </button>
                  )}
                  {match.status === 'LIVE' && (
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setLiveControlMatch(match)} 
                        className="w-full py-3 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Settings size={18} />
                        لوحة التحكم الحي
                      </button>
                      <button 
                        onClick={() => handleEndMatch(match)} 
                        className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 font-bold transition-all flex items-center justify-center gap-2 shadow-sm mt-1"
                      >
                        <CheckCircle size={18} />
                        إنهاء المباراة
                      </button>
                    </div>
                  )}
                  {/* Quick Stream Toggle */}
                  <button
                    onClick={() => handleToggleStream(match)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      match.isStreamActive
                        ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${match.isStreamActive ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                    {match.isStreamActive ? '🔴 البث نشط – إيقاف' : '📺 تفعيل البث'}
                  </button>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" className="flex-1 h-9 text-xs border-white/10 text-slate-900" onClick={() => handleEditClick(match)}>
                      <Edit size={14} className="mr-1.5" /> تعديل
                    </Button>
                    <Button variant="outline" className="flex-1 h-9 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(match.id)}>
                      <Trash2 size={14} className="mr-1.5" /> حذف
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 py-2">
                  <div className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full w-full justify-center">
                    <CheckCircle size={16} />
                    نتيجة: {match.result === 'TEAM_1_WIN' ? match.team1Name : match.result === 'TEAM_2_WIN' ? match.team2Name : 'التعادل'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="glass rounded-3xl p-16 text-center border border-slate-200">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Trophy size={64} className="opacity-20 mb-6" />
            <p className="text-xl font-bold text-slate-900 mb-2">لا توجد مباريات حالياً.</p>
            <p className="opacity-60 mb-8">قم بإضافة مباراة جديدة للبدء واستقبال رهانات المستخدمين.</p>
            <Button onClick={handleAddNewClick} className="shadow-[0_0_20px_rgba(34,197,94,0.2)]">إضافة أول مباراة</Button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
