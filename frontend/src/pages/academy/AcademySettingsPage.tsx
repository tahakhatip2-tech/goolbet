import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAcademy, updateMyAcademy } from '../../api/academies';
import { Save, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { BackendImage } from '../../components/BackendImage';

export const AcademySettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);

  const { data: academy, isLoading } = useQuery({
    queryKey: ['myAcademy'],
    queryFn: getMyAcademy
  });

  const updateMutation = useMutation({
    mutationFn: updateMyAcademy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAcademy'] });
      showToast('success', 'تم تحديث الإعدادات بنجاح');
      setLogoPreview(null);
      setCoverPreview(null);
    },
    onError: () => showToast('error', 'حدث خطأ أثناء التحديث')
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'logo') setLogoPreview(url);
      else setCoverPreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate(formData);
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
        <h2 className="text-2xl font-bold mb-6">إعدادات الأكاديمية</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">اسم الأكاديمية</label>
              <input 
                name="name" 
                defaultValue={academy?.name} 
                required 
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">رقم الهاتف</label>
              <input 
                name="phone" 
                defaultValue={academy?.phone} 
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none text-left" dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">المدينة</label>
              <input 
                name="city" 
                defaultValue={academy?.city} 
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">البلد</label>
              <input 
                name="country" 
                defaultValue={academy?.country} 
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">وصف الأكاديمية</label>
            <textarea 
              name="description" 
              defaultValue={academy?.description} 
              rows={4}
              className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none resize-none" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-900/50 rounded-xl border border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <ImageIcon size={18} /> شعار الأكاديمية
              </label>
              {(logoPreview || academy?.logo) && (
                <BackendImage src={logoPreview || academy.logo} alt="Logo" className="w-24 h-24 rounded-xl object-cover mb-4 border border-gray-600 bg-white" />
              )}
              <input type="file" name="logo" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <ImageIcon size={18} /> صورة الغلاف
              </label>
              {(coverPreview || academy?.coverImage) && (
                <BackendImage src={coverPreview || academy.coverImage} alt="Cover" className="w-full h-24 rounded-xl object-cover mb-4 border border-gray-600 bg-gray-800" />
              )}
              <input type="file" name="coverImage" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
            >
              <Save size={20} />
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
