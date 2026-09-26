import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyStreams, createStream, updateStream, deleteStream, startStream, endStream } from '../../api/academies';
import { Button } from '../../components/ui/Button';
import { BackendImage } from '../../components/BackendImage';
import { HeroSection } from '../../components/ui/HeroSection';
import { Plus, X, Edit, CheckCircle, Clock, CalendarDays, Activity, Trophy, ShieldHalf, Trash2, PlayCircle, Camera, Settings, Loader2 } from 'lucide-react';
import { LiveControlPanel } from '../../components/LiveControlPanel';
import { CameraBroadcast } from '../../components/CameraBroadcast';
import { useToast } from '../../context/ToastContext';

export const AcademyStreamsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: matches, isLoading } = useQuery({
    queryKey: ['myStreams'],
    queryFn: getMyStreams
  });

  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'ENDED'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [liveControlMatch, setLiveControlMatch] = useState<any | null>(null);
  const [cameraBroadcastMatch, setCameraBroadcastMatch] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', team1Name: '', team2Name: '', matchDate: '', status: 'SCHEDULED', streamType: 'MATCH',
    team1Score: 0, team2Score: 0,
    odds: { team1Win: 1.5, draw: 3.0, team2Win: 2.5 },
  });
  const [team1LogoFile, setTeam1LogoFile] = useState<File | null>(null);
  const [team2LogoFile, setTeam2LogoFile] = useState<File | null>(null);
  const [team1LogoPreview, setTeam1LogoPreview] = useState<string | null>(null);
  const [team2LogoPreview, setTeam2LogoPreview] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStreams'] });
      setShowAddForm(false);
      resetForm();
      toast.success('تم إضافة المباراة بنجاح!');
    },
    onError: () => toast.error('حدث خطأ أثناء حفظ المباراة'),
    onSettled: () => setIsSubmitting(false)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: FormData }) => updateStream(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStreams'] });
      setShowAddForm(false);
      resetForm();
      toast.success('تم تعديل المباراة بنجاح!');
    },
    onError: () => toast.error('حدث خطأ أثناء تعديل المباراة'),
    onSettled: () => setIsSubmitting(false)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStreams'] });
      toast.success('تم حذف المباراة بنجاح.');
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف')
  });

  const startMutation = useMutation({
    mutationFn: ({ id, url }: { id: string, url?: string }) => startStream(id, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStreams'] });
      toast.success('بدأت المباراة بنجاح.');
    },
    onError: () => toast.error('حدث خطأ أثناء بدء المباراة')
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => endStream(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStreams'] });
      toast.success('تم إنهاء المباراة بنجاح!');
    },
    onError: () => toast.error('حدث خطأ أثناء الإنهاء')
  });

  const resetForm = () => {
    setFormData({
      title: '', team1Name: '', team2Name: '',
      matchDate: '', status: 'SCHEDULED', streamType: 'MATCH',
      team1Score: 0, team2Score: 0,
      odds: { team1Win: 1.5, draw: 3.0, team2Win: 2.5 },
    });
    setTeam1LogoFile(null);
    setTeam2LogoFile(null);
    setTeam1LogoPreview(null);
    setTeam2LogoPreview(null);
    setEditingMatchId(null);
  };

  const handleAddOrEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const data = new FormData();
    data.append('title', `${formData.team1Name} vs ${formData.team2Name}`);
    data.append('team1Name', formData.team1Name);
    data.append('team2Name', formData.team2Name);
    data.append('streamType', formData.streamType);
    
    const localDateObj = new Date(formData.matchDate);
    data.append('scheduledAt', localDateObj.toISOString());
    
    data.append('status', formData.status);
    data.append('odds', JSON.stringify(formData.odds));

    if (team1LogoFile) data.append('team1Logo', team1LogoFile);
    if (team2LogoFile) data.append('team2Logo', team2LogoFile);

    if (editingMatchId) {
      updateMutation.mutate({ id: editingMatchId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditClick = (match: any) => {
    const d = new Date(match.scheduledAt || match.matchDate || match.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}T${hours}:${minutes}`;

    setFormData({
      title: match.title || '',
      team1Name: match.team1Name || '',
      team2Name: match.team2Name || '',
      matchDate: dateStr,
      status: match.status,
      streamType: match.streamType || 'MATCH',
      team1Score: match.team1Score || 0,
      team2Score: match.team2Score || 0,
      odds: {
        team1Win: match.odds?.[0]?.team1Win || 1.5,
        draw: match.odds?.[0]?.draw || 3.0,
        team2Win: match.odds?.[0]?.team2Win || 2.5,
      }
    });
    setTeam1LogoFile(null);
    setTeam2LogoFile(null);
    setTeam1LogoPreview(match.team1Logo || null);
    setTeam2LogoPreview(match.team2Logo || null);
    setEditingMatchId(match.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (matchId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المباراة نهائياً؟')) return;
    deleteMutation.mutate(matchId);
  };

  const handleStartMatch = (matchId: string) => {
    if (!confirm('هل أنت متأكد من بدء هذه المباراة الآن؟ ستتحول إلى البث المباشر.')) return;
    startMutation.mutate({ id: matchId });
  };

  const handleEndMatch = (matchId: string) => {
    if (!confirm('هل أنت متأكد من إنهاء هذه المباراة؟')) return;
    endMutation.mutate(matchId);
  };

  const handleStreamStarted = (url: string) => {
    if (!cameraBroadcastMatch) return;
    const data = new FormData();
    data.append('streamUrl', url);
    data.append('isStreamActive', 'true');
    updateMutation.mutate({ id: cameraBroadcastMatch.id, data });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, team: 1 | 2) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      if (team === 1) {
        setTeam1LogoFile(file);
        setTeam1LogoPreview(previewUrl);
      } else {
        setTeam2LogoFile(file);
        setTeam2LogoPreview(previewUrl);
      }
    }
  };

  if (isLoading) return (
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
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['myStreams'] })}
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
        title="إدارة مباريات الأكاديمية"
        subtitle="أضف مباريات، نظم البثوث، وتحكم بالتفاصيل"
        icon={<Trophy size={48} className="text-amber-400" />}
      >
        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-xl px-6"
        >
          {showAddForm ? <X size={20} className="ml-2" /> : <Plus size={20} className="ml-2" />}
          {showAddForm ? 'إلغاء الإضافة' : 'إضافة مباراة جديدة'}
        </Button>
      </HeroSection>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {showAddForm && (
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddForm(false);
            }}>
              <div className="bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden relative my-auto animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 sticky top-0 z-10 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                      {editingMatchId ? <Edit size={24} /> : <Plus size={24} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editingMatchId ? 'تعديل بيانات المباراة' : 'إضافة مباراة جديدة'}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">أدخل تفاصيل الفريقين والموعد لجدولة المباراة</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleAddOrEditMatch} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Column 1: Teams */}
                    <div className="space-y-6">
                      <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 space-y-5">
                        <h3 className="text-sm font-bold text-slate-300 border-b border-slate-700 pb-2 flex items-center gap-2">
                          <ShieldHalf size={16} className="text-blue-400" /> الفريق الأول (المستضيف)
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">اسم الفريق الأول</label>
                          <input
                            type="text"
                            required
                            value={formData.team1Name}
                            onChange={(e) => setFormData({ ...formData, team1Name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
                            placeholder="مثال: أكاديمية مواهب الأردن"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">شعار الفريق الأول</label>
                          <div className="flex items-center gap-4">
                            {team1LogoPreview && (
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                                <BackendImage url={team1LogoPreview} alt="Team 1 Logo" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoChange(e, 1)}
                              className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 transition-all cursor-pointer bg-slate-900 rounded-xl border border-slate-700"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 space-y-5">
                        <h3 className="text-sm font-bold text-slate-300 border-b border-slate-700 pb-2 flex items-center gap-2">
                          <ShieldHalf size={16} className="text-red-400" /> الفريق الثاني (الضيف)
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">اسم الفريق الثاني</label>
                          <input
                            type="text"
                            required
                            value={formData.team2Name}
                            onChange={(e) => setFormData({ ...formData, team2Name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
                            placeholder="مثال: أكاديمية الفرسان"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">شعار الفريق الثاني</label>
                          <div className="flex items-center gap-4">
                            {team2LogoPreview && (
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                                <BackendImage url={team2LogoPreview} alt="Team 2 Logo" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoChange(e, 2)}
                              className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 transition-all cursor-pointer bg-slate-900 rounded-xl border border-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Match Details & Odds */}
                    <div className="space-y-6">
                      <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 space-y-5">
                        <h3 className="text-sm font-bold text-slate-300 border-b border-slate-700 pb-2 flex items-center gap-2">
                          <CalendarDays size={16} className="text-green-400" /> تفاصيل المباراة
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">تاريخ ووقت المباراة</label>
                          <input
                            type="datetime-local"
                            required
                            value={formData.matchDate}
                            onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner [color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">نوع البث</label>
                          <select
                            value={formData.streamType}
                            onChange={(e) => setFormData({ ...formData, streamType: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
                          >
                            <option value="MATCH">مباراة تنافسية</option>
                            <option value="TRAINING">تدريب</option>
                            <option value="PODCAST">بودكاست</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 space-y-5">
                        <h3 className="text-sm font-bold text-amber-400 border-b border-slate-700 pb-2 flex items-center gap-2">
                          <Trophy size={16} /> أوزان الرهان (Odds)
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                          أدخل عوائد الرهان كأرقام عشرية (مثال: 1.5 يعني أن الرهان بـ 100 يعود بـ 150). هذه الأرقام ستظهر للمستخدمين عند المراهنة.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-blue-400 mb-1 text-center">فوز الأول</label>
                            <input
                              type="number"
                              step="0.01"
                              min="1.01"
                              value={formData.odds.team1Win}
                              onChange={(e) => setFormData({
                                ...formData,
                                odds: { ...formData.odds, team1Win: parseFloat(e.target.value) || 1 }
                              })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-center text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 text-center">تعادل</label>
                            <input
                              type="number"
                              step="0.01"
                              min="1.01"
                              value={formData.odds.draw}
                              onChange={(e) => setFormData({
                                ...formData,
                                odds: { ...formData.odds, draw: parseFloat(e.target.value) || 1 }
                              })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-center text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-red-400 mb-1 text-center">فوز الثاني</label>
                            <input
                              type="number"
                              step="0.01"
                              min="1.01"
                              value={formData.odds.team2Win}
                              onChange={(e) => setFormData({
                                ...formData,
                                odds: { ...formData.odds, team2Win: parseFloat(e.target.value) || 1 }
                              })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-center text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-700 sticky bottom-0 bg-slate-900 py-4 z-10">
                    <Button 
                      type="submit" 
                      className="flex-1 shadow-xl hover:shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-bold py-3 text-lg" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري الحفظ...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          {editingMatchId ? 'حفظ التعديلات' : 'إضافة المباراة'}
                        </span>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      className="px-8 py-3 bg-slate-800 border-slate-600 text-white hover:bg-slate-700 font-bold"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </div>
            </div>
            , document.body
          )
        )}

        {/* Filter Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-8 border border-slate-700/50 shadow-lg backdrop-blur-md w-full md:w-auto overflow-x-auto hide-scrollbar">
          {(['ALL', 'LIVE', 'SCHEDULED', 'ENDED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 min-w-[100px] px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f === 'ALL' ? 'الكل' : f === 'LIVE' ? 'مباشر 🔴' : f === 'SCHEDULED' ? 'مجدولة 📅' : 'منتهية ✅'}
            </button>
          ))}
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches?.filter((m: any) => filter === 'ALL' || (filter === 'SCHEDULED' ? ['SCHEDULED', 'UPCOMING'].includes(m.status) : m.status === filter)).map((match: any) => (
            <div key={match.id} className={`group relative bg-slate-800/60 backdrop-blur-sm rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 ${match.status === 'LIVE' ? 'border-red-500/50' : 'border-slate-700/50'}`}>
              
              {/* Match Status Header */}
              <div className={`px-4 py-2 flex items-center justify-between text-xs font-bold border-b ${
                match.status === 'LIVE' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                match.status === 'SCHEDULED' || match.status === 'UPCOMING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                'bg-slate-700/30 border-slate-700 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  {match.status === 'LIVE' ? (
                    <>
                      <Activity size={14} className="animate-pulse" />
                      مباشر الآن
                    </>
                  ) : match.status === 'SCHEDULED' || match.status === 'UPCOMING' ? (
                    <>
                      <Clock size={14} />
                      قادمة
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      منتهية
                    </>
                  )}
                </div>
              </div>

              {/* Teams & Score Area */}
              <div className="p-6 relative">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={12} />
                    <span>{new Date(match.scheduledAt || match.matchDate || match.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                    <span className="mx-1">•</span>
                    <Clock size={12} />
                    <span>{new Date(match.scheduledAt || match.matchDate || match.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Team 1 */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-inner mb-3 p-2 flex items-center justify-center">
                      {match.team1Logo ? (
                        <BackendImage url={match.team1Logo} alt={match.team1Name} className="w-full h-full object-contain" />
                      ) : (
                        <ShieldHalf className="w-8 h-8 text-slate-600" />
                      )}
                    </div>
                    <span className="font-bold text-sm text-center text-white line-clamp-2">{match.team1Name}</span>
                  </div>

                  {/* Score OR VS */}
                  <div className="flex flex-col items-center justify-center px-2">
                    {(match.status === 'LIVE' || match.status === 'ENDED') ? (
                      <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700 shadow-inner">
                        <span className="text-3xl font-black text-white">{match.team1Score || 0}</span>
                        <span className="text-slate-500 font-bold">-</span>
                        <span className="text-3xl font-black text-white">{match.team2Score || 0}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-black text-sm shadow-inner">
                        VS
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-inner mb-3 p-2 flex items-center justify-center">
                      {match.team2Logo ? (
                        <BackendImage url={match.team2Logo} alt={match.team2Name} className="w-full h-full object-contain" />
                      ) : (
                        <ShieldHalf className="w-8 h-8 text-slate-600" />
                      )}
                    </div>
                    <span className="font-bold text-sm text-center text-white line-clamp-2">{match.team2Name}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 bg-slate-800/80 hover:bg-slate-700 border-slate-600 shadow-sm text-white h-10" 
                  onClick={() => handleEditClick(match)}
                >
                  <Edit size={16} className="mr-2" /> تعديل
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-none w-10 h-10 p-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20" 
                  onClick={() => handleDelete(match.id)}
                >
                  <Trash2 size={16} />
                </Button>

                <div className="w-full flex gap-2">
                  {(match.status === 'SCHEDULED' || match.status === 'UPCOMING') && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/20 h-10 font-bold" 
                      onClick={() => handleStartMatch(match.id)}
                    >
                      <PlayCircle size={18} className="mr-2" /> بدء المباراة
                    </Button>
                  )}

                  {match.status === 'LIVE' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="default"
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold h-10" 
                        onClick={() => setLiveControlMatch(match)}
                      >
                        <Settings size={16} className="mr-2" /> تحكم
                      </Button>
                      <Button 
                        size="sm" 
                        className={`flex-none w-10 h-10 p-0 ${match.isStreamActive ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`} 
                        onClick={() => {
                          if (match.isStreamActive) {
                            if(confirm('إيقاف البث بالكاميرا؟')) {
                              const d = new FormData();
                              d.append('isStreamActive', 'false');
                              updateMutation.mutate({ id: match.id, data: d });
                            }
                          } else {
                            setCameraBroadcastMatch(match);
                          }
                        }}
                      >
                        <Camera size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        className="flex-none bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-bold px-3" 
                        onClick={() => handleEndMatch(match.id)}
                      >
                        إنهاء
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(!matches || matches.length === 0) && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
              <Trophy size={64} className="mb-4 opacity-20" />
              <p className="text-xl font-bold">لا توجد مباريات</p>
              <p className="text-sm mt-2">قم بإضافة مباراة جديدة للبدء</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
