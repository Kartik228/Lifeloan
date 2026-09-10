import React from 'react';
import { X, TrendingUp, ShieldCheck, CheckCircle2, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { FinancialProfile } from '../types';

interface HealthScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FinancialProfile | null;
}

export const HealthScoreModal: React.FC<HealthScoreModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  if (!isOpen || !profile) return null;

  const score = profile.health_score || 75;
  const creditScore = profile.credit_score || 740;
  const dti = profile.debt_to_income != null ? profile.debt_to_income : 28.5;
  const savingsMonths = profile.monthly_expenses > 0
    ? (profile.savings / profile.monthly_expenses).toFixed(1)
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09100c]/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-[#3c4a42] shadow-2xl bg-[#161d19]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242c27] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#dde4dd]">
                Financial Health Score
              </h3>
              <p className="text-[11px] text-[#86948a]">
                LifeLoan Internal AI Metric • Distinct from CIBIL Score
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#86948a] hover:bg-[#242c27] hover:text-[#dde4dd] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Score Ring / Display */}
        <div className="rounded-2xl bg-[#0e1511] p-5 border border-[#242c27] flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#71837a]">Current Health Rating</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-[#4edea3]">{score}</span>
              <span className="text-xs text-[#71837a]">/ 100</span>
              <span className="ml-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-[#10b981]/15 text-[#4edea3]">
                {score >= 75 ? 'Optimal' : score >= 60 ? 'Moderate' : 'Attention'}
              </span>
            </div>
          </div>

          <div className="h-12 w-12 rounded-full border-4 border-[#10b981] flex items-center justify-center font-bold text-xs text-[#4edea3] bg-[#10b981]/10">
            {score}%
          </div>
        </div>

        {/* Breakdown Factors */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#71837a]">
            Underlying Scoring Factors
          </h4>

          <div className="rounded-xl bg-[#0e1511] p-3.5 border border-[#242c27] flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-[#dde4dd]">Credit Profile Strength</p>
              <p className="text-[10px] text-[#86948a]">Rating: {creditScore}</p>
            </div>
            <span className="font-mono font-bold text-[#4edea3]">
              {creditScore >= 750 ? '+25 pts' : creditScore >= 700 ? '+15 pts' : '-15 pts'}
            </span>
          </div>

          <div className="rounded-xl bg-[#0e1511] p-3.5 border border-[#242c27] flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-[#dde4dd]">Debt-to-Income (DTI) Leverage</p>
              <p className="text-[10px] text-[#86948a]">Active DTI: {dti}%</p>
            </div>
            <span className={`font-mono font-bold ${dti <= 35 ? 'text-[#4edea3]' : 'text-amber-400'}`}>
              {dti <= 30 ? '+15 pts' : dti <= 45 ? '+5 pts' : '-15 pts'}
            </span>
          </div>

          <div className="rounded-xl bg-[#0e1511] p-3.5 border border-[#242c27] flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-[#dde4dd]">Liquid Savings Buffer</p>
              <p className="text-[10px] text-[#86948a]">{savingsMonths}x monthly expenses in reserves</p>
            </div>
            <span className="font-mono font-bold text-[#4edea3]">
              {Number(savingsMonths) >= 6 ? '+10 pts' : Number(savingsMonths) >= 3 ? '+5 pts' : '+0 pts'}
            </span>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="rounded-xl border border-[#242c27] bg-[#101713] p-3 text-[11px] text-[#86948a] mb-6 flex items-start gap-2">
          <Info className="h-4 w-4 text-[#4edea3] shrink-0 mt-0.5" />
          <span>
            The Financial Health Score is an internal behavioral composite metric designed to help you track borrowing stability. It updates automatically when your debt, income, or savings change.
          </span>
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#10b981] px-6 py-2.5 text-xs font-bold text-[#003824] hover:bg-[#4edea3] transition shadow-lg shadow-[#10b981]/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
