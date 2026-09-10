import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  CalendarDays,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from "lucide-react";
import { api, formatINR, formatDateIN } from "../api";
import { PaymentConfirmationModal } from "./PaymentConfirmationModal";

interface MyLoansProps {
  onBack: () => void;
  onApplyLoan?: () => void;
  userId?: number;
}

interface LoanItem {
  id: string;
  userId: number;
  title: string;
  type: string;
  amount: number;
  remainingAmount: number;
  emi: number;
  interestRate: number;
  tenureMonths: number;
  progressPercentage: number;
  status: string;
  createdAt: string;
  nextDueDate?: string | null;
}

interface PaymentRecord {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  dueDate?: string | null;
  status: "paid" | "upcoming" | "scheduled";
  label: string;
}

interface BackendLoan {
  id: number;
  user_id: number;
  title: string;
  loan_type: string;
  amount: number;
  remaining_amount: number;
  emi: number;
  interest_rate: number;
  tenure_months: number;
  progress_percentage: number;
  status: string;
  created_at: string;
  next_due_date?: string | null;
  payments?: BackendPayment[];
}

interface BackendPayment {
  id: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  due_date?: string | null;
  status: string;
}

interface ScheduleItem {
  installment_number: number;
  due_date: string;
  amount: number;
  status: "paid" | "upcoming";
  payment_date?: string | null;
}


const MyLoans: React.FC<MyLoansProps> = ({
  onBack,
  onApplyLoan,
}) => {

  // ============================================================
  // STATE
  // ============================================================

  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<
    PaymentRecord[]
  >([]);

  const [expandedLoan, setExpandedLoan] =
    useState<string | null>(null);

  const [schedules, setSchedules] = useState<
    Record<string, ScheduleItem[]>
  >({});

  const [loadingSchedule, setLoadingSchedule] = useState<
    Record<string, boolean>
  >({});

  const [loading, setLoading] = useState(true);

  const [paymentLoading, setPaymentLoading] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [selectedLoanForPayment, setSelectedLoanForPayment] =
    useState<LoanItem | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] =
    useState(false);

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date: string) => {
    if (!date) {
      return "Date unavailable";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // MAP BACKEND LOAN → FRONTEND LOAN
  // ============================================================

  const mapLoan = (
    loan: BackendLoan
  ): LoanItem => {
    return {
      id: String(loan.id),

      userId: loan.user_id,

      title: loan.title,

      type: loan.loan_type,

      amount: Number(loan.amount),

      remainingAmount: Number(
        loan.remaining_amount
      ),

      emi: Number(loan.emi),

      interestRate: Number(
        loan.interest_rate
      ),

      tenureMonths: Number(
        loan.tenure_months
      ),

      progressPercentage: Number(
        loan.progress_percentage
      ),

      status: loan.status,

      createdAt: loan.created_at,

      nextDueDate: loan.next_due_date || null,
    };
  };

  // ============================================================
  // LOAD LOANS
  // ============================================================

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get<BackendLoan[]>("/loans");
      const mappedLoans = data.map(mapLoan);
      setLoans(mappedLoans);
      await loadPaymentHistory(mappedLoans);

    } catch (err: any) {
      console.error("LOAD LOANS ERROR:", err);
      setError(
        err.message || "Unable to load your loans. Please make sure the LifeLoan backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD PAYMENT HISTORY
  // ============================================================

  const loadPaymentHistory = async (
    loanList: LoanItem[]
  ) => {
    try {
      const allPayments: PaymentRecord[] = [];

      for (const loan of loanList) {
        try {
          const payments = await api.get<BackendPayment[]>(
            `/loans/${loan.id}/payments`
          );

          payments.forEach((payment) => {
            allPayments.push({
              id: String(payment.id),
              loanId: String(payment.loan_id),
              amount: Number(payment.amount),
              date: formatDateIN(payment.payment_date),
              dueDate: payment.due_date ? formatDateIN(payment.due_date) : null,
              status: payment.status === "paid" ? "paid" : "scheduled",
              label: payment.status === "paid" ? "EMI payment" : "Scheduled EMI",
            });
          });


        } catch (paymentError) {
          console.warn(
            `Could not load payments for loan ${loan.id}:`,
            paymentError
          );
        }
      }

      setPaymentHistory(allPayments);

    } catch (err) {
      console.error(
        "PAYMENT HISTORY ERROR:",
        err
      );
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadLoans();
  }, []);

  // ============================================================
  // FILTER LOANS
  // ============================================================

  const activeLoans = loans.filter(
    (loan) =>
      loan.status !== "completed" &&
      loan.remainingAmount > 0
  );

  const completedLoans = loans.filter(
    (loan) =>
      loan.status === "completed" ||
      loan.remainingAmount <= 0
  );

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalRemaining = activeLoans.reduce(
    (total, loan) =>
      total +
      Math.max(
        0,
        loan.remainingAmount
      ),
    0
  );

  const totalEmi = activeLoans.reduce(
    (total, loan) =>
      total + loan.emi,
    0
  );

  // ============================================================
  // UPCOMING EMI
  // ============================================================

  const nextLoan =
    activeLoans.length > 0
      ? activeLoans[0]
      : null;

  // ============================================================
  // LOAD SCHEDULE
  // ============================================================

  const loadSchedule = async (loanId: string) => {
    try {
      setLoadingSchedule((prev) => ({ ...prev, [loanId]: true }));
      const data = await api.get<ScheduleItem[]>(`/loans/${loanId}/schedule`);
      setSchedules((prev) => ({ ...prev, [loanId]: data }));
    } catch (err) {
      console.error(`Error loading schedule for loan ${loanId}:`, err);
    } finally {
      setLoadingSchedule((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  // ============================================================
  // TOGGLE LOAN
  // ============================================================

  const toggleLoan = (
    loanId: string
  ) => {
    setExpandedLoan((current) => {
      const nextVal = current === loanId ? null : loanId;
      if (nextVal) {
        loadSchedule(loanId);
      }
      return nextVal;
    });
  };

  // ============================================================
  // GET LOAN HISTORY
  // ============================================================

  const getLoanHistory = (
    loanId: string
  ) => {
    return paymentHistory.filter(
      (payment) =>
        payment.loanId === loanId
    );
  };

  // ============================================================
  // PAY EMI (SAFE 2-STEP CONFIRMATION FLOW)
  // ============================================================

  const handlePayEmi = (
    loan: LoanItem
  ) => {
    setSelectedLoanForPayment(loan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    await loadLoans();
    if (selectedLoanForPayment) {
      await loadSchedule(selectedLoanForPayment.id);
    }
  };

  // ============================================================
  // STATUS ICON
  // ============================================================

  const PaymentStatusIcon = ({
    status,
  }: {
    status: PaymentRecord["status"];
  }) => {
    if (status === "paid") {
      return (
        <CheckCircle2 className="h-4 w-4 text-[#4edea3]" />
      );
    }

    if (status === "upcoming") {
      return (
        <Clock3 className="h-4 w-4 text-[#4edea3]" />
      );
    }

    return (
      <CalendarDays className="h-4 w-4 text-[#71837a]" />
    );
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1511] text-[#dde4dd]">

        <header className="sticky top-0 z-50 border-b border-[#242c27]/70 bg-[#0e1511]/90 backdrop-blur-xl">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-[#9aa9a1] transition hover:text-[#4edea3]"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to Dashboard
            </button>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857]">

                <CreditCard className="h-4 w-4 text-[#003824]" />

              </div>

              <span className="font-serif text-xl font-bold">
                Life
                <span className="text-[#4edea3]">
                  Loan
                </span>
              </span>

            </div>

            <div className="w-[130px]" />

          </div>

        </header>

        <main className="mx-auto max-w-7xl px-6 py-20">

          <div className="flex items-center justify-center">

            <div className="text-center">

              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#242c27] border-t-[#4edea3]" />

              <p className="text-sm text-[#71837a]">
                Loading your loans...
              </p>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0e1511] text-[#dde4dd]">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#242c27]/70 bg-[#0e1511]/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#9aa9a1] transition hover:text-[#4edea3]"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857]">

              <CreditCard className="h-4 w-4 text-[#003824]" />

            </div>

            <span className="font-serif text-xl font-bold">
              Life
              <span className="text-[#4edea3]">
                Loan
              </span>
            </span>

          </div>

          <div className="w-[130px]" />

        </div>

      </header>

      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ====================================================
            HEADING
            ==================================================== */}

        <section className="mb-10">

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">
            LOAN MANAGEMENT
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight">
            My Loans
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#819087]">
            Manage your active loans, monitor repayment progress,
            and keep track of your upcoming EMI payments.
          </p>

        </section>

        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (

          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <div>

              <p className="text-sm font-semibold text-red-300">
                Something went wrong
              </p>

              <p className="mt-1 text-xs leading-5 text-red-300/70">
                {error}
              </p>

            </div>

          </div>

        )}

        {/* ====================================================
            SUMMARY CARDS
            ==================================================== */}

        <section className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* ACTIVE */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <CreditCard className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="text-xs text-[#71837a]">
              Active Loans
            </p>

            <p className="mt-1 text-3xl font-bold">
              {activeLoans.length}
            </p>

          </div>

          {/* REMAINING */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <Wallet className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="text-xs text-[#71837a]">
              Total Remaining
            </p>

            <p className="mt-1 text-3xl font-bold">

              {formatCurrency(
                totalRemaining
              )}

            </p>

          </div>

          {/* EMI */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <CalendarDays className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="text-xs text-[#71837a]">
              Monthly EMI
            </p>

            <p className="mt-1 text-3xl font-bold">

              {formatCurrency(
                totalEmi
              )}

            </p>

          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <CheckCircle2 className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="text-xs text-[#71837a]">
              Completed Loans
            </p>

            <p className="mt-1 text-3xl font-bold">
              {completedLoans.length}
            </p>

          </div>

        </section>

        {/* ====================================================
            UPCOMING EMI
            ==================================================== */}

        {nextLoan && (

          <section className="mb-10 rounded-2xl border border-[#4edea3]/20 bg-[#102018] p-6 shadow-lg">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10 border border-[#10b981]/30">

                  <Clock3 className="h-5 w-5 text-[#4edea3]" />

                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4edea3]">
                    UPCOMING EMI
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Your next payment is scheduled
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-[#dde4dd]">
                    {nextLoan.title}
                  </p>

                  <p className="mt-0.5 text-xs text-[#819087]">
                    Next EMI: <span className="font-bold text-[#4edea3]">{nextLoan.nextDueDate ? formatDateIN(nextLoan.nextDueDate) : "Due date unavailable"}</span>
                  </p>

                </div>

              </div>

              <div className="sm:text-right">

                <p className="text-xs text-[#71837a]">
                  Amount due
                </p>

                <p className="mt-1 text-2xl font-bold text-[#4edea3]">

                  {formatCurrency(
                    nextLoan.emi
                  )}

                </p>

              </div>

            </div>

          </section>

        )}


        {/* ====================================================
            ACTIVE LOANS
            ==================================================== */}

        <section>

          <div className="mb-5">

            <h2 className="text-xl font-bold">
              Active Loans
            </h2>

            <p className="mt-1 text-xs text-[#71837a]">
              Your currently active borrowing commitments.
            </p>

          </div>

          {activeLoans.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-[#3c4a42] bg-[#161d19] px-6 py-12 text-center">

              <CreditCard className="mx-auto h-10 w-10 text-[#52625a]" />

              <h3 className="mt-4 font-semibold">
                No active loans
              </h3>

              <p className="mt-2 text-xs text-[#71837a] max-w-sm mx-auto">
                You currently don't have any active loans in your LifeLoan portfolio. Submit an application to get started.
              </p>

              {onApplyLoan && (
                <button
                  onClick={onApplyLoan}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-2.5 text-xs font-bold text-[#003824] transition hover:bg-[#4edea3]"
                >
                  <PlusCircle className="h-4 w-4" />
                  Apply for a Loan
                </button>
              )}

            </div>

          ) : (

            <div className="space-y-5">

              {activeLoans.map(
                (loan) => {

                  const progress =
                    Math.min(
                      100,
                      Math.max(
                        0,
                        loan.progressPercentage ?? 0
                      )
                    );

                  const remainingPercentage =
                    Math.max(
                      0,
                      100 - progress
                    );

                  const isExpanded =
                    expandedLoan ===
                    loan.id;

                  const loanHistory =
                    getLoanHistory(
                      loan.id
                    );

                  const isPaying =
                    paymentLoading ===
                    loan.id;

                  return (

                    <div
                      key={loan.id}
                      className="rounded-2xl border border-[#242c27] bg-[#161d19] p-6 transition hover:border-[#4edea3]/30"
                    >

                      {/* TOP */}

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                        <div className="flex items-start gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10">

                            <CreditCard className="h-5 w-5 text-[#4edea3]" />

                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="text-lg font-bold">
                                {loan.title}
                              </h3>

                              <span className="rounded-full border border-[#4edea3]/20 bg-[#10b981]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4edea3]">
                                Active
                              </span>

                            </div>

                            <p className="mt-1 text-xs text-[#71837a]">
                              {loan.type} Facility
                            </p>

                          </div>

                        </div>

                        {/* EMI */}

                        {/* EMI */}

                        <div className="lg:text-right">

                          <p className="text-xs text-[#71837a]">
                            Monthly EMI
                          </p>

                          <p className="mt-1 text-2xl font-bold">

                            {formatCurrency(
                              loan.emi
                            )}

                          </p>

                          <p className="mt-1 text-xs text-[#71837a]">
                            Due: <span className="font-semibold text-[#4edea3]">{loan.nextDueDate ? formatDateIN(loan.nextDueDate) : "Due date unavailable"}</span>
                          </p>

                        </div>

                      </div>

                      {/* LOAN DETAILS */}

                      <div className="mt-7 grid gap-4 border-y border-[#242c27] py-5 sm:grid-cols-4">

                        <div>

                          <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                            Original Amount
                          </p>

                          <p className="mt-1 font-semibold">

                            {formatCurrency(
                              loan.amount
                            )}

                          </p>

                        </div>

                        <div>

                          <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                            Remaining
                          </p>

                          <p className="mt-1 font-semibold">

                            {formatCurrency(
                              Math.max(
                                0,
                                loan.remainingAmount
                              )
                            )}

                          </p>

                        </div>

                        <div>

                          <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                            Next Due
                          </p>

                          <p className="mt-1 font-semibold text-[#4edea3]">
                            {loan.nextDueDate ? formatDateIN(loan.nextDueDate) : "Due date unavailable"}
                          </p>

                        </div>

                        <div>

                          <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                            Status
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 font-semibold text-[#4edea3]">

                            <Clock3 className="h-3.5 w-3.5" />

                            Repayment in progress

                          </p>

                        </div>

                      </div>

                      {/* PROGRESS */}

                      <div className="mt-6">

                        <div className="mb-2 flex items-center justify-between">

                          <span className="text-xs text-[#71837a]">
                            Repayment progress
                          </span>

                          <span className="text-xs font-bold text-[#4edea3]">
                            {progress}%
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[#242c27]">

                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#047857] to-[#4edea3] transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                            }}
                          />

                        </div>

                        <div className="mt-2 flex justify-between text-[10px] text-[#52625a]">

                          <span>
                            Paid
                          </span>

                          <span>
                            {remainingPercentage}% remaining
                          </span>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-2 text-xs text-[#71837a]">

                          <CalendarDays className="h-4 w-4 text-[#4edea3]" />

                          <span>Next EMI: <strong className="text-[#dde4dd]">{formatCurrency(loan.emi)}/mo</strong> · Due: <strong className="text-[#4edea3]">{loan.nextDueDate ? formatDateIN(loan.nextDueDate) : "Due date unavailable"}</strong></span>

                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">

                          {/* VIEW SCHEDULE */}

                          <button
                            onClick={() =>
                              toggleLoan(
                                loan.id
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl border border-[#3c4a42] px-5 py-3 text-xs font-bold text-[#9aa9a1] transition hover:border-[#4edea3]/50 hover:text-[#4edea3]"
                          >

                            {isExpanded ? (
                              <>
                                Hide Schedule
                                <ChevronUp className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                View Schedule
                                <ChevronDown className="h-4 w-4" />
                              </>
                            )}

                          </button>

                          {/* PAY EMI */}

                          <button
                            disabled={isPaying}
                            onClick={() =>
                              handlePayEmi(
                                loan
                              )
                            }
                            className="rounded-xl bg-[#10b981] px-5 py-3 text-xs font-bold text-[#003824] transition hover:bg-[#4edea3] disabled:cursor-not-allowed disabled:opacity-50"
                          >

                            {isPaying
                              ? "Processing..."
                              : "Record EMI Payment"}

                          </button>

                        </div>

                      </div>

                      {/* PAYMENT SCHEDULE */}

                      {isExpanded && (() => {
                        const loanSchedule = schedules[loan.id] || [];
                        const isLoadingSched = !!loadingSchedule[loan.id];
                        const completedSchedule = loanSchedule.filter(
                          (item) => item.status === "paid"
                        );
                        const upcomingSchedule = loanSchedule.filter(
                          (item) => item.status === "upcoming"
                        );

                        return (
                          <div className="mt-6 rounded-2xl border border-[#242c27] bg-[#101713] p-5">
                            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#242c27] pb-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4edea3]">
                                  PAYMENT SCHEDULE
                                </p>
                                <h4 className="mt-1 text-lg font-bold">
                                  EMI Schedule & Payment History
                                </h4>
                                <p className="mt-1 text-xs text-[#71837a]">
                                  Actual schedule derived from loan start, tenure, and payment records.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-[#4edea3]/20 bg-[#10b981]/10 px-3 py-1 text-[11px] font-semibold text-[#4edea3]">
                                  {completedSchedule.length} Paid
                                </span>
                                <span className="rounded-full border border-[#3c4a42] bg-[#161d19] px-3 py-1 text-[11px] font-semibold text-[#9aa9a1]">
                                  {upcomingSchedule.length} Upcoming
                                </span>
                              </div>
                            </div>

                            {isLoadingSched ? (
                              <div className="py-8 text-center">
                                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#242c27] border-t-[#4edea3]" />
                                <p className="mt-3 text-xs text-[#71837a]">
                                  Loading payment schedule...
                                </p>
                              </div>
                            ) : loanSchedule.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-[#3c4a42] p-5 text-center">
                                <p className="text-xs text-[#71837a]">
                                  {loan.createdAt
                                    ? "Calculating schedule..."
                                    : "Due date unavailable"}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* COMPLETED PAYMENTS */}
                                {completedSchedule.length > 0 && (
                                  <div>
                                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#819087]">
                                      Completed Payments ({completedSchedule.length})
                                    </p>
                                    <div className="space-y-2.5">
                                      {completedSchedule.map((item) => (
                                        <div
                                          key={`paid-${item.installment_number}`}
                                          className="flex flex-col gap-3 rounded-xl border border-[#242c27] bg-[#161d19] p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10b981]/10 border border-[#10b981]/30">
                                              <CheckCircle2 className="h-4 w-4 text-[#4edea3]" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-[#dde4dd]">
                                                {formatDateIN(item.due_date)}
                                              </p>
                                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#71837a]">
                                                <span>
                                                  Due:{" "}
                                                  <strong className="text-[#a6b6ad]">
                                                    {formatDateIN(item.due_date)}
                                                  </strong>
                                                </span>
                                                {item.payment_date && (
                                                  <>
                                                    <span className="text-[#3c4a42]">•</span>
                                                    <span>
                                                      Paid on:{" "}
                                                      <strong className="text-[#4edea3]">
                                                        {formatDateIN(item.payment_date)}
                                                      </strong>
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between gap-5 sm:justify-end">
                                            <span className="text-sm font-bold font-mono text-[#dde4dd]">
                                              {formatCurrency(item.amount)}
                                            </span>
                                            <span className="rounded-full border border-[#4edea3]/20 bg-[#10b981]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4edea3]">
                                              PAID
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* UPCOMING PAYMENTS */}
                                {upcomingSchedule.length > 0 && (
                                  <div>
                                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#4edea3]">
                                      Upcoming Payments ({upcomingSchedule.length})
                                    </p>
                                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                                      {upcomingSchedule.map((item, idx) => (
                                        <div
                                          key={`upcoming-${item.installment_number}`}
                                          className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                                            idx === 0
                                              ? "border-[#4edea3]/30 bg-[#102018]"
                                              : "border-[#242c27] bg-[#161d19]"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div
                                              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                                idx === 0
                                                  ? "bg-[#10b981]/20 border border-[#10b981]/40"
                                                  : "bg-[#242c27]"
                                              }`}
                                            >
                                              <Clock3
                                                className={`h-4 w-4 ${
                                                  idx === 0
                                                    ? "text-[#4edea3]"
                                                    : "text-[#71837a]"
                                                }`}
                                              />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-[#dde4dd]">
                                                  EMI #{idx + 1}
                                                </p>
                                                {idx === 0 && (
                                                  <span className="rounded bg-[#10b981]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#4edea3]">
                                                    Next Due
                                                  </span>
                                                )}
                                              </div>
                                              <p className="mt-0.5 text-[11px] text-[#71837a]">
                                                Due:{" "}
                                                <strong className="text-[#4edea3]">
                                                  {formatDateIN(item.due_date)}
                                                </strong>
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between gap-5 sm:justify-end">
                                            <span className="text-sm font-bold font-mono text-[#dde4dd]">
                                              {formatCurrency(item.amount)}
                                            </span>
                                            <span
                                              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                idx === 0
                                                  ? "border-[#4edea3]/30 bg-[#10b981]/15 text-[#4edea3]"
                                                  : "border-[#3c4a42] bg-[#242c27] text-[#819087]"
                                              }`}
                                            >
                                              Upcoming
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* SCHEDULE SUMMARY */}
                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-xl border border-[#242c27] bg-[#161d19] p-4">
                                <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                                  Monthly EMI
                                </p>
                                <p className="mt-1 font-bold">
                                  {formatCurrency(loan.emi)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#242c27] bg-[#161d19] p-4">
                                <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                                  Next Due Date
                                </p>
                                <p className="mt-1 font-bold text-[#4edea3]">
                                  {loan.nextDueDate
                                    ? formatDateIN(loan.nextDueDate)
                                    : "Due date unavailable"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#242c27] bg-[#161d19] p-4">
                                <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                                  Remaining Balance
                                </p>
                                <p className="mt-1 font-bold">
                                  {formatCurrency(
                                    Math.max(0, loan.remainingAmount)
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}


                    </div>

                  );
                }
              )}

            </div>

          )}

        </section>

        {/* ====================================================
            COMPLETED LOANS
            ==================================================== */}

        {completedLoans.length > 0 && (

          <section className="mt-12">

            <div className="mb-5">

              <h2 className="text-xl font-bold">
                Completed Loans
              </h2>

              <p className="mt-1 text-xs text-[#71837a]">
                Loans that have been fully repaid.
              </p>

            </div>

            <div className="space-y-3">

              {completedLoans.map(
                (loan) => (

                  <div
                    key={loan.id}
                    className="flex flex-col gap-4 rounded-2xl border border-[#242c27] bg-[#161d19] p-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

                        <CheckCircle2 className="h-5 w-5 text-[#4edea3]" />

                      </div>

                      <div>

                        <h3 className="font-semibold">
                          {loan.title}
                        </h3>

                        <p className="text-xs text-[#71837a]">
                          {loan.type} · Fully repaid
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-6">

                      <div>

                        <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                          Amount
                        </p>

                        <p className="mt-1 text-sm font-semibold">

                          {formatCurrency(
                            loan.amount
                          )}

                        </p>

                      </div>

                      <span className="rounded-full border border-[#4edea3]/20 bg-[#10b981]/10 px-3 py-1.5 text-[10px] font-bold text-[#4edea3]">
                        COMPLETED
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          </section>

        )}

        {/* ====================================================
            INFORMATION NOTICE
            ==================================================== */}

        <div className="mt-10 flex gap-3 rounded-2xl border border-[#242c27] bg-[#121914] p-5">

          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#4edea3]" />

          <p className="text-xs leading-5 text-[#71837a]">

            Loan and EMI information shown here is connected
            to the LifeLoan backend database. Payments are
            stored against the selected user's loan records.

          </p>

        </div>

      </main>

      <PaymentConfirmationModal
        isOpen={isPaymentModalOpen}
        loan={selectedLoanForPayment}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedLoanForPayment(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

    </div>
  );
};

export default MyLoans;