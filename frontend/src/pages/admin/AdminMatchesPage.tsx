import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { BackendImage } from '../../components/BackendImage';
import { HeroSection } from '../../components/ui/HeroSection';
import { Plus, X, Edit, CheckCircle, Clock, CalendarDays, Activity, Trophy, ShieldHalf, Trash2, Loader2, PlayCircle, Settings, Camera } from 'lucide-react';
import { LiveControlPanel } from '../../components/LiveControlPanel';
import { CameraBroadcast } from '../../components/CameraBroadcast';
import { useToast } from '../../context/ToastContext';

export const AdminMatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [liveControlMatch, setLiveControlMatch] = useState<any | null>(null);
  const [cameraBroadcastMatch, setCameraBroadcastMatch] = useState<any | null>(null);
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
      const res = await api.get('/admin/streams');
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
      // Convert local datetime-local value to ISO UTC string
      const localDateObj = new Date(formData.matchDate);
      data.append('matchDate', localDateObj.toISOString());
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
    // Format date for datetime-local input in local timezone
    const d = new Date(match.matchDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}T${hours}:${minutes}`;
    
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

  const handleStreamStarted = async (url: string) => {
    if (!cameraBroadcastMatch) return;
    try {
      await api.put(`/admin/matches/${cameraBroadcastMatch.id}`, {
        streamUrl: url,
        isStreamActive: true
      });
      fetchMatches();
    } catch (error) {
      toast.error('حدث خطأ أثناء تفعيل بث الكاميرا في قاعدة البيانات');
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

      {cameraBroadcastMatch && (
        <CameraBroadcast
          channelName={`match_${cameraBroadcastMatch.id}`}
          onClose={() => setCameraBroadcastMatch(null)}
          onStreamStarted={handleStreamStarted}
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
        <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
          <Button variant="outline" onClick={() => setFilter('ALL')} className={`text-sm px-4 md:px-6 rounded-xl shadow-sm font-bold transition-all ${filter === 'ALL' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-slate-300 text-slate-600 bg-white/50'}`}>الكل</Button>
          <Button variant="outline" onClick={() => setFilter('LIVE')} className={`text-sm px-4 md:px-6 rounded-xl shadow-sm font-bold transition-all ${filter === 'LIVE' ? 'border-red-500 text-red-600 bg-red-50/50' : 'border-slate-300 text-slate-600 bg-white/50'}`}>مباشر</Button>
          <Button variant="outline" onClick={() => setFilter('UPCOMING')} className={`text-sm px-4 md:px-6 rounded-xl shadow-sm font-bold transition-all ${filter === 'UPCOMING' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' : 'border-slate-300 text-slate-600 bg-white/50'}`}>قادمة</Button>
          <Button variant="outline" onClick={() => setFilter('FINISHED')} className={`text-sm px-4 md:px-6 rounded-xl shadow-sm font-bold transition-all ${filter === 'FINISHED' ? 'border-slate-500 text-slate-600 bg-slate-100/50' : 'border-slate-300 text-slate-600 bg-white/50'}`}>مكتملة</Button>
        </div>
        <div className="mt-4 flex justify-center">
          <Button onClick={handleAddNewClick} className="flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            {showAddForm && !editingMatchId ? <X size={20} /> : <Plus size={20} />}
            {showAddForm && !editingMatchId ? 'إلغاء الإضافة' : 'مباراة جديدة'}
          </Button>
        </div>
      </HeroSection>

      <div className="container mx-auto px-4 mt-2 relative z-20">


            {showAddForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 relative shadow-2xl scrollbar-hide border border-slate-100">
            
            <button type="button" onClick={() => { setShowAddForm(false); setEditingMatchId(null); }} className="absolute top-6 left-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors z-20">
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
              {editingMatchId ? <Edit size={24} className="text-blue-500" /> : <Plus size={24} className="text-blue-500" />}
              {editingMatchId ? 'تعديل بيانات المباراة' : 'إضافة مباراة جديدة'}
            </h2>
            
            <form onSubmit={handleAddOrEditMatch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teams Input */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-base font-bold text-slate-700 mb-2">بيانات الفرق</h3>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium text-slate-600">الفريق الأول (المضيف)</label>
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900" required placeholder="مثال: ريال مدريد" value={formData.team1Name} onChange={e => setFormData({...formData, team1Name: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm mb-1.5 font-medium text-slate-600">شعار الفريق الأول (اختياري)</label>
                      <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl bg-white" onChange={e => {
                        const file = e.target.files ? e.target.files[0] : null;
                        setTeam1LogoFile(file);
                        if (file) setTeam1LogoPreview(URL.createObjectURL(file));
                        else setTeam1LogoPreview(null);
                      }} />
                    </div>
                    {team1LogoPreview && (
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-sm mt-6">
                        <BackendImage src={team1LogoPreview} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium text-slate-600">الفريق الثاني (الضيف)</label>
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900" required placeholder="مثال: برشلونة" value={formData.team2Name} onChange={e => setFormData({...formData, team2Name: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm mb-1.5 font-medium text-slate-600">شعار الفريق الثاني (اختياري)</label>
                      <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl bg-white" onChange={e => {
                        const file = e.target.files ? e.target.files[0] : null;
                        setTeam2LogoFile(file);
                        if (file) setTeam2LogoPreview(URL.createObjectURL(file));
                        else setTeam2LogoPreview(null);
                      }} />
                    </div>
                    {team2LogoPreview && (
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-sm mt-6">
                        <BackendImage src={team2LogoPreview} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
  
                {/* Match Info Input */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-base font-bold text-slate-700 mb-2">تفاصيل المباراة</h3>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium text-slate-600">اسم البطولة / الدوري</label>
                    <input 
                      type="text" 
                      list="leaguesList"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900" 
                      required 
                      placeholder="اختر أو ابحث عن دوري..." 
                      value={formData.league} 
                      onChange={e => setFormData({...formData, league: e.target.value})} 
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium text-slate-600">تاريخ ووقت المباراة</label>
                    <input type="datetime-local" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900" required value={formData.matchDate} onChange={e => setFormData({...formData, matchDate: e.target.value})} />
                  </div>
                  {editingMatchId && (
                    <div>
                      <label className="block text-sm mb-1.5 font-medium text-slate-600">حالة المباراة</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="UPCOMING">قادمة (UPCOMING)</option>
                        <option value="LIVE">جارية الآن (LIVE)</option>
                        <option value="CANCELLED">ملغاة (CANCELLED)</option>
                      </select>
                    </div>
                  )}
                  {editingMatchId && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm mb-1.5 font-medium text-slate-600">أهداف الفريق الأول</label>
                        <input type="number" min="0" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-center text-lg font-bold" required value={formData.team1Score} onChange={e => setFormData({...formData, team1Score: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-sm mb-1.5 font-medium text-slate-600">أهداف الفريق الثاني</label>
                        <input type="number" min="0" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-center text-lg font-bold" required value={formData.team2Score} onChange={e => setFormData({...formData, team2Score: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-base font-bold mt-6 mb-2 text-slate-700">الاحتمالات (Odds)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs mb-1 text-slate-500 text-center line-clamp-1" title={`فوز ${formData.team1Name || 'الأول'}`}>فوز {formData.team1Name || 'الأول'}</label>
                      <input type="number" step="0.01" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 outline-none focus:border-blue-500 text-center font-bold text-slate-800" required value={formData.odds.team1Win} onChange={e => setFormData({...formData, odds: {...formData.odds, team1Win: parseFloat(e.target.value)}})} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-slate-500 text-center">تعادل</label>
                      <input type="number" step="0.01" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 outline-none focus:border-amber-500 text-center font-bold text-amber-600" required value={formData.odds.draw} onChange={e => setFormData({...formData, odds: {...formData.odds, draw: parseFloat(e.target.value)}})} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-slate-500 text-center line-clamp-1" title={`فوز ${formData.team2Name || 'الثاني'}`}>فوز {formData.team2Name || 'الثاني'}</label>
                      <input type="number" step="0.01" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 outline-none focus:border-blue-500 text-center font-bold text-slate-800" required value={formData.odds.team2Win} onChange={e => setFormData({...formData, odds: {...formData.odds, team2Win: parseFloat(e.target.value)}})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stream Settings */}
              <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
                <h3 className="text-base font-bold mb-3 text-rose-600 flex items-center gap-2">
                  <PlayCircle size={18} /> إعدادات البث المباشر
                </h3>
                <div className="mb-4">
                  <label className="block text-sm mb-1.5 font-medium text-slate-600">رابط البث (YouTube Embed أو أي رابط)</label>
                  <input
                    type="url"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all text-slate-900"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.streamUrl}
                    onChange={e => setFormData({...formData, streamUrl: e.target.value})}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">ادخل رابط YouTube أو أي رابط بث مباشر. سيتم تحويله تلقائياً لرابط embed.</p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isStreamActive: !formData.isStreamActive})}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${formData.isStreamActive ? 'bg-rose-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${formData.isStreamActive ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{formData.isStreamActive ? '🔴 البث نشط – سيظهر للمستخدمين' : '⏹️ البث متوقف – لن يظهر للمستخدمين'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">قم بتفعيله عند بدء البث الفعلي للمباراة</p>
                  </div>
                </div>
              </div>
  
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={18} /> جاري الحفظ...</span>
                  ) : (
                    editingMatchId ? 'حفظ التعديلات' : 'إضافة المباراة'
                  )}
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-12 text-base font-medium border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => { setShowAddForm(false); setEditingMatchId(null); }}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Matches Grid (FIFA Style Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.filter(m => filter === 'ALL' || m.status === filter).map(match => (
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
            
            {/* League Badge - LEFT */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-amber-400" title={match.league}>
                <Trophy size={14} />
              </span>
              {/* Academy or Admin Badge */}
              {match.isAdminMatch ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-bold whitespace-nowrap">
                  🏆 رسمية
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-bold whitespace-nowrap">
                  🏫 أكاديمية
                </span>
              )}
            </div>

            {/* Teams & Score Area */}
            <div className="pt-12 pb-6 px-6 relative z-10 flex-1">
              <div className="text-center mb-6">
                <p className="text-xs text-muted-foreground font-medium mb-1">{match.league || match.academy?.name || '—'}</p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-900/70">
                  <CalendarDays size={12} />
                  <span>{new Date(match.scheduledAt || match.matchDate || match.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                  <span className="mx-1">•</span>
                  <Clock size={12} />
                  <span>{new Date(match.scheduledAt || match.matchDate || match.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
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

            <div className="p-4 border-t border-slate-200 bg-white backdrop-blur-md">
              {match.status !== 'FINISHED' ? (
                <div className="space-y-3">
                  {!match.apiFixtureId && (match.status === 'UPCOMING' || match.status === 'DRAFT') && (
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
                      {!match.apiFixtureId && (
                        <button 
                          onClick={() => setLiveControlMatch(match)} 
                          className="w-full py-3 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Settings size={18} />
                          لوحة التحكم الحي
                        </button>
                      )}
                      {!match.apiFixtureId && (
                        <button 
                          onClick={() => setCameraBroadcastMatch(match)}
                          className="w-full py-3 px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 font-bold transition-all flex items-center justify-center gap-2 shadow-sm mt-1"
                        >
                          <Camera size={18} />
                          بث من كاميرا الهاتف
                        </button>
                      )}
                      {!match.apiFixtureId && (
                        <button 
                          onClick={() => handleEndMatch(match)} 
                          className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 font-bold transition-all flex items-center justify-center gap-2 shadow-sm mt-1"
                        >
                          <CheckCircle size={18} />
                          إنهاء المباراة
                        </button>
                      )}
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
                    {!match.apiFixtureId && (
                      <Button variant="outline" className="flex-1 h-9 text-xs border-white/10 text-slate-900" onClick={() => handleEditClick(match)}>
                        <Edit size={14} className="mr-1.5" /> تعديل
                      </Button>
                    )}
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

      {matches.filter(m => filter === 'ALL' || m.status === filter).length === 0 && (
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
