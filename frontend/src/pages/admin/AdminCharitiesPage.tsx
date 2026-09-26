import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllCharities, createCharity, updateCharity, deleteCharity } from '../../api/charities';
import { type Charity } from '../../api/charities';
import { 
  Heart, Plus, Edit2, Trash2, CheckCircle, XCircle, 
  DollarSign, Users, Building2, X, Save
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminCharitiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharity, setEditingCharity] = useState<Charity | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', logo: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: charities = [], isLoading } = useQuery({
    queryKey: ['charities'],
    queryFn: getAllCharities
  });

  const createMutation = useMutation({
    mutationFn: createCharity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charities'] });
      showToast('success', 'تم إنشاء الجمعية الخيرية بنجاح ✅');
      closeModal();
    },
    onError: (e: any) => showToast('error', e.response?.data?.error || 'حدث خطأ')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCharity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charities'] });
      showToast('success', 'تم تحديث الجمعية بنجاح');
      closeModal();
    },
    onError: (e: any) => showToast('error', e.response?.data?.error || 'حدث خطأ')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCharity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charities'] });
      showToast('success', 'تم حذف الجمعية');
      setDeleteConfirm(null);
    },
    onError: (e: any) => showToast('error', e.response?.data?.error || 'حدث خطأ')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateCharity(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charities'] }),
    onError: (e: any) => showToast('error', e.response?.data?.error || 'حدث خطأ')
  });

  const openModal = (charity?: Charity) => {
    if (charity) {
      setEditingCharity(charity);
      setFormData({ name: charity.name, description: charity.description || '', logo: charity.logo || '' });
    } else {
      setEditingCharity(null);
      setFormData({ name: '', description: '', logo: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCharity(null);
    setFormData({ name: '', description: '', logo: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (editingCharity) {
      updateMutation.mutate({ id: editingCharity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const totalReceived = charities.reduce((sum, c) => sum + (c.totalReceived || 0), 0);
  const activeCount = charities.filter(c => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="text-red-500" size={28} />
            إدارة الجمعيات الخيرية
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            الجمعيات المضافة هنا ستظهر في قائمة اختيار الجمعية عند وضع الرهانات
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 font-medium"
        >
          <Plus size={20} />
          إضافة جمعية خيرية
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">إجمالي الجمعيات</p>
            <h3 className="text-2xl font-bold text-slate-900">{charities.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">جمعيات نشطة</p>
            <h3 className="text-2xl font-bold text-slate-900">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">إجمالي الأموال الموزعة</p>
            <h3 className="text-2xl font-bold text-slate-900">${totalReceived.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Charities Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">قائمة الجمعيات الخيرية</h2>
        </div>

        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        ) : charities.length === 0 ? (
          <div className="p-16 text-center">
            <Heart size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">لا توجد جمعيات خيرية مضافة بعد</p>
            <p className="text-slate-400 text-sm mt-1">قم بإضافة أول جمعية خيرية لتبدأ بتفعيل ميزة الرهانات الخيرية</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">الجمعية</th>
                  <th className="px-6 py-4 font-medium">الوصف</th>
                  <th className="px-6 py-4 font-medium">إجمالي المستلم</th>
                  <th className="px-6 py-4 font-medium">الأصوات</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {charities.map((charity) => (
                  <tr key={charity.id} className={`hover:bg-slate-50 transition-colors ${!charity.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {charity.logo ? (
                          <img src={charity.logo} alt={charity.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white font-bold">
                            {charity.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-slate-900">{charity.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm max-w-xs">
                      <span className="line-clamp-2">{charity.description || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">${(charity.totalReceived || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Users size={14} />
                        <span>{charity._count?.votes || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: charity.id, isActive: !charity.isActive })}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          charity.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        {charity.isActive ? <><CheckCircle size={12} /> نشطة</> : <><XCircle size={12} /> معطلة</>}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openModal(charity)}
                          className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors"
                          title="تعديل"
                        >
                          <Edit2 size={15} />
                        </button>
                        {deleteConfirm === charity.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteMutation.mutate(charity.id)}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                            >تأكيد</button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-300"
                            >إلغاء</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(charity.id)}
                            className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Heart className="text-amber-600 mt-0.5 shrink-0" size={20} />
          <div>
            <h4 className="font-semibold text-amber-800">كيف تعمل الجمعيات الخيرية؟</h4>
            <p className="text-amber-700 text-sm mt-1">
              عند وضع رهان على مباراة، يختار المستخدم جمعية خيرية من القائمة. 
              عند الفوز، يتم تحويل <strong>10%</strong> من الأرباح تلقائياً للجمعية التي اختارها.
              هذا يجعل التجربة أكثر أخلاقية ويشجع على المشاركة.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Heart className="text-red-500" size={22} />
                {editingCharity ? 'تعديل الجمعية الخيرية' : 'إضافة جمعية خيرية جديدة'}
              </h3>
              <button onClick={closeModal} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اسم الجمعية *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: الجمعية الإسلامية الخيرية"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">وصف الجمعية</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="وصف مختصر عن أهداف ونشاط الجمعية..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رابط الشعار (URL)</label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData(p => ({ ...p, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-left"
                  dir="ltr"
                />
              </div>

              {formData.logo && (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                  <img src={formData.logo} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-slate-200" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <span className="text-sm text-slate-500">معاينة الشعار</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100 mt-6">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Save size={18} />
                  {createMutation.isPending || updateMutation.isPending
                    ? 'جاري الحفظ...'
                    : editingCharity ? 'حفظ التعديلات' : 'إضافة الجمعية'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 bg-slate-100 text-slate-700 rounded-xl py-3 font-medium hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
