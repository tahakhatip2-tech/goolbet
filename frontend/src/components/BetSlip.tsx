import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { placeBet } from '../api/streams';
import { getWallet } from '../api/wallet';
import { getAllCharities, type Charity } from '../api/charities';
import { useTranslation } from 'react-i18next';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';

interface BetSelection {
  matchId: string;
  team1: string;
  team2: string;
  selectionLabel: string;
  selectionValue: string;
  odds: number;
}

interface BetSlipProps {
  selection: BetSelection | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const BetSlip: React.FC<BetSlipProps> = ({ selection, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [stake, setStake] = useState<number | ''>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const [useBonus, setUseBonus] = useState(false);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [realBalance, setRealBalance] = useState(0);

  // ─── Charity State ───────────────────────────────────────────────────────────
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCharityId, setSelectedCharityId] = useState<string>('');
  const [charityExpanded, setCharityExpanded] = useState(false);

  useEffect(() => {
    if (selection) {
      getWallet().then((res: any) => {
        if (res.wallet) {
          setBonusBalance(res.wallet.bonusBalance || 0);
          setRealBalance(res.wallet.balance || 0);
        }
      }).catch(console.error);

      // Fetch charities
      getAllCharities().then(setCharities).catch(console.error);
    }
  }, [selection]);

  useEffect(() => {
    if (selection) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selection]);

  if (!selection) return null;

  const potentialReturn = (Number(stake) * selection.odds).toFixed(2);
  const potentialProfit = ((Number(stake) * selection.odds) - Number(stake)).toFixed(2);
  const charityAmount = selectedCharityId ? (Number(stake) * selection.odds * 0.10).toFixed(2) : null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError('');
    try {
      await placeBet({
        streamId: selection.matchId,
        selection: selection.selectionValue,
        stake: Number(stake),
        oddsAtBet: selection.odds,
        useBonus,
        ...(selectedCharityId && { charityId: selectedCharityId })
      });
      onConfirm();
    } catch (err: any) {
      setError(err.response?.data?.error || t('bet_slip.error_default'));
    } finally {
      setIsConfirming(false);
    }
  };

  const selectedCharity = charities.find(c => c.id === selectedCharityId);

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[90] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-0 right-0 left-0 md:left-auto w-full md:w-[26rem] bg-card border-t md:border-l border-border shadow-2xl rounded-t-2xl md:rounded-tr-none md:rounded-tl-2xl z-[100] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-3 px-4 flex justify-between items-center shrink-0 rounded-t-2xl md:rounded-none">
          <h3 className="font-bold text-base">{t('bet_slip.title')}</h3>
          <button onClick={onClose} className="hover:opacity-80 font-bold px-2 py-1 bg-white/10 rounded-md text-xs">{t('bet_slip.close')}</button>
        </div>

        <div className="p-4 md:p-5 overflow-y-auto flex-1 no-scrollbar min-h-0 space-y-4">
          
          {/* Selection */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">{selection.team1} {t('bet_slip.vs')} {selection.team2}</div>
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="font-bold text-sm md:text-base">{selection.selectionLabel}</span>
              <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-md font-bold text-sm">{selection.odds}</span>
            </div>
          </div>

          {/* Stake Input */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 flex justify-between">
              <span>{t('bet_slip.stake_label')}</span>
              <span className="font-bold text-primary">{t('bet_slip.available')} ${useBonus ? bonusBalance.toFixed(2) : realBalance.toFixed(2)}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full bg-background border border-border rounded-xl py-2.5 pl-8 pr-3 outline-none focus:border-primary transition-colors text-lg font-bold"
              />
            </div>
          </div>

          {/* Bonus Toggle */}
          {bonusBalance > 0 && (
            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl flex items-center gap-2.5">
              <input
                type="checkbox"
                id="useBonusToggle"
                checked={useBonus}
                onChange={(e) => setUseBonus(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
              <label htmlFor="useBonusToggle" className="text-xs font-medium text-blue-900 flex-1 cursor-pointer">
                {t('bet_slip.use_bonus')}
                <span className="block text-[10px] text-blue-600/80">{t('bet_slip.bonus_available')} ${bonusBalance.toFixed(2)}</span>
              </label>
            </div>
          )}

          {/* ─── Charity Section ─────────────────────────────────────────────── */}
          <div className="border border-red-100 bg-red-50/50 rounded-xl overflow-hidden">
            {/* Toggle Header */}
            <button
              type="button"
              onClick={() => setCharityExpanded(!charityExpanded)}
              className="w-full flex items-center justify-between p-3 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                  <Heart size={15} className="text-red-500" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">تبرع لجمعية خيرية</p>
                  {selectedCharity ? (
                    <p className="text-xs text-green-600 font-medium">✅ {selectedCharity.name}</p>
                  ) : (
                    <p className="text-xs text-slate-400">اختياري - 10% من الأرباح</p>
                  )}
                </div>
              </div>
              {charityExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {/* Charity List */}
            {charityExpanded && (
              <div className="border-t border-red-100 p-3 space-y-2 bg-white">
                {charities.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">لا توجد جمعيات خيرية متاحة حالياً</p>
                ) : (
                  <>
                    {/* No charity option */}
                    <button
                      type="button"
                      onClick={() => setSelectedCharityId('')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${
                        selectedCharityId === ''
                          ? 'border-slate-400 bg-slate-50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm shrink-0">
                        —
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-700">بدون تبرع</p>
                        <p className="text-xs text-slate-400">الأرباح كاملة لي</p>
                      </div>
                      {selectedCharityId === '' && (
                        <div className="w-4 h-4 rounded-full bg-slate-500 shrink-0" />
                      )}
                    </button>

                    {charities.map((charity) => (
                      <button
                        key={charity.id}
                        type="button"
                        onClick={() => setSelectedCharityId(charity.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${
                          selectedCharityId === charity.id
                            ? 'border-red-400 bg-red-50'
                            : 'border-slate-100 hover:border-red-200 hover:bg-red-50/30'
                        }`}
                      >
                        {charity.logo ? (
                          <img src={charity.logo} alt={charity.name} className="w-9 h-9 rounded-full object-cover border border-red-100 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {charity.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-right">
                          <p className="font-semibold text-sm text-slate-800 truncate">{charity.name}</p>
                          {charity.description && (
                            <p className="text-xs text-slate-400 truncate">{charity.description}</p>
                          )}
                          <p className="text-xs text-green-600 font-medium mt-0.5">
                            مجموع المستلم: ${(charity.totalReceived || 0).toFixed(2)}
                          </p>
                        </div>
                        {selectedCharityId === charity.id && (
                          <div className="w-4 h-4 rounded-full bg-red-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && <div className="bg-red-500/10 text-red-500 p-2 rounded-md text-xs">{error}</div>}

          {/* Potential Returns Summary */}
          {stake && Number(stake) > 0 && (
            <div className="bg-muted p-3 rounded-xl space-y-1.5 text-xs border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('bet_slip.potential_return')}</span>
                <span className="font-bold text-sm">${potentialReturn}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('bet_slip.net_profit')}</span>
                <span className="font-bold text-green-500">+${potentialProfit}</span>
              </div>
              {charityAmount && selectedCharity && (
                <div className="flex justify-between items-center pt-1 border-t border-red-100 mt-1">
                  <span className="text-red-500 flex items-center gap-1">
                    <Heart size={11} /> تبرع لـ {selectedCharity.name}
                  </span>
                  <span className="font-bold text-red-500">${charityAmount}</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-yellow-500/10 text-yellow-700 p-2 rounded-lg text-[10px] text-center">
            {t('bet_slip.warning')}
          </div>
        </div>

        {/* Footer / Confirm Button */}
        <div className="p-3 border-t border-border shrink-0 bg-card">
          <Button
            className="w-full shadow-sm"
            size="default"
            disabled={!stake || Number(stake) <= 0 || isConfirming || Number(stake) > (useBonus ? bonusBalance : realBalance)}
            onClick={handleConfirm}
          >
            {isConfirming ? t('bet_slip.confirming') : t('bet_slip.confirm')}
          </Button>
          {selectedCharity && stake && Number(stake) > 0 && (
            <p className="text-center text-xs text-red-500 mt-1.5 flex items-center justify-center gap-1">
              <Heart size={12} /> سيتم تبرع ${charityAmount} لـ {selectedCharity.name} عند الفوز
            </p>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
