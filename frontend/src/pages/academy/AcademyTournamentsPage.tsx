import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  getMyOrganizedTournaments, getMyRegisteredTournaments,
  createTournament, updateTournament, deleteTournament, generateDraw
} from '../../api/tournaments';
import type { Tournament } from '../../api/tournaments';
import {
  Trophy, Plus, Swords, Users, Calendar, Trash2,
  Loader2, ExternalLink, Shuffle, Eye, ChevronRight, Shield
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT:       { label: 'مسودة',          color: 'bg-gray-500/20 text-gray-400' },
  OPEN:        { label: '🟢 مفتوح',        color: 'bg-green-500/20 text-green-400' },
  IN_PROGRESS: { label: '🔴 جارية',        color: 'bg-red-500/20 text-red-400' },
  COMPLETED:   { label: '✅ منتهية',       color: 'bg-blue-500/20 text-blue-400' },
  CANCELLED:   { label: '❌ ملغاة',        color: 'bg-gray-500/20 text-gray-500' },
};

const formatConfig: Record<string, string> = {
  KNOCKOUT:       '🏆 إقصائي',
  LEAGUE:         '📊 دوري',
  GROUP_KNOCKOUT: '🔥 مجموعات + إقصائي',
};

// ─── Create Tournament Modal ──────────────────────────────────────────────────
const CreateTournamentModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', description: '', sport: 'FOOTBALL', format: 'KNOCKOUT',
    maxTeams: '8', minTeams: '2', entryFee: '0',
    registrationDeadline: '', startDate: '', endDate: '',
    prizeInfo: '', city: '', country: '', venue: '',
  });

  const createMutation = useMutation({
    mutationFn: () => createTournament({ ...form, maxTeams: parseInt(form.maxTeams), minTeams: parseInt(form.minTeams), entryFee: parseFloat(form.entryFee) }),
    onSuccess: () => {
      toast.success('تم إنشاء البطولة بنجاح! 🎉');
      onCreated();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'حدث خطأ'),
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إنشاء بطولة جديدة</h2>
              <p className="text-gray-500 text-sm">الخطوة {step} من 2</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className={`w-8 h-1.5 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-gray-700'}`} />
            <div className={`w-8 h-1.5 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-gray-700'}`} />
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">اسم البطولة *</label>
                <input
                  value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="مثال: كأس الصداقة الصيفي 2026"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">وصف البطولة</label>
                <textarea
                  value={form.description} onChange={e => set('description', e.target.value)}
                  rows={3} placeholder="تفاصيل عن البطولة، قوانينها..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">الرياضة</label>
                  <select value={form.sport} onChange={e => set('sport', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500">
                    <option value="FOOTBALL">⚽ كرة القدم</option>
                    <option value="FUTSAL">🥅 كرة قدم صالات</option>
                    <option value="BASKETBALL">🏀 كرة السلة</option>
                    <option value="VOLLEYBALL">🏐 كرة الطائرة</option>
                    <option value="TENNIS">🎾 تنس</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">نظام البطولة</label>
                  <select value={form.format} onChange={e => set('format', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500">
                    <option value="KNOCKOUT">🏆 خروج المغلوب (إقصائي)</option>
                    <option value="LEAGUE">📊 دوري (كل فريق يلعب ضد الكل)</option>
                    <option value="GROUP_KNOCKOUT">🔥 مجموعات + إقصائي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">الحد الأقصى للفرق</label>
                  <select value={form.maxTeams} onChange={e => set('maxTeams', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500">
                    {[4, 8, 12, 16, 24, 32].map(n => (
                      <option key={n} value={n}>{n} فرق</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">الحد الأدنى للبدء</label>
                  <select value={form.minTeams} onChange={e => set('minTeams', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500">
                    {[2, 4, 8].map(n => (
                      <option key={n} value={n}>{n} فرق</option>
                    ))}
                  </select>
                </div>
              </div>

              <button onClick={() => setStep(2)} disabled={!form.name.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
                التالي ←
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">آخر موعد للتسجيل</label>
                  <input type="datetime-local" value={form.registrationDeadline}
                    onChange={e => set('registrationDeadline', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">تاريخ بداية البطولة</label>
                  <input type="datetime-local" value={form.startDate}
                    onChange={e => set('startDate', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">الجوائز 🏆</label>
                <textarea value={form.prizeInfo} onChange={e => set('prizeInfo', e.target.value)}
                  rows={2} placeholder="مثال: المركز الأول - كأس + 5000 ريال..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">المدينة</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="الرياض"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">الدولة</label>
                  <input value={form.country} onChange={e => set('country', e.target.value)}
                    placeholder="السعودية"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">رسوم الاشتراك $</label>
                  <input type="number" value={form.entryFee} onChange={e => set('entryFee', e.target.value)}
                    placeholder="0 = مجاني"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors">
                  ← السابق
                </button>
                <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
                  {createMutation.isPending ? <Loader2 size={18} className="animate-spin mx-auto" /> : '🚀 إنشاء البطولة'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 text-center">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AcademyTournamentsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'organized' | 'registered'>('organized');

  const { data: myTournaments = [], isLoading: loadingMine } = useQuery({
    queryKey: ['my-organized-tournaments'],
    queryFn: getMyOrganizedTournaments,
  });

  const { data: registeredTournaments = [], isLoading: loadingRegistered } = useQuery({
    queryKey: ['my-registered-tournaments'],
    queryFn: getMyRegisteredTournaments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTournament,
    onSuccess: () => {
      toast.success('تم حذف البطولة');
      queryClient.invalidateQueries({ queryKey: ['my-organized-tournaments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'لا يمكن الحذف'),
  });

  const drawMutation = useMutation({
    mutationFn: generateDraw,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['my-organized-tournaments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'تعذر توليد القرعة'),
  });

  const handleOpenStatus = async (id: string) => {
    try {
      await updateTournament(id, { status: 'OPEN' } as any);
      toast.success('تم فتح التسجيل للبطولة');
      queryClient.invalidateQueries({ queryKey: ['my-organized-tournaments'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    }
  };

  const isLoading = loadingMine || loadingRegistered;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Trophy size={28} className="text-purple-400" />
            البطولات والفعاليات
          </h1>
          <p className="text-gray-400 mt-1 text-sm">أنشئ بطولات رياضية واستقطب الأكاديميات للمشاركة</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus size={20} />
          بطولة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'بطولاتي', value: myTournaments.length, icon: Trophy, color: 'text-purple-400' },
          { label: 'جارية الآن', value: myTournaments.filter(t => t.status === 'IN_PROGRESS').length, icon: Swords, color: 'text-red-400' },
          { label: 'مشارك فيها', value: registeredTournaments.length, icon: Shield, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 flex items-center gap-4">
            <div className={`${s.color} bg-current/10 rounded-xl p-3`} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <s.icon size={22} className={s.color} />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 border border-gray-700/50 w-fit">
        <button
          onClick={() => setActiveTab('organized')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'organized' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
        >
          بطولاتي ({myTournaments.length})
        </button>
        <button
          onClick={() => setActiveTab('registered')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'registered' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
        >
          مشارك فيها ({registeredTournaments.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-purple-500" />
        </div>
      ) : activeTab === 'organized' ? (
        myTournaments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy size={40} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">لم تنشئ أي بطولة بعد</h3>
            <p className="text-gray-600 mb-6">أنشئ أول بطولة وابدأ استقطاب الفرق!</p>
            <button onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-bold">
              إنشاء أول بطولة 🏆
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myTournaments.map(tournament => (
              <MyTournamentCard
                key={tournament.id}
                tournament={tournament}
                onDelete={() => {
                  if (confirm('هل أنت متأكد من حذف هذه البطولة؟')) {
                    deleteMutation.mutate(tournament.id);
                  }
                }}
                onGenerateDraw={() => drawMutation.mutate(tournament.id)}
                onOpen={() => handleOpenStatus(tournament.id)}
                isGenerating={drawMutation.isPending}
              />
            ))}
          </div>
        )
      ) : (
        registeredTournaments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p>لم تشترك في أي بطولة بعد</p>
            <Link to="/tournaments" className="mt-4 inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm">
              تصفح البطولات المتاحة <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registeredTournaments.map((t: any) => (
              <div key={t.id} className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">{t.name}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${statusConfig[t.status]?.color || ''}`}>
                    {statusConfig[t.status]?.label}
                  </span>
                </div>
                {t.myTeam && (
                  <div className="text-sm text-gray-400 mb-3">
                    الفريق: <span className="text-white font-medium">{t.myTeam.teamName}</span>
                    <span className={`mr-2 text-xs px-2 py-0.5 rounded-full ${
                      t.myTeam.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                      t.myTeam.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {t.myTeam.status === 'APPROVED' ? '✅ مقبول' : t.myTeam.status === 'REJECTED' ? '❌ مرفوض' : '⏳ بانتظار الموافقة'}
                    </span>
                  </div>
                )}
                <Link to={`/tournaments/${t.id}`}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors">
                  عرض تفاصيل البطولة <ExternalLink size={14} />
                </Link>
              </div>
            ))}
          </div>
        )
      )}

      {showCreate && (
        <CreateTournamentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['my-organized-tournaments'] })}
        />
      )}
    </div>
  );
};

// ─── Tournament Management Card ───────────────────────────────────────────────
const MyTournamentCard: React.FC<{
  tournament: Tournament;
  onDelete: () => void;
  onGenerateDraw: () => void;
  onOpen: () => void;
  isGenerating: boolean;
}> = ({ tournament, onDelete, onGenerateDraw, onOpen, isGenerating }) => {
  const statusInfo = statusConfig[tournament.status] || statusConfig.DRAFT;
  const teamsCount = tournament._count?.teams || 0;

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6 hover:border-gray-600 transition-all">
      <div className="flex items-start gap-5">
        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-800 to-blue-800 flex items-center justify-center text-2xl flex-shrink-0">
          {tournament.sport === 'FOOTBALL' ? '⚽' : tournament.sport === 'BASKETBALL' ? '🏀' : '🏅'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-black text-white text-lg truncate">{tournament.name}</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span>{formatConfig[tournament.format]}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {teamsCount}/{tournament.maxTeams} فريق
            </span>
            {tournament.startDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(tournament.startDate).toLocaleDateString('ar-SA')}
                </span>
              </>
            )}
          </div>

          {/* Progress */}
          <div className="h-1.5 bg-gray-700 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              style={{ width: `${Math.min((teamsCount / tournament.maxTeams) * 100, 100)}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link to={`/tournaments/${tournament.id}`}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Eye size={15} /> عرض
            </Link>

            {tournament.status === 'DRAFT' && (
              <button onClick={onOpen}
                className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm px-4 py-2 rounded-lg transition-colors border border-green-500/20">
                🟢 فتح التسجيل
              </button>
            )}

            {tournament.status === 'OPEN' && teamsCount >= tournament.minTeams && (
              <button onClick={onGenerateDraw} disabled={isGenerating}
                className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-sm px-4 py-2 rounded-lg transition-colors border border-purple-500/20">
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Shuffle size={14} />}
                توليد القرعة
              </button>
            )}

            {!['IN_PROGRESS', 'COMPLETED'].includes(tournament.status) && (
              <button onClick={onDelete}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg transition-colors mr-auto">
                <Trash2 size={14} /> حذف
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
