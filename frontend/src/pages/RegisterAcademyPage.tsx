import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { registerAcademy } from '../api/auth';
import { ArrowRight, Building, User, Mail, Lock, Phone, MapPin } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const RegisterAcademyPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    academyName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    country: ''
  });

  const registerMutation = useMutation({
    mutationFn: registerAcademy,
    onSuccess: (data) => {
      toast.success('تم تسجيل الأكاديمية بنجاح! يرجى انتظار تفعيل الإدارة.');
      navigate('/academy');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء التسجيل');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <ArrowRight size={20} className="ml-2" />
          العودة للصفحة الرئيسية
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-white">
          سجل أكاديميتك الرياضية
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          أو{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            تسجيل الدخول إذا كان لديك حساب
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-gray-900 py-8 px-4 shadow-xl sm:rounded-2xl border border-gray-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300">اسم الأكاديمية *</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                  <Building size={20} />
                </div>
                <input
                  name="academyName"
                  required
                  value={formData.academyName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-700 rounded-xl shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="مثال: أكاديمية الأبطال"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300">اسم المستخدم *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                    <User size={20} />
                  </div>
                  <input
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-700 rounded-xl shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-primary sm:text-sm text-left" dir="ltr"
                    placeholder="champions_academy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">البريد الإلكتروني *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                    <Mail size={20} />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-700 rounded-xl shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-primary sm:text-sm text-left" dir="ltr"
                    placeholder="info@academy.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300">كلمة المرور *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                    <Lock size={20} />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-700 rounded-xl shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-primary sm:text-sm text-left" dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">رقم الهاتف</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                    <Phone size={20} />
                  </div>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-700 rounded-xl shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-primary sm:text-sm text-left" dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300">المدينة</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                    <MapPin size={20} />
                  </div>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-700 rounded-xl shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">البلد</label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-xl shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {registerMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الأكاديمية الآن'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
