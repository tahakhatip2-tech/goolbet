import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTournamentById, registerTeam } from '../api/tournaments';
import type { TournamentMatch, TournamentStanding, TournamentTeam } from '../api/tournaments';
import {
  Trophy, Users, Calendar, MapPin, Swords, Shield, ChevronRight,
  Clock, CheckCircle2, XCircle, Loader2, Star, ArrowRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const statusColors: Record<string, string> = {
  SCHEDULED: 'text-blue-400 bg-blue-500/10',
  LIVE: 'text-red-400 bg-red-500/10 animate-pulse',
  COMPLETED: 'text-green-400 bg-green-500/10',
  CANCELLED: 'text-gray-500 bg-gray-500/10',
};

const roundOrder = ['دور المجموعات', 'دور الـ 32', 'دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'النهائي'];

export const TournamentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'standings' | 'teams'>('overview');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [teamName, setTeamName] = useState('');

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => getTournamentById(id!),
    enabled: !!id,
  });

  const registerMutation = useMutation({
    mutationFn: () => registerTeam(id!, { teamName }),
    onSuccess: () => {
      toast.success('تم إرسال طلب التسجيل! في انتظار موافقة المنظِّم.');
      setShowRegisterModal(false);
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'حدث خطأ أثناء التسجيل');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        البطولة غير موجودة
      </div>
    );
  }

  const approvedTeams = tournament.teams?.filter(t => t.status === 'APPROVED') || [];
  const pendingTeams = tournament.teams?.filter(t => t.status === 'PENDING') || [];
  const progressPercent = Math.min((approvedTeams.length / tournament.maxTeams) * 100, 100);

  // تجميع المباريات حسب الجولة
  const matchesByRound = (tournament.matches || []).reduce((acc, match) => {
    const key = match.groupName || match.round;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {} as Record<string, TournamentMatch[]>);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Cover */}
      <div className="relative h-72 overflow-hidden">
        {tournament.coverImage ? (
          <img src={tournament.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/60 via-gray-900 to-blue-900/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 right-6">
          <Link to="/tournaments" className="flex items-center gap-2 bg-black/40 backdrop-blur text-white px-4 py-2 rounded-xl hover:bg-black/60 transition-colors">
            <ArrowRight size={16} />
            <span className="text-sm">البطولات</span>
          </Link>
        </div>

        {/* Tournament Info */}
        <div className="absolute bottom-0 right-0 left-0 p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gray-900 border-2 border-gray-700 overflow-hidden flex-shrink-0 shadow-xl">
              {tournament.logo ? (
                <img src={tournament.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-800 to-blue-800 flex items-center justify-center">
                  <Trophy size={32} className="text-white/70" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  tournament.status === 'OPEN' ? 'bg-green-500/20 text-green-400' :
                  tournament.status === 'IN_PROGRESS' ? 'bg-red-500/20 text-red-400' :
                  tournament.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {tournament.status === 'OPEN' ? '🟢 التسجيل مفتوح' :
                   tournament.status === 'IN_PROGRESS' ? '🔴 جارية الآن' :
                   tournament.status === 'COMPLETED' ? '✅ منتهية' : 'مسودة'}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white">{tournament.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm">
                {tournament.organizer && <span>منظِّم: {tournament.organizer.name}</span>}
                {tournament.city && (
                  <span className="flex items-center gap-1"><MapPin size={12} />{tournament.city}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Column - Main Content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6 border border-gray-800">
              {[
                { key: 'overview', label: 'نظرة عامة' },
                { key: 'matches', label: `المباريات (${tournament.matches?.length || 0})` },
                { key: 'standings', label: 'الترتيب' },
                { key: 'teams', label: `الفرق (${approvedTeams.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {tournament.description && (
                  <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                    <h3 className="font-bold text-white mb-3">عن البطولة</h3>
                    <p className="text-gray-400 leading-relaxed">{tournament.description}</p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Users, label: 'الفرق', value: `${approvedTeams.length}/${tournament.maxTeams}` },
                    { icon: Swords, label: 'المباريات', value: tournament.matches?.length || 0 },
                    { icon: Trophy, label: 'الشكل', value: tournament.format === 'KNOCKOUT' ? 'إقصائي' : tournament.format === 'LEAGUE' ? 'دوري' : 'مجموعات' },
                    { icon: Star, label: 'الرياضة', value: tournament.sport },
                  ].map(stat => (
                    <div key={stat.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 text-center">
                      <stat.icon size={24} className="text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-black text-white">{stat.value}</div>
                      <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {tournament.prizeInfo && (
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy size={20} className="text-yellow-400" />
                      <h3 className="font-bold text-yellow-400">الجوائز</h3>
                    </div>
                    <p className="text-gray-300">{tournament.prizeInfo}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Matches */}
            {activeTab === 'matches' && (
              <div className="space-y-6">
                {Object.keys(matchesByRound).length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Swords size={36} className="mx-auto mb-3 opacity-30" />
                    <p>لم يتم توليد جدول المباريات بعد</p>
                  </div>
                ) : (
                  Object.entries(matchesByRound).map(([round, matches]) => (
                    <div key={round}>
                      <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-800" />
                        {round}
                        <div className="h-px flex-1 bg-gray-800" />
                      </h3>
                      <div className="space-y-3">
                        {matches.map(match => (
                          <MatchCard key={match.id} match={match} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Standings */}
            {activeTab === 'standings' && (
              <div>
                {(!tournament.standings || tournament.standings.length === 0) ? (
                  <div className="text-center py-16 text-gray-500">
                    <Trophy size={36} className="mx-auto mb-3 opacity-30" />
                    <p>جدول الترتيب سيظهر بعد بدء البطولة (نظام دوري أو مجموعات)</p>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800/50 text-gray-400">
                          <th className="text-right p-4">#</th>
                          <th className="text-right p-4">الفريق</th>
                          <th className="p-4">لعب</th>
                          <th className="p-4">ف</th>
                          <th className="p-4">ت</th>
                          <th className="p-4">خ</th>
                          <th className="p-4">+/-</th>
                          <th className="p-4 text-white font-bold">نق</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tournament.standings.map((standing, index) => (
                          <StandingRow key={standing.id} standing={standing} rank={index + 1} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Teams */}
            {activeTab === 'teams' && (
              <div className="space-y-4">
                {approvedTeams.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Users size={36} className="mx-auto mb-3 opacity-30" />
                    <p>لا توجد فرق مشاركة حتى الآن</p>
                  </div>
                ) : (
                  approvedTeams.map(team => (
                    <TeamCard key={team.id} team={team} />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Registration Card */}
            {tournament.status === 'OPEN' && (
              <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Shield size={18} className="text-purple-400" />
                  التسجيل في البطولة
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>{approvedTeams.length} فريق مسجّل</span>
                    <span>{tournament.maxTeams - approvedTeams.length} مكان متاح</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                {tournament.entryFee > 0 && (
                  <div className="text-center mb-3 text-sm text-gray-400">
                    رسوم التسجيل: <span className="text-yellow-400 font-bold">${tournament.entryFee}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  سجّل فريقك الآن
                </button>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white mb-4">تفاصيل البطولة</h3>
              {[
                { icon: Calendar, label: 'بداية التسجيل', value: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toLocaleDateString('ar-SA') : 'غير محدد' },
                { icon: Calendar, label: 'تاريخ البدء', value: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('ar-SA') : 'غير محدد' },
                { icon: MapPin, label: 'الملعب', value: tournament.venue || tournament.city || 'غير محدد' },
                { icon: Users, label: 'أقصى عدد للفرق', value: `${tournament.maxTeams} فريق` },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon size={15} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="text-sm text-gray-300 font-medium">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">تسجيل فريق في البطولة</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">اسم الفريق</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="اسم فريقك في هذه البطولة"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => registerMutation.mutate()}
                disabled={!teamName.trim() || registerMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {registerMutation.isPending ? 'جاري الإرسال...' : 'تسجيل الفريق'}
              </button>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MatchCard: React.FC<{ match: TournamentMatch }> = ({ match }) => {
  const statusClass = statusColors[match.status] || 'text-gray-400 bg-gray-500/10';
  const isCompleted = match.status === 'COMPLETED';

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-center gap-4">
        {/* Home Team */}
        <div className="flex-1 flex items-center gap-3 justify-end">
          <span className="font-semibold text-white text-sm">{match.homeTeam?.teamName}</span>
          <div className="w-8 h-8 rounded-lg bg-gray-800 overflow-hidden">
            {match.homeTeam?.teamLogo && (
              <img src={match.homeTeam.teamLogo} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Score / Status */}
        <div className="flex flex-col items-center min-w-[80px]">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-xl font-black">
              <span className={match.winnerId === match.homeTeamId ? 'text-green-400' : 'text-gray-400'}>
                {match.homeScore}
              </span>
              <span className="text-gray-600">-</span>
              <span className={match.winnerId === match.awayTeamId ? 'text-green-400' : 'text-gray-400'}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClass}`}>
              {match.status === 'LIVE' ? '🔴 مباشر' : match.status === 'SCHEDULED' ? 'مجدولة' : 'ملغاة'}
            </span>
          )}
          {match.scheduledAt && !isCompleted && (
            <span className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <Clock size={10} />
              {new Date(match.scheduledAt).toLocaleDateString('ar-SA')}
            </span>
          )}
          {match.stream && (
            <Link
              to={`/watch/${match.stream.id}`}
              className="mt-1 text-xs text-red-400 hover:text-red-300 font-bold"
            >
              شاهد البث
            </Link>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-800 overflow-hidden">
            {match.awayTeam?.teamLogo && (
              <img src={match.awayTeam.teamLogo} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <span className="font-semibold text-white text-sm">{match.awayTeam?.teamName}</span>
        </div>
      </div>
    </div>
  );
};

const StandingRow: React.FC<{ standing: TournamentStanding; rank: number }> = ({ standing, rank }) => (
  <tr className={`border-t border-gray-800 hover:bg-gray-800/30 transition-colors ${rank <= 2 ? 'bg-green-500/5' : ''}`}>
    <td className="p-4 text-gray-400 font-bold">{rank}</td>
    <td className="p-4">
      <div className="flex items-center gap-3">
        {standing.team?.teamLogo ? (
          <img src={standing.team.teamLogo} alt="" className="w-7 h-7 rounded-lg object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gray-700" />
        )}
        <span className="font-semibold text-white">{standing.team?.teamName}</span>
      </div>
    </td>
    <td className="p-4 text-center text-gray-400">{standing.played}</td>
    <td className="p-4 text-center text-green-400">{standing.won}</td>
    <td className="p-4 text-center text-yellow-400">{standing.drawn}</td>
    <td className="p-4 text-center text-red-400">{standing.lost}</td>
    <td className="p-4 text-center text-gray-400">
      <span className={standing.goalDifference > 0 ? 'text-green-400' : standing.goalDifference < 0 ? 'text-red-400' : ''}>
        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
      </span>
    </td>
    <td className="p-4 text-center font-black text-white text-lg">{standing.points}</td>
  </tr>
);

const TeamCard: React.FC<{ team: TournamentTeam }> = ({ team }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden">
        {team.teamLogo ? (
          <img src={team.teamLogo} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">⚽</div>
        )}
      </div>
      <div>
        <h4 className="font-bold text-white">{team.teamName}</h4>
        {team.academy && <p className="text-sm text-gray-500">{team.academy.name}</p>}
      </div>
      <div className="mr-auto">
        <CheckCircle2 size={18} className="text-green-400" />
      </div>
    </div>

    {/* Players */}
    {team.players && team.players.length > 0 && (
      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 mb-3">التشكيلة ({team.players.length} لاعب)</p>
        <div className="flex flex-wrap gap-2">
          {team.players.map(player => (
            <div
              key={player.id}
              className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs"
            >
              {player.jerseyNumber && (
                <span className="text-purple-400 font-bold">#{player.jerseyNumber}</span>
              )}
              <span className="text-gray-300">{player.name}</span>
              {player.position && (
                <span className="text-gray-600">({player.position})</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
