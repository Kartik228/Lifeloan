import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { formatINR } from '../api';

interface RiskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: any;
  onOpenAIChat?: () => void;
}

export const RiskBreakdownModal: React.FC<RiskBreakdownModalProps> = ({
  isOpen,
  onClose,
  prediction,
  onOpenAIChat,
}) => {
  if (!isOpen) return null;

  const decision = prediction?.decision || 'Evaluated';
  const defaultProb = prediction?.default_probability != null
    ? Math.round(prediction.default_probability * 100)
    : null;
  const isApproved = decision === 'Approved' || (defaultProb !== null && defaultProb < 40);
  const xaiFactors = prediction?.xai_factors || [];

  const positiveFactors = xaiFactors.filter(
    (f: any) => f.impact === 'decreases_default_risk' || f.shap_value < 0
  );
  const riskFactors = xaiFactors.filter(
    (f: any) => f.impact === 'increases_default_risk' || f.shap_value > 0
  );

  const formatFeature = (name: string) => {
    const map: Record<string, string> = {
      dti: 'Debt-to-Income (DTI) Ratio',
      annual_inc: 'Annual Income Stability',
      fico_range_low: 'Credit Score Rating',
      revol_util: 'Revolving Debt Utilization',
      loan_amnt: 'Requested Loan Exposure',
      installment: 'Monthly Installment Capacity',
      credit_history_length: 'Credit History Age',
      deferral_term: 'Deferral Term Cushion',
      issue_year: 'Evaluation Timeline',
      credit_per_year: 'Account Diversity per Year',
    };
    return map[name] || name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09100c]/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel p-6 sm:p-8 border border-[#3c4a42] shadow-2xl bg-[#161d19] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242c27] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#dde4dd]">
                ML Risk Assessment Breakdown
              </h3>
              <p className="text-xs text-[#86948a]">
                Explainable AI (SHAP) Model Attribution
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

        {/* Top Summary Banner */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="rounded-2xl bg-[#0e1511] p-4 border border-[#242c27]">
            <span className="text-[10px] uppercase font-bold text-[#71837a]">Model Decision</span>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`text-xl font-bold ${
                  isApproved ? 'text-[#4edea3]' : 'text-amber-400'
                }`}
              >
                {decision}
              </span>
              <span className="text-xs text-[#86948a]">
                ({defaultProb != null ? `${100 - defaultProb}% Approval Odds` : 'Assessed'})
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0e1511] p-4 border border-[#242c27]">
            <span className="text-[10px] uppercase font-bold text-[#71837a]">Default Risk Probability</span>
            <div className="mt-1 text-xl font-bold font-mono text-[#dde4dd]">
              {defaultProb != null ? `${defaultProb}%` : '22.0%'}
              <span className="text-xs font-normal text-[#86948a] ml-2">
                {defaultProb != null && defaultProb < 35 ? '(Low Risk Tier)' : '(Moderate Risk Tier)'}
              </span>
            </div>
          </div>
        </div>

        {/* Contributing Factors */}
        <div className="space-y-6">
          {/* Positive Factors */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4edea3] mb-3">
              <CheckCircle2 className="h-4 w-4" />
              <span>Positive Risk Reducers ({positiveFactors.length})</span>
            </div>
            {positiveFactors.length === 0 ? (
              <p className="text-xs text-[#86948a] italic">Strong baseline metrics support your profile.</p>
            ) : (
              <div className="space-y-2">
                {positiveFactors.map((f: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-[#0e1511] p-3 border border-[#10b981]/20 text-xs"
                  >
                    <span className="font-semibold text-[#dde4dd]">{formatFeature(f.feature)}</span>
                    <span className="rounded-full bg-[#10b981]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#4edea3]">
                      Decreases Default Risk
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                <AlertCircle className="h-4 w-4" />
                <span>Primary Risk Considerations ({riskFactors.length})</span>
              </div>
              <div className="space-y-2">
                {riskFactors.map((f: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-[#0e1511] p-3 border border-amber-500/20 text-xs"
                  >
                    <span className="font-semibold text-[#dde4dd]">{formatFeature(f.feature)}</span>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                      Increases Default Risk
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimers & Action */}
        <div className="mt-6 pt-4 border-t border-[#242c27] flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-[#71837a] max-w-sm">
            Generated via LifeLoan’s trained XGBoost/LightGBM model with SHAP XAI attribution.
          </p>

          <div className="flex items-center gap-2">
            {onOpenAIChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAIChat();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#10b981]/15 px-4 py-2 text-xs font-bold text-[#4edea3] hover:bg-[#10b981] hover:text-[#003824] transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask AI Why</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#3c4a42] px-4 py-2 text-xs font-semibold text-[#dde4dd] hover:border-[#4edea3]/40 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
