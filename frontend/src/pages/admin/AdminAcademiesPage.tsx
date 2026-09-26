import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAcademies, verifyAcademy, toggleAcademyStatus } from '../../api/adminAcademies';
import { ShieldCheck, ShieldAlert, Power, Video, Search, UserCheck, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const AdminAcademiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: academies = [], isLoading } = useQuery({
    queryKey: ['admin-academies'],
    queryFn: getAllAcademies
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) => verifyAcademy(id, isVerified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
      showToast('success', 'تم تحديث حالة التوثيق بنجاح');
    },
    onError: (e: any) => showToast('error', e.response?.data?.error || 'حدث خطأ أثناء التحديث')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleAcademyStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
      showToast('success', 'تم تحديث حالة حساب الأكاديمية بنجاح');
    },
    onError: (e: any) => showToast('error', e.response?.data?.error || 'حدث خطأ أثناء التحديث')
  });

  const pendingCount = academies.filter(a => !a.isVerified).length;
  const verifiedCount = academies.filter(a => a.isVerified).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={28} />
            إدارة الأكاديميات
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            مراجعة وتوثيق حسابات الأكاديميات للسماح لهم بإنشاء البثوث
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">إجمالي الأكاديميات</p>
            <h3 className="text-2xl font-bold text-slate-900">{academies.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">في انتظار التوثيق</p>
            <h3 className="text-2xl font-bold text-slate-900">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">أكاديميات موثقة</p>
            <h3 className="text-2xl font-bold text-slate-900">{verifiedCount}</h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-semibold text-slate-900">سجل الأكاديميات</h2>
          
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن أكاديمية..." 
              className="pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">جاري تحميل البيانات...</p>
          </div>
        ) : academies.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="text-slate-300 mx-auto mb-4" size={48} />
            <p className="text-slate-500 font-medium">لا توجد أكاديميات مسجلة حتى الآن</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">الأكاديمية</th>
                  <th className="px-6 py-4 font-medium">المدير (User)</th>
                  <th className="px-6 py-4 font-medium">البثوث</th>
                  <th className="px-6 py-4 font-medium">تاريخ التسجيل</th>
                  <th className="px-6 py-4 font-medium">حالة الحساب</th>
                  <th className="px-6 py-4 font-medium">التوثيق (Verification)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {academies.map((academy) => (
                  <tr key={academy.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {academy.logo ? (
                          <img src={academy.logo} alt={academy.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {academy.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{academy.name}</p>
                          <p className="text-xs text-slate-500">ID: {academy.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-800">{academy.user.username}</p>
                        <p className="text-xs text-slate-500">{academy.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg w-max">
                        <Video size={14} />
                        <span className="font-medium text-sm">{academy._count.streams}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(academy.createdAt), 'dd MMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatusMutation.mutate(academy.id)}
                        disabled={toggleStatusMutation.isPending}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          academy.isActive 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700'
                        }`}
                      >
                        <Power size={14} />
                        {academy.isActive ? 'نشط (إيقاف)' : 'موقوف (تفعيل)'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => verifyMutation.mutate({ id: academy.id, isVerified: !academy.isVerified })}
                        disabled={verifyMutation.isPending}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                          academy.isVerified 
                            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                        }`}
                      >
                        {academy.isVerified ? (
                          <>
                            <ShieldCheck size={14} /> موثق (إلغاء)
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={14} /> غير موثق (توثيق)
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
