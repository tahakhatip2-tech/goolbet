import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAcademyStats } from '../../api/academies';
import { Video, Activity, Users, TrendingUp } from 'lucide-react';

export const AcademyDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['academyStats'],
    queryFn: getAcademyStats
  });

  if (isLoading) return <div className="text-center p-8">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي البثوث</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.totalStreams || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center">
              <Video size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">البثوث الحية الآن</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.liveStreams || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي الرهانات</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.totalBets || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4">أحدث البثوث</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="pb-3 font-medium">العنوان</th>
                <th className="pb-3 font-medium">النوع</th>
                <th className="pb-3 font-medium">الحالة</th>
                <th className="pb-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {stats?.recentStreams?.map((stream: any) => (
                <tr key={stream.id}>
                  <td className="py-4 font-medium">{stream.title}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 rounded bg-gray-700 text-xs">
                      {stream.streamType === 'MATCH' ? 'مباراة' : stream.streamType === 'TRAINING' ? 'تمرين' : 'بودكاست'}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stream.status === 'LIVE' ? 'bg-red-500/20 text-red-500' :
                      stream.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {stream.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-400">{new Date(stream.startedAt || stream.scheduledAt || Date.now()).toLocaleDateString('ar-SA')}</td>
                </tr>
              ))}
              {(!stats?.recentStreams || stats.recentStreams.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">لا توجد بثوث سابقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
