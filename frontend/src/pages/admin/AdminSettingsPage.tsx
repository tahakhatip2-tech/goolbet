import React, { useState, useEffect } from 'react';
import { HeroSection } from '../../components/ui/HeroSection';
import { Settings, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export const AdminSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [depositMethods, setDepositMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    network: '',
    address: '',
    isActive: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings/DEPOSIT_METHODS');
      if (data && data.value) {
        setDepositMethods(JSON.parse(data.value));
      } else {
        setDepositMethods([]);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('حدث خطأ أثناء جلب الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (methods: any[]) => {
    setIsSaving(true);
    try {
      await api.put('/admin/settings/DEPOSIT_METHODS', { value: methods });
      setDepositMethods(methods);
      toast.success('تم الحفظ بنجاح');
      setEditingIndex(null);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', network: '', address: '', isActive: true });
    setEditingIndex(null);
  };

  const handleAddMethod = () => {
    if (!formData.name || !formData.address) {
      toast.warning('يرجى تعبئة الحقول الأساسية (الاسم، العنوان)');
      return;
    }
    const newMethod = {
      id: Date.now().toString(),
      name: formData.name,
      network: formData.network,
      address: formData.address,
      isActive: formData.isActive
    };
    saveSettings([...depositMethods, newMethod]);
  };

  const handleUpdateMethod = () => {
    if (editingIndex === null) return;
    const updated = [...depositMethods];
    updated[editingIndex] = formData;
    saveSettings(updated);
  };

  const handleDeleteMethod = (index: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الطريقة؟')) return;
    const updated = depositMethods.filter((_, i) => i !== index);
    saveSettings(updated);
  };

  const handleEditClick = (method: any, index: number) => {
    setFormData(method);
    setEditingIndex(index);
  };

  const toggleStatus = (index: number) => {
    const updated = [...depositMethods];
    updated[index].isActive = !updated[index].isActive;
    saveSettings(updated);
  };

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <HeroSection 
        title={
          <>
            إعدادات <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-400">النظام</span>
          </>
        }
        subtitle="إدارة طرق الإيداع وإعدادات المنصة الأخرى"
        badge="الإعدادات ⚙️"
        minHeight="min-h-[30vh]"
      />

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">طرق الإيداع</h2>
          </div>

          {/* Form */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-6">
            <h3 className="text-sm font-semibold text-white/80 mb-4">
              {editingIndex !== null ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">الاسم (مثال: USDT, Vodafone Cash)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">الشبكة (مثال: TRC-20)</label>
                <input 
                  type="text" 
                  value={formData.network}
                  onChange={e => setFormData({...formData, network: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">عنوان المحفظة أو الرابط</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                />
                مفعلة ونشطة
              </label>
              
              <div className="flex gap-2">
                {editingIndex !== null ? (
                  <>
                    <button onClick={resetForm} disabled={isSaving} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <X className="w-4 h-4" /> إلغاء
                    </button>
                    <button onClick={handleUpdateMethod} disabled={isSaving} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Save className="w-4 h-4" /> {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                  </>
                ) : (
                  <button onClick={handleAddMethod} disabled={isSaving} className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus className="w-4 h-4" /> {isSaving ? 'جاري الإضافة...' : 'إضافة الطريقة'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {depositMethods.length === 0 ? (
              <div className="text-center text-slate-500 py-8">لا توجد طرق إيداع مضافة حالياً.</div>
            ) : (
              depositMethods.map((method, idx) => (
                <div key={method.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${method.isActive ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-800/30 border-slate-700/50 opacity-60'} transition-all`}>
                  <div className="mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-lg">{method.name}</span>
                      {method.network && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{method.network}</span>}
                    </div>
                    <div className="text-xs text-slate-400 font-mono select-all bg-slate-900/50 p-1.5 rounded w-fit">{method.address}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleStatus(idx)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${method.isActive ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
                    >
                      {method.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button 
                      onClick={() => handleEditClick(method, idx)}
                      className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMethod(idx)}
                      className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
