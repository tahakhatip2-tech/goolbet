import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { HeroSection } from '../../components/ui/HeroSection';
import { Receipt, Check, X, CreditCard, ExternalLink, Clock, TrendingDown, TrendingUp, AlertCircle, ChevronDown } from 'lucide-react';

const TransactionCard: React.FC<{ tx: any; onProcess: (id: string, action: 'APPROVE' | 'REJECT') => void; processingId: string | null }> = ({ tx, onProcess, processingId }) => {
  const [expanded, setExpanded] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const details = JSON.parse(tx.details || '{}');
  const isProcessing = processingId === tx.id;
  const receiptUrl = details.receiptImage ? `http://localhost:5000/uploads/${details.receiptImage}` : null;

  return (
    <>
    {/* Lightbox */}
    {imgOpen && receiptUrl && (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setImgOpen(false)}>
        <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
          <button onClick={() => setImgOpen(false)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600 hover:text-red-500 font-bold text-lg z-10">✕</button>
          <img src={receiptUrl} alt="الإيصال" className="w-full rounded-2xl shadow-2xl" />
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 mt-3 text-white text-xs bg-white/20 border border-white/30 px-4 py-2 rounded-xl font-bold hover:bg-white/30 transition-all">
            <ExternalLink size={12} /> فتح في تبويب جديد
          </a>
        </div>
      </div>
    )}
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all">
      {/* Card Header - always visible */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-sm">{tx.user.firstName?.[0]?.toUpperCase()}</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800 text-sm">{tx.user.firstName} {tx.user.lastName}</div>
            <div className="text-[10px] text-slate-400">{tx.user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-black text-base ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-50 bg-slate-50/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Type & Date Row */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                {tx.type === 'DEPOSIT' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {tx.type === 'DEPOSIT' ? 'إيداع' : 'سحب'}
              </span>
              {tx.status !== 'PENDING' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {tx.status === 'COMPLETED' ? 'مكتمل' : 'مرفوض'}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-500 font-medium">{new Date(tx.createdAt).toLocaleDateString('ar-EG')}</div>
              <div className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-slate-100">
            <span className="text-xs text-slate-500">طريقة الدفع</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <CreditCard size={12} className="text-blue-400" />
              {details.method || 'غير محدد'}
            </span>
          </div>

          {/* Address or Receipt */}
          {tx.type === 'WITHDRAWAL' && details.address && (
            <div className="bg-white rounded-xl px-3 py-2 border border-slate-100">
              <span className="text-xs text-slate-500 block mb-1">عنوان المحفظة</span>
              <span className="text-xs text-slate-700 break-all font-mono">{details.address}</span>
            </div>
          )}
          {tx.type === 'DEPOSIT' && receiptUrl && (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">صورة الإيصال</span>
                <button onClick={() => setImgOpen(true)} className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  <ExternalLink size={10} /> عرض كامل
                </button>
              </div>
              <img
                src={receiptUrl}
                alt="الإيصال"
                onClick={() => setImgOpen(true)}
                className="w-full h-40 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-1">
            {tx.status === 'PENDING' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={isProcessing}
                  onClick={() => onProcess(tx.id, 'APPROVE')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={15} /> موافقة
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => onProcess(tx.id, 'REJECT')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={15} /> رفض
                </button>
              </div>
            ) : (
              <div className={`text-center py-2.5 rounded-xl text-sm font-bold border ${tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                {tx.status === 'COMPLETED' ? 'مكتمل ✅' : 'مرفوض ❌'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

import { useToast } from '../../context/ToastContext';

export const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCount: 0, depositCount: 0, withdrawCount: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL'>('ALL');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [txRes, statsRes] = await Promise.all([
        api.get('/admin/transactions'),
        api.get('/admin/transactions/stats')
      ]);
      setTransactions(txRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcess = async (id: string, action: 'APPROVE' | 'REJECT') => {
    if (!confirm(action === 'APPROVE' ? 'هل أنت متأكد من قبول هذه المعاملة؟' : 'هل أنت متأكد من رفض هذه المعاملة؟')) return;
    setProcessingId(id);
    try {
      await api.put(`/admin/transactions/${id}/process`, { action });
      fetchData(); // re-fetch both pending tx and stats
      toast.success(action === 'APPROVE' ? 'تمت الموافقة على المعاملة بنجاح' : 'تم رفض المعاملة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة المعاملة');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = filter === 'ALL' ? transactions : transactions.filter(tx => tx.type === filter);

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <HeroSection
        title={
          <>
            المعاملات <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-400">المالية</span>
          </>
        }
        subtitle="مراجعة ومعالجة طلبات السحب والإيداع المعلقة"
        badge="إدارة المالية 💳"
        minHeight="min-h-[30vh]"
      >
        <div className="mt-8 grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto">
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/70 transition-all cursor-pointer">
            <Clock size={20} className="text-blue-500 mb-1" />
            <span className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">الكل</span>
            <span className="text-lg md:text-xl font-black text-slate-900">{stats.totalCount}</span>
          </div>
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/70 transition-all cursor-pointer">
            <TrendingUp size={20} className="text-emerald-500 mb-1" />
            <span className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">إيداع</span>
            <span className="text-lg md:text-xl font-black text-slate-900">{stats.depositCount}</span>
          </div>
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/70 transition-all cursor-pointer">
            <TrendingDown size={20} className="text-rose-500 mb-1" />
            <span className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">سحب</span>
            <span className="text-lg md:text-xl font-black text-slate-900">{stats.withdrawCount}</span>
          </div>
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/70 transition-all cursor-pointer">
            <Receipt size={20} className="text-purple-500 mb-1" />
            <span className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">الإجمالي</span>
            <span className="text-lg md:text-xl font-black text-slate-900">${stats.totalAmount.toFixed(0)}</span>
          </div>
        </div>
      </HeroSection>

      <div className="container mx-auto px-4 mt-2 mb-8 relative z-20">

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['ALL', 'DEPOSIT', 'WITHDRAWAL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                filter === f
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'الكل' : f === 'DEPOSIT' ? '⬆ إيداع' : '⬇ سحب'}
            </button>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mr-auto">
            <AlertCircle size={13} className="text-amber-500" />
            {filtered.filter(t => t.status === 'PENDING').length} طلب معلق
          </div>
        </div>

        {/* Mobile: Cards with Dropdown */}
        <div className="md:hidden space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-100">
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Receipt size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium text-sm">لا توجد طلبات معلقة</p>
            </div>
          ) : (
            filtered.map(tx => (
              <TransactionCard key={tx.id} tx={tx} onProcess={handleProcess} processingId={processingId} />
            ))
          )}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Receipt size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">لا توجد طلبات معلقة حالياً</p>
              <p className="text-slate-300 text-sm">ستظهر الطلبات الجديدة هنا فور وصولها</p>
            </div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-4 font-bold text-slate-600 text-xs uppercase tracking-wide">المستخدم</th>
                  <th className="px-5 py-4 font-bold text-slate-600 text-xs uppercase tracking-wide text-center">النوع</th>
                  <th className="px-5 py-4 font-bold text-slate-600 text-xs uppercase tracking-wide text-center">المبلغ</th>
                  <th className="px-5 py-4 font-bold text-slate-600 text-xs uppercase tracking-wide">التفاصيل</th>
                  <th className="px-5 py-4 font-bold text-slate-600 text-xs uppercase tracking-wide text-center">التاريخ</th>
                  <th className="px-5 py-4 font-bold text-slate-600 text-xs uppercase tracking-wide text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(tx => {
                  const details = JSON.parse(tx.details || '{}');
                  const isProcessing = processingId === tx.id;
                  return (
                    <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-blue-600 font-bold text-sm">{tx.user.firstName?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{tx.user.firstName} {tx.user.lastName}</div>
                            <div className="text-xs text-slate-400">{tx.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                            {tx.type === 'DEPOSIT' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {tx.type === 'DEPOSIT' ? 'إيداع' : 'سحب'}
                          </span>
                          {tx.status !== 'PENDING' && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {tx.status === 'COMPLETED' ? 'مكتمل' : 'مرفوض'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`font-black text-base ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <CreditCard size={12} className="text-blue-400" />
                            {details.method || 'غير محدد'}
                          </span>
                          {tx.type === 'WITHDRAWAL' && details.address && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[160px]">{details.address.slice(0, 20)}...</span>
                          )}
                          {tx.type === 'DEPOSIT' && details.receiptImage && (
                            <a href={`http://localhost:5000/uploads/${details.receiptImage}`} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg w-fit">
                              <ExternalLink size={11} /> عرض الإيصال
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="text-xs text-slate-600 font-medium">{new Date(tx.createdAt).toLocaleDateString('ar-EG')}</div>
                        <div className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {tx.status === 'PENDING' ? (
                          <div className="flex gap-2 justify-center">
                            <button disabled={isProcessing} onClick={() => handleProcess(tx.id, 'APPROVE')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all disabled:opacity-50">
                              <Check size={13} /> موافقة
                            </button>
                            <button disabled={isProcessing} onClick={() => handleProcess(tx.id, 'REJECT')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all disabled:opacity-50">
                              <X size={13} /> رفض
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                            {tx.status === 'COMPLETED' ? 'مكتمل ✅' : 'مرفوض ❌'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
