import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicTournaments } from '../api/tournaments';
import type { Tournament } from '../api/tournaments';
import { Trophy, Users, Calendar, MapPin, ChevronRight, Search, Filter, Swords } from 'lucide-react';

const formatLabels: Record<string, string> = {
  KNOCKOUT: '🏆 إقصائي',
  LEAGUE: '📊 دوري',
  GROUP_KNOCKOUT: '🔥 مجموعات + إقصائي',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'مسودة', color: 'bg-gray-500/20 text-gray-400' },
  OPEN: { label: '🟢 التسجيل مفتوح', color: 'bg-green-500/20 text-green-400' },
  IN_PROGRESS: { label: '🔴 جارية الآن', color: 'bg-red-500/20 text-red-400' },
  COMPLETED: { label: '✅ منتهية', color: 'bg-blue-500/20 text-blue-400' },
  CANCELLED: { label: '❌ ملغاة', color: 'bg-gray-500/20 text-gray-500' },
};

const sportIcons: Record<string, string> = {
  FOOTBALL: '⚽',
  BASKETBALL: '🏀',
  VOLLEYBALL: '🏐',
  TENNIS: '🎾',
  FUTSAL: '🥅',
};

export const TournamentsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['public-tournaments', statusFilter, formatFilter],
    queryFn: () => getPublicTournaments({
      status: statusFilter || undefined,
      format: formatFilter || undefined,
    }),
  });

  const filtered = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.organizer?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-950/30 to-gray-900 border-b border-gray-800">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, #7c3aed 0%, transparent 50%),
                            radial-gradient(circle at 70% 50%, #2563eb 0%, transparent 50%)`
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Trophy size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                البطولات والفعاليات
              </h1>
              <p className="text-gray-400 mt-1">شارك في أقوى البطولات الرياضية وتابع جميع المباريات مباشرة</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-8">
            {[
              { label: 'بطولة نشطة', value: tournaments.filter(t => t.status === 'IN_PROGRESS').length },
              { label: 'تسجيل مفتوح', value: tournaments.filter(t => t.status === 'OPEN').length },
              { label: 'إجمالي البطولات', value: tournaments.length },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 backdrop-blur rounded-2xl px-6 py-4 border border-white/10">
                <div className="text-3xl font-black text-white">{stat.value}</div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="ابحث عن بطولة أو أكاديمية..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl pr-12 pl-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
          >
            <option value="">جميع الحالات</option>
            <option value="OPEN">مفتوح للتسجيل</option>
            <option value="IN_PROGRESS">جارية</option>
            <option value="COMPLETED">منتهية</option>
          </select>

          {/* Format Filter */}
          <select
            value={formatFilter}
            onChange={e => setFormatFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
          >
            <option value="">جميع الأشكال</option>
            <option value="KNOCKOUT">إقصائي</option>
            <option value="LEAGUE">دوري</option>
            <option value="GROUP_KNOCKOUT">مجموعات + إقصائي</option>
          </select>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-800" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-gray-800 rounded-full w-3/4" />
                  <div className="h-4 bg-gray-800 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={36} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">لا توجد بطولات حالياً</h3>
            <p className="text-gray-600 mt-2">كن أول من ينظم بطولة على المنصة!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TournamentCard: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
  const statusInfo = statusLabels[tournament.status] || statusLabels.DRAFT;
  const sportIcon = sportIcons[tournament.sport] || '🏅';
  const teamsCount = tournament._count?.teams || 0;
  const progressPercent = Math.min((teamsCount / tournament.maxTeams) * 100, 100);

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="group bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col"
    >
      {/* Cover Image */}
      <div className="relative h-44 overflow-hidden">
        {tournament.coverImage ? (
          <img
            src={tournament.coverImage}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
            <span className="text-6xl opacity-40">{sportIcon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Logo */}
        <div className="absolute bottom-3 right-4 w-12 h-12 rounded-xl bg-gray-900 border-2 border-gray-700 overflow-hidden">
          {tournament.logo ? (
            <img src={tournament.logo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl bg-purple-900/50">{sportIcon}</div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors leading-tight">
          {tournament.name}
        </h3>

        <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
          <Swords size={14} />
          <span>{formatLabels[tournament.format]}</span>
          <span className="text-gray-700">•</span>
          <span>{sportIcon} {tournament.sport}</span>
        </div>

        {tournament.organizer && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
            <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden">
              {tournament.organizer.logo && (
                <img src={tournament.organizer.logo} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <span>منظِّم: {tournament.organizer.name}</span>
          </div>
        )}

        {/* Teams Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{teamsCount} / {tournament.maxTeams} فريق</span>
            </div>
            <span className="text-purple-400 font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {tournament.city && (
              <>
                <MapPin size={12} />
                <span>{tournament.city}</span>
              </>
            )}
            {tournament.startDate && (
              <>
                {tournament.city && <span className="text-gray-700">•</span>}
                <Calendar size={12} />
                <span>{new Date(tournament.startDate).toLocaleDateString('ar-SA')}</span>
              </>
            )}
          </div>
          <ChevronRight size={16} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
