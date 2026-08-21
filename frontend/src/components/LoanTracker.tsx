import React from "react";
import {
  ArrowLeft,
  WalletCards,
  CalendarDays,
  CreditCard,
  TrendingUp,
  CircleCheck,
  Clock3,
  AlertTriangle,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface LoanTrackerProps {
  onBack: () => void;
}

interface Loan {
  id: number;
  name: string;
  purpose: string;
  originalAmount: number;
  outstanding: number;
  emi: number;
  interestRate: number;
  tenure: number;
  paidMonths: number;
  nextPayment: string;
  status: "Active" | "Completed" | "Overdue";
}

const LoanTracker: React.FC<LoanTrackerProps> = ({
  onBack,
}) => {

  // ============================================================
  // SAMPLE LOANS
  // ============================================================

  const loans: Loan[] = [
    {
      id: 1,
      name: "Personal Loan",
      purpose: "Personal",
      originalAmount: 500000,
      outstanding: 284500,
      emi: 16850,
      interestRate: 11.5,
      tenure: 36,
      paidMonths: 17,
      nextPayment: "05 September 2026",
      status: "Active",
    },

    {
      id: 2,
      name: "Education Loan",
      purpose: "Education",
      originalAmount: 800000,
      outstanding: 512000,
      emi: 14200,
      interestRate: 9.2,
      tenure: 60,
      paidMonths: 21,
      nextPayment: "12 September 2026",
      status: "Active",
    },
  ];

  // ============================================================
  // HELPERS
  // ============================================================

  const formatCurrency = (
    amount: number
  ) => {
    return `₹${Math.round(amount).toLocaleString(
      "en-IN"
    )}`;
  };

  const getProgress = (
    loan: Loan
  ) => {
    return Math.min(
      100,
      Math.round(
        (loan.paidMonths /
          loan.tenure) *
          100
      )
    );
  };

  const totalOutstanding =
    loans.reduce(
      (total, loan) =>
        total + loan.outstanding,
      0
    );

  const totalOriginal =
    loans.reduce(
      (total, loan) =>
        total + loan.originalAmount,
      0
    );

  const totalEMI =
    loans.reduce(
      (total, loan) =>
        total + loan.emi,
      0
    );

  const overallProgress =
    totalOriginal > 0
      ? Math.round(
          ((totalOriginal -
            totalOutstanding) /
            totalOriginal) *
            100
        )
      : 0;

  // ============================================================
  // STATUS
  // ============================================================

  const getStatusStyles = (
    status: Loan["status"]
  ) => {

    if (status === "Completed") {
      return {
        icon: CircleCheck,
        className:
          "border-[#4edea3]/30 bg-[#4edea3]/5 text-[#4edea3]",
      };
    }

    if (status === "Overdue") {
      return {
        icon: AlertTriangle,
        className:
          "border-red-400/30 bg-red-400/5 text-red-300",
      };
    }

    return {
      icon: Clock3,
      className:
        "border-[#3c4a42] bg-[#101713] text-[#9aa9a1]",
    };
  };

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

              <WalletCards className="h-4 w-4 text-[#003824]" />

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
            TITLE
        ==================================================== */}

        <section className="mb-10">

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">
            LOAN MANAGEMENT
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight">
            My Loans
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#819087]">

            Track your active loans, monitor repayment
            progress, and stay ahead of upcoming EMI
            payments.

          </p>

        </section>


        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* ACTIVE LOANS */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="flex items-center justify-between">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

                <WalletCards className="h-5 w-5 text-[#4edea3]" />

              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-[#52625a]">
                ACTIVE
              </span>

            </div>

            <p className="mt-5 text-xs text-[#71837a]">
              Active Loans
            </p>

            <p className="mt-1 text-3xl font-bold">
              {loans.filter(
                (loan) =>
                  loan.status === "Active"
              ).length}
            </p>

          </div>


          {/* OUTSTANDING */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <CreditCard className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="mt-5 text-xs text-[#71837a]">
              Total Outstanding
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(
                totalOutstanding
              )}
            </p>

          </div>


          {/* EMI */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <CalendarDays className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="mt-5 text-xs text-[#71837a]">
              Monthly EMI
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(
                totalEMI
              )}
            </p>

          </div>


          {/* PROGRESS */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <TrendingUp className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="mt-5 text-xs text-[#71837a]">
              Overall Repayment
            </p>

            <p className="mt-1 text-2xl font-bold">
              {overallProgress}%
            </p>

          </div>

        </section>


        {/* ====================================================
            NEXT PAYMENT
        ==================================================== */}

        <section className="mt-8 rounded-3xl border border-[#242c27] bg-[#161d19] p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10">

                <CalendarDays className="h-5 w-5 text-[#4edea3]" />

              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-[#4edea3]">
                  NEXT EMI
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Upcoming payment
                </h2>

                <p className="mt-1 text-xs text-[#71837a]">
                  Personal Loan · 05 September 2026
                </p>

              </div>

            </div>


            <div className="text-left sm:text-right">

              <p className="text-xs text-[#71837a]">
                Amount due
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(
                  loans[0]?.emi || 0
                )}
              </p>

            </div>

          </div>

        </section>


        {/* ====================================================
            LOANS
        ==================================================== */}

        <section className="mt-8">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h2 className="font-serif text-2xl font-bold">
                Your Loans
              </h2>

              <p className="mt-1 text-xs text-[#71837a]">
                Manage and monitor your current loans.
              </p>

            </div>

            <span className="rounded-full border border-[#3c4a42] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#71837a]">

              {loans.length} Loans

            </span>

          </div>


          <div className="space-y-4">

            {loans.map(
              (loan) => {

                const progress =
                  getProgress(
                    loan
                  );

                const status =
                  getStatusStyles(
                    loan.status
                  );

                const StatusIcon =
                  status.icon;

                return (

                  <div
                    key={loan.id}
                    className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 transition-all duration-200 hover:border-[#3c4a42]"
                  >

                    {/* TOP */}

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#101713]">

                          <WalletCards className="h-5 w-5 text-[#4edea3]" />

                        </div>


                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <h3 className="text-lg font-bold">
                              {loan.name}
                            </h3>

                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-wider
                                ${status.className}
                              `}
                            >

                              <StatusIcon className="h-3 w-3" />

                              {loan.status}

                            </span>

                          </div>

                          <p className="mt-1 text-xs text-[#71837a]">
                            {loan.purpose} Loan
                          </p>

                        </div>

                      </div>


                      <button
                        className="flex w-fit items-center gap-2 text-xs font-semibold text-[#9aa9a1] transition hover:text-[#4edea3]"
                      >

                        View Details

                        <ChevronRight className="h-4 w-4" />

                      </button>

                    </div>


                    {/* STATS */}

                    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                      <div>

                        <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                          Outstanding
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {formatCurrency(
                            loan.outstanding
                          )}
                        </p>

                      </div>


                      <div>

                        <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                          Monthly EMI
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {formatCurrency(
                            loan.emi
                          )}
                        </p>

                      </div>


                      <div>

                        <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                          Interest Rate
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {loan.interestRate}%
                        </p>

                      </div>


                      <div>

                        <p className="text-[10px] uppercase tracking-wider text-[#52625a]">
                          Next Payment
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {loan.nextPayment}
                        </p>

                      </div>

                    </div>


                    {/* PROGRESS */}

                    <div className="mt-7">

                      <div className="mb-2 flex items-center justify-between">

                        <p className="text-xs text-[#71837a]">
                          Repayment Progress
                        </p>

                        <p className="text-xs font-bold text-[#4edea3]">
                          {progress}%
                        </p>

                      </div>


                      <div className="h-2 overflow-hidden rounded-full bg-[#242c27]">

                        <div
                          className="h-full rounded-full bg-[#10b981] transition-all"
                          style={{
                            width: `${progress}%`,
                          }}
                        />

                      </div>


                      <div className="mt-2 flex justify-between text-[10px] text-[#52625a]">

                        <span>
                          {loan.paidMonths} payments completed
                        </span>

                        <span>
                          {loan.tenure -
                            loan.paidMonths}{" "}
                          remaining
                        </span>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        </section>


        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {loans.length === 0 && (

          <section className="mt-8 rounded-3xl border border-dashed border-[#3c4a42] bg-[#101713] p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#161d19]">

              <WalletCards className="h-6 w-6 text-[#71837a]" />

            </div>

            <h2 className="mt-5 font-serif text-xl font-bold">
              No loans yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71837a]">

              Once you take a loan through LifeLoan,
              your loan information will appear here.

            </p>

          </section>

        )}


        {/* ====================================================
            FOOTER INFO
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-[#242c27] bg-[#121914] p-5">

          <div className="flex gap-3">

            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4edea3]" />

            <p className="text-xs leading-5 text-[#71837a]">

              Your loan information is securely associated
              with your LifeLoan account. Payment dates
              and balances shown here are for tracking
              purposes.

            </p>

          </div>

        </section>

      </main>

    </div>
  );
};

export default LoanTracker;