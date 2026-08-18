import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Radio, ShieldCheck, Clock, Award, ChevronRight, Zap, RefreshCw, DollarSign, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';
import { LoanItem, RecoveryPlan } from '../types';

interface BentoGridProps {
  loans: LoanItem[];
  recoveryPlan: RecoveryPlan;
  onOpenCheckEligibility: () => void;
  onOpenApply: () => void;
  onPayEmi: (loanId: string) => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  loans,
  recoveryPlan,
  onOpenCheckEligibility,
  onOpenApply,
  onPayEmi,
}) => {
  // Card 1: Interactive Loan Calculator state
  const [calcAmount, setCalcAmount] = useState(450000);
  const [calcTenure, setCalcTenure] = useState(15);
  const [calcIncome, setCalcIncome] = useState(140000);

  // Card 3: Loan Tracker Tab state
  const [trackerTab, setTrackerTab] = useState<'active' | 'upcoming' | 'completed' | 'history'>('active');

  // Compute Card 1 live calculation
  const monthlyRate = 0.058 / 12;
  const numPayments = calcTenure * 12;
  const calculatedEmi = Math.round(
    (calcAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );

  const monthlyIncome = calcIncome / 12;
  const estimatedDti = Math.round((calculatedEmi / monthlyIncome) * 100);
  const eligibilityScore = Math.min(98, Math.max(20, Math.round(100 - (estimatedDti * 1.2))));

  // Filtered loans for Card 3
  const filteredLoans = loans.filter((l) => l.status === trackerTab);

  return (
    <section id="features" className="relative py-16 lg:py-24">
      {/* Section Glow Background */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10b981]/5 blur-[160px]" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        
        {/* Section Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-[#3c4a42] bg-[#161d19] px-4 py-1.5 text-xs font-bold tracking-widest text-[#4edea3] uppercase mb-3">
            <Zap className="h-3.5 w-3.5" />
            <span>INTELLIGENT FINANCIAL MODULES</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#dde4dd] sm:text-4xl lg:text-5xl">
            Precision Underwriting & Portfolio Control.
          </h2>
        </div>

        {/* 4-Card Bento Box Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          
          {/* ================= CARD 1: LOAN ELIGIBILITY PREDICTION ================= */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-7 glass-panel rounded-2xl p-6 lg:p-8 relative overflow-hidden glass-panel-hover"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <span className="text-xs font-mono text-[#86948a] uppercase tracking-wider">Predictive Model v4.2</span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#dde4dd]">
              Loan Eligibility Prediction
            </h3>
            <p className="mt-2 text-xs text-[#bbcabf] max-w-md">
              Real-time ML estimation of borrowing threshold based on income, debt service capacity, and market rates.
            </p>

            {/* Live Interactive Sliders */}
            <div className="mt-6 space-y-4 rounded-xl bg-[#0e1511]/90 p-4 border border-[#242c27]">
              <div>
                <div className="flex justify-between text-xs font-medium text-[#bbcabf] mb-1">
                  <span>Loan Amount</span>
                  <span className="font-mono font-bold text-[#4edea3]">${calcAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="25000"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full accent-[#10b981] bg-[#1a211d] h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-[#bbcabf] mb-1">
                    <span>Tenure</span>
                    <span className="font-mono text-[#dde4dd]">{calcTenure} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={calcTenure}
                    onChange={(e) => setCalcTenure(Number(e.target.value))}
                    className="w-full accent-[#10b981] bg-[#1a211d] h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-[#bbcabf] mb-1">
                    <span>Annual Income</span>
                    <span className="font-mono text-[#dde4dd]">${(calcIncome / 1000).toFixed(0)}k/yr</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="500000"
                    step="10000"
                    value={calcIncome}
                    onChange={(e) => setCalcIncome(Number(e.target.value))}
                    className="w-full accent-[#10b981] bg-[#1a211d] h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#242c27] pt-3 text-center">
                <div className="rounded-lg bg-[#161d19] p-2">
                  <div className="text-[10px] text-[#86948a] uppercase">Approval Odds</div>
                  <div className="text-base font-bold text-[#4edea3] font-mono">{eligibilityScore}%</div>
                </div>
                <div className="rounded-lg bg-[#161d19] p-2">
                  <div className="text-[10px] text-[#86948a] uppercase">Est. Monthly EMI</div>
                  <div className="text-base font-bold text-[#dde4dd] font-mono">${calculatedEmi.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-[#161d19] p-2">
                  <div className="text-[10px] text-[#86948a] uppercase">Est. DTI Ratio</div>
                  <div className={`text-base font-bold font-mono ${estimatedDti <= 36 ? 'text-[#4edea3]' : 'text-amber-400'}`}>
                    {estimatedDti}%
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={onOpenCheckEligibility}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#4edea3] hover:underline"
              >
                <span>RUN DETAILED AI ANALYSIS</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>


          {/* ================= CARD 2: CREDIT RISK ASSESSMENT ================= */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-5 glass-panel rounded-2xl p-6 lg:p-8 relative overflow-hidden glass-panel-hover flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#dde4dd]">
                Credit Risk Assessment
              </h3>
              <p className="mt-2 text-xs text-[#bbcabf]">
                Evaluate repayment risk using explainable machine learning models.
              </p>

              {/* Explainable Risk Factors */}
              <div className="mt-6 space-y-3">
                <div className="rounded-xl bg-[#0e1511]/80 p-3 border border-[#242c27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#dde4dd]">Repayment History</div>
                    <div className="text-[10px] text-[#86948a]">100% On-time records across 24 mos</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#4edea3]">Low Risk</span>
                </div>

                <div className="rounded-xl bg-[#0e1511]/80 p-3 border border-[#242c27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#dde4dd]">Credit Utilization</div>
                    <div className="text-[10px] text-[#86948a]">Currently at 18% (Optimal &lt;30%)</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#4edea3]">Optimal</span>
                </div>

                <div className="rounded-xl bg-[#0e1511]/80 p-3 border border-[#242c27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#dde4dd]">Liquidity Coverage Ratio</div>
                    <div className="text-[10px] text-[#86948a]">4.2x monthly debt obligations</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#4edea3]">Tier 1</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#242c27] flex items-center justify-between text-xs text-[#bbcabf]">
              <span>Overall Risk Score: <strong className="text-[#4edea3]">742 (Excellent)</strong></span>
              <button 
                onClick={onOpenApply}
                className="text-[#4edea3] hover:underline flex items-center font-semibold"
              >
                <span>View Breakdown</span>
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          </motion.div>


          {/* ================= CARD 3: LOAN TRACKER ================= */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-6 glass-panel rounded-2xl p-6 lg:p-8 relative overflow-hidden glass-panel-hover"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-serif text-2xl font-bold text-[#dde4dd]">
                Loan Tracker
              </h3>

              {/* Status Tabs matching user reference image (Active, Upcoming EMI, Completed, History) */}
              <div className="flex rounded-full bg-[#0e1511] p-1 border border-[#2f3632]">
                {(['active', 'upcoming', 'completed', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTrackerTab(tab)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition-all ${
                      trackerTab === tab
                        ? 'bg-[#10b981] text-[#003824] shadow-sm'
                        : 'text-[#bbcabf] hover:text-[#dde4dd]'
                    }`}
                  >
                    {tab === 'upcoming' ? 'Upcoming EMI' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List of loans for active tab */}
            <div className="mt-4 space-y-3 min-h-[220px]">
              {filteredLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-[#86948a] text-xs">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <span>No loans found under "{trackerTab}" tab.</span>
                </div>
              ) : (
                filteredLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="rounded-xl bg-[#0e1511]/80 p-4 border border-[#242c27] transition-all hover:border-[#3c4a42]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[#dde4dd]">{loan.title}</div>
                        <div className="text-xs text-[#86948a]">{loan.lender} • {loan.interestRate}% APR</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-[#dde4dd]">
                          ${loan.remainingAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#86948a]">Remaining Balance</div>
                      </div>
                    </div>

                    {/* EMI & Progress */}
                    <div className="mt-3 flex items-center justify-between border-t border-[#1a211d] pt-2 text-xs">
                      <div className="text-[#bbcabf]">
                        Next EMI: <span className="font-mono text-[#4edea3] font-semibold">${loan.emi}/mo</span> ({loan.nextDueDate})
                      </div>

                      {loan.status === 'active' || loan.status === 'upcoming' ? (
                        <button
                          onClick={() => onPayEmi(loan.id)}
                          className="rounded-full border border-[#4edea3]/40 bg-[#10b981]/10 px-3 py-1 text-[10px] font-bold text-[#4edea3] hover:bg-[#10b981] hover:text-[#003824] transition-all"
                        >
                          PAY EMI
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#10b981] font-semibold">● {loan.status.toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>


          {/* ================= CARD 4: FINANCIAL RECOVERY PLANNER ================= */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-6 glass-panel rounded-2xl p-6 lg:p-8 relative overflow-hidden glass-panel-hover flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#dde4dd]">
                    Financial Recovery Planner
                  </h3>
                  <p className="mt-1 text-xs text-[#bbcabf] max-w-sm">
                    Receive personalized strategies to improve your financial health after setbacks.
                  </p>
                </div>

                {/* 82% Glowing Financial Health Ring (exact match to image) */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0e1511] p-1 border border-[#10b981]/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                  <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-[#1a211d]"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#4edea3] drop-shadow-[0_0_8px_#4edea3]"
                      strokeDasharray="82, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-sm font-bold font-mono text-[#dde4dd]">82%</span>
                    <span className="block text-[8px] font-semibold text-[#4edea3] uppercase tracking-tighter">Financial Health</span>
                  </div>
                </div>
              </div>

              {/* Recovery Strategies List */}
              <div className="mt-4 space-y-2.5">
                {recoveryPlan.strategies.map((strat) => (
                  <div
                    key={strat.id}
                    className="rounded-xl bg-[#0e1511]/80 p-3 border border-[#242c27] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#dde4dd]">{strat.title}</div>
                      <div className="text-[10px] text-[#86948a]">{strat.description}</div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="rounded-full bg-[#10b981]/15 px-2 py-0.5 text-[10px] font-bold text-[#4edea3]">
                        {strat.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#242c27] flex items-center justify-between text-xs text-[#86948a]">
              <span>Status: <strong className="text-[#4edea3]">{recoveryPlan.status}</strong></span>
              <button 
                onClick={onOpenApply}
                className="text-[#4edea3] font-semibold hover:underline"
              >
                Generate Custom Plan →
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
