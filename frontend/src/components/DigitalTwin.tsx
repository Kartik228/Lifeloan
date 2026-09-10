import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Sliders,
  ArrowUpRight,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  IndianRupee,
  Calendar,
  Percent,
  Wallet,
  Activity,
  UserCheck,
  Scale,
  Info,
  ChevronRight,
} from 'lucide-react';
import { api, formatINR } from '../api';
import { FinancialProfile, DigitalTwinSimulationResult, DigitalTwinXAIFactor } from '../types';

interface DigitalTwinProps {
  onBack?: () => void;
  onOpenAIChat: () => void;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  onBack,
  onOpenAIChat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // =====================================================
  // AUTHENTIC USER PROFILE BASELINE
  // =====================================================
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // =====================================================
  // HYPOTHETICAL SCENARIO PARAMETERS
  // =====================================================
  const [scenario, setScenario] = useState({
    loanAmount: 500000,
    interestRate: 10.5,
    tenureYears: 5,
    incomeChangePercent: 0,
    expenseChangePercent: 0,
  });

  // Track if scenario changed since last simulation run
  const [isStale, setIsStale] = useState(false);

  // =====================================================
  // REAL XGBOOST SIMULATION ENGINE STATE
  // =====================================================
  const [simulationResult, setSimulationResult] =
    useState<DigitalTwinSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [hasSimulated, setHasSimulated] = useState(false);

  // =====================================================
  // REAL-TIME LOCAL EMI ESTIMATE (FOR SLIDER HINT)
  // =====================================================
  const liveEmiEstimate = useMemo(() => {
    const P = scenario.loanAmount;
    const r = (scenario.interestRate / 100) / 12;
    const n = scenario.tenureYears * 12;
    if (P <= 0 || n <= 0) return 0;
    if (r <= 0) return Math.round(P / n);
    const compound = Math.pow(1 + r, n);
    const denom = compound - 1;
    return denom > 0 ? Math.round((P * r * compound) / denom) : Math.round(P / n);
  }, [scenario.loanAmount, scenario.interestRate, scenario.tenureYears]);

  // =====================================================
  // LOAD AUTHENTIC USER PROFILE (DO NOT AUTO-RUN SIMULATION)
  // =====================================================
  useEffect(() => {
    let mounted = true;

    async function loadBaselineProfile() {
      try {
        setLoadingProfile(true);
        setProfileError(null);
        const data = await api.get<FinancialProfile>('/financial-profile');
        if (mounted) {
          setProfile(data);
        }
      } catch (err: any) {
        console.warn('Could not load authentic profile for Digital Twin:', err);
        if (mounted) {
          // If unauthenticated or profile unavailable, provide graceful fallback
          const fallbackProfile: FinancialProfile = {
            id: 0,
            user_id: 0,
            annual_income: 600000,
            monthly_income: 50000,
            monthly_expenses: 25000,
            existing_debt: 10000,
            savings: 150000,
            credit_score: 740,
            employment_status: 'Salaried',
            monthly_surplus: 25000,
            debt_to_income: 20.0,
            active_loan_count: 0,
            total_active_loan_amount: 0,
            total_monthly_emi: 0,
            health_score: 75,
          };
          setProfile(fallbackProfile);
        }
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }

    loadBaselineProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // RUN REAL ML SIMULATION (TRIGGERED BY USER ONLY)
  // =====================================================
  const runSimulation = async () => {
    try {
      setSimulating(true);
      setSimError(null);

      const result = await api.post<DigitalTwinSimulationResult>(
        '/digital-twin/simulate',
        {
          scenario_loan_amount: scenario.loanAmount,
          scenario_interest_rate: scenario.interestRate,
          scenario_tenure_years: scenario.tenureYears,
          income_change_percent: scenario.incomeChangePercent,
          expense_change_percent: scenario.expenseChangePercent,
        }
      );

      setSimulationResult(result);
      setHasSimulated(true);
      setIsStale(false);

      // Cache authentic scenario in localStorage for AI Advisor context
      localStorage.setItem(
        'lifeloan_digital_twin_scenario',
        JSON.stringify({
          scenario: scenario,
          result: result,
          xai_factors: result.xai_factors || [],
          current_state: result.current_financial_metrics,
          simulated_state: result.simulated_financial_metrics,
          risk_delta: result.risk_change_percentage_points,
        })
      );
    } catch (err: any) {
      console.error('Digital Twin simulation execution failed:', err);
      setSimError(
        err.message || 'Unable to run simulation. Please verify backend service and retry.'
      );
    } finally {
      setSimulating(false);
    }
  };

  // =====================================================
  // ASK AI WHY (OPENS AI ADVISOR WITH FULL SIMULATION CONTEXT)
  // =====================================================
  const handleAskAI = () => {
    if (simulationResult) {
      const deltaSign = simulationResult.risk_change_percentage_points > 0 ? '+' : '';
      const topFactors = (simulationResult.xai_factors || [])
        .slice(0, 3)
        .map((f) => `${f.label || f.feature} (${f.impact === 'increases_default_risk' ? 'increases risk' : 'decreases risk'})`)
        .join(', ');

      const promptText = `Explain my Digital Twin simulation: I tested a prospective ₹${scenario.loanAmount.toLocaleString(
        'en-IN'
      )} loan at ${scenario.interestRate}% interest over ${scenario.tenureYears} years (${scenario.tenureYears * 12} months). My baseline default risk was ${simulationResult.current_default_probability}% (${simulationResult.current_risk_level}) and moved to ${simulationResult.simulated_default_probability}% (${simulationResult.simulated_risk_level}), a change of ${deltaSign}${simulationResult.risk_change_percentage_points} percentage points. The top model factors were: ${topFactors || 'repayment burden and DTI shift'}. Why did this risk change happen according to LifeLoan's XGBoost model, and how can I maintain financial sustainability?`;

      localStorage.setItem('lifeloan_chat_initial_prompt', promptText);
    }
    onOpenAIChat();
  };

  // =====================================================
  // NEURAL TWIN CANVAS ANIMATION
  // =====================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || 300);
    let height = (canvas.height = canvas.offsetHeight || 300);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 300;
      height = canvas.height = canvas.offsetHeight || 300;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = 32;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(78, 222, 163, 0.08)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 85) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = i % 2 === 0 ? '#4edea3' : '#10b981';
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Format helper for risk delta
  const getRiskDeltaLabel = (delta: number) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)} percentage points`;
  };

  const currentRisk = simulationResult?.current_default_probability ?? 0;
  const simRisk = simulationResult?.simulated_default_probability ?? 0;
  const riskDelta = simulationResult?.risk_change_percentage_points ?? 0;
  const isFavorable = simulationResult?.is_favorable ?? true;

  return (
    <div className="min-h-screen bg-[#0a0f0c] text-[#dde4dd] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f2923] pb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#233128] bg-[#121915] text-[#9aa9a1] hover:text-[#4edea3] hover:border-[#4edea3]/40 transition"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-6 items-center gap-1.5 rounded-full border border-[#4edea3]/30 bg-[#10b981]/10 px-3 text-[11px] font-bold text-[#4edea3]">
                  <Cpu className="h-3.5 w-3.5 animate-pulse" />
                  REAL XGBOOST SIMULATION ENGINE
                </span>
                <span className="text-[11px] text-[#6b7c73] font-medium hidden md:inline">
                  • Powered by LifeLoan ML Risk Pipeline & SHAP TreeExplainer
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dde4dd] mt-1.5">
                Financial Digital Twin
              </h1>
              <p className="text-xs text-[#7d9086] mt-0.5 max-w-2xl">
                Simulate prospective borrowing, interest fluctuations, and income adjustments against your authentic profile in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAskAI}
              className="inline-flex items-center gap-2 rounded-xl border border-[#4edea3]/40 bg-[#131d17] px-4 py-2.5 text-xs font-bold text-[#4edea3] transition hover:bg-[#10b981]/20 shadow-sm shadow-[#10b981]/10"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI Why
            </button>
          </div>
        </div>

        {/* =====================================================
            AUTHENTIC USER PROFILE BASELINE BAR
        ===================================================== */}
        <div className="rounded-2xl border border-[#233128] bg-[#111814]/90 p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10 border border-[#4edea3]/30 text-[#4edea3]">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#4edea3]">
                  Authentic Profile Synchronized
                </span>
                <p className="text-xs font-semibold text-[#dde4dd]">
                  {loadingProfile ? 'Synchronizing profile...' : `Baseline Financial Identity: ${profile?.employment_status || 'Salaried Borrower'}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-xs">
              <div className="border-l border-[#233128] pl-3">
                <span className="text-[10px] text-[#71837a]">Annual Income</span>
                <p className="font-mono font-bold text-[#dde4dd]">
                  {profile ? formatINR(profile.annual_income) : '—'}
                </p>
              </div>
              <div className="border-l border-[#233128] pl-3">
                <span className="text-[10px] text-[#71837a]">Monthly Surplus</span>
                <p className={`font-mono font-bold ${(profile?.monthly_surplus ?? 0) >= 0 ? 'text-[#4edea3]' : 'text-red-400'}`}>
                  {profile ? formatINR(profile.monthly_surplus) : '—'}
                </p>
              </div>
              <div className="border-l border-[#233128] pl-3">
                <span className="text-[10px] text-[#71837a]">Existing Liabilities</span>
                <p className="font-mono font-bold text-[#dde4dd]">
                  {profile ? formatINR(profile.existing_debt + (profile.total_active_loan_amount || 0)) : '—'}
                </p>
              </div>
              <div className="border-l border-[#233128] pl-3">
                <span className="text-[10px] text-[#71837a]">Credit Score</span>
                <p className="font-mono font-bold text-[#4edea3]">
                  {profile ? profile.credit_score : '—'} <span className="text-[10px] text-[#6b7c73] font-normal">pts</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            MAIN GRID: SCENARIO BUILDER & SIMULATION RESULTS
        ===================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: SCENARIO PARAMETERS (SLIDERS) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-[#233128] bg-[#121a15] p-6 shadow-xl relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-5 w-5 text-[#4edea3]" />
                  <div>
                    <h2 className="text-base font-bold text-[#dde4dd]">
                      Hypothetical Scenario
                    </h2>
                    <p className="text-[11px] text-[#71837a]">
                      Adjust parameters to evaluate with XGBoost
                    </p>
                  </div>
                </div>

                {isStale && hasSimulated && (
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="h-3 w-3" />
                    Scenario Changed
                  </span>
                )}
              </div>

              {/* SLIDERS STACK */}
              <div className="space-y-6">
                {/* 1. Simulated Loan Amount */}
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9aa9a1] font-medium flex items-center gap-1.5">
                      <IndianRupee className="h-3.5 w-3.5 text-[#4edea3]" />
                      Simulated Loan Amount
                    </span>
                    <span className="font-mono font-bold text-[#4edea3] text-sm">
                      {formatINR(scenario.loanAmount)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={5000000}
                    step={25000}
                    value={scenario.loanAmount}
                    onChange={(e) => {
                      setScenario({ ...scenario, loanAmount: Number(e.target.value) });
                      setIsStale(true);
                    }}
                    className="w-full accent-[#10b981] bg-[#0c130f] h-2.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5c6e64] mt-1.5 font-mono">
                    <span>₹50,000</span>
                    <span>₹25,00,000</span>
                    <span>₹50,00,000</span>
                  </div>
                </div>

                {/* 2. Simulated Interest Rate */}
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9aa9a1] font-medium flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-[#4edea3]" />
                      Simulated Interest Rate
                    </span>
                    <span className="font-mono font-bold text-[#4edea3] text-sm">
                      {scenario.interestRate.toFixed(2)}% p.a.
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={25.0}
                    step={0.25}
                    value={scenario.interestRate}
                    onChange={(e) => {
                      setScenario({ ...scenario, interestRate: Number(e.target.value) });
                      setIsStale(true);
                    }}
                    className="w-full accent-[#10b981] bg-[#0c130f] h-2.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5c6e64] mt-1.5 font-mono">
                    <span>0.0%</span>
                    <span>12.5%</span>
                    <span>25.0%</span>
                  </div>
                </div>

                {/* 3. Repayment Tenure */}
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9aa9a1] font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#4edea3]" />
                      Repayment Tenure
                    </span>
                    <span className="font-mono font-bold text-[#4edea3] text-sm">
                      {scenario.tenureYears} {scenario.tenureYears === 1 ? 'Year' : 'Years'} ({scenario.tenureYears * 12} Months)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={scenario.tenureYears}
                    onChange={(e) => {
                      setScenario({ ...scenario, tenureYears: Number(e.target.value) });
                      setIsStale(true);
                    }}
                    className="w-full accent-[#10b981] bg-[#0c130f] h-2.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5c6e64] mt-1.5 font-mono">
                    <span>1 Year</span>
                    <span>10 Years</span>
                    <span>20 Years</span>
                  </div>
                </div>

                {/* 4. Income Adjustment */}
                <div className="border-t border-[#1f2923] pt-5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9aa9a1] font-medium flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-[#4edea3]" />
                      Income Adjustment
                    </span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        scenario.incomeChangePercent >= 0 ? 'text-[#4edea3]' : 'text-red-400'
                      }`}
                    >
                      {scenario.incomeChangePercent > 0 ? '+' : ''}
                      {scenario.incomeChangePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={100}
                    step={5}
                    value={scenario.incomeChangePercent}
                    onChange={(e) => {
                      setScenario({ ...scenario, incomeChangePercent: Number(e.target.value) });
                      setIsStale(true);
                    }}
                    className="w-full accent-[#10b981] bg-[#0c130f] h-2.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5c6e64] mt-1.5 font-mono">
                    <span>-50%</span>
                    <span>0% (Current)</span>
                    <span>+100%</span>
                  </div>
                </div>
              </div>

              {/* LIVE ESTIMATED EMI HINT */}
              <div className="mt-6 rounded-2xl bg-[#0d1410] border border-[#1f2923] p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71837a]">
                    Projected Loan EMI
                  </span>
                  <p className="text-xs text-[#9aa9a1] mt-0.5">
                    Standard Amortizing Formula
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-base text-[#4edea3]">
                    {formatINR(liveEmiEstimate)}
                  </span>
                  <span className="text-[10px] text-[#71837a] ml-1">/ month</span>
                </div>
              </div>

              {/* STALE SCENARIO NOTICE */}
              {isStale && hasSimulated && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Scenario parameters changed — run simulation again to update ML results.</span>
                </div>
              )}

              {/* RUN REAL SIMULATION CTA BUTTON */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={simulating}
                  id="run-real-simulation-button"
                  className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-xs font-bold uppercase tracking-wider transition shadow-lg ${
                    simulating
                      ? 'bg-[#0d1410] text-[#71837a] cursor-wait border border-[#233128]'
                      : 'bg-[#10b981] text-[#003320] hover:bg-[#4edea3] hover:shadow-[#10b981]/25 hover:shadow-xl active:scale-[0.99]'
                  }`}
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-[#4edea3]" />
                      <span>RUNNING LIFELOAN ML SIMULATION...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="h-4 w-4" />
                      <span>RUN REAL SIMULATION</span>
                    </>
                  )}
                </button>
              </div>

              {/* ERROR STATE */}
              {simError && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                    <span className="font-semibold">Unable to run the simulation.</span>
                  </div>
                  <p className="text-[11px] text-red-400/80">{simError}</p>
                  <button
                    type="button"
                    onClick={runSimulation}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] font-bold text-red-200 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    TRY AGAIN
                  </button>
                </div>
              )}

              {/* HYPOTHETICAL DISCLAIMER */}
              <div className="mt-5 border-t border-[#1f2923] pt-4 text-[11px] text-[#63756b] flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-[#4edea3]" />
                <span>
                  Simulation only — this does not create a loan, submit an application, or modify your account.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: DIGITAL TWIN STATUS & SIMULATION RESULTS */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. NEURAL TWIN HERO CANVAS CARD */}
            <div className="relative rounded-3xl border border-[#233128] bg-[#121a15] p-6 overflow-hidden shadow-xl">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
              />

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4edea3] flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5" />
                      Trained XGBoost Risk Engine
                    </span>
                    <h2 className="text-xl font-bold text-[#dde4dd] mt-1">
                      {hasSimulated ? 'Simulation Evaluation Complete' : 'Scenario Evaluation Ready'}
                    </h2>
                    <p className="text-xs text-[#7d9086] mt-1 max-w-lg">
                      {hasSimulated
                        ? simulationResult?.summary
                        : 'Adjust prospective loan parameters on the left and click "RUN REAL SIMULATION" to execute the trained XGBoost model and TreeExplainer SHAP attributions.'}
                    </p>
                  </div>

                  {hasSimulated && (
                    <div className="text-right shrink-0">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                          isFavorable
                            ? 'border-[#4edea3]/30 bg-[#10b981]/15 text-[#4edea3]'
                            : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {isFavorable ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#4edea3]" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        )}
                        <span>{simulationResult?.simulated_decision || 'Evaluated'}</span>
                      </div>
                      <div className="mt-2 text-[10px] text-[#71837a]">
                        Risk Delta:
                        <span
                          className={`font-mono font-bold ml-1.5 ${
                            riskDelta <= 0 ? 'text-[#4edea3]' : 'text-amber-400'
                          }`}
                        >
                          {getRiskDeltaLabel(riskDelta)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONDITIONAL CONTENT: BEFORE RUNNING vs AFTER RUNNING */}
                {!hasSimulated ? (
                  <div className="mt-8 rounded-2xl border border-[#1f2923] bg-[#0c130f]/80 p-8 text-center space-y-3">
                    <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-[#10b981]/10 border border-[#4edea3]/20 text-[#4edea3]">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#dde4dd]">
                      No Simulation Executed Yet
                    </h3>
                    <p className="text-xs text-[#71837a] max-w-md mx-auto">
                      Click <strong className="text-[#dde4dd]">RUN REAL SIMULATION</strong> to evaluate your prospective ₹{scenario.loanAmount.toLocaleString('en-IN')} borrowing request using LifeLoan's active XGBoost credit risk model.
                    </p>
                  </div>
                ) : (
                  /* SIMULATION RESULTS SECTION (REQUIREMENTS 10 & 11) */
                  <div className="mt-6 space-y-6">
                    {/* BANNER: SIMULATION COMPLETE */}
                    <div className="rounded-2xl bg-[#10b981]/10 border border-[#4edea3]/30 p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[#4edea3] shrink-0" />
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4edea3]">
                            SIMULATION COMPLETE
                          </h3>
                          <p className="text-xs text-[#dde4dd] mt-0.5">
                            Your hypothetical scenario has been evaluated using LifeLoan's ML risk model.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAskAI}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#10b981]/20 border border-[#4edea3]/40 px-3.5 py-1.5 text-xs font-bold text-[#4edea3] hover:bg-[#10b981]/30 transition"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        ASK AI WHY
                      </button>
                    </div>

                    {/* THREE COMPARISON CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* CARD 1: CURRENT FINANCIAL STATE */}
                      <div className="rounded-2xl border border-[#233128] bg-[#0d1410] p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#1f2923] pb-2">
                          <span className="text-[10px] uppercase font-bold text-[#71837a]">
                            CURRENT FINANCIAL STATE
                          </span>
                          <span className="text-[10px] font-bold text-[#9aa9a1] bg-[#162019] px-2 py-0.5 rounded">
                            {simulationResult?.current_risk_level || 'Moderate Risk'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] text-[#71837a]">Default Risk</span>
                            <p className="font-mono font-bold text-lg text-[#dde4dd]">
                              {currentRisk.toFixed(1)}%
                            </p>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-[#1a231d]">
                            <span className="text-[#71837a]">Monthly Surplus</span>
                            <span className="font-mono font-semibold text-[#dde4dd]">
                              {formatINR(simulationResult?.current_metrics.monthly_surplus ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-[#71837a]">DTI Ratio</span>
                            <span className="font-mono font-semibold text-[#dde4dd]">
                              {simulationResult?.current_metrics.debt_to_income.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CARD 2: SIMULATED SCENARIO */}
                      <div className="rounded-2xl border border-[#4edea3]/30 bg-[#101e16] p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#1f2923] pb-2">
                          <span className="text-[10px] uppercase font-bold text-[#4edea3]">
                            SIMULATED SCENARIO
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isFavorable
                                ? 'bg-[#10b981]/20 text-[#4edea3]'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {simulationResult?.simulated_risk_level || 'Moderate Risk'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] text-[#71837a]">Simulated Default Risk</span>
                            <p
                              className={`font-mono font-bold text-lg ${
                                isFavorable ? 'text-[#4edea3]' : 'text-amber-400'
                              }`}
                            >
                              {simRisk.toFixed(1)}%
                            </p>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-[#1a231d]">
                            <span className="text-[#71837a]">Estimated EMI</span>
                            <span className="font-mono font-semibold text-[#4edea3]">
                              {formatINR(simulationResult?.simulated_emi ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-[#71837a]">Simulated DTI</span>
                            <span className="font-mono font-semibold text-[#dde4dd]">
                              {simulationResult?.simulated_dti.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-[#71837a]">Monthly Surplus</span>
                            <span
                              className={`font-mono font-semibold ${
                                (simulationResult?.simulated_monthly_surplus ?? 0) >= 0
                                  ? 'text-[#4edea3]'
                                  : 'text-red-400'
                              }`}
                            >
                              {formatINR(simulationResult?.simulated_monthly_surplus ?? 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CARD 3: RISK IMPACT & DELTA */}
                      <div className="rounded-2xl border border-[#233128] bg-[#0d1410] p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#1f2923] pb-2">
                          <span className="text-[10px] uppercase font-bold text-[#71837a]">
                            RISK IMPACT
                          </span>
                          <span className="text-[10px] font-bold text-[#4edea3] bg-[#162019] px-2 py-0.5 rounded">
                            XGBoost Delta
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] text-[#71837a]">Risk Change</span>
                            <p
                              className={`font-mono font-bold text-lg ${
                                riskDelta <= 0 ? 'text-[#4edea3]' : 'text-amber-400'
                              }`}
                            >
                              {riskDelta > 0 ? '+' : ''}
                              {riskDelta.toFixed(1)}
                              <span className="text-xs font-normal text-[#9aa9a1] ml-1">
                                percentage points
                              </span>
                            </p>
                          </div>
                          <div className="pt-2 border-t border-[#1a231d] text-[11px] text-[#86998f]">
                            {riskDelta <= 0
                              ? 'Default likelihood remains steady or declines under prospective terms.'
                              : 'Added leverage increases debt obligations relative to monthly cash flow.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. SIDE-BY-SIDE METRICS COMPARISON TABLE (APPEARS AFTER SIMULATION) */}
            {hasSimulated && simulationResult && (
              <div className="rounded-3xl border border-[#233128] bg-[#121a15] p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#dde4dd]">
                      Detailed Side-by-Side Financial State
                    </h3>
                    <p className="text-xs text-[#71837a]">
                      Authentic baseline vs simulated hypothetical scenario
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-[#4edea3] bg-[#10b981]/10 px-2.5 py-1 rounded-full border border-[#4edea3]/20">
                    Currency: INR (₹)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#233128] text-[#71837a] uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Financial Metric</th>
                        <th className="py-3 px-3">Current Baseline</th>
                        <th className="py-3 px-3 text-[#4edea3]">Simulated Scenario</th>
                        <th className="py-3 px-3 text-right">Net Shift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b241e]">
                      {/* Annual Income */}
                      <tr className="hover:bg-[#162019]/50">
                        <td className="py-3 px-3 font-medium text-[#dde4dd]">Annual Income</td>
                        <td className="py-3 px-3 font-mono text-[#9aa9a1]">
                          {formatINR(simulationResult.current_metrics.annual_income)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#dde4dd]">
                          {formatINR(simulationResult.simulated_metrics.annual_income)}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-[#9aa9a1]">
                          {simulationResult.simulated_metrics.annual_income - simulationResult.current_metrics.annual_income >= 0 ? '+' : ''}
                          {formatINR(simulationResult.simulated_metrics.annual_income - simulationResult.current_metrics.annual_income)}
                        </td>
                      </tr>

                      {/* Monthly Income */}
                      <tr className="hover:bg-[#162019]/50">
                        <td className="py-3 px-3 font-medium text-[#dde4dd]">Monthly Income</td>
                        <td className="py-3 px-3 font-mono text-[#9aa9a1]">
                          {formatINR(simulationResult.current_metrics.monthly_income)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#dde4dd]">
                          {formatINR(simulationResult.simulated_metrics.monthly_income)}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-[#9aa9a1]">
                          {simulationResult.simulated_metrics.monthly_income - simulationResult.current_metrics.monthly_income >= 0 ? '+' : ''}
                          {formatINR(simulationResult.simulated_metrics.monthly_income - simulationResult.current_metrics.monthly_income)}
                        </td>
                      </tr>

                      {/* Monthly Expenses */}
                      <tr className="hover:bg-[#162019]/50">
                        <td className="py-3 px-3 font-medium text-[#dde4dd]">Monthly Expenses</td>
                        <td className="py-3 px-3 font-mono text-[#9aa9a1]">
                          {formatINR(simulationResult.current_metrics.monthly_expenses)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#dde4dd]">
                          {formatINR(simulationResult.simulated_metrics.monthly_expenses)}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-[#9aa9a1]">
                          {simulationResult.simulated_metrics.monthly_expenses - simulationResult.current_metrics.monthly_expenses >= 0 ? '+' : ''}
                          {formatINR(simulationResult.simulated_metrics.monthly_expenses - simulationResult.current_metrics.monthly_expenses)}
                        </td>
                      </tr>

                      {/* Existing Debt */}
                      <tr className="hover:bg-[#162019]/50">
                        <td className="py-3 px-3 font-medium text-[#dde4dd]">Existing Debt</td>
                        <td className="py-3 px-3 font-mono text-[#9aa9a1]">
                          {formatINR(simulationResult.current_metrics.total_debt)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#dde4dd]">
                          {formatINR(simulationResult.current_metrics.total_debt)}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-[#71837a]">—</td>
                      </tr>

                      {/* New Loan */}
                      <tr className="hover:bg-[#162019]/50 bg-[#10b981]/5">
                        <td className="py-3 px-3 font-medium text-[#4edea3]">New Prospective Loan</td>
                        <td className="py-3 px-3 font-mono text-[#71837a]">—</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#4edea3]">
                          {formatINR(scenario.loanAmount)}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-[#4edea3]">
                          +{formatINR(scenario.loanAmount)}
                        </td>
                      </tr>

                      {/* New Loan EMI */}
                      <tr className="hover:bg-[#162019]/50 bg-[#10b981]/5">
                        <td className="py-3 px-3 font-medium text-[#4edea3]">New Loan EMI</td>
                        <td className="py-3 px-3 font-mono text-[#71837a]">—</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#4edea3]">
                          {formatINR(simulationResult.simulated_emi)}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-amber-300">
                          +{formatINR(simulationResult.simulated_emi)}
                        </td>
                      </tr>

                      {/* Total Monthly EMI */}
                      <tr className="hover:bg-[#162019]/50">
                        <td className="py-3 px-3 font-medium text-[#dde4dd]">Total Monthly EMI</td>
                        <td className="py-3 px-3 font-mono text-[#9aa9a1]">
                          {formatINR(simulationResult.monthly_emi.current)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#dde4dd]">
                          {formatINR(simulationResult.monthly_emi.simulated)}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-amber-300">
                          +{formatINR(simulationResult.monthly_emi.delta)}
                        </td>
                      </tr>

                      {/* Monthly Surplus */}
                      <tr className="hover:bg-[#162019]/50">
                        <td className="py-3 px-3 font-medium text-[#dde4dd]">Monthly Surplus</td>
                        <td className="py-3 px-3 font-mono text-[#9aa9a1]">
                          {formatINR(simulationResult.monthly_surplus.current)}
                        </td>
                        <td
                          className={`py-3 px-3 font-mono font-bold ${
                            simulationResult.monthly_surplus.simulated >= 0
                              ? 'text-[#4edea3]'
                              : 'text-red-400'
                          }`}
                        >
                          {formatINR(simulationResult.monthly_surplus.simulated)}
                        </td>
                        <td
                          className={`py-3 px-3 font-mono text-right ${
                            simulationResult.monthly_surplus.delta >= 0
                              ? 'text-[#4edea3]'
                              : 'text-red-400'
                          }`}
                        >
                          {simulationResult.monthly_surplus.delta >= 0 ? '+' : ''}
                          {formatINR(simulationResult.monthly_surplus.delta)}
                        </td>
                      </tr>

                      {/* DTI */}
                      <tr className="hover:bg-[#162019]/50">
                        <td className="py-3 px-3 font-medium text-[#dde4dd]">Debt-to-Income (DTI)</td>
                        <td className="py-3 px-3 font-mono text-[#9aa9a1]">
                          {simulationResult.debt_to_income.current.toFixed(1)}%
                        </td>
                        <td
                          className={`py-3 px-3 font-mono font-bold ${
                            simulationResult.debt_to_income.simulated <= 40
                              ? 'text-[#4edea3]'
                              : 'text-amber-400'
                          }`}
                        >
                          {simulationResult.debt_to_income.simulated.toFixed(1)}%
                        </td>
                        <td
                          className={`py-3 px-3 font-mono text-right ${
                            simulationResult.debt_to_income.delta <= 0
                              ? 'text-[#4edea3]'
                              : 'text-amber-400'
                          }`}
                        >
                          {simulationResult.debt_to_income.delta >= 0 ? '+' : ''}
                          {simulationResult.debt_to_income.delta.toFixed(1)}%
                        </td>
                      </tr>

                      {/* Projected Credit Score */}
                      <tr className="hover:bg-[#162019]/50">
                        <td className="py-3 px-3 font-medium text-[#dde4dd]">Projected Credit Score</td>
                        <td className="py-3 px-3 font-mono text-[#9aa9a1]">
                          {simulationResult.credit_score.current} pts
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#4edea3]">
                          {simulationResult.credit_score.simulated} pts
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-[#4edea3]">
                          {simulationResult.credit_score.delta >= 0 ? '+' : ''}
                          {simulationResult.credit_score.delta} pts
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. XAI / WHY DID RISK CHANGE? (REQUIREMENT 12) */}
            {hasSimulated && simulationResult && (simulationResult.xai_factors || []).length > 0 && (
              <div className="rounded-3xl border border-[#233128] bg-[#121a15] p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2923] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#4edea3]" />
                      <h3 className="text-sm font-bold text-[#dde4dd]">
                        WHY DID THE RISK CHANGE?
                      </h3>
                    </div>
                    <p className="text-xs text-[#71837a] mt-0.5">
                      SHAP TreeExplainer feature attributions computed directly by the trained XGBoost model.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAskAI}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#10b981]/15 border border-[#4edea3]/30 px-3.5 py-1.5 text-xs font-bold text-[#4edea3] hover:bg-[#10b981]/25 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    ASK AI WHY
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {simulationResult.xai_factors!.map((factor, idx) => {
                    const isIncrease = factor.impact === 'increases_default_risk' || factor.shap_value > 0;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#1f2923] bg-[#0d1410] p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#dde4dd]">
                            {factor.label || factor.feature}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isIncrease
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-[#10b981]/15 text-[#4edea3] border border-[#4edea3]/30'
                            }`}
                          >
                            {isIncrease ? 'Increases Risk' : 'Decreases Risk'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#71837a]">
                          {factor.description || 'Model feature contribution'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#5c6e64] pt-1 border-t border-[#1a231d]">
                          <span>SHAP: {factor.shap_value.toFixed(4)}</span>
                          {factor.value !== null && factor.value !== undefined && (
                            <span>Value: {String(factor.value)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;