import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../components/ui/Button';
import api from '../api/axios';
import { HeroSection } from '../components/ui/HeroSection';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

const TransactionCard = ({ tx }: { tx: any }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const isPositive = tx.type === 'DEPOSIT' || tx.type === 'BET_WON';
  
  return (
    <div className="glass p-4 rounded-xl mb-3 border border-border/40 transition-all">
       <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
         <div className="flex items-center gap-3">
           <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
             {isPositive ? '↓' : '↑'}
           </div>
           <div>
               <p className="font-bold text-slate-800">
                 {tx.type === 'DEPOSIT' ? t('wallet.tx_deposit') : tx.type === 'WITHDRAWAL' ? t('wallet.tx_withdraw') : tx.type === 'BET_PLACED' ? t('wallet.tx_bet') : t('wallet.tx_won')}
               </p>
              <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
           </div>
         </div>
         <div className="text-left flex items-center gap-3">
            <p className={`font-bold font-mono text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : '-'}{Math.abs(tx.amount)}$
            </p>
            {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
         </div>
       </div>
       
       {expanded && (
         <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="flex justify-between items-center">
               <span className="text-slate-500 font-medium">{t('wallet.tx_status')}</span>
               <span className={`px-2 py-1 rounded-md text-xs font-bold ${tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600' : tx.status === 'FAILED' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                 {tx.status === 'COMPLETED' ? t('wallet.status_completed') : tx.status === 'FAILED' ? t('wallet.status_failed') : t('wallet.status_pending')}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-slate-500 font-medium">{t('wallet.tx_date')}</span>
               <span className="font-mono text-slate-700">{new Date(tx.createdAt).toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-slate-500 font-medium">{t('wallet.tx_id')}</span>
              <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{tx.id}</span>
            </div>
         </div>
       )}
    </div>
  );
};

export const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0.00);
  const [lockedBalance, setLockedBalance] = useState(0.00);
  const [bonusBalance, setBonusBalance] = useState(0.00);
  const [totalDeposited, setTotalDeposited] = useState(0.00);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0.00);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositMethods, setDepositMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Modals state
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const fetchData = async () => {
    try {
      const [walletRes, methodsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/deposit-methods')
      ]);
      
      if (walletRes.data && walletRes.data.wallet) {
        setBalance(walletRes.data.wallet.balance);
        setLockedBalance(walletRes.data.wallet.lockedBalance);
        setBonusBalance(walletRes.data.wallet.bonusBalance || 0);
        setTotalDeposited(walletRes.data.wallet.totalDeposited || 0);
        setTotalWithdrawn(walletRes.data.wallet.totalWithdrawn || 0);
      }
      setTransactions(walletRes.data.transactions || []);
      
      if (methodsRes.data && methodsRes.data.length > 0) {
        setDepositMethods(methodsRes.data);
        setDepositMethod(methodsRes.data[0].name); // Select first by default
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingDeposit) return;
    if (!receiptFile || !depositAmount) return toast.warning(t('wallet.err_amount_receipt'));
    
    setIsSubmittingDeposit(true);
    const formData = new FormData();
    formData.append('amount', depositAmount);
    formData.append('method', depositMethod);
    formData.append('receipt', receiptFile);

    try {
      await api.post('/wallet/deposit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('wallet.deposit_success'));
      setShowDeposit(false);
      setDepositAmount('');
      setReceiptFile(null);
      fetchData();
    } catch (err) {
      toast.error(t('wallet.deposit_error'));
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingWithdraw) return;
    if (!withdrawAmount || !withdrawAddress) return toast.warning(t('wallet.err_amount_address'));
    if (Number(withdrawAmount) > balance) return toast.error(t('wallet.err_insufficient'));

    setIsSubmittingWithdraw(true);
    try {
      await api.post('/wallet/withdraw', {
        amount: withdrawAmount,
        address: withdrawAddress,
        method: 'USDT TRC-20'
      });
      toast.success(t('wallet.withdraw_success'));
      setShowWithdraw(false);
      setWithdrawAmount('');
      setWithdrawAddress('');
      fetchData();
    } catch (err) {
      toast.error(t('wallet.withdraw_error'));
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 min-h-screen">
      <HeroSection 
        title={
          <>
            {t('wallet.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-400">{t('wallet.title_highlight')}</span>
          </>
        }
        subtitle={t('wallet.subtitle')}
        badge={t('wallet.badge')}
        minHeight="min-h-[40vh]"
      >
        <div className="mt-8 text-center p-6 inline-block min-w-[280px]">
           <p className="text-sm font-bold text-slate-600 mb-1">{t('wallet.available_balance')}</p>
           <h2 className="text-4xl font-black text-slate-900 drop-shadow-sm">${balance.toFixed(2)}</h2>
           <div className="flex gap-4 mt-6 justify-center w-full max-w-sm mx-auto">
             <Button size="lg" className="flex-1 shadow-[0_0_15px_rgba(34,197,94,0.4)] text-lg" onClick={() => setShowDeposit(true)}>{t('wallet.deposit')}</Button>
             <Button size="lg" variant="outline" className="flex-1 border-slate-300 bg-white/50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-lg" onClick={() => setShowWithdraw(true)}>{t('wallet.withdraw')}</Button>
           </div>
        </div>
      </HeroSection>
      
      <div className="container mx-auto px-4 py-8 mt-2 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          <div className="bg-white/40 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-white/60 shadow-sm relative overflow-hidden group hover:shadow-md hover:bg-white/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <h2 className="text-sm md:text-base text-slate-600 mb-2 relative z-10">{t('wallet.locked_bets')}</h2>
            <div className="text-xl md:text-3xl font-bold text-slate-700 relative z-10">${lockedBalance.toFixed(2)}</div>
          </div>
          
          <div className="bg-white/40 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-green-300/50 shadow-sm relative overflow-hidden group hover:shadow-md hover:bg-green-50/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/15 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <h2 className="text-sm md:text-base text-green-600 mb-2 relative z-10 font-bold">{t('wallet.total_deposits')}</h2>
            <div className="text-xl md:text-3xl font-bold text-green-600 relative z-10">${totalDeposited.toFixed(2)}</div>
          </div>

          <div className="bg-white/40 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-red-300/50 shadow-sm relative overflow-hidden group hover:shadow-md hover:bg-red-50/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <h2 className="text-sm md:text-base text-red-500 mb-2 relative z-10">{t('wallet.total_withdrawals')}</h2>
            <div className="text-xl md:text-3xl font-bold text-red-600 relative z-10">${totalWithdrawn.toFixed(2)}</div>
          </div>
          
          <div className="bg-white/40 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-blue-300/50 shadow-sm relative overflow-hidden group hover:shadow-md hover:bg-blue-50/60 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/15 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <h2 className="text-sm md:text-base text-blue-600 mb-2 relative z-10 font-bold">{t('wallet.bonus_balance')}</h2>
            <div className="text-xl md:text-3xl font-bold text-blue-600 relative z-10">${bonusBalance.toFixed(2)}</div>
          </div>
        </div>

      {showDeposit && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-primary">{t('wallet.deposit_title')}</h3>
              <button onClick={() => setShowDeposit(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {depositMethods.length > 0 ? (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-bold text-slate-700">{t('wallet.deposit_method')}</label>
                    <select 
                      value={depositMethod} 
                      onChange={e => setDepositMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-primary transition-all text-sm font-bold text-slate-700"
                    >
                      {depositMethods.map((m: any) => (
                        <option key={m.id} value={m.name}>{m.name} {m.network ? `(${m.network})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  {depositMethods.filter(m => m.name === depositMethod).map(method => (
                    <div key={method.id} className="bg-blue-50/50 p-4 rounded-xl font-mono text-sm border border-blue-100 animate-in fade-in">
                       <p className="text-slate-500 mb-2 font-sans font-medium text-xs">{t('wallet.wallet_address')}</p>
                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <span className="truncate break-all text-slate-700 font-bold max-w-[70%]">{method.address}</span>
                         <Button type="button" variant="outline" className="h-8 px-3 ms-2 bg-slate-50 hover:bg-slate-100 text-xs" onClick={() => {
                          navigator.clipboard.writeText(method.address);
                          toast.success(t('wallet.copied'));
                        }}>{t('wallet.copy')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="p-4 mb-6 text-center text-amber-600 bg-amber-50 rounded-xl border border-amber-200 text-sm font-medium">
                  {t('wallet.no_methods')}
                </div>
              )}
              <form onSubmit={handleDepositSubmit} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-bold text-slate-700">{t('wallet.amount_usd')}</label>
                  <input type="number" required value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono text-lg" placeholder="0.00" />
                </div>
                <div>
                   <label className="block mb-2 text-sm font-bold text-slate-700">{t('wallet.receipt_label')}</label>
                  <input type="file" accept="image/*" required onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all text-sm" />
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={isSubmittingDeposit} className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmittingDeposit ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        {t('wallet.sending')}
                      </>
                    ) : (
                      t('wallet.submit')
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      , document.body)}

      {showWithdraw && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-primary">{t('wallet.withdraw_title')}</h3>
              <button onClick={() => setShowWithdraw(false)} disabled={isSubmittingWithdraw} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors disabled:opacity-50">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleWithdrawSubmit} className="space-y-5">
                <div>
                   <label className="block mb-2 text-sm font-bold text-slate-700">{t('wallet.amount_usd')}</label>
                  <input type="number" max={balance} required value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} disabled={isSubmittingWithdraw} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono text-lg disabled:opacity-50" placeholder="0.00" />
                   <span className="text-xs text-slate-500 mt-1.5 font-medium block">{t('wallet.max_available')} <span className="font-bold text-slate-800">${balance.toFixed(2)}</span></span>
                </div>
                <div>
                   <label className="block mb-2 text-sm font-bold text-slate-700">{t('wallet.withdraw_address_label')}</label>
                  <input type="text" required value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} disabled={isSubmittingWithdraw} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono disabled:opacity-50" placeholder="T..." />
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={isSubmittingWithdraw} className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmittingWithdraw ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        {t('wallet.sending')}
                      </>
                    ) : (
                      t('wallet.confirm_withdraw')
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      , document.body)}

      <h2 className="text-2xl font-bold mb-6">{t('wallet.transactions_title')}</h2>
      <div className="space-y-3 mb-8">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground glass rounded-xl">{t('common.loading')}</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground glass rounded-xl">{t('wallet.no_transactions')}</div>
        ) : (
          transactions.map(tx => (
            <TransactionCard key={tx.id} tx={tx} />
          ))
        )}
      </div>
    </div>
    </div>
  );
};
