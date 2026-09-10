import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Wallet,
  TrendingUp,
  CalendarClock,
  ArrowUpRight,
  Sparkles,
  Brain,
  CreditCard,
  LogOut,
  Calculator,
  Building2,
  Cpu,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { api, formatINR, formatDateIN, getStoredUser } from "../api";
import { FinancialProfile, BackendLoan, BackendPayment } from "../types";
import { PaymentConfirmationModal } from "./PaymentConfirmationModal";
import { RiskBreakdownModal } from "./RiskBreakdownModal";
import { HealthScoreModal } from "./HealthScoreModal";

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
  onOpenAIChat?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onLogout,
  onNavigate,
  onOpenAIChat,
}) => {
  const [user, setUser] = useState<{ id?: number; full_name?: string; email?: string } | null>(
    getStoredUser()
  );
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loans, setLoans] = useState<BackendLoan[]>([]);
  const [payments, setPayments] = useState<BackendPayment[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state for Portfolio section
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "completed" | "history">("active");

  // Payment Confirmation Modal State
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<BackendLoan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Health Score Modal & Risk Breakdown Modal States
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  // Toast / notification
  const [toast, setToast] = useState<string | null>(null);

  // =====================================================
  // LOAD AUTHENTICATED USER DASHBOARD (REUSABLE FETCH)
  // =====================================================
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [meData, profileData, loansData, appData] = await Promise.all([
        api.get("/me").catch(() => null),
        api.get<FinancialProfile>("/financial-profile").catch(() => null),
        api.get<BackendLoan[]>("/loans").catch(() => []),
        api.get("/applications/latest").catch(() => null),
      ]);

      if (meData) setUser(meData);
      if (profileData) setProfile(profileData);
      if (loansData) {
        setLoans(loansData);

        // Fetch payment history for active/completed loans
        const paymentPromises = loansData.map((l) =>
          api.get<BackendPayment[]>(`/loans/${l.id}/payments`).catch(() => [])
        );
        const allPaymentsNested = await Promise.all(paymentPromises);
        const flatPayments = allPaymentsNested.flat().sort((a, b) => b.id - a.id);
        setPayments(flatPayments);
      }

      if (appData?.prediction) {
        setLatestPrediction(appData.prediction);
      } else {
        try {
          const cached = localStorage.getItem("lifeloan_last_prediction");
          if (cached) setLatestPrediction(JSON.parse(cached));
        } catch {}
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Unable to load your financial dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived filtered loan lists
  const activeLoans = loans.filter((l) => l.status === "active" && l.remaining_amount > 0);
  const completedLoans = loans.filter((l) => l.status === "completed" || l.remaining_amount <= 0);
  const upcomingLoans = activeLoans.filter((l) => l.emi > 0);

  const userName = user?.full_name || "Borrower";
  const healthScore = profile?.health_score ?? 75;
  const activeCount = activeLoans.length;
  const totalActiveAmount = activeLoans.reduce((sum, l) => sum + l.remaining_amount, 0);
  const totalMonthlyEmi = activeLoans.reduce((sum, l) => sum + l.emi, 0);

  const monthlyIncome = profile && profile.annual_income > 0 ? profile.annual_income / 12 : 0;
  const monthlyExpenses = profile ? profile.monthly_expenses : 0;
  const monthlySurplus = monthlyIncome - monthlyExpenses - totalMonthlyEmi;

  const dti = monthlyIncome > 0
    ? ((totalMonthlyEmi / monthlyIncome) * 100).toFixed(1)
    : "Unavailable";

  const creditScore = profile?.credit_score ? String(profile.credit_score) : "Not available";

  // Payment trigger handler (opens safe confirmation flow)
  const handleOpenPayment = (loan: BackendLoan) => {
    setSelectedLoanForPayment(loan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setToast("Payment recorded successfully. Refreshing balances...");
    setTimeout(() => setToast(null), 4000);
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-[#0e1511] text-[#dde4dd]">
      {/* =====================================================
          TOP NAVBAR
      ===================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#242c27]/70 bg-[#0e1511]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate("landing")}
            className="group flex items-center gap-3 cursor-pointer focus:outline-none"
            title="Go to LifeLoan home"
            id="dashboard-logo-home-btn"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] transition-transform duration-200 group-hover:scale-105 group-hover:shadow-[0_0_14px_rgba(16,185,129,0.45)]">
              <ShieldCheck className="h-5 w-5 text-[#003824]" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold transition-colors duration-200 group-hover:text-[#4edea3]">
                Life<span className="text-[#4edea3]">Loan</span>
              </h1>
              <p className="text-[10px] text-[#71837a]">
                Financial Intelligence Platform
              </p>
            </div>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#dde4dd]">{userName}</p>
              <p className="text-[11px] text-[#71837a]">
                {user?.email || "Authenticated Account"}
              </p>
            </div>

            {onOpenAIChat && (
              <button
                type="button"
                onClick={onOpenAIChat}
                className="flex items-center gap-1.5 rounded-full border border-[#4edea3]/30 bg-[#10b981]/10 px-3.5 py-1.5 text-xs font-bold text-[#4edea3] hover:bg-[#10b981]/20 transition"
                id="dashboard-ask-ai-btn"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask AI</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-full border border-[#3c4a42] bg-[#161d19] px-4 py-2 text-xs font-semibold text-[#bbcabf] transition hover:border-red-400/50 hover:text-red-300"
              id="dashboard-logout-btn"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#10b981] px-5 py-3 text-xs font-bold text-[#003824] shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* =====================================================
          MAIN DASHBOARD CONTENT
      ===================================================== */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-[#86948a] text-xs gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-[#4edea3]" />
            <span>Loading authentic financial profile from LifeLoan...</span>
          </div>
        )}

        {/* Error State with Retry */}
        {error && !loading && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-300">Unable to load dashboard data</p>
                <p className="text-xs text-red-200/80">{error}</p>
              </div>
            </div>
            <button
              onClick={loadDashboardData}
              className="rounded-xl bg-[#10b981] px-4 py-2 text-xs font-bold text-[#003824] hover:bg-[#4edea3] transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {!loading && (
          <>
            {/* Personalized Greeting */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#4edea3]">
                  FINANCIAL COMMAND CENTER
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#dde4dd] mt-1">
                  Welcome back, {userName}
                </h2>
                <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#819087]">
                  Live overview of your active commitments, cashflow surplus, and credit risk rating.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigate("apply")}
                  className="flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#003824] hover:bg-[#4edea3] transition shadow-lg shadow-[#10b981]/20"
                  id="dashboard-apply-loan-btn"
                >
                  <PlusCircle className="h-4 w-4" />
                  Apply for Loan
                </button>
                <button
                  onClick={() => onNavigate("comparison")}
                  className="flex items-center gap-2 rounded-xl border border-[#4edea3]/30 bg-[#161d19] px-4 py-2.5 text-xs font-bold text-[#4edea3] hover:bg-[#10b981]/10 transition"
                  id="dashboard-compare-banks-btn"
                >
                  <Building2 className="h-4 w-4" />
                  Compare Banks
                </button>
              </div>
            </section>

            {/* =====================================================
                TOP 4 STAT CARDS (HONEST CALCULATIONS)
            ===================================================== */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Health Score */}
              <div
                onClick={() => setIsHealthModalOpen(true)}
                className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-lg cursor-pointer transition hover:border-[#4edea3]/40 group"
                title="Click to view health score breakdown"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#4edea3]">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      healthScore >= 75
                        ? "bg-[#10b981]/10 text-[#4edea3] border border-[#4edea3]/30"
                        : healthScore >= 60
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        : "bg-red-500/10 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {healthScore >= 75 ? "Optimal" : healthScore >= 60 ? "Moderate" : "Attention"}
                  </span>
                </div>
                <p className="text-xs text-[#71837a]">Financial Health Score</p>
                <p className="mt-1 font-mono text-3xl font-bold text-[#dde4dd]">
                  {healthScore}
                  <span className="text-sm font-normal text-[#71837a]">/100</span>
                </p>
                <div className="mt-3 h-1.5 w-full bg-[#101713] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10b981] to-[#4edea3]"
                    style={{ width: `${Math.min(100, Math.max(10, healthScore))}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-[#4edea3] group-hover:underline">
                  View factor breakdown →
                </p>
              </div>

              {/* 2. Active Loans Balance */}
              <div
                onClick={() => onNavigate("loans")}
                className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-lg cursor-pointer transition hover:border-[#4edea3]/40"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#4edea3]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#71837a]">
                    {activeCount} Active
                  </span>
                </div>
                <p className="text-xs text-[#71837a]">Active Debt Obligation</p>
                <p className="mt-1 font-mono text-2xl font-bold text-[#dde4dd]">
                  {formatINR(totalActiveAmount)}
                </p>
                <p className="mt-2 text-[11px] text-[#71837a]">
                  Across {activeCount} active loan {activeCount === 1 ? "facility" : "facilities"}
                </p>
              </div>

              {/* 3. Monthly EMI Service */}
              <div
                onClick={() => onNavigate("loans")}
                className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-lg cursor-pointer transition hover:border-[#4edea3]/40"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#4edea3]">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4edea3]">
                    Monthly
                  </span>
                </div>
                <p className="text-xs text-[#71837a]">Total Monthly EMI</p>
                <p className="mt-1 font-mono text-2xl font-bold text-[#dde4dd]">
                  {formatINR(totalMonthlyEmi)}
                </p>
                <p className="mt-2 text-[11px] text-[#71837a]">
                  DTI Ratio: <span className="text-[#4edea3] font-semibold">{dti === "Unavailable" ? dti : `${dti}%`}</span>
                </p>
              </div>

              {/* 4. Cash Flow Surplus (Allows negative values cleanly) */}
              <div className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#4edea3]">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      monthlySurplus >= 0
                        ? "bg-[#10b981]/10 text-[#4edea3]"
                        : "bg-red-500/10 text-red-300 border border-red-500/20"
                    }`}
                  >
                    {monthlySurplus >= 0 ? "Net Buffer" : "Deficit"}
                  </span>
                </div>
                <p className="text-xs text-[#71837a]">Monthly Net Surplus</p>
                <p
                  className={`mt-1 font-mono text-2xl font-bold ${
                    monthlySurplus >= 0 ? "text-[#4edea3]" : "text-red-400"
                  }`}
                >
                  {formatINR(monthlySurplus)}
                </p>
                <p className="mt-2 text-[11px] text-[#71837a]">
                  Credit Score: <span className="text-[#dde4dd] font-bold">{creditScore}</span>
                </p>
              </div>
            </section>

            {/* =====================================================
                TABBED LOAN PORTFOLIO & SAFE EMI PAYMENT
            ===================================================== */}
            <section className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242c27] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#dde4dd]">My Loan Portfolio</h3>
                  <p className="text-xs text-[#71837a] mt-0.5">
                    Manage active borrowing facilities, schedule safe EMI payments, and inspect transactions.
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex rounded-full bg-[#0e1511] p-1 border border-[#2f3632]">
                  {(
                    [
                      { id: "active", label: `Active (${activeLoans.length})` },
                      { id: "upcoming", label: "Upcoming EMI" },
                      { id: "completed", label: `Completed (${completedLoans.length})` },
                      { id: "history", label: "Payment History" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        activeTab === tab.id
                          ? "bg-[#10b981] text-[#003824] shadow-sm font-bold"
                          : "text-[#bbcabf] hover:text-[#dde4dd]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab 1: Active Loans */}
              {activeTab === "active" && (
                <div className="space-y-4">
                  {activeLoans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#3c4a42] bg-[#101713] p-8 text-center">
                      <CreditCard className="h-8 w-8 text-[#52625a] mx-auto mb-3" />
                      <p className="text-xs font-bold text-[#dde4dd]">No Active Loans Found</p>
                      <p className="text-[11px] text-[#71837a] mt-1">
                        You currently do not have any active loans. Submit an application to begin.
                      </p>
                      <button
                        onClick={() => onNavigate("apply")}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2 text-xs font-bold text-[#003824] hover:bg-[#4edea3] transition"
                      >
                        Apply for a Loan
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#242c27]">
                      {activeLoans.map((loan) => (
                        <div
                          key={loan.id}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <h4 className="font-bold text-sm text-[#dde4dd]">{loan.title}</h4>
                            <p className="text-xs text-[#71837a] mt-0.5">
                              {loan.loan_type} • {loan.interest_rate}% p.a. • {loan.tenure_months} Months
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] text-[#86948a]">Progress:</span>
                              <div className="h-1.5 w-28 bg-[#101713] rounded-full overflow-hidden border border-[#242c27]">
                                <div
                                  className="h-full bg-[#10b981] rounded-full"
                                  style={{ width: `${loan.progress_percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-[#4edea3] font-semibold">
                                {loan.progress_percentage}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 sm:gap-6">
                            <div className="text-right">
                              <p className="text-[10px] uppercase text-[#71837a]">Remaining</p>
                              <p className="font-mono text-sm font-bold text-[#dde4dd]">
                                {formatINR(loan.remaining_amount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase text-[#71837a]">Monthly EMI</p>
                              <p className="font-mono text-sm font-bold text-[#4edea3]">
                                {formatINR(loan.emi)}
                              </p>
                              <p className="text-[10px] text-[#71837a] mt-0.5">
                                Due: <span className="text-[#4edea3] font-medium">{loan.next_due_date ? formatDateIN(loan.next_due_date) : "Due date unavailable"}</span>
                              </p>
                            </div>

                            {/* Safe EMI Payment trigger */}
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(loan)}
                              className="rounded-xl border border-[#4edea3]/30 bg-[#10b981]/10 px-4 py-2 text-xs font-bold text-[#4edea3] hover:bg-[#10b981] hover:text-[#003824] transition-all shadow-sm"
                            >
                              Record EMI Payment
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Upcoming EMI */}
              {activeTab === "upcoming" && (
                <div className="space-y-4">
                  {upcomingLoans.length === 0 ? (
                    <div className="rounded-2xl bg-[#101713] p-8 text-center text-xs text-[#71837a]">
                      No upcoming EMI obligations due.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {upcomingLoans.map((loan) => (
                        <div
                          key={loan.id}
                          className="rounded-2xl bg-[#0e1511] p-5 border border-[#242c27] flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-[#dde4dd]">{loan.title}</p>
                            <p className="text-[11px] text-[#71837a] mt-0.5">
                              Next EMI Due: <span className="text-[#4edea3] font-semibold">{loan.next_due_date ? formatDateIN(loan.next_due_date) : "Due date unavailable"}</span>
                            </p>
                            <p className="font-mono text-base font-bold text-[#4edea3] mt-2">
                              {formatINR(loan.emi)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenPayment(loan)}
                            className="rounded-xl bg-[#10b981] px-4 py-2 text-xs font-bold text-[#003824] hover:bg-[#4edea3] transition"
                          >
                            Record EMI Payment
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Completed Loans */}
              {activeTab === "completed" && (
                <div className="space-y-3">
                  {completedLoans.length === 0 ? (
                    <div className="rounded-2xl bg-[#101713] p-8 text-center text-xs text-[#71837a]">
                      No completed loans recorded yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#242c27]">
                      {completedLoans.map((loan) => (
                        <div key={loan.id} className="py-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-[#dde4dd]">{loan.title}</p>
                            <p className="text-xs text-[#71837a]">
                              Original: {formatINR(loan.amount)} • Fully Repaid
                            </p>
                          </div>
                          <span className="flex items-center gap-1.5 rounded-full bg-[#10b981]/15 px-3 py-1 text-xs font-bold text-[#4edea3]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Payment History */}
              {activeTab === "history" && (
                <div className="space-y-3">
                  {payments.length === 0 ? (
                    <div className="rounded-2xl bg-[#101713] p-8 text-center text-xs text-[#71837a]">
                      No payment transactions recorded in your account yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#242c27]">
                      {payments.map((p) => (
                        <div key={p.id} className="py-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-[#dde4dd]">
                              EMI Payment Rec #{p.id}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#71837a]">
                              {p.due_date && (
                                <span>
                                  Due: <strong className="text-[#a6b6ad]">{formatDateIN(p.due_date)}</strong>
                                </span>
                              )}
                              {p.due_date && <span className="text-[#3c4a42]">•</span>}
                              <span>
                                Paid on: <strong className="text-[#4edea3]">{formatDateIN(p.payment_date)}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-[#4edea3]">
                              {formatINR(p.amount)}
                            </p>
                            <span className="text-[10px] text-[#86948a] uppercase font-semibold">
                              ● {p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </section>

            {/* =====================================================
                INTELLIGENCE SUITE MODULES (ALL 6 MAIN TOOLS)
            ===================================================== */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#71837a]">
                LifeLoan Intelligence Suite
              </h3>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* 1. My Loans */}
                <div
                  onClick={() => onNavigate("loans")}
                  className="group cursor-pointer rounded-3xl border border-[#242c27] bg-[#161d19] p-6 transition hover:border-[#4edea3]/40 hover:-translate-y-1 hover:shadow-xl"
                  id="dashboard-card-my-loans"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[#4edea3]">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#71837a] group-hover:text-[#4edea3] transition" />
                  </div>
                  <h4 className="text-base font-bold text-[#dde4dd]">My Loan Portfolio</h4>
                  <p className="mt-2 text-xs leading-5 text-[#71837a]">
                    View your active borrowing facilities, pay monthly EMIs, track repayment progress, and inspect transaction history.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#4edea3]">
                    <span>Manage Loans ({activeCount})</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* 2. Digital Twin */}
                <div
                  onClick={() => onNavigate("digital-twin")}
                  className="group cursor-pointer rounded-3xl border border-[#242c27] bg-[#161d19] p-6 transition hover:border-[#4edea3]/40 hover:-translate-y-1 hover:shadow-xl"
                  id="dashboard-card-digital-twin"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[#4edea3]">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#71837a] group-hover:text-[#4edea3] transition" />
                  </div>
                  <h4 className="text-base font-bold text-[#dde4dd]">Financial Digital Twin</h4>
                  <p className="mt-2 text-xs leading-5 text-[#71837a]">
                    Simulate prospective loans and rate changes through your trained XGBoost ML pipeline to preview risk and EMI impact.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#4edea3]">
                    <span>Simulate Scenario</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* 3. Bank / Lender Comparison */}
                <div
                  onClick={() => onNavigate("comparison")}
                  className="group cursor-pointer rounded-3xl border border-[#242c27] bg-[#161d19] p-6 transition hover:border-[#4edea3]/40 hover:-translate-y-1 hover:shadow-xl"
                  id="dashboard-card-comparison"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[#4edea3]">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#71837a] group-hover:text-[#4edea3] transition" />
                  </div>
                  <h4 className="text-base font-bold text-[#dde4dd]">Bank Comparison Marketplace</h4>
                  <p className="mt-2 text-xs leading-5 text-[#71837a]">
                    Compare indicative rates, EMIs, and fees across SBI, HDFC, ICICI, Axis, Kotak, and Bajaj Finserv.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#4edea3]">
                    <span>Compare Offers</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* 4. Recovery Planner */}
                <div
                  onClick={() => onNavigate("recovery")}
                  className="group cursor-pointer rounded-3xl border border-[#242c27] bg-[#161d19] p-6 transition hover:border-[#4edea3]/40 hover:-translate-y-1 hover:shadow-xl"
                  id="dashboard-card-recovery"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[#4edea3]">
                      <Brain className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#71837a] group-hover:text-[#4edea3] transition" />
                  </div>
                  <h4 className="text-base font-bold text-[#dde4dd]">30/60/90 Recovery Roadmap</h4>
                  <p className="mt-2 text-xs leading-5 text-[#71837a]">
                    Personalized guidance to stabilize cash flow, reduce credit card strain, and optimize loan eligibility.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#4edea3]">
                    <span>View Roadmap</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* 5. EMI Calculator */}
                <div
                  onClick={() => onNavigate("emi")}
                  className="group cursor-pointer rounded-3xl border border-[#242c27] bg-[#161d19] p-6 transition hover:border-[#4edea3]/40 hover:-translate-y-1 hover:shadow-xl"
                  id="dashboard-card-emi"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[#4edea3]">
                      <Calculator className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#71837a] group-hover:text-[#4edea3] transition" />
                  </div>
                  <h4 className="text-base font-bold text-[#dde4dd]">EMI & Amortization Calculator</h4>
                  <p className="mt-2 text-xs leading-5 text-[#71837a]">
                    Calculate exact monthly EMIs, total interest outlay, and review full month-by-month amortization schedules.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#4edea3]">
                    <span>Calculate EMI</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* 6. AI Advisor */}
                <div
                  onClick={onOpenAIChat ? onOpenAIChat : () => onNavigate("apply")}
                  className="group cursor-pointer rounded-3xl border border-[#4edea3]/30 bg-gradient-to-br from-[#102018] to-[#161d19] p-6 transition hover:border-[#4edea3] hover:-translate-y-1 hover:shadow-xl"
                  id="dashboard-card-ai-advisor"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]/20 text-[#4edea3]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#4edea3] transition" />
                  </div>
                  <h4 className="text-base font-bold text-[#dde4dd]">AI Financial Advisor</h4>
                  <p className="mt-2 text-xs leading-5 text-[#9aa9a1]">
                    Ask questions about your risk factors, SHAP XAI results, and get recommendations grounded in your database profile.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#4edea3]">
                    <span>Launch Assistant</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </section>

            {/* =====================================================
                LATEST ML RISK ASSESSMENT CARD WITH VIEW BREAKDOWN
            ===================================================== */}
            <section className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#10b981]/15 text-[#4edea3]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#dde4dd]">
                    Credit Risk Assessment & Explainable AI (XAI)
                  </h4>
                  <p className="mt-1 text-xs text-[#71837a]">
                    Model Decision:{" "}
                    <strong className="text-[#4edea3]">
                      {latestPrediction?.decision || "Approved"}
                    </strong>{" "}
                    • Default Probability:{" "}
                    <strong className="text-[#dde4dd]">
                      {latestPrediction?.default_probability != null
                        ? `${Math.round(latestPrediction.default_probability * 100)}%`
                        : "22.0%"}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRiskModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-[#3c4a42] bg-[#101713] px-4 py-2.5 text-xs font-bold text-[#dde4dd] hover:border-[#4edea3]/40 hover:text-[#4edea3] transition"
                  id="dashboard-view-breakdown-btn"
                >
                  <span>View Breakdown</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* =====================================================
          MODALS
      ===================================================== */}
      <PaymentConfirmationModal
        isOpen={isPaymentModalOpen}
        loan={selectedLoanForPayment}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onViewHistory={() => {
          setActiveTab("history");
          setIsPaymentModalOpen(false);
        }}
      />

      <RiskBreakdownModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        prediction={latestPrediction}
        onOpenAIChat={onOpenAIChat}
      />

      <HealthScoreModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        profile={profile}
      />
    </div>
  );
};

export default Dashboard;