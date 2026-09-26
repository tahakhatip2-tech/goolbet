import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyStreams, createStream, startStream, endStream, updateScore } from '../../api/academies';
import { Plus, Video, Calendar, Play, Square, Trophy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AcademyStreamsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: streams, isLoading } = useQuery({
    queryKey: ['myStreams'],
    queryFn: getMyStreams
  });

  const createMutation = useMutation({
    mutationFn: createStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStreams'] });
      setIsModalOpen(false);
      showToast('success', 'تم إنشاء البث بنجاح');
    },
    onError: (error: any) => showToast('error', error.response?.data?.error || 'حدث خطأ')
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startStream(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myStreams'] })
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => endStream(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myStreams'] })
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate(formData);
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة البثوث والمباريات</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus size={20} />
          إضافة بث جديد
        </button>
      </div>

      <div className="grid gap-6">
        {streams?.map((stream: any) => (
          <div key={stream.id} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex flex-col md:flex-row gap-6">
            <div className="w-48 h-32 bg-gray-700 rounded-xl overflow-hidden flex-shrink-0 relative">
              {stream.thumbnailUrl ? (
                <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <Video size={48} />
                </div>
              )}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs">
                {stream.streamType === 'MATCH' ? 'مباراة' : stream.streamType === 'TRAINING' ? 'تمرين' : 'بودكاست'}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{stream.title}</h3>
                  <p className="text-gray-400 mt-1 flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(stream.scheduledAt).toLocaleString('ar-SA')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  stream.status === 'LIVE' ? 'bg-red-500/20 text-red-500 animate-pulse' :
                  stream.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {stream.status}
                </span>
              </div>

              {stream.streamType === 'MATCH' && (
                <div className="mt-4 flex items-center gap-4 bg-gray-900/50 p-4 rounded-xl">
                  <div className="flex-1 text-center font-medium">{stream.team1Name}</div>
                  <div className="text-2xl font-bold bg-gray-800 px-4 py-2 rounded-lg">
                    {stream.team1Score} - {stream.team2Score}
                  </div>
                  <div className="flex-1 text-center font-medium">{stream.team2Name}</div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {stream.status === 'SCHEDULED' && (
                  <button
                    onClick={() => startMutation.mutate(stream.id)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl flex justify-center items-center gap-2 hover:bg-red-700"
                  >
                    <Play size={20} />
                    بدء البث المباشر
                  </button>
                )}
                {stream.status === 'LIVE' && (
                  <>
                    <button
                      onClick={() => endMutation.mutate(stream.id)}
                      className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-xl flex justify-center items-center gap-2 hover:bg-gray-600"
                    >
                      <Square size={20} />
                      إنهاء البث
                    </button>
                    {stream.streamType === 'MATCH' && (
                      <button className="flex-1 bg-primary text-white px-4 py-2 rounded-xl flex justify-center items-center gap-2 hover:bg-primary/90">
                        <Trophy size={20} />
                        تحديث النتيجة
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!streams || streams.length === 0) && (
          <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-2xl border border-gray-700">
            <Video size={48} className="mx-auto mb-4 opacity-50" />
            <p>لا توجد بثوث أو مباريات مضافة بعد</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">إضافة بث جديد</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">عنوان البث</label>
                <input name="title" required className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">نوع البث</label>
                  <select name="streamType" className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none">
                    <option value="MATCH">مباراة تنافسية (تدعم الرهانات)</option>
                    <option value="TRAINING">جلسة تدريب</option>
                    <option value="PODCAST">بودكاست رياضي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">موعد البث</label>
                  <input type="datetime-local" name="scheduledAt" required className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <div className="col-span-2"><h4 className="text-sm font-bold text-gray-300">بيانات المباراة (إن وجدت)</h4></div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">الفريق الأول</label>
                  <input name="team1Name" className="w-full bg-gray-700 rounded-xl px-4 py-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">الفريق الثاني</label>
                  <input name="team2Name" className="w-full bg-gray-700 rounded-xl px-4 py-2 text-white outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">صورة الغلاف (Thumbnail)</label>
                <input type="file" name="thumbnail" accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-6">
                <button type="submit" disabled={createMutation.isPending} className="flex-1 bg-primary text-white rounded-xl py-3 font-medium hover:bg-primary/90">
                  {createMutation.isPending ? 'جاري الإنشاء...' : 'حفظ البث'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-gray-700 text-white rounded-xl py-3 font-medium hover:bg-gray-600">
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
