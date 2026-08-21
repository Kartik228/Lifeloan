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
} from "lucide-react";

interface MyLoansProps {
  onBack: () => void;

  // Keep this optional for now so your App.tsx
  // does not immediately break.
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
}

interface PaymentRecord {
  id: string;
  loanId: string;
  amount: number;
  date: string;
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
  payments?: BackendPayment[];
}

interface BackendPayment {
  id: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  status: string;
}

const API_URL = "http://127.0.0.1:8000";

const MyLoans: React.FC<MyLoansProps> = ({
  onBack,
  userId,
}) => {
  // ============================================================
  // USER
  // ============================================================

  /*
    For now:

    If App.tsx passes userId -> use it.

    Otherwise use 1 because our Swagger testing
    currently uses user_id = 1.

    Later we will connect this to the actual
    logged-in user's JWT/account.
  */

  const currentUserId = userId ?? 1;

  // ============================================================
  // STATE
  // ============================================================

  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<
    PaymentRecord[]
  >([]);

  const [expandedLoan, setExpandedLoan] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [paymentLoading, setPaymentLoading] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

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
    };
  };

  // ============================================================
  // LOAD LOANS
  // ============================================================

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/loans?user_id=${currentUserId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load loans (${response.status})`
        );
      }

      const data: BackendLoan[] =
        await response.json();

      const mappedLoans = data.map(mapLoan);

      setLoans(mappedLoans);

    } catch (err) {
      console.error("LOAD LOANS ERROR:", err);

      setError(
        "Unable to load your loans. Please make sure the LifeLoan backend is running."
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
          const response = await fetch(
            `${API_URL}/loans/${loan.id}/payments?user_id=${currentUserId}`
          );

          if (!response.ok) {
            console.warn(
              `Could not load payments for loan ${loan.id}`
            );

            continue;
          }

          const payments: BackendPayment[] =
            await response.json();

          payments.forEach((payment) => {
            allPayments.push({
              id: String(payment.id),

              loanId: String(
                payment.loan_id
              ),

              amount: Number(
                payment.amount
              ),

              date: formatDate(
                payment.payment_date
              ),

              status:
                payment.status === "paid"
                  ? "paid"
                  : "scheduled",

              label:
                payment.status === "paid"
                  ? "EMI payment"
                  : "Scheduled EMI",
            });
          });

        } catch (paymentError) {
          console.error(
            `PAYMENT HISTORY ERROR FOR LOAN ${loan.id}:`,
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
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_URL}/loans?user_id=${currentUserId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load loans (${response.status})`
          );
        }

        const data: BackendLoan[] =
          await response.json();

        const mappedLoans =
          data.map(mapLoan);

        setLoans(mappedLoans);

        await loadPaymentHistory(
          mappedLoans
        );

      } catch (err) {
        console.error(
          "INITIAL LOAD ERROR:",
          err
        );

        setError(
          "Unable to load your loans. Please make sure the LifeLoan backend is running."
        );

      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUserId]);

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
  // TOGGLE LOAN
  // ============================================================

  const toggleLoan = (
    loanId: string
  ) => {
    setExpandedLoan(
      (current) =>
        current === loanId
          ? null
          : loanId
    );
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
  // PAY EMI
  // ============================================================

  const handlePayEmi = async (
    loan: LoanItem
  ) => {
    try {
      setPaymentLoading(loan.id);
      setError(null);

      const response = await fetch(
        `${API_URL}/loans/${loan.id}/pay-emi?user_id=${currentUserId}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            amount: loan.emi,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            `Payment failed (${response.status})`
        );
      }

      /*
        Backend returns the updated loan.
      */

      const updatedLoan: BackendLoan =
        await response.json();

      const mappedLoan =
        mapLoan(updatedLoan);

      /*
        Update the loan immediately
        without waiting for another request.
      */

      setLoans((currentLoans) =>
        currentLoans.map(
          (existingLoan) =>
            existingLoan.id ===
            mappedLoan.id
              ? mappedLoan
              : existingLoan
        )
      );

      /*
        Reload payment history so the
        new payment appears in the
        schedule.
      */

      await loadPaymentHistory(
        loans.map((existingLoan) =>
          existingLoan.id ===
          mappedLoan.id
            ? mappedLoan
            : existingLoan
        )
      );

      /*
        Automatically open the loan
        after payment.
      */

      setExpandedLoan(
        mappedLoan.id
      );

      alert(
        `EMI payment of ${formatCurrency(
          loan.emi
        )} recorded successfully!`
      );

    } catch (err) {
      console.error(
        "PAY EMI ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to process EMI payment."
      );

    } finally {
      setPaymentLoading(null);
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

          <section className="mb-10 rounded-2xl border border-[#4edea3]/20 bg-[#102018] p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10">

                  <Clock3 className="h-5 w-5 text-[#4edea3]" />

                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4edea3]">
                    UPCOMING EMI
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Your next payment is scheduled
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    {nextLoan.title} · Next EMI
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

              <p className="mt-2 text-xs text-[#71837a]">
                You currently don't have any active loans.
              </p>

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

                        <div className="lg:text-right">

                          <p className="text-xs text-[#71837a]">
                            Monthly EMI
                          </p>

                          <p className="mt-1 text-2xl font-bold">

                            {formatCurrency(
                              loan.emi
                            )}

                          </p>

                        </div>

                      </div>

                      {/* LOAN DETAILS */}

                      <div className="mt-7 grid gap-4 border-y border-[#242c27] py-5 sm:grid-cols-3">

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

                          Next EMI payment scheduled

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
                              : "Pay EMI"}

                          </button>

                        </div>

                      </div>

                      {/* PAYMENT SCHEDULE */}

                      {isExpanded && (

                        <div className="mt-6 rounded-2xl border border-[#242c27] bg-[#101713] p-5">

                          <div className="mb-5">

                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4edea3]">
                              PAYMENT SCHEDULE
                            </p>

                            <h4 className="mt-1 text-lg font-bold">
                              EMI Payment History
                            </h4>

                            <p className="mt-1 text-xs text-[#71837a]">
                              Track your completed and upcoming payments.
                            </p>

                          </div>

                          <div className="space-y-3">

                            {loanHistory.length === 0 ? (

                              <div className="rounded-xl border border-dashed border-[#3c4a42] p-5 text-center">

                                <p className="text-xs text-[#71837a]">
                                  No EMI payments recorded yet.
                                </p>

                              </div>

                            ) : (

                              loanHistory.map(
                                (payment) => (

                                  <div
                                    key={
                                      payment.id
                                    }
                                    className="flex flex-col gap-3 rounded-xl border border-[#242c27] bg-[#161d19] p-4 sm:flex-row sm:items-center sm:justify-between"
                                  >

                                    <div className="flex items-center gap-3">

                                      <div
                                        className={`
                                          flex
                                          h-9
                                          w-9
                                          items-center
                                          justify-center
                                          rounded-lg
                                          ${
                                            payment.status ===
                                            "paid"
                                              ? "bg-[#10b981]/10"
                                              : "bg-[#242c27]"
                                          }
                                        `}
                                      >

                                        <PaymentStatusIcon
                                          status={
                                            payment.status
                                          }
                                        />

                                      </div>

                                      <div>

                                        <p className="text-sm font-semibold">
                                          {payment.label}
                                        </p>

                                        <p className="mt-1 text-[11px] text-[#71837a]">
                                          {payment.date}
                                        </p>

                                      </div>

                                    </div>

                                    <div className="flex items-center justify-between gap-5 sm:justify-end">

                                      <span className="text-sm font-bold">

                                        {formatCurrency(
                                          payment.amount
                                        )}

                                      </span>

                                      <span
                                        className={`
                                          rounded-full
                                          px-3
                                          py-1.5
                                          text-[9px]
                                          font-bold
                                          uppercase
                                          tracking-wider
                                          border
                                          ${
                                            payment.status ===
                                            "paid"
                                              ? "border-[#4edea3]/20 bg-[#10b981]/10 text-[#4edea3]"
                                              : "border-[#3c4a42] bg-[#242c27] text-[#71837a]"
                                          }
                                        `}
                                      >

                                        {payment.status ===
                                        "paid"
                                          ? "Paid"
                                          : "Scheduled"}

                                      </span>

                                    </div>

                                  </div>

                                )
                              )

                            )}

                          </div>

                          {/* SCHEDULE SUMMARY */}

                          <div className="mt-5 grid gap-3 sm:grid-cols-3">

                            <div className="rounded-xl border border-[#242c27] bg-[#161d19] p-4">

                              <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                                EMI
                              </p>

                              <p className="mt-1 font-bold">

                                {formatCurrency(
                                  loan.emi
                                )}

                              </p>

                            </div>

                            <div className="rounded-xl border border-[#242c27] bg-[#161d19] p-4">

                              <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                                Next Due
                              </p>

                              <p className="mt-1 font-bold">
                                Next EMI
                              </p>

                            </div>

                            <div className="rounded-xl border border-[#242c27] bg-[#161d19] p-4">

                              <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                                Remaining
                              </p>

                              <p className="mt-1 font-bold">

                                {formatCurrency(
                                  Math.max(
                                    0,
                                    loan.remainingAmount
                                  )
                                )}

                              </p>

                            </div>

                          </div>

                        </div>

                      )}

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

    </div>
  );
};

export default MyLoans;